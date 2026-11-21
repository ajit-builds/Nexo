"use client";

import React from "react";
import { Award, Database, ShieldAlert, Clock, TrendingUp } from "lucide-react";
import { BatchRecord, RevocationRecord } from "@/types";

interface Props {
  batches: BatchRecord[];
  revocations: RevocationRecord[];
}

export function IssuerAnalytics({ batches, revocations }: Props) {
  const totalIssued = batches.reduce((acc, b) => acc + b.totalCredentials, 0);
  const totalActive = Math.max(0, totalIssued - revocations.length);
  const hoursSaved = Math.round(totalIssued * 4.5); // Approx 4.5 hours per manual BGV check

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-black/[0.06] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">Issuer Performance & Network Analytics</h2>
        <p className="text-[#86868b] text-sm mt-1 max-w-2xl leading-relaxed">
          Real-time metrics on credential anchoring, administrative throughput, and automated background verification savings.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl border border-black/[0.06] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3">
          <div className="flex items-center justify-between text-[#86868b] text-xs font-medium">
            <span>Total Issued</span>
            <Award className="w-4 h-4 text-[#0071e3]" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight">{totalIssued}</div>
          <p className="text-xs text-[#34c759] flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> Digitally signed & anchored
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-black/[0.06] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3">
          <div className="flex items-center justify-between text-[#86868b] text-xs font-medium">
            <span>Anchored Batches</span>
            <Database className="w-4 h-4 text-[#5856d6]" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight">{batches.length}</div>
          <p className="text-xs text-[#5856d6] font-medium">
            1 tx per batch on Polygon Amoy
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-black/[0.06] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3">
          <div className="flex items-center justify-between text-[#86868b] text-xs font-medium">
            <span>Active vs Revoked</span>
            <ShieldAlert className="w-4 h-4 text-[#ff9500]" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight">
            {totalActive} <span className="text-base font-normal text-[#ff3b30]">/ {revocations.length} Revoked</span>
          </div>
          <p className="text-xs text-[#86868b] font-medium">
            On-chain revocation enforcement
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-black/[0.06] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3">
          <div className="flex items-center justify-between text-[#86868b] text-xs font-medium">
            <span>Hours Saved</span>
            <Clock className="w-4 h-4 text-[#34c759]" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight">{hoursSaved} hrs</div>
          <p className="text-xs text-[#34c759] font-medium">
            Self-service instant verification
          </p>
        </div>
      </div>

      {/* Feature Value Grid */}
      <div className="bg-white rounded-3xl border border-black/[0.06] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5">
        <h3 className="text-base font-semibold text-[#1d1d1f]">Trust & Efficiency Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 bg-[#f5f5f7] border border-black/[0.04] rounded-2xl space-y-2">
            <span className="text-[#0071e3] font-semibold block text-sm">Gas Optimization</span>
            <p className="text-[#86868b] leading-relaxed">
              By using <code className="text-[#1d1d1f] font-mono text-[11px] bg-white px-1.5 py-0.5 rounded">@openzeppelin/merkle-tree</code>, anchoring 1,000 credentials costs the university the exact same gas as issuing 1 credential (~0.002 MATIC).
            </p>
          </div>

          <div className="p-5 bg-[#f5f5f7] border border-black/[0.04] rounded-2xl space-y-2">
            <span className="text-[#5856d6] font-semibold block text-sm">Tamper-Proof Integrity</span>
            <p className="text-[#86868b] leading-relaxed">
              Any modification to student marks or names creates a different leaf hash that instantly fails Merkle root verification against Polygon Amoy.
            </p>
          </div>

          <div className="p-5 bg-[#f5f5f7] border border-black/[0.04] rounded-2xl space-y-2">
            <span className="text-[#34c759] font-semibold block text-sm">Data Privacy Compliance</span>
            <p className="text-[#86868b] leading-relaxed">
              Zero student personal data (PII) is ever stored on the public blockchain, strictly adhering to India&apos;s DPDP Act regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}