import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, GraduationCap, Building2, QrCode } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nexo - Tamper-Proof Digital Credential Network',
  description: 'Decentralized verifiable credentials for universities, students, and recruiters on Polygon Amoy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900">NEXO</span>
                <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase block -mt-1">
                  Credential Network
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/student"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student Wallet</span>
              </Link>
              <Link
                href="/university"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <Building2 className="w-4 h-4" />
                <span>University Portal</span>
              </Link>
              <Link
                href="/verify"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <QrCode className="w-4 h-4" />
                <span>Recruiter Verifier</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
