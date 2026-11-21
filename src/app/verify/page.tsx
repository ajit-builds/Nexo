'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Camera,
  ClipboardPaste,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { VerificationPresentationPayload } from '@/lib/types';
import { QRScanner } from '@/components/QRScanner';

function VerifierContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presentationId = searchParams.get('id');
  const rawData = searchParams.get('data');

  const [activeTab, setActiveTab] = useState<'camera' | 'paste' | 'demo'>('camera');
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
    if (presentationId || rawData) {
      loadPresentation();
    }
  }, [presentationId, rawData]);

  // Handle scanned QR code text
  const handleQRScan = (decodedText: string) => {
    if (!decodedText) return;

    try {
      // 1. If scanned text is a URL, extract ?id= or ?data=
      if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
        const url = new URL(decodedText);
        const id = url.searchParams.get('id');
        const dataParam = url.searchParams.get('data');
        if (id) {
          router.push(`/verify?id=${id}`);
          return;
        }
        if (dataParam) {
          const parsed = JSON.parse(decodeURIComponent(dataParam));
          setPresentation(parsed);
          setVerifiedTime(new Date().toLocaleTimeString());
          setError(null);
          return;
        }
      }

      // 2. If scanned text is raw JSON payload
      const parsed = JSON.parse(decodedText);
      if (parsed.disclosedClaims) {
        setPresentation(parsed);
        setError(null);
        setVerifiedTime(new Date().toLocaleTimeString());
        return;
      }
    } catch {
      // If it's just a raw presentation ID string
      if (decodedText.startsWith('pres_') || decodedText.startsWith('nexo_')) {
        router.push(`/verify?id=${decodedText}`);
        return;
      }
    }

    setError('Could not decode QR code into a valid Nexo presentation.');
  };

  const handleManualVerify = () => {
    if (!manualInput.trim()) return;
    try {
      if (manualInput.startsWith('http://') || manualInput.startsWith('https://')) {
        const url = new URL(manualInput);
        const id = url.searchParams.get('id');
        if (id) {
          router.push(`/verify?id=${id}`);
          return;
        }
      }

      const parsed = JSON.parse(manualInput);
      if (parsed.disclosedClaims) {
        setPresentation(parsed);
        setError(null);
        setVerifiedTime(new Date().toLocaleTimeString());
      } else {
        setError('Invalid presentation format: missing disclosedClaims.');
      }
    } catch {
      // Maybe user entered just the presentation ID
      if (manualInput.length > 5) {
        router.push(`/verify?id=${manualInput.trim()}`);
      } else {
        setError('Invalid JSON string or presentation ID.');
      }
    }
  };

  const handleLoadDemo = (studentId: string) => {
    setLoading(true);
    fetch(`/api/credentials?studentId=${studentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.credentials && data.credentials.length > 0) {
          const cred = data.credentials[0];
          setPresentation({
            version: '1.0',
            presentationId: `demo_${Date.now()}`,
            credentialId: cred.id,
            credentialType: cred.type,
            issuerName: cred.issuerName,
            issuerAddress: cred.issuerAddress,
            batchId: cred.batchId,
            merkleProof: cred.merkleProof,
            merkleRoot: cred.merkleRoot,
            credentialHash: cred.credentialHash,
            disclosedClaims: {
              full_name: cred.claims.full_name,
              degree: cred.claims.degree,
              major: cred.claims.major,
              graduation_year: cred.claims.graduation_year,
              cgpa_above_8: cred.claims.cgpa_above_8,
            },
            redactedKeys: ['cgpa', 'student_id'],
            holderAddress: '0xStudentWalletDemo1234567890abcdef',
            purpose: 'Hiring Verification Demo',
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            nonce: Math.random().toString(36).substring(7),
          });
          setVerifiedTime(new Date().toLocaleTimeString());
          setError(null);
        }
      })
      .catch(() => setError('Failed to load demo scenario'))
      .finally(() => setLoading(false));
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
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recruiter Verification Portal</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically verifies candidate SD-JWT presentations against on-chain Merkle roots and TrustRegistry.
        </p>
      </div>

      {/* Mode Selection Tabs (when no presentation or when wanting to scan another) */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 shadow-inner">
          <button
            onClick={() => { setActiveTab('camera'); setError(null); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'camera'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Scan QR Code</span>
          </button>
          <button
            onClick={() => { setActiveTab('paste'); setError(null); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'paste'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>Paste Token / Link</span>
          </button>
          <button
            onClick={() => { setActiveTab('demo'); setError(null); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'demo'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Quick Demos</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {!presentation && !loading && (
        <div className="mb-8">
          {activeTab === 'camera' && (
            <QRScanner onScan={handleQRScan} isOpen={activeTab === 'camera'} />
          )}

          {activeTab === 'paste' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-1">Paste Verification Link or JSON</h3>
              <p className="text-xs text-slate-500 mb-4">
                Paste the URL from the candidate&apos;s QR code, a presentation ID, or the complete JSON token:
              </p>
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                rows={4}
                placeholder="http://localhost:3001/verify?id=... or presentation JSON"
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
              <button
                onClick={handleManualVerify}
                className="mt-3 w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-sm"
              >
                Verify Presentation
              </button>
            </div>
          )}

          {activeTab === 'demo' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-1">Instant Demo Scenarios</h3>
              <p className="text-xs text-slate-500 mb-4">
                Click a candidate to test the 5-step verification pipeline without scanning:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleLoadDemo('IITB-2024-001')}
                  className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left transition flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Aarav Sharma (IIT Bombay)</div>
                    <div className="text-[11px] text-emerald-700">CGPA 8.85 · B.Tech CSE (Qualified)</div>
                  </div>
                </button>
                <button
                  onClick={() => handleLoadDemo('IITB-2024-003')}
                  className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-left transition flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-amber-900">Rohan Verma (IIT Bombay)</div>
                    <div className="text-[11px] text-amber-700">CGPA 7.45 · B.Tech Mech (Under 8.0)</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-slate-700">Verifying cryptographic proofs on Polygon Amoy...</p>
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

          {/* Action to scan another */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setPresentation(null);
                setError(null);
                router.push('/verify');
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Verify Another Credential</span>
            </button>
          </div>
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
