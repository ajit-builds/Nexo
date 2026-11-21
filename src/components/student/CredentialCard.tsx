'use client';

import React, { useState } from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  ShieldCheck, 
  Share2, 
  Layers, 
  Calendar, 
  Building2,
  ExternalLink,
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

  return (
    <div className="bg-white border border-black/[0.06] hover:border-[#0071e3]/40 rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 flex flex-col justify-between">
      {/* Top Header - Apple Solid Style */}
      <div className="p-6 sm:p-7 border-b border-black/[0.04] bg-[#fbfbfd]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isAcademic ? 'bg-[#0071e3] text-white' : 'bg-[#34c759] text-white'}`}>
              {isAcademic ? <GraduationCap className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
            </div>
            <div>
              <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isAcademic ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-[#34c759]/10 text-[#34c759]'}`}>
                {isAcademic ? 'Academic Degree' : 'Work Experience'}
              </span>
              <h3 className="text-lg font-bold text-[#1d1d1f] mt-1.5 leading-snug">{credential.title}</h3>
              <p className="text-xs font-medium text-[#86868b] flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-[#86868b]" />
                {credential.issuerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#34c759]/10 text-[#34c759] text-xs font-semibold flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </div>
        </div>
      </div>

      {/* Body: Key Claims Grid */}
      <div className="p-6 sm:p-7 space-y-4">
        {isAcademic ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/[0.03]">
              <span className="text-[11px] text-[#86868b] font-medium block">Specialization</span>
              <span className="text-xs sm:text-sm font-semibold text-[#1d1d1f] mt-0.5 block truncate">{claims.major}</span>
            </div>
            <div className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/[0.03]">
              <span className="text-[11px] text-[#86868b] font-medium block">Convocation</span>
              <span className="text-xs sm:text-sm font-semibold text-[#1d1d1f] mt-0.5 block">{claims.graduation_year}</span>
            </div>
            <div className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/[0.03]">
              <span className="text-[11px] text-[#86868b] font-medium block">Cumulative CGPA</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs sm:text-sm font-bold text-[#1d1d1f]">{claims.cgpa} / 10.0</span>
                {claims.cgpa_above_8 && (
                  <span className="text-[10px] font-bold bg-[#0071e3]/10 text-[#0071e3] px-2 py-0.5 rounded-full">
                    ≥ 8.0
                  </span>
                )}
              </div>
            </div>
            <div className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/[0.03]">
              <span className="text-[11px] text-[#86868b] font-medium block">Enrollment ID</span>
              <span className="text-xs sm:text-sm font-mono font-medium text-[#1d1d1f] mt-0.5 block truncate">{claims.student_id}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/[0.03]">
              <span className="text-[11px] text-[#86868b] font-medium block">Corporate Role</span>
              <span className="text-xs sm:text-sm font-semibold text-[#1d1d1f] mt-0.5 block truncate">{claims.designation}</span>
            </div>
            <div className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/[0.03]">
              <span className="text-[11px] text-[#86868b] font-medium block">Verified Tenure</span>
              <span className="text-xs sm:text-sm font-semibold text-[#1d1d1f] mt-0.5 block">{claims.experience_years} Years</span>
            </div>
            <div className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/[0.03]">
              <span className="text-[11px] text-[#86868b] font-medium block">Duration</span>
              <span className="text-xs font-medium text-[#1d1d1f] mt-0.5 block truncate">{claims.start_date} → {claims.end_date}</span>
            </div>
            <div className="bg-[#f5f5f7] p-3.5 rounded-2xl border border-black/[0.03]">
              <span className="text-[11px] text-[#86868b] font-medium block">HR Rating</span>
              <span className="text-xs sm:text-sm font-bold text-[#34c759] mt-0.5 block">{claims.conduct_rating}</span>
            </div>
          </div>
        )}

        {/* Cryptographic Badges */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-[#86868b]">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#f5f5f7] text-[#1d1d1f] px-2.5 py-1 rounded-full border border-black/[0.04]">
            <ShieldCheck className="w-3 h-3 text-[#0071e3]" />
            TrustRegistry #1
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#f5f5f7] text-[#1d1d1f] px-2.5 py-1 rounded-full border border-black/[0.04]">
            <Layers className="w-3 h-3 text-[#5856d6]" />
            Merkle Anchored
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#f5f5f7] text-[#86868b] px-2.5 py-1 rounded-full border border-black/[0.04]">
            <Calendar className="w-3 h-3 text-[#86868b]" />
            {credential.issuedAt}
          </span>
        </div>
      </div>

      {/* Footer Actions - Apple Pill Buttons */}
      <div className="p-6 sm:p-7 pt-0 space-y-2.5">
        <button
          onClick={() => onShare(credential)}
          className="w-full flex items-center justify-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white font-medium py-3 px-5 rounded-full transition shadow-[0_2px_8px_rgba(0,113,227,0.25)] text-xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share with Selective Disclosure</span>
        </button>

        <button
          onClick={() => setShowCertModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] active:scale-[0.98] text-[#1d1d1f] font-medium py-2.5 px-4 rounded-full transition border border-black/[0.06] text-xs"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#86868b]" />
          <span>View Verified Certificate Card</span>
        </button>
      </div>

      {/* Certificate Card Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 my-8 border border-black/[0.06]">
            <button
              onClick={() => setShowCertModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#86868b] hover:text-[#1d1d1f] transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
            <StudentVerifyCard
              title={credential.title}
              recipient={claims.full_name || claims.student_name || 'Aarav Sharma'}
              issuer={credential.issuerName}
              issuerUrl="www.nexo-credentials.edu"
              issueDate={credential.issuedAt}
              transactionId={credential.merkleRoot}
              isVerified={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}