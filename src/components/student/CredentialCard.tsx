'use client';

import React from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  ShieldCheck, 
  Share2, 
  Layers, 
  Calendar, 
  Award,
  Building2
} from 'lucide-react';
import { NexoCredential } from '@/lib/types';

interface CredentialCardProps {
  credential: NexoCredential;
  onShare: (credential: NexoCredential) => void;
  onQuickQR?: (credential: NexoCredential) => void;
}

export function CredentialCard({ credential, onShare, onQuickQR }: CredentialCardProps) {
  const isAcademic = credential.type === 'academic';
  const claims = credential.claims;

  return (
    <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
      {/* Top Banner */}
      <div className={`p-6 border-b ${isAcademic ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-100' : 'bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-emerald-100'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isAcademic ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
              {isAcademic ? <GraduationCap className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
            </div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isAcademic ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isAcademic ? 'Academic Degree' : 'Work Experience'}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1 leading-tight">{credential.title}</h3>
              <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {credential.issuerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </div>
        </div>
      </div>

      {/* Body: Key Claims Grid */}
      <div className="p-6 space-y-4">
        {isAcademic ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block">Specialization / Major</span>
              <span className="text-sm font-semibold text-slate-800">{claims.major}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block">Convocation Year</span>
              <span className="text-sm font-semibold text-slate-800">{claims.graduation_year}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block">Cumulative CGPA</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-slate-900">{claims.cgpa} / 10.0</span>
                {claims.cgpa_above_8 && (
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md">
                    CGPA ≥ 8.0
                  </span>
                )}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block">Enrollment ID</span>
              <span className="text-sm font-mono font-medium text-slate-700">{claims.student_id}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block">Corporate Role</span>
              <span className="text-sm font-semibold text-slate-800">{claims.designation}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block">Verified Tenure</span>
              <span className="text-sm font-semibold text-slate-800">{claims.experience_years} Years</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block">Service Duration</span>
              <span className="text-xs font-medium text-slate-700">{claims.start_date} → {claims.end_date}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block">HR Exit Rating</span>
              <span className="text-sm font-bold text-emerald-600">{claims.conduct_rating}</span>
            </div>
          </div>
        )}

        {/* Cryptographic Badges */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 border-t border-slate-100">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
            <ShieldCheck className="w-3 h-3 text-indigo-600" />
            TrustRegistry #1
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
            <Layers className="w-3 h-3 text-purple-600" />
            Merkle Batch Anchored
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
            <Calendar className="w-3 h-3 text-slate-400" />
            Issued: {credential.issuedAt}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 pt-0 grid grid-cols-2 gap-2.5">
        <button
          onClick={() => (onQuickQR ? onQuickQR(credential) : onShare(credential))}
          className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-3 rounded-xl transition shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Auto QR Code</span>
        </button>
        <button
          onClick={() => onShare(credential)}
          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2.5 px-3 rounded-xl transition border border-slate-200"
        >
          <span>Selective Privacy</span>
        </button>
      </div>
    </div>
  );
}
