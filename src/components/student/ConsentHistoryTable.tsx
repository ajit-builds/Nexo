'use client';

import React, { useState, useMemo } from 'react';
import { Shield, Clock, CheckCircle2, History } from 'lucide-react';
import { ConsentLogEntry } from '@/lib/types';
import { Pagination } from '@/components/ui/Pagination';

interface ConsentHistoryTableProps {
  logs: ConsentLogEntry[];
}

export function ConsentHistoryTable({ logs }: ConsentHistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const pagedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, currentPage]);

  if (logs.length === 0) {
    return (
      <div className="bg-white border border-black/[0.06] rounded-3xl p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#86868b] mx-auto mb-3">
          <History className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-[#1d1d1f]">No Sharing History Yet</h4>
        <p className="text-xs text-[#86868b] mt-1 max-w-sm mx-auto leading-relaxed">
          Whenever you share a credential using selective disclosure, a DPDP-compliant consent record will be immutably recorded here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-black/[0.06] rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-[#0071e3]/10 text-[#0071e3] rounded-2xl">
            <Shield className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[#1d1d1f] tracking-tight">Consent & Sharing Log</h3>
            <p className="text-xs text-[#86868b] mt-0.5">
              DPDP Act (India) compliant: Audit log of all verifications and consent grants.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold bg-[#f5f5f7] text-[#1d1d1f] px-3 py-1 rounded-full border border-black/[0.04] self-start sm:self-auto">
          {logs.length} Total Shares
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/[0.04] text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
              <th className="py-3 px-4">Target Recruiter</th>
              <th className="py-3 px-4">Credential</th>
              <th className="py-3 px-4">Disclosed Fields</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.03] text-xs">
            {pagedLogs.map((log) => {
              const isExpired = new Date(log.expiresAt).getTime() < Date.now();
              return (
                <tr key={log.id} className="hover:bg-[#f5f5f7]/60 transition">
                  <td className="py-3.5 px-4 font-semibold text-[#1d1d1f]">
                    {log.recipient}
                  </td>
                  <td className="py-3.5 px-4 text-[#86868b]">
                    {log.credentialTitle}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {log.disclosedClaims.slice(0, 3).map((claim) => (
                        <span
                          key={claim}
                          className="px-2 py-0.5 bg-[#f5f5f7] text-[#1d1d1f] text-[10px] font-mono rounded-md border border-black/[0.04]"
                        >
                          {claim}
                        </span>
                      ))}
                      {log.disclosedClaims.length > 3 && (
                        <span className="px-2 py-0.5 bg-[#0071e3]/10 text-[#0071e3] text-[10px] font-semibold rounded-md">
                          +{log.disclosedClaims.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#86868b] whitespace-nowrap text-[11px]">
                    {new Date(log.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#86868b] bg-[#f5f5f7] px-2.5 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#34c759] bg-[#34c759]/10 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {logs.length > pageSize && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalItems={logs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="records"
          />
        </div>
      )}
    </div>
  );
}