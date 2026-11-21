"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { Building2, ArrowLeft, ExternalLink } from "lucide-react";
import { IssuerPortal } from "@/components/IssuerPortal";
import { AuthGuard } from "@/components/auth/AuthGuard";

function UniversityContent() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col">
      {/* Sub-header / Navigation */}
      <div className="border-b border-black/[0.06] bg-white/80 backdrop-blur-xl sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Link>
            <span className="text-[#d2d2d7]">/</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#1d1d1f] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0071e3]" /> Issuer Portal
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full">
                Institutional Access
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href="https://amoy.polygonscan.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] border border-black/[0.06] text-[#1d1d1f] hover:bg-[#e8e8ed] transition font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-[#34c759] animate-pulse"></span>
              Polygon Amoy <ExternalLink className="w-3 h-3 text-[#86868b]" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Issuer Portal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <IssuerPortal />
      </main>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] bg-white py-6 text-center text-xs text-[#86868b]">
        <p>Nexo &bull; Module 2: Issuer Portal &amp; Batch Issuance Engine &bull; Polygon Amoy &amp; W3C SD-JWT</p>
      </footer>
    </div>
  );
}

export default function UniversityPage() {
  return (
    <AuthGuard allowedRole="ISSUER">
      <Suspense fallback={<div className="p-12 text-center text-sm text-[#86868b]">Loading Issuer Portal...</div>}>
        <UniversityContent />
      </Suspense>
    </AuthGuard>
  );
}
