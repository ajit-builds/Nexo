'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Check, 
  ExternalLink, 
  QrCode, 
  FileText, 
  Briefcase, 
  GraduationCap,
  Calendar,
  Layers,
  X
} from 'lucide-react';
import { NexoCredential } from '@/lib/types';
import { StudentVerifyCard } from '@/components/StudentVerifyCard';

interface CredentialCardProps {
  credential: NexoCredential;
  onShare: (credential: NexoCredential) => void;
}

export function CredentialCard({ credential, onShare }: CredentialCardProps) {
  const [showCertModal, setShowCertModal] = useState(false);
  const isAcademic = credential.type === 'academic';
  const claims = credential.claims;

  // Listen to Escape key to close modal
  useEffect(() => {
    if (!showCertModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCertModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCertModal]);

  return (
    <div className="bg-white border border-neutral-200/90 hover:border-neutral-300 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isAcademic 
                ? 'bg-neutral-50 text-neutral-900 border-neutral-200/80' 
                : 'bg-neutral-50 text-neutral-900 border-neutral-200/80'
            }`}>
              {isAcademic ? (
                <GraduationCap className="w-5 h-5 text-neutral-800" />
              ) : (
                <Briefcase className="w-5 h-5 text-neutral-800" />
              )}
            </div>
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                {isAcademic ? 'Degree Certificate' : 'Employment Record'}
              </span>
              <h3 className="text-base font-bold text-neutral-900 mt-0.5 leading-snug">
                {credential.title}
              </h3>
              <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{credential.issuerName}</span>
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-medium shrink-0">
            <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
            <span>Verified</span>
          </div>
        </div>

        {/* Structured Metadata - Clean Editorial Grid */}
        <div className="py-4 space-y-2.5 text-xs">
          {isAcademic ? (
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <span className="text-[11px] text-neutral-400 block font-normal">Specialization</span>
                <span className="font-medium text-neutral-800 truncate block mt-0.5">{claims.major || 'Computer Science'}</span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block font-normal">Graduation Year</span>
                <span className="font-medium text-neutral-800 block mt-0.5">{claims.graduation_year || '2024'}</span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block font-normal">Cumulative CGPA</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-semibold text-neutral-900">{claims.cgpa} / 10.0</span>
                  {claims.cgpa_above_8 && (
                    <span className="text-[10px] font-medium bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded">
                      ≥ 8.0 Predicate
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block font-normal">Roll ID</span>
                <span className="font-mono text-neutral-600 text-xs truncate block mt-0.5">{claims.student_id}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <span className="text-[11px] text-neutral-400 block font-normal">Role</span>
                <span className="font-medium text-neutral-800 truncate block mt-0.5">{claims.designation}</span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block font-normal">Tenure</span>
                <span className="font-medium text-neutral-800 block mt-0.5">{claims.experience_years} Years</span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block font-normal">Period</span>
                <span className="font-medium text-neutral-700 text-xs truncate block mt-0.5">{claims.start_date} – {claims.end_date}</span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block font-normal">Conduct Rating</span>
                <span className="font-semibold text-emerald-700 text-xs block mt-0.5">{claims.conduct_rating}</span>
              </div>
            </div>
          )}

          {/* Cryptographic Footprint Info */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-neutral-400" />
              <span>Merkle Root Anchored</span>
            </span>
            <span className="text-neutral-400">{credential.issuedAt}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2">
        <button
          onClick={() => onShare(credential)}
          className="flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white font-medium py-2.5 px-3 rounded-xl transition text-xs shadow-sm"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Share via QR</span>
        </button>

        <button
          onClick={() => setShowCertModal(true)}
          className="flex items-center justify-center gap-1.5 bg-white hover:bg-neutral-50 active:scale-[0.98] text-neutral-700 font-medium py-2.5 px-3 rounded-xl transition border border-neutral-200 text-xs"
        >
          <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          <span>Certificate</span>
        </button>
      </div>

      {/* Verified Certificate Modal */}
      {showCertModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowCertModal(false)}
        >
          <div 
            className="relative max-w-2xl w-full my-auto z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <StudentVerifyCard
              title={credential.title}
              recipient={claims.name || claims.full_name || 'Aarav Sharma'}
              issuer={credential.issuerName}
              issueDate={credential.issuedAt || 'May 15, 2024'}
              transactionId={
                credential.merkleRoot ||
                credential.credentialHash ||
                '0xae0789d1a055d1dd765b820a44fcb2d881ef10'
              }
              isVerified={true}
              onReset={() => setShowCertModal(false)}
              onClose={() => setShowCertModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
