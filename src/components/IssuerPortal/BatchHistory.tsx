"use client";

import React, { useState } from "react";
import { Database, Copy, Download, ExternalLink, ChevronDown, ChevronUp, Key, Check } from "lucide-react";
import { BatchRecord, SDJWTCredential } from "@/types";
import { Pagination } from "@/components/ui/Pagination";

interface Props {
  batches: BatchRecord[];
}

export function BatchHistory({ batches }: Props) {
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [selectedCred, setSelectedCred] = useState<SDJWTCredential | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  
  // Pagination for batches
  const [batchesPage, setBatchesPage] = useState(1);
  const BATCHES_PAGE_SIZE = 4;

  // Pagination for credentials within an expanded batch
  const [credPages, setCredPages] = useState<Record<string, number>>({});
  const CRED_PAGE_SIZE = 5;

  const toggleExpand = (id: string) => {
    setExpandedBatchId(expandedBatchId === id ? null : id);
    if (!credPages[id]) {
      setCredPages(prev => ({ ...prev, [id]: 1 }));
    }
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
      <div className="bg-white border border-black/[0.06] rounded-3xl p-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#86868b] mx-auto mb-4">
          <Database className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-[#1d1d1f]">No Batches Anchored Yet</h3>
        <p className="text-[#86868b] text-sm mt-1 max-w-sm mx-auto">
          Upload a graduation CSV in the Bulk Issuance tab to anchor your first Merkle root on Polygon Amoy.
        </p>
      </div>
    );
  }

  const paginatedBatches = batches.slice(
    (batchesPage - 1) * BATCHES_PAGE_SIZE,
    batchesPage * BATCHES_PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">Anchored Credential Batches</h2>
          <p className="text-[#86868b] text-sm mt-0.5">
            Immutable on-chain Merkle roots stored in CredentialAnchor.sol on Polygon Amoy
          </p>
        </div>
        <span className="px-3 py-1 bg-[#0071e3]/10 text-[#0071e3] rounded-full text-xs font-semibold">
          {batches.length} Active Batches
        </span>
      </div>

      <div className="space-y-4">
        {paginatedBatches.map((batch) => {
          const isExpanded = expandedBatchId === batch.batchId;
          const formattedDate = new Date(batch.timestamp).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });

          const currentCredPage = credPages[batch.batchId] || 1;
          const paginatedCredentials = batch.credentials.slice(
            (currentCredPage - 1) * CRED_PAGE_SIZE,
            currentCredPage * CRED_PAGE_SIZE
          );

          return (
            <div key={batch.batchId} className="bg-white border border-black/[0.06] rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition">
              <div
                onClick={() => toggleExpand(batch.batchId)}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#f5f5f7]/50 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.04]">
                      {batch.credentialType} Batch
                    </span>
                    <span className="text-xs text-[#86868b]">{formattedDate}</span>
                  </div>
                  <h4 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
                    {batch.issuerName} &bull; {batch.totalCredentials} Credentials
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#86868b]">
                    <span>Root: <span className="text-[#0071e3]">{batch.merkleRoot.slice(0, 14)}...{batch.merkleRoot.slice(-8)}</span></span>
                    <span>Tx: <span className="text-[#1d1d1f]">{batch.txHash.slice(0, 10)}...</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadBatchJson(batch);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] transition border border-black/[0.04]"
                  >
                    <Download className="w-3.5 h-3.5" /> Export JSON
                  </button>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${batch.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#0071e3] transition border border-black/[0.04]"
                  >
                    Polygonscan <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    className="p-1.5 text-[#86868b] hover:text-[#1d1d1f] rounded-full"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Credentials Table with Pagination */}
              {isExpanded && (
                <div className="border-t border-black/[0.06] p-6 bg-[#f5f5f7]/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                      Credentials in this Merkle Tree ({batch.credentials.length})
                    </h5>
                  </div>
                  
                  <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f5f5f7] text-[#86868b] font-semibold uppercase text-[11px] border-b border-black/[0.06]">
                        <tr>
                          <th className="py-2.5 px-4">Credential ID</th>
                          <th className="py-2.5 px-4">Student Name</th>
                          <th className="py-2.5 px-4">Degree</th>
                          <th className="py-2.5 px-4">Disclosed Predicate</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04]">
                        {paginatedCredentials.map((cred) => (
                          <tr key={cred.credentialId} className="hover:bg-[#f5f5f7]/50 transition">
                            <td className="py-2.5 px-4 font-mono font-medium text-[#1d1d1f]">{cred.credentialId}</td>
                            <td className="py-2.5 px-4 font-semibold text-[#1d1d1f]">
                              {cred.disclosures.find(d => d.key === "full_name")?.value || "Student"}
                            </td>
                            <td className="py-2.5 px-4 text-[#86868b]">{cred.disclosedClaims.degree}</td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#34c759]/10 text-[#34c759]">
                                CGPA &ge; 8.0: {cred.disclosedClaims.cgpa_above_8 ? "TRUE" : "FALSE"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => setSelectedCred(cred)}
                                className="text-[#0071e3] hover:underline font-medium text-xs"
                              >
                                View Payload
                              </button>
                              <button
                                type="button"
                                onClick={() => copyToken(cred.encodedToken)}
                                className="p-1 text-[#86868b] hover:text-[#1d1d1f] rounded"
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

                  {/* Credentials Pagination */}
                  <Pagination
                    currentPage={currentCredPage}
                    totalItems={batch.credentials.length}
                    pageSize={CRED_PAGE_SIZE}
                    onPageChange={(p) => setCredPages(prev => ({ ...prev, [batch.batchId]: p }))}
                    itemName="credentials"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Batches List Pagination */}
      <Pagination
        currentPage={batchesPage}
        totalItems={batches.length}
        pageSize={BATCHES_PAGE_SIZE}
        onPageChange={setBatchesPage}
        itemName="batches"
      />

      {/* Credential Payload Modal */}
      {selectedCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-black/[0.08] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <h3 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0071e3]" /> W3C SD-JWT Credential Payload
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCred(null)}
                className="text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] px-2.5 py-1 rounded-full hover:bg-[#f5f5f7]"
              >
                Done
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[#86868b] font-medium block mb-1.5">Public Disclosed Claims:</span>
                <pre className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/[0.04] text-[#1d1d1f] font-mono overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedCred.disclosedClaims, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-[#86868b] font-medium block mb-1.5">Salted Hidden Disclosures (Selective Disclosure):</span>
                <pre className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/[0.04] text-[#1d1d1f] font-mono overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedCred.disclosures, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-[#86868b] font-medium block mb-1.5">Merkle Inclusion Proof (Polygon Amoy):</span>
                <pre className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/[0.04] text-[#0071e3] font-mono overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedCred.merkleProof, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => copyToken(selectedCred.encodedToken)}
                className="flex items-center gap-2 bg-[#1d1d1f] hover:bg-black text-white px-5 py-2 rounded-full text-xs font-semibold shadow-sm transition active:scale-[0.98]"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedToken ? "Copied Token" : "Copy Token"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
