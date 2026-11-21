"use client";

import React, { useState } from "react";
import { Database, CheckCircle2, Copy, Download, ExternalLink, ChevronDown, ChevronUp, Key } from "lucide-react";
import { BatchRecord, SDJWTCredential } from "@/types";

interface Props {
  batches: BatchRecord[];
}

export function BatchHistory({ batches }: Props) {
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [selectedCred, setSelectedCred] = useState<SDJWTCredential | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedBatchId(expandedBatchId === id ? null : id);
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const downloadBatchJson = (batch: BatchRecord) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(batch, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Nexo_Batch_${batch.batchId.slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (batches.length === 0) {
    return (
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-12 text-center">
        <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white">No Batches Anchored Yet</h3>
        <p className="text-gray-400 text-sm mt-1">
          Upload a graduation CSV in the Bulk Issuance tab to anchor your first batch on Polygon Amoy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Anchored Credential Batches</h2>
          <p className="text-gray-400 text-sm">
            Immutable on-chain Merkle roots stored in CredentialAnchor.sol on Polygon Amoy
          </p>
        </div>
        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium">
          {batches.length} Active Batches
        </span>
      </div>

      <div className="space-y-4">
        {batches.map((batch) => {
          const isExpanded = expandedBatchId === batch.batchId;
          const formattedDate = new Date(batch.timestamp).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });

          return (
            <div key={batch.batchId} className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
              <div
                onClick={() => toggleExpand(batch.batchId)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-800/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {batch.credentialType} Batch
                    </span>
                    <span className="text-xs text-gray-400">{formattedDate}</span>
                  </div>
                  <h4 className="text-base font-semibold text-white flex items-center gap-2">
                    {batch.issuerName} &bull; {batch.totalCredentials} Credentials
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-400">
                    <span>Root: <span className="text-indigo-400">{batch.merkleRoot.slice(0, 14)}...{batch.merkleRoot.slice(-8)}</span></span>
                    <span>Tx: <span className="text-purple-400">{batch.txHash.slice(0, 10)}...</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadBatchJson(batch);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors border border-gray-700"
                  >
                    <Download className="w-3.5 h-3.5" /> Export JSON
                  </button>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${batch.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 transition-colors border border-indigo-700/50"
                  >
                    Polygonscan <ExternalLink className="w-3 h-3" />
                  </a>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {/* Expanded Credentials Table */}
              {isExpanded && (
                <div className="border-t border-gray-800 p-5 bg-black/30 space-y-4">
                  <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Individual Credentials in this Merkle Tree
                  </h5>
                  <div className="overflow-x-auto rounded-lg border border-gray-800">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-gray-800/80 uppercase text-gray-400">
                        <tr>
                          <th className="py-2.5 px-3">Credential ID</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">Degree</th>
                          <th className="py-2.5 px-3">Disclosed Predicate</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {batch.credentials.map((cred) => (
                          <tr key={cred.credentialId} className="hover:bg-gray-800/40">
                            <td className="py-2.5 px-3 font-mono text-gray-300">{cred.credentialId}</td>
                            <td className="py-2.5 px-3 font-medium text-white">
                              {cred.disclosures.find(d => d.key === "full_name")?.value || "Student"}
                            </td>
                            <td className="py-2.5 px-3 text-gray-300">{cred.disclosedClaims.degree}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30">
                                CGPA &ge; 8.0: {cred.disclosedClaims.cgpa_above_8 ? "TRUE" : "FALSE"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => setSelectedCred(cred)}
                                className="text-indigo-400 hover:text-indigo-300 font-medium text-xs mr-3"
                              >
                                View Payload
                              </button>
                              <button
                                onClick={() => copyToken(cred.encodedToken)}
                                className="text-gray-400 hover:text-white"
                                title="Copy SD-JWT Token"
                              >
                                <Copy className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Credential Payload Modal */}
      {selectedCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" /> W3C SD-JWT Credential Payload
              </h3>
              <button
                onClick={() => setSelectedCred(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 font-semibold block mb-1">Public Disclosed Claims:</span>
                <pre className="bg-black/60 p-3 rounded-lg border border-gray-800 text-indigo-300 overflow-x-auto">
                  {JSON.stringify(selectedCred.disclosedClaims, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-gray-400 font-semibold block mb-1">Salted Hidden Disclosures (Selective Disclosure):</span>
                <pre className="bg-black/60 p-3 rounded-lg border border-gray-800 text-purple-300 overflow-x-auto">
                  {JSON.stringify(selectedCred.disclosures, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-gray-400 font-semibold block mb-1">Merkle Inclusion Proof (Connects to Amoy Root):</span>
                <pre className="bg-black/60 p-3 rounded-lg border border-gray-800 text-green-300 overflow-x-auto">
                  {JSON.stringify(selectedCred.merkleProof, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => copyToken(selectedCred.encodedToken)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                {copiedToken ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedToken ? "Copied SD-JWT Token!" : "Copy Full SD-JWT Token"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
