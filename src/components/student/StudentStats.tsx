'use client';

import React from 'react';
import { 
  FileCheck2, 
  ShieldCheck, 
  Share2, 
  Cpu
} from 'lucide-react';
import { NexoCredential, ConsentLogEntry } from '@/lib/types';

interface StudentStatsProps {
  credentials: NexoCredential[];
  consentLogs: ConsentLogEntry[];
}

export function StudentStats({ credentials, consentLogs }: StudentStatsProps) {
  const totalCreds = credentials.length;
  const academicCount = credentials.filter((c) => c.type === 'academic').length;
  const experienceCount = credentials.filter((c) => c.type === 'experience').length;
  const totalShares = consentLogs.length;

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
        
        {/* Metric 1: Verified Credentials */}
        <div className="p-3 sm:px-4 sm:py-2 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Portfolio
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight text-neutral-900">{totalCreds}</span>
            <span className="text-xs text-neutral-500 font-medium">Credentials</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
            {academicCount} Degree · {experienceCount} Work Experience
          </p>
        </div>

        {/* Metric 2: Cryptographic Anchor */}
        <div className="p-3 sm:px-4 sm:py-2 flex flex-col justify-between pt-4 md:pt-2">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Verification
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-sm font-semibold text-neutral-900">W3C SD-JWT</span>
            <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
            Selective disclosure &amp; zero-knowledge predicates
          </p>
        </div>

        {/* Metric 3: Active Consents */}
        <div className="p-3 sm:px-4 sm:py-2 flex flex-col justify-between pt-4 md:pt-2">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Privacy &amp; Consents
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight text-neutral-900">{totalShares}</span>
            <span className="text-xs text-neutral-500 font-medium">DPDP Tokens</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
            Time-bound audit logs for verification
          </p>
        </div>

        {/* Metric 4: On-Chain Settlement */}
        <div className="p-3 sm:px-4 sm:py-2 flex flex-col justify-between pt-4 md:pt-2">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Network Anchor
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-sm font-semibold text-neutral-900">Polygon Amoy</span>
            <span className="text-[10px] text-neutral-400 font-mono">Chain 80002</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
            Zero gas cost for student holders
          </p>
        </div>

      </div>
    </div>
  );
}
