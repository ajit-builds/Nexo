"use client";

import React from "react";
import { Award, Database, ShieldAlert, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
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
      <div>
        <h2 className="text-xl font-bold text-white">Issuer Performance & Network Analytics</h2>
        <p className="text-gray-400 text-sm">
          Metrics on credential anchoring, administrative throughput, and automated verification savings
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Total Issued Credentials</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalIssued}</div>
          <p className="text-xs text-green-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> Digitally signed & anchored
          </p>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Anchored Merkle Batches</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{batches.length}</div>
          <p className="text-xs text-purple-400 font-medium">
            1 tx per batch on Polygon Amoy
          </p>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Active vs Revoked</span>
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {totalActive} <span className="text-sm font-normal text-red-400">/ {revocations.length} Revoked</span>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            On-chain revocation enforcement
          </p>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Registrar Hours Saved</span>
            <Clock className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{hoursSaved} hrs</div>
          <p className="text-xs text-green-400 font-medium">
            Self-service instant verification
          </p>
        </div>
      </div>

      {/* Feature Value Grid */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Trust & Efficiency Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-black/40 border border-gray-800 rounded-lg space-y-2">
            <span className="text-indigo-400 font-semibold block text-sm">Gas Optimization</span>
            <p className="text-gray-300">
              By using <code className="text-indigo-300 font-mono">@openzeppelin/merkle-tree</code>, anchoring 1,000 credentials costs the university the exact same gas as issuing 1 credential (~0.002 MATIC).
            </p>
          </div>

          <div className="p-4 bg-black/40 border border-gray-800 rounded-lg space-y-2">
            <span className="text-purple-400 font-semibold block text-sm">Tamper-Proof Integrity</span>
            <p className="text-gray-300">
              Any modification to student marks or names creates a different leaf hash that instantly fails Merkle root verification against Polygon Amoy.
            </p>
          </div>

          <div className="p-4 bg-black/40 border border-gray-800 rounded-lg space-y-2">
            <span className="text-green-400 font-semibold block text-sm">Data Privacy Compliance</span>
            <p className="text-gray-300">
              Zero student personal data (PII) is ever stored on the public blockchain, strictly adhering to India's DPDP Act regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
