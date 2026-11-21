"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  GraduationCap, 
  Building2, 
  QrCode, 
  ArrowRight, 
  LogIn 
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Role State Banner (If Logged In) */}
      {user && (
        <div className="mb-12 p-5 bg-white border border-black/[0.06] rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f]">
              {user.role === "issuer" ? <Building2 className="w-5 h-5" /> : user.role === "student" ? <GraduationCap className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block">
                Signed in as {user.roleTitle}
              </span>
              <p className="text-sm font-medium text-[#1d1d1f]">
                {user.name} ({user.email}) &bull; <span className="text-[#86868b] font-normal">{user.organization}</span>
              </p>
            </div>
          </div>

          <Link
            href={user.role === "issuer" ? "/university" : user.role === "student" ? "/student" : "/verify"}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1d1d1f] hover:bg-black text-white font-medium text-xs rounded-full shadow-sm transition active:scale-[0.98] shrink-0"
          >
            <span>Open Authorized Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] text-xs font-medium text-[#1d1d1f] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#34c759]"></span>
          <span>Polygon Amoy Network &bull; W3C SD-JWT Standard</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-semibold text-[#1d1d1f] tracking-tight leading-[1.1]">
          Verifiable credentials, made effortlessly simple.
        </h1>

        <p className="text-lg sm:text-xl text-[#86868b] max-w-2xl mx-auto font-normal leading-relaxed">
          Universities anchor graduation batches in one on-chain transaction. Students hold zero-gas privacy wallets. Recruiters verify credentials in seconds.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {!user ? (
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm rounded-full shadow-sm transition active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Work or Student Email</span>
            </Link>
          ) : (
            <Link
              href={user.role === "issuer" ? "/university" : user.role === "student" ? "/student" : "/verify"}
              className="flex items-center gap-2 px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm rounded-full shadow-sm transition active:scale-[0.98]"
            >
              <span>Continue to {user.roleTitle}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            href="/verify?mode=demo"
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-medium text-sm rounded-full border border-black/[0.08] shadow-sm transition active:scale-[0.98]"
          >
            <span>Try Verifier Demo</span>
          </Link>
        </div>
      </div>

      {/* Feature Pillars / Three Portals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 sm:mt-28">
        {/* Module 1 & 2: University Issuer */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] mb-6">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full">
              University Admin
            </span>
            <h3 className="text-xl font-semibold text-[#1d1d1f] mt-3">Issuer Portal</h3>
            <p className="text-sm text-[#86868b] mt-2 leading-relaxed">
              Upload CSV rosters. A single transaction anchors thousands of credentials on Polygon Amoy via Merkle trees.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-black/[0.04]">
            <Link href="/university" className="text-xs font-semibold text-[#0071e3] hover:underline flex items-center gap-1.5">
              <span>Open Issuer Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Module 3: Student Wallet */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] mb-6">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full">
              Student / Alumni
            </span>
            <h3 className="text-xl font-semibold text-[#1d1d1f] mt-3">In-App Wallet</h3>
            <p className="text-sm text-[#86868b] mt-2 leading-relaxed">
              Zero-gas browser wallet. Selectively disclose claims with zero-knowledge predicates without revealing raw marks.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-black/[0.04]">
            <Link href="/student" className="text-xs font-semibold text-[#0071e3] hover:underline flex items-center gap-1.5">
              <span>Open Student Wallet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Module 4: Recruiter Verifier */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] mb-6">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full">
              Recruiter / HR
            </span>
            <h3 className="text-xl font-semibold text-[#1d1d1f] mt-3">Instant Verifier</h3>
            <p className="text-sm text-[#86868b] mt-2 leading-relaxed">
              Scan candidate QR codes via camera or photo. Real-time verification of trust, Merkle root, and revocation in under 2s.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-black/[0.04]">
            <Link href="/verify" className="text-xs font-semibold text-[#0071e3] hover:underline flex items-center gap-1.5">
              <span>Open Verifier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
