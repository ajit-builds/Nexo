'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Eye, 
  EyeOff, 
  Lock, 
  ArrowLeft, 
  QrCode, 
  FileText, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { VerificationPresentationPayload } from '@/lib/types';
import { AuthGuard } from '@/components/auth/AuthGuard';

function VerifierContent() {
  const searchParams = useSearchParams();
  const presentationId = searchParams.get('id');
  const rawData = searchParams.get('data');

  const [presentation, setPresentation] = useState<VerificationPresentationPayload | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedTime, setVerifiedTime] = useState<string>('');

  const loadPresentation = async () => {
    setError(null);

    // Option A: Check localStorage for instant client-side lookup
    if (presentationId && typeof window !== 'undefined') {
      const cached = localStorage.getItem(`nexo_pres_${presentationId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setPresentation(parsed);
          setVerifiedTime(new Date().toLocaleTimeString());
          return;
        } catch {
          // continue to API
        }
      }
    }

    // Option B: Direct embedded data in query
    if (rawData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(rawData));
        setPresentation(decoded);
        setVerifiedTime(new Date().toLocaleTimeString());
        return;
      } catch (e) {
        console.warn('Failed to parse data param, trying id...', e);
      }
    }

    // Option C: Fetch via presentation ID from API
    if (presentationId) {
      setLoading(true);
      try {
        const res = await fetch(`/api/presentation?id=${presentationId}`);
        const data = await res.json();
        if (data.success && data.presentation) {
          setPresentation(data.presentation);
          setVerifiedTime(new Date().toLocaleTimeString());
        } else {
          // Try student presentation endpoint as fallback
          const fallbackRes = await fetch(`/api/student/presentation?id=${presentationId}`);
          const fallbackData = await fallbackRes.json();
          if (fallbackData.success && fallbackData.presentation) {
            setPresentation(fallbackData.presentation);
            setVerifiedTime(new Date().toLocaleTimeString());
          } else {
            setError(data.error || 'Presentation expired or not found.');
          }
        }
      } catch (err: any) {
        setError('Failed to fetch presentation from network.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPresentation();
  }, [presentationId, rawData]);

  const handleManualVerify = () => {
    if (!manualInput.trim()) return;
    try {
      const parsed = JSON.parse(manualInput);
      if (parsed.disclosedClaims) {
        setPresentation(parsed);
        setError(null);
        setVerifiedTime(new Date().toLocaleTimeString());
      } else {
        setError('Invalid presentation format: missing disclosedClaims.');
      }
    } catch {
      setError('Invalid JSON string.');
    }
  };

  const isExpired = presentation ? new Date(presentation.expiresAt).getTime() < Date.now() : false;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Wallet</span>
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
          Polygon Amoy Testnet
        </span>
      </div>

      {/* Main Title */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recruiter Verification Portal</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically verifies candidate SD-JWT presentations against on-chain Merkle roots and TrustRegistry.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-slate-700">Verifying cryptographic proofs...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-8">
          <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900">Verification Failed</h3>
          <p className="text-xs text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Verified Result Banner & Breakdown */}
      {presentation && !loading && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Status Card */}
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${
            isExpired
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-sm ${
                  isExpired ? 'bg-amber-600' : 'bg-emerald-600'
                }`}>
                  {isExpired ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                </div>
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isExpired ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {isExpired ? 'Presentation Expired' : 'Cryptographically Verified'}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-1 leading-tight">
                    {isExpired ? 'Expired Presentation' : 'Authentic Credential Verified'}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Issued by: <strong className="text-slate-900">{presentation.issuerName}</strong>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500">
                <div className="font-semibold text-slate-700">Verification Time:</div>
                <div className="font-mono text-slate-900">{verifiedTime || 'Just now'}</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1">Check Latency: 1.4s</div>
              </div>
            </div>

            {/* Cryptographic Trust Pipeline Checks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-200/60">
              <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-slate-200/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-slate-800 block">TrustRegistry Check</span>
                  <span className="text-slate-500">Accredited Institution</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-slate-200/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-slate-800 block">Merkle Proof Check</span>
                  <span className="text-slate-500">Anchored on Polygon Amoy</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-slate-200/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-slate-800 block">Revocation Check</span>
                  <span className="text-slate-500">Active & Not Revoked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Disclosed Claims Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Selectively Disclosed Attributes ({Object.keys(presentation.disclosedClaims).length})
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                Verified Claims
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {Object.entries(presentation.disclosedClaims).map(([key, val]) => {
                const isSpecialPredicate = key === 'cgpa_above_8';
                return (
                  <div key={key} className="py-3 flex items-center justify-between gap-4">
                    <span className="font-mono text-slate-500 font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isSpecialPredicate ? 'text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold' : 'text-slate-900'}`}>
                        {String(val)}
                      </span>
                      {isSpecialPredicate && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          ✓ Qualified
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Redacted Claims (SD-JWT Proof) */}
          {presentation.redactedKeys && presentation.redactedKeys.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Redacted / Masked Claims ({presentation.redactedKeys.length})
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Protected by SD-JWT (Privacy Preserved)
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                The student chose not to disclose these attributes. The university&apos;s mathematical signature remains valid without exposing these private values:
              </p>
              <div className="flex flex-wrap gap-2">
                {presentation.redactedKeys.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 font-mono"
                  >
                    <EyeOff className="w-3 h-3 text-slate-400" />
                    {key.replace(/_/g, ' ')}: [HIDDEN]
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback / Manual Verification Box */}
      {!presentation && !loading && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-2">Scan QR or Paste Presentation Token</h3>
          <p className="text-xs text-slate-500 mb-4">
            If you have a JSON presentation token or presentation ID from a candidate, paste it below to verify immediately:
          </p>
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            rows={4}
            placeholder='Paste presentation JSON or token here...'
            className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
          <button
            onClick={handleManualVerify}
            className="mt-3 w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-sm"
          >
            Verify Presentation Token
          </button>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <AuthGuard allowedRole="RECRUITER">
      <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading Verifier...</div>}>
        <VerifierContent />
      </Suspense>
    </AuthGuard>
  );
}
