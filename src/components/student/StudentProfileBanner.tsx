'use client';

import React, { useState } from 'react';
import { 
  GraduationCap, 
  Building2, 
  CheckCircle2, 
  Copy, 
  Check, 
  KeyRound, 
  ShieldCheck, 
  Sparkles,
  User,
  Zap,
  RefreshCw
} from 'lucide-react';
import { StoredStudentWallet } from '@/lib/types';

interface StudentProfileBannerProps {
  wallet: StoredStudentWallet | null;
  activeStudent: {
    studentId: string;
    name: string;
    degree?: string;
    major?: string;
    institution?: string;
    cgpa?: number | string;
    cgpa_above_8?: boolean;
    graduation_year?: number | string;
  };
  availableStudents: any[];
  onSelectStudent: (studentId: string) => void;
  isLoading?: boolean;
}

export function StudentProfileBanner({
  wallet,
  activeStudent,
  availableStudents,
  onSelectStudent,
  isLoading = false,
}: StudentProfileBannerProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedAddress = wallet?.address
    ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}`
    : 'Generating keypair...';

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
      {/* Background glow & accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Avatar + Scholar Info */}
        <div className="flex items-start sm:items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white">
                <GraduationCap className="w-9 h-9 text-indigo-300" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {activeStudent.name || 'Scholar Profile'}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                Verified Scholar
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-medium">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                {activeStudent.institution || 'Indian Institute of Technology Bombay'}
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-slate-300">
                ID: {activeStudent.studentId}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-300 font-semibold">
                Class of {activeStudent.graduation_year || '2024'}
              </span>
            </div>

            {/* Academic Predicate Proof Pill */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                <Check className="w-3 h-3 text-emerald-400" />
                CGPA ≥ 8.0 Predicate: Proved ({activeStudent.cgpa} / 10.0)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                DPDP Act Compliant
              </span>
            </div>
          </div>
        </div>

        {/* Right: Wallet Details & Live ERP Switcher */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          {/* Sovereign In-App Key Badge */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 px-4 shadow-inner flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <span>In-App Sovereign Key</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                  AES-GCM
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs font-semibold text-slate-200">
                  {truncatedAddress}
                </span>
                <button
                  onClick={copyAddress}
                  className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  title="Copy sovereign address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* ERP Switcher Dropdown (for testing multi-student batch) */}
          {availableStudents.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">ERP Profile:</span>
              <select
                value={activeStudent.studentId}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {availableStudents.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.name} ({s.studentId})
                  </option>
                ))}
              </select>
              {isLoading && <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
