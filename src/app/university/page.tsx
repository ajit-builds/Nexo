"use client";

import React from "react";
import Link from "next/link";
import { Building2, ArrowLeft, ShieldCheck, ExternalLink, Sparkles } from "lucide-react";
import { IssuerPortal } from "@/components/IssuerPortal";

export default function UniversityPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Sub-header / Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <span className="text-slate-700">/</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" /> University & Employer Issuer Portal
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 px-2 py-0.5 rounded-full">
                Module 2 • @pratikswain070-blip
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/student"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              🎓 Student Wallet
            </Link>
            <Link
              href="/verify"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              🔍 Recruiter Verifier
            </Link>
            <a
              href="https://amoy.polygonscan.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40 transition"
            >
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              Polygon Amoy <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Issuer Portal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <IssuerPortal />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Nexo Module 2 &bull; Issuer Portal & Batch Issuance Engine &bull; Polygon Amoy & W3C SD-JWT</p>
      </footer>
    </div>
  );
}
