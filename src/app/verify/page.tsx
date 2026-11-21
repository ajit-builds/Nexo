import Link from 'next/link';
import { QrCode, ScanLine, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function VerifyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-6">
        <QrCode className="w-8 h-8" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
        Module 4 • Assigned to @foggypants
      </span>
      <h1 className="text-3xl font-black text-slate-900 mt-4">Recruiter Verifier Portal</h1>
      <p className="text-slate-600 max-w-lg mx-auto mt-2 text-sm leading-relaxed">
        Webcam QR code scanning (`html5-qrcode`), mathematical signature verification, TrustRegistry checks, and instant fraud detection.
      </p>

      <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-left">
        <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Module 4 Key Tasks:</h4>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>QR code scanner reading Member 3&apos;s presentation payload</li>
          <li>Polygon Amoy on-chain trust check (`isIssuerTrusted`)</li>
          <li>Merkle inclusion verification against anchored root</li>
          <li>Revocation registry check (`isCredentialRevoked`)</li>
        </ul>
      </div>

      <div className="mt-8">
        <Link
          href="/student"
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Module 3 (Student Wallet)
        </Link>
      </div>
    </div>
  );
}
