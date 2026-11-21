'use client';

import React from 'react';
import { 
  Building2, 
  ExternalLink, 
  Check, 
  Layers
} from 'lucide-react';
import { NexoCredential } from '@/lib/types';

interface StudentTimelineProps {
  credentials: NexoCredential[];
}

export function StudentTimeline({ credentials }: StudentTimelineProps) {
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
      claims: ['Degree Awarded', 'Major: Computer Science', 'CGPA ≥ 8.0: Proved', 'Convocation #62']
    },
    {
      year: '2023 - 2024',
      date: 'May 10, 2024',
      type: 'experience',
      title: 'Systems Engineering Internship & Relieving Record',
      institution: 'Tata Consultancy Services (TCS Innovation Labs)',
      subtitle: 'Distributed Systems & Blockchain Infrastructure Division',
      proofStatus: 'Anchored on Polygon Amoy',
      txHash: '0x5b38da6a701c568545dcfcb03fcb875f56beddc4f4c8034a74a159f3e498c567',
      merkleRoot: '0x3a4b9c1e2f5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      claims: ['Performance: Exceptional', 'Security Clearance: Verified', 'Relieved in Good Standing']
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
      claims: ['Matriculation Verified', 'Enrollment Roll: IITB-2024-001']
    }
  ];

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-neutral-100">
        <div>
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">
            Academic &amp; Career History
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Chronological milestone chain verified on-chain.
          </p>
        </div>
        <div className="text-[11px] text-neutral-400 font-mono">
          Polygon Amoy (80002)
        </div>
      </div>

      {/* Timeline track */}
      <div className="mt-6 relative pl-6 sm:pl-7 before:content-[''] before:absolute before:left-2.5 sm:before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-neutral-200">
        {milestones.map((item, idx) => (
          <div key={idx} className="relative pb-8 last:pb-2">
            {/* Timeline bullet */}
            <div className="absolute -left-[20px] sm:-left-[22px] top-1.5 w-3 h-3 rounded-full bg-neutral-900 border-2 border-white" />

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-neutral-400 font-medium">{item.date}</span>
                <span className="text-neutral-300">•</span>
                <span className="text-xs font-semibold text-neutral-900">{item.title}</span>
              </div>

              <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>{item.institution}</span>
                <span className="text-neutral-300">•</span>
                <span className="text-neutral-600">{item.subtitle}</span>
              </div>

              {/* Claims pill tags */}
              <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                {item.claims.map((claim, cIdx) => (
                  <span
                    key={cIdx}
                    className="text-[11px] text-neutral-600 bg-neutral-100 border border-neutral-200/60 px-2 py-0.5 rounded-md"
                  >
                    {claim}
                  </span>
                ))}
              </div>

              {/* Hash / Proof metadata */}
              <div className="pt-1 text-[11px] font-mono text-neutral-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                <a
                  href={`https://amoy.polygonscan.com/tx/${item.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-neutral-800 transition inline-flex items-center gap-1"
                >
                  <span>Tx: {item.txHash.slice(0, 10)}...{item.txHash.slice(-6)}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
