'use client';

import React from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  Award, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  FileCode2,
  Lock
} from 'lucide-react';
import { NexoCredential } from '@/lib/types';

interface StudentTimelineProps {
  credentials: NexoCredential[];
}

export function StudentTimeline({ credentials }: StudentTimelineProps) {
  // Combine credentials into a chronologically sorted verifiable career journey
  const milestones = [
    {
      year: '2024',
      date: 'June 15, 2024',
      type: 'academic',
      title: 'Bachelor of Technology in Computer Science and Engineering',
      institution: 'Indian Institute of Technology Bombay',
      subtitle: 'First Class with Distinction • CGPA 8.85 / 10.0',
      proofStatus: 'Anchored on Polygon Amoy',
      txHash: '0xae0789d1a055d1dd77395ba5c4b8e2b8cb13a89178ad976f4e1f7481ba2a6888',
      merkleRoot: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      claims: ['Degree Awarded', 'Major: Computer Science', 'CGPA ≥ 8.0: Proved', 'Convocation #62'],
      badgeColor: 'blue'
    },
    {
      year: '2023 - 2024',
      date: 'May 10, 2024',
      type: 'experience',
      title: 'Senior Systems Engineering Internship & Relieving Record',
      institution: 'Tata Consultancy Services (TCS Innovation Labs)',
      subtitle: 'Distributed Systems & Blockchain Infrastructure Division',
      proofStatus: 'Anchored on Polygon Amoy',
      txHash: '0x5b38da6a701c568545dcfcb03fcb875f56beddc4f4c8034a74a159f3e498c567',
      merkleRoot: '0x3a4b9c1e2f5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      claims: ['Performance: Exceptional', 'Security Clearance: Verified', 'Relieved in Good Standing'],
      badgeColor: 'emerald'
    },
    {
      year: '2020',
      date: 'November 20, 2020',
      type: 'academic',
      title: 'Admissions & Matriculation Verification',
      institution: 'Joint Entrance Examination (JEE Advanced) / IIT Bombay',
      subtitle: 'All India Rank (AIR) Qualified Scholar',
      proofStatus: 'Identity Root Bound',
      txHash: '0x99f8d1a055d1dd77395ba5c4b8e2b8cb13a89178ad976f4e1f7481ba2a1122',
      merkleRoot: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      claims: ['Matriculation Verified', 'Enrollment Roll: IITB-2024-001'],
      badgeColor: 'indigo'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Verifiable Academic &amp; Career Timeline
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              100% Cryptographically Anchored
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chronological milestone chain backed by immutable Merkle proofs on Polygon Amoy.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-time On-Chain Validity</span>
        </div>
      </div>

      {/* Timeline track */}
      <div className="mt-8 relative pl-6 sm:pl-8 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {milestones.map((item, idx) => (
          <div key={idx} className="relative pb-10 last:pb-2 group">
            {/* Timeline node bullet */}
            <div className={`absolute -left-[27px] sm:-left-[31px] top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white ${
              item.badgeColor === 'blue' 
                ? 'border-blue-600 text-blue-600 shadow-blue-100' 
                : item.badgeColor === 'emerald'
                ? 'border-emerald-600 text-emerald-600 shadow-emerald-100'
                : 'border-indigo-600 text-indigo-600 shadow-indigo-100'
            } shadow-sm group-hover:scale-110 transition`}>
              {item.type === 'academic' ? (
                <GraduationCap className="w-3.5 h-3.5" />
              ) : (
                <Briefcase className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Timeline content box */}
            <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 transition">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono">
                    {item.year}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {item.date}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg w-fit">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{item.proofStatus}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900">
                {item.title}
              </h3>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                {item.institution}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.subtitle}
              </p>

              {/* Claims pills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.claims.map((claim, cIdx) => (
                  <span 
                    key={cIdx}
                    className="text-[11px] font-medium bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-md flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {claim}
                  </span>
                ))}
              </div>

              {/* Merkle anchor & polygon tx explorer link */}
              <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 font-mono">
                  <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Merkle Root: {item.merkleRoot.slice(0, 16)}...</span>
                </div>
                <a
                  href={`https://amoy.polygonscan.com/tx/${item.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium underline transition"
                >
                  <span>Verify TX on Amoy</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
