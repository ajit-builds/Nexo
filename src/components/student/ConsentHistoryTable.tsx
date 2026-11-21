'use client';

import React from 'react';
import { Shield, Clock, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { ConsentLogEntry } from '@/lib/types';

interface ConsentHistoryTableProps {
  logs: ConsentLogEntry[];
}

export function ConsentHistoryTable({ logs }: ConsentHistoryTableProps) {
  if (logs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <History className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-700">No Sharing History Yet</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Whenever you share a credential using selective disclosure, a DPDP-compliant consent record will be immutably recorded here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Shield className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">Consent & Sharing Log</h3>
            <p className="text-xs text-slate-500">
              DPDP Act (India) compliant: Audit log of all verifications and consent grants.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
          {logs.length} Total Shares
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-5">Target Recruiter</th>
              <th className="py-3 px-5">Credential</th>
              <th className="py-3 px-5">Disclosed Fields</th>
              <th className="py-3 px-5">Timestamp</th>
              <th className="py-3 px-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {logs.map((log) => {
              const isExpired = new Date(log.expiresAt).getTime() < Date.now();
              return (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-5 font-semibold text-slate-800">
                    {log.recipient}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600">
                    {log.credentialTitle}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {log.disclosedClaims.slice(0, 3).map((claim) => (
                        <span
                          key={claim}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded"
                        >
                          {claim}
                        </span>
                      ))}
                      {log.disclosedClaims.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded">
                          +{log.disclosedClaims.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
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
    </div>
  );
}
