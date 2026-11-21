'use client';

import React, { useState, useMemo } from 'react';
import { Shield, Clock, Check, History } from 'lucide-react';
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
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto mb-3">
          <History className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-neutral-900">No Sharing History Yet</h4>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Whenever you share a credential using selective disclosure, a DPDP-compliant consent record will be immutably recorded here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4 p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
        <div>
          <h3 className="text-base font-bold text-neutral-900 tracking-tight">Consent &amp; Sharing Log</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Audit-log of selective disclosure tokens and verification consents.
          </p>
        </div>
        <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-lg self-start sm:self-auto font-mono">
          {logs.length} Total Shares
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Target Recruiter</th>
              <th className="py-2.5 px-3">Credential</th>
              <th className="py-2.5 px-3">Disclosed Fields</th>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs">
            {pagedLogs.map((log) => {
              const isExpired = new Date(log.expiresAt).getTime() < Date.now();
              return (
                <tr key={log.id} className="hover:bg-neutral-50/70 transition">
                  <td className="py-3 px-3 font-medium text-neutral-900">
                    {log.recipient}
                  </td>
                  <td className="py-3 px-3 text-neutral-600">
                    {log.credentialTitle}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {log.disclosedClaims.slice(0, 3).map((claim) => (
                        <span
                          key={claim}
                          className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-[10px] font-mono rounded"
                        >
                          {claim}
                        </span>
                      ))}
                      {log.disclosedClaims.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-neutral-200/60 text-neutral-700 text-[10px] font-medium rounded">
                          +{log.disclosedClaims.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-neutral-400 whitespace-nowrap text-[11px]">
                    {new Date(log.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-500">
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
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
