import Link from 'next/link';
import { 
  GraduationCap, 
  Building2, 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Lock, 
  Zap, 
  Sparkles 
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 shadow-sm">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Polygon Amoy Testnet • 100% Free & Open-Source</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
          Tamper-Proof Credential Network for India
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Universities issue tamper-proof digital certificates in bulk. Students hold them in a zero-gas wallet. Recruiters verify them in seconds without phone calls or background check delays.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/student"
            className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-indigo-200 transition"
          >
            <GraduationCap className="w-5 h-5" />
            <span>Open Student In-App Wallet</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/verify"
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition"
          >
            <QrCode className="w-5 h-5" />
            <span>Recruiter Verifier</span>
          </Link>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 sm:mt-24">
        {/* Module 1 & 2 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Module 2 • University Portal
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">Bulk Issuance & Merkle Batching</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Upload existing ERP/CSV exports. One single transaction anchors thousands of digital credentials on Polygon Amoy.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/university" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Explore Issuer Portal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Module 3 (Member 3) */}
        <div className="bg-gradient-to-b from-indigo-50/50 to-white border-2 border-indigo-200 rounded-3xl p-8 shadow-md flex flex-col justify-between relative">
          <div className="absolute top-4 right-4">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white rounded-full">
              Live Demo
            </span>
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-6 shadow-md shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
              Module 3 • Student Wallet
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">In-App Wallet & Selective Disclosure</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Zero-gas, zero-seed-phrase wallet. Disclose &quot;CGPA ≥ 8.0: true&quot; while mathematically redacting exact marks.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-indigo-100">
            <Link href="/student" className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1">
              Launch Student Wallet <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Module 4 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Module 4 • Recruiter Verifier
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">Instant QR Verification</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Scan candidate QR code. Mathematically verifies digital signature, issuer trust registry, and revocation status in &lt; 2 seconds.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/verify" className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
              Open Recruiter Scanner <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
