"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  GraduationCap, 
  Building2, 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  LogIn, 
  UserCircle2 
} from 'lucide-react';
import { ROLE_PORTALS } from '@/lib/domain-registry';

export default function HomePage() {
  const { user } = useAuth();

  const role = user?.role?.toLowerCase();
  const isIssuer = role === "issuer";
  const isStudent = role === "student";
  const isReviewer = role === "reviewer";

  const userPortalPath = user ? (user.portalPath || (isIssuer ? "/university" : isStudent ? "/student" : "/verify")) : "/login";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Role State Banner (If Logged In) */}
      {user && (
        <div className="mb-8 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isIssuer ? "bg-blue-100 text-blue-700" : isStudent ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {isIssuer ? <Building2 className="w-5 h-5" /> : isStudent ? <GraduationCap className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Active Session: {isIssuer ? "University Issuer" : isStudent ? "Student Credential Holder" : "Company Reviewer"}
              </span>
              <p className="text-sm font-bold text-slate-900">
                {user.name} ({user.email}) &bull; <span className="text-slate-500 font-normal">{user.organization}</span>
              </p>
            </div>
          </div>

          <Link
            href={userPortalPath}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition shrink-0"
          >
            <span>Open My Authorized Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 shadow-sm">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Polygon Amoy Testnet • Role-Based Credential Network</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
          Tamper-Proof Credential Network for India
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Universities issue tamper-proof digital certificates in bulk. Students hold them in a zero-gas wallet. Recruiters verify them in seconds without phone calls or background check delays.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {!user ? (
            <Link
              href="/login"
              className="flex items-center gap-2 px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In with Institutional / Corporate Email</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href={userPortalPath}
              className="flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              <span>Go to Your Portal ({isIssuer ? "University" : isStudent ? "Student" : "Reviewer"})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Feature Pillars / Role Entrances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 sm:mt-24">
        {/* Module 1: University Issuer */}
        <div className={`bg-white border rounded-3xl p-8 shadow-sm flex flex-col justify-between transition ${
          isIssuer ? "ring-2 ring-blue-500 border-blue-300" : "border-slate-200"
        }`}>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              University Domain Only
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">University Issuer Portal</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Upload existing ERP/CSV exports. One single transaction anchors thousands of digital credentials on Polygon Amoy.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/university" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Enter Issuer Portal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Module 2: Student Wallet */}
        <div className={`bg-white border rounded-3xl p-8 shadow-sm flex flex-col justify-between transition ${
          isStudent ? "ring-2 ring-indigo-500 border-indigo-300" : "border-slate-200"
        }`}>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              @college.isu.ac.in Only
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">Student In-App Wallet</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Zero-gas, zero-seed-phrase wallet. Disclose &quot;CGPA &ge; 8.0: true&quot; while mathematically redacting exact marks.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/student" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Open Student Wallet <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Module 3: Company Reviewer */}
        <div className={`bg-white border rounded-3xl p-8 shadow-sm flex flex-col justify-between transition ${
          isReviewer ? "ring-2 ring-emerald-500 border-emerald-300" : "border-slate-200"
        }`}>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Company Domain Only
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">Company Reviewer Portal</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Scan candidate QR code. Mathematically verifies digital signature, issuer trust registry, and revocation status in &lt; 2 seconds.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/verify" className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
              Open Reviewer Portal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
