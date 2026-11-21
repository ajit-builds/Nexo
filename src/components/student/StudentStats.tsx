'use client';

import React from 'react';
import { 
  Award, 
  ShieldCheck, 
  Share2, 
  Zap, 
  Lock, 
  TrendingUp, 
  FileCheck2,
  CheckCircle2
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Verifiable Documents */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
          <span>Verifiable Portfolio</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900 tracking-tight">
          {totalCreds}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium mt-1.5">
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>{academicCount} Degree · {experienceCount} Experience</span>
        </div>
      </div>

      {/* 2. Privacy Shield (SD-JWT) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
          <span>Privacy Shield (SD-JWT)</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
          100% <span className="text-xs font-semibold text-indigo-600">Active</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium mt-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Selective disclosure &amp; predicates</span>
        </div>
      </div>

      {/* 3. Recruiter Shares & DPDP Consents */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
          <span>DPDP Active Consents</span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900 tracking-tight">
          {totalShares}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-purple-700 font-medium mt-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
          <span>Audit-logged presentation tokens</span>
        </div>
      </div>

      {/* 4. Zero Gas Expense */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
          <span>Student Gas Incurred</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900 tracking-tight">
          0.00 <span className="text-xs font-bold text-slate-400">MATIC</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mt-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>100% Relayer subsidized</span>
        </div>
      </div>
    </div>
  );
}
