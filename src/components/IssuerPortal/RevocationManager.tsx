"use client";

import React, { useState } from "react";
import { AlertOctagon, CheckCircle2, ShieldAlert, Search, RefreshCw, ExternalLink } from "lucide-react";
import { revokeCredentialOnChain } from "@/lib/contracts";
import { saveRevocation } from "@/lib/storage";
import { BatchRecord, RevocationRecord } from "@/types";

interface Props {
  batches: BatchRecord[];
  revocations: RevocationRecord[];
  onRevocationComplete: (record: RevocationRecord) => void;
}

const REVOCATION_REASONS = [
  "Academic Misconduct / Cheating / Plagiarism",
  "Forged or Tampered Application Records",
  "Disciplinary Expulsion & Degree Cancellation",
  "Administrative Issuance Correction"
];

export function RevocationManager({ batches, revocations, onRevocationComplete }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHash, setSelectedHash] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [reason, setReason] = useState(REVOCATION_REASONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Flatten all credentials from existing batches for quick lookup
  const allCredentials = batches.flatMap(b => b.credentials.map(c => ({
    ...c,
    studentName: c.disclosures.find(d => d.key === "full_name")?.value || "Unknown Student",
    degree: c.disclosedClaims.degree
  })));

  const handleSelectCredential = (cred: any) => {
    setSelectedStudent(cred);
    setSelectedHash(cred.signature);
  };

  const handleRevoke = async () => {
    if (!selectedHash || !selectedStudent) return;

    try {
      setIsSubmitting(true);
      const issuerAddress = "0x71C83d95B309A20165b4F435F649BCE286a1172A";
      const result = await revokeCredentialOnChain(selectedHash, reason, issuerAddress);

      const record: RevocationRecord = {
        credentialHash: selectedHash,
        credentialId: selectedStudent.credentialId,
        studentName: String(selectedStudent.studentName),
        degree: selectedStudent.degree,
        revokedBy: issuerAddress,
        reason,
        timestamp: result.timestamp,
        txHash: result.txHash
      };

      saveRevocation(record);
      onRevocationComplete(record);
      setSuccessMessage(`Credential successfully revoked on-chain! Transaction: ${result.txHash.slice(0, 14)}...`);
      setSelectedStudent(null);
      setSelectedHash("");
      setIsSubmitting(false);
    } catch (err) {
      console.error("Revocation error:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950/60 to-orange-950/40 border border-red-700/50 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-2 text-red-400 font-semibold text-xs tracking-wider uppercase">
          <ShieldAlert className="w-4 h-4" /> RevocationRegistry.sol Controller
        </div>
        <h2 className="text-2xl font-bold text-white">Instant Credential Revocation</h2>
        <p className="text-gray-300 text-sm mt-1 max-w-2xl">
          If a credential was issued in error or obtained fraudulently, revoke it here.
          The revocation is stamped on-chain on Polygon Amoy, and every subsequent recruiter verification
          will fail immediately in seconds.
        </p>
      </div>

      {/* Revocation Action Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-400" /> Select Credential to Revoke
          </h3>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by student name or credential ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-800 rounded-lg p-2 bg-black/30">
            {allCredentials.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No active credentials in batch history.</p>
            ) : (
              allCredentials
                .filter(c =>
                  String(c.studentName).toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.credentialId.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((cred) => {
                  const isAlreadyRevoked = revocations.some(r => r.credentialHash === cred.signature);
                  return (
                    <div
                      key={cred.credentialId}
                      onClick={() => !isAlreadyRevoked && handleSelectCredential(cred)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        selectedStudent?.credentialId === cred.credentialId
                          ? "bg-indigo-950/60 border-indigo-500 text-white"
                          : isAlreadyRevoked
                          ? "opacity-50 cursor-not-allowed bg-red-950/20 border-red-900/40 text-gray-400"
                          : "bg-gray-800/40 border-gray-700/50 hover:bg-gray-800 text-gray-300"
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-white">{cred.studentName}</span>
                        <span className="font-mono text-gray-400">{cred.credentialId}</span>
                      </div>
                      <div>
                        {isAlreadyRevoked ? (
                          <span className="text-red-400 font-semibold uppercase text-[10px]">Already Revoked</span>
                        ) : (
                          <span className="text-indigo-400 font-medium">Select</span>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {selectedStudent && (
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg text-xs space-y-1">
              <span className="text-indigo-300 font-semibold block">Selected for Revocation:</span>
              <p className="text-white font-medium">{selectedStudent.studentName} &bull; {selectedStudent.degree}</p>
              <p className="font-mono text-gray-400 truncate">Hash: {selectedHash}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Official Revocation Reason:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            >
              {REVOCATION_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <button
            disabled={!selectedStudent || isSubmitting}
            onClick={handleRevoke}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-all shadow-md disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Committing Revocation to Amoy...
              </>
            ) : (
              <>
                <AlertOctagon className="w-4 h-4" /> Revoke Credential on Polygon Amoy
              </>
            )}
          </button>

          {successMessage && (
            <div className="p-3 bg-green-950/40 border border-green-500/40 rounded-lg text-xs text-green-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> {successMessage}
            </div>
          )}
        </div>

        {/* Revocation History Ledger */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" /> On-Chain Revocation Ledger
            </h3>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
              {revocations.length} Revoked Credentials
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto">
            {revocations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No credentials revoked. All issued degrees are in good standing.
              </div>
            ) : (
              revocations.map((rev) => (
                <div key={rev.credentialHash} className="p-4 bg-black/40 border border-red-900/40 rounded-lg space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{rev.studentName}</span>
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded font-semibold text-[10px]">
                      REVOKED
                    </span>
                  </div>
                  <p className="text-gray-300 font-medium">{rev.degree}</p>
                  <p className="text-red-400 font-medium">Reason: {rev.reason}</p>
                  <div className="flex items-center justify-between text-gray-500 font-mono pt-1 border-t border-gray-800">
                    <span>Tx: {rev.txHash.slice(0, 12)}...</span>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${rev.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                      Polygonscan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
