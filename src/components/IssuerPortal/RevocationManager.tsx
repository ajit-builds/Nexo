"use client";

import React, { useState, useMemo } from "react";
import { AlertOctagon, CheckCircle2, ShieldAlert, Search, RefreshCw, ExternalLink } from "lucide-react";
import { revokeCredentialOnChain } from "@/lib/contracts";
import { saveRevocation } from "@/lib/storage";
import { BatchRecord, RevocationRecord } from "@/types";
import { Pagination } from "@/components/ui/Pagination";

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

  // Pagination states
  const [candidatePage, setCandidatePage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const pageSize = 5;

  // Flatten all credentials from existing batches for quick lookup
  const allCredentials = useMemo(() => {
    return batches.flatMap((b) =>
      b.credentials.map((c) => ({
        ...c,
        studentName: c.disclosures.find((d) => d.key === "full_name")?.value || "Unknown Student",
        degree: c.disclosedClaims.degree,
      }))
    );
  }, [batches]);

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allCredentials;
    return allCredentials.filter(
      (c) =>
        String(c.studentName).toLowerCase().includes(q) ||
        c.credentialId.toLowerCase().includes(q)
    );
  }, [allCredentials, searchQuery]);

  const pagedCandidates = useMemo(() => {
    const start = (candidatePage - 1) * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, candidatePage]);

  const pagedLedger = useMemo(() => {
    const start = (ledgerPage - 1) * pageSize;
    return revocations.slice(start, start + pageSize);
  }, [revocations, ledgerPage]);

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
        txHash: result.txHash,
      };

      saveRevocation(record);
      onRevocationComplete(record);
      setSuccessMessage(`Credential revoked on-chain! Transaction: ${result.txHash.slice(0, 14)}...`);
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
      {/* Top Banner - Clean Apple Style */}
      <div className="bg-white rounded-3xl border border-black/[0.06] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-2 text-[#ff3b30] font-semibold text-xs tracking-wider uppercase">
          <ShieldAlert className="w-4 h-4" /> RevocationRegistry.sol Controller
        </div>
        <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">Instant Credential Revocation</h2>
        <p className="text-[#86868b] text-sm mt-1 max-w-2xl leading-relaxed">
          If a credential was issued in error or obtained fraudulently, revoke it here.
          The revocation is stamped on-chain on Polygon Amoy, and every subsequent recruiter verification
          will fail immediately in seconds.
        </p>
      </div>

      {/* Revocation Action Form & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Candidate Selector */}
        <div className="bg-white rounded-3xl border border-black/[0.06] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#0071e3]" /> Select Credential
            </h3>
            <span className="text-xs text-[#86868b] font-medium">
              {filteredCandidates.length} eligible
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by student name or credential ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCandidatePage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-[#d2d2d7]/50 rounded-2xl text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:bg-white focus:border-[#0071e3] transition"
            />
          </div>

          <div className="space-y-2">
            {filteredCandidates.length === 0 ? (
              <div className="p-8 text-center text-[#86868b] text-xs bg-[#f5f5f7] rounded-2xl border border-black/[0.04]">
                No credentials found matching &quot;{searchQuery}&quot;.
              </div>
            ) : (
              pagedCandidates.map((cred) => {
                const isAlreadyRevoked = revocations.some((r) => r.credentialHash === cred.signature);
                const isSelected = selectedStudent?.credentialId === cred.credentialId;
                return (
                  <div
                    key={cred.credentialId}
                    onClick={() => !isAlreadyRevoked && handleSelectCredential(cred)}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-[#0071e3]/5 border-[#0071e3] text-[#1d1d1f]"
                        : isAlreadyRevoked
                        ? "opacity-50 cursor-not-allowed bg-[#f5f5f7] border-black/[0.04] text-[#86868b]"
                        : "bg-[#f5f5f7] border-black/[0.04] hover:bg-white hover:border-[#d2d2d7] text-[#1d1d1f]"
                    }`}
                  >
                    <div>
                      <span className="font-semibold block text-[#1d1d1f]">{cred.studentName}</span>
                      <span className="font-mono text-[#86868b] text-[11px]">{cred.credentialId}</span>
                    </div>
                    <div>
                      {isAlreadyRevoked ? (
                        <span className="text-[#ff3b30] font-semibold uppercase text-[10px] px-2 py-0.5 rounded-full bg-[#ff3b30]/10">
                          Revoked
                        </span>
                      ) : isSelected ? (
                        <span className="text-[#0071e3] font-semibold text-xs">Selected</span>
                      ) : (
                        <span className="text-[#86868b] hover:text-[#0071e3] font-medium text-xs">Choose</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Candidate Pagination */}
          {filteredCandidates.length > pageSize && (
            <Pagination
              currentPage={candidatePage}
              totalItems={filteredCandidates.length}
              pageSize={pageSize}
              onPageChange={setCandidatePage}
              itemLabel="candidates"
            />
          )}

          {selectedStudent && (
            <div className="p-4 bg-[#f5f5f7] border border-[#d2d2d7]/60 rounded-2xl text-xs space-y-1">
              <span className="text-[#0071e3] font-semibold block text-[11px] uppercase tracking-wider">
                Target Selected for Revocation:
              </span>
              <p className="text-[#1d1d1f] font-semibold">{selectedStudent.studentName} &bull; {selectedStudent.degree}</p>
              <p className="font-mono text-[#86868b] truncate text-[11px]">Signature: {selectedHash}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#1d1d1f]">Official Revocation Reason:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#f5f5f7] border border-[#d2d2d7]/50 rounded-2xl px-4 py-2.5 text-xs text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] transition"
            >
              {REVOCATION_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <button
            disabled={!selectedStudent || isSubmitting}
            onClick={handleRevoke}
            className="w-full flex items-center justify-center gap-2 bg-[#ff3b30] hover:bg-[#e03429] text-white font-medium py-3 px-5 rounded-full text-xs transition-all shadow-[0_2px_8px_rgba(255,59,48,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Committing Revocation to Polygon Amoy...
              </>
            ) : (
              <>
                <AlertOctagon className="w-4 h-4" /> Revoke Credential on Polygon Amoy
              </>
            )}
          </button>

          {successMessage && (
            <div className="p-3.5 bg-[#34c759]/10 border border-[#34c759]/30 rounded-2xl text-xs text-[#34c759] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Right: Revocation History Ledger */}
        <div className="bg-white rounded-3xl border border-black/[0.06] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#ff3b30]" /> On-Chain Revocation Ledger
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#ff3b30]/10 text-[#ff3b30]">
              {revocations.length} Revoked
            </span>
          </div>

          <div className="space-y-3">
            {revocations.length === 0 ? (
              <div className="p-12 text-center text-[#86868b] text-xs bg-[#f5f5f7] rounded-2xl border border-black/[0.04]">
                No credentials revoked. All issued degrees remain in good standing.
              </div>
            ) : (
              pagedLedger.map((rev) => (
                <div key={rev.credentialHash} className="p-4 bg-[#f5f5f7] border border-black/[0.04] rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1d1d1f] text-sm">{rev.studentName}</span>
                    <span className="px-2.5 py-0.5 bg-[#ff3b30]/10 text-[#ff3b30] rounded-full font-semibold text-[10px]">
                      REVOKED
                    </span>
                  </div>
                  <p className="text-[#86868b]">{rev.degree}</p>
                  <p className="text-[#ff3b30] font-medium text-[11px]">Reason: {rev.reason}</p>
                  <div className="flex items-center justify-between text-[#86868b] font-mono text-[11px] pt-2 border-t border-black/[0.04]">
                    <span>Tx: {rev.txHash.slice(0, 14)}...</span>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${rev.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0071e3] hover:underline inline-flex items-center gap-1 font-sans font-medium"
                    >
                      Polygonscan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ledger Pagination */}
          {revocations.length > pageSize && (
            <Pagination
              currentPage={ledgerPage}
              totalItems={revocations.length}
              pageSize={pageSize}
              onPageChange={setLedgerPage}
              itemLabel="revocations"
            />
          )}
        </div>
      </div>
    </div>
  );
}