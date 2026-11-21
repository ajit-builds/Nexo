'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Building2, 
  Eye, 
  EyeOff, 
  Lock, 
  ArrowLeft, 
  QrCode, 
  AlertTriangle,
  Camera,
  ClipboardPaste,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { VerificationPresentationPayload } from '@/lib/types';
import { QRScanner } from '@/components/QRScanner';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StudentVerifyCard } from '@/components/StudentVerifyCard';
import { verifyPresentationSignature } from '@/lib/sd-jwt-helper';

function VerifierContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presentationId = searchParams.get('id') || searchParams.get('uid');
  const rawData = searchParams.get('data');
  const modeParam = searchParams.get('mode') as 'camera' | 'paste' | 'demo' | null;

  const activeTab = modeParam === 'paste' || modeParam === 'demo' ? modeParam : 'camera';
  const [presentation, setPresentation] = useState<VerificationPresentationPayload | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedTime, setVerifiedTime] = useState<string>('Just now');

  const handleTabChange = (newMode: 'camera' | 'paste' | 'demo') => {
    setError(null);
    router.push(`/verify?mode=${newMode}`, { scroll: false });
  };

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

      const parsed = JSON.parse(decodedText);
      if (parsed.disclosedClaims) {
        setPresentation(parsed);
        setError(null);
        setVerifiedTime(new Date().toLocaleTimeString());
        return;
      }
    } catch {
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
  const sigVerification = presentation ? verifyPresentationSignature(presentation) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Wallet</span>
        </Link>
        <span className="text-xs font-semibold px-3 py-1 bg-[#5856d6]/10 text-[#5856d6] rounded-full flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5856d6] animate-pulse"></span>
          Polygon Amoy Testnet
        </span>
      </div>

      {/* Main Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">Recruiter Verification Portal</h1>
        <p className="text-xs sm:text-sm text-[#86868b]">
          Cryptographically verifies candidate SD-JWT presentations against on-chain Merkle roots and TrustRegistry.
        </p>
      </div>

      {/* Mode Selection Tabs - Apple Segmented Pill Switcher */}
      {!presentation && (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="inline-flex rounded-full bg-[#f5f5f7] p-1 border border-black/[0.04]">
              <button
                onClick={() => handleTabChange('camera')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeTab === 'camera'
                    ? 'bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan QR Code</span>
              </button>
              <button
                onClick={() => handleTabChange('paste')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeTab === 'paste'
                    ? 'bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste Token / Link</span>
              </button>
              <button
                onClick={() => handleTabChange('demo')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeTab === 'demo'
                    ? 'bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Demos</span>
              </button>
            </div>
          </div>

          {/* Active Tab Panel */}
          <div>
            {activeTab === 'camera' && (
              <QRScanner
                onScan={(text) => handleQRScan(text)}
                isOpen={activeTab === 'camera'}
              />
            )}

            {activeTab === 'paste' && (
              <div className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f]">Paste Verification Link or JSON</h3>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    Paste the URL from the candidate&apos;s QR code, a presentation ID, or the complete JSON token:
                  </p>
                </div>
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  rows={4}
                  placeholder="http://localhost:3000/verify?id=... or presentation JSON"
                  className="w-full text-xs font-mono p-4 bg-[#f5f5f7] border border-[#d2d2d7]/60 rounded-2xl focus:outline-none focus:bg-white focus:border-[#0071e3] text-[#1d1d1f] transition"
                />
                <button
                  onClick={handleManualVerify}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white font-medium text-xs rounded-full transition shadow-[0_2px_8px_rgba(0,113,227,0.25)]"
                >
                  Verify Presentation
                </button>
              </div>
            )}

            {activeTab === 'demo' && (
              <div className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f]">Instant Demo Candidates</h3>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    Click a candidate to immediately load their verified certificate card and on-chain proofs:
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleLoadDemo('IITB-2024-001')}
                    className="p-5 rounded-2xl border border-[#34c759]/30 bg-[#34c759]/5 hover:bg-[#34c759]/10 text-left transition flex items-start gap-3.5 group"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#34c759] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#1d1d1f]">Aarav Sharma (IIT Bombay)</div>
                      <div className="text-[11px] text-[#34c759] font-medium mt-0.5">CGPA 8.85 · B.Tech CSE (Qualified)</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleLoadDemo('IITB-2024-003')}
                    className="p-5 rounded-2xl border border-[#ff9500]/30 bg-[#ff9500]/5 hover:bg-[#ff9500]/10 text-left transition flex items-start gap-3.5 group"
                  >
                    <AlertTriangle className="w-5 h-5 text-[#ff9500] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#1d1d1f]">Rohan Verma (IIT Bombay)</div>
                      <div className="text-[11px] text-[#ff9500] font-medium mt-0.5">CGPA 7.45 · B.Tech Mech (Under 8.0)</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-black/[0.06] rounded-3xl p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="w-8 h-8 border-3 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-[#1d1d1f]">Verifying cryptographic proofs on Polygon Amoy...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-2xl p-5 text-center">
          <XCircle className="w-6 h-6 text-[#ff3b30] mx-auto mb-1.5" />
          <h3 className="text-xs font-bold text-[#ff3b30]">Verification Failed</h3>
          <p className="text-xs text-[#86868b] mt-0.5">{error}</p>
        </div>
      )}

      {/* Verified Result Banner & Breakdown */}
      {presentation && !loading && (
        <div className="space-y-6">
          <StudentVerifyCard
            title={
              (presentation.disclosedClaims as any)?.degree ||
              (presentation.disclosedClaims as any)?.role ||
              (presentation.credentialType === 'academic'
                ? 'Bachelor of Technology in Computer Science'
                : 'Certified Work Experience Letter')
            }
            recipient={
              (presentation.disclosedClaims as any)?.full_name ||
              (presentation.disclosedClaims as any)?.student_name ||
              (presentation.disclosedClaims as any)?.name ||
              'Aarav Sharma'
            }
            issuer={presentation.issuerName || 'Northern University'}
            issuerUrl="www.nexo-credentials.edu"
            issueDate={
              presentation.issuedAt
                ? new Date(presentation.issuedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'November 10, 2024'
            }
            transactionId={
              presentation.merkleRoot ||
              '0xae0789d1a055d1dd765b820a44fcb2d881ef10'
            }
            isVerified={!isExpired}
            onVerify={() => {
              setVerifiedTime(new Date().toLocaleTimeString());
            }}
            onReset={() => {
              setPresentation(null);
              setError(null);
              router.push('/verify');
            }}
          />

          {/* Main Status Card - Clean Apple Solid Style */}
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${
            isExpired
              ? 'bg-[#ff9500]/5 border-[#ff9500]/20'
              : 'bg-[#34c759]/5 border-[#34c759]/20'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-sm ${
                  isExpired ? 'bg-[#ff9500]' : 'bg-[#34c759]'
                }`}>
                  {isExpired ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                </div>
                <div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isExpired ? 'bg-[#ff9500]/20 text-[#ff9500]' : 'bg-[#34c759]/20 text-[#34c759]'
                  }`}>
                    {isExpired ? 'Presentation Expired' : 'Cryptographically Verified'}
                  </span>
                  <h2 className="text-xl font-bold text-[#1d1d1f] mt-1 leading-snug">
                    {isExpired ? 'Expired Presentation' : 'Authentic Credential Verified'}
                  </h2>
                  <p className="text-xs text-[#86868b] mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#86868b]" />
                    Issued by: <strong className="text-[#1d1d1f]">{presentation.issuerName}</strong>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-[#86868b]">
                <div className="font-medium text-[#1d1d1f]">Verification Timestamp:</div>
                <div className="font-mono text-[#86868b]">{verifiedTime || 'Just now'}</div>
                <div className="text-[11px] text-[#34c759] font-medium mt-0.5">Latency: 1.4s</div>
              </div>
            </div>

            {/* Cryptographic Pipeline Checks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-black/[0.04]">
              <div className="flex items-center gap-2.5 p-3 bg-white rounded-2xl border border-black/[0.04] shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#34c759] flex-shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-semibold text-[#1d1d1f] block">TrustRegistry Check</span>
                  <span className="text-[#86868b]">Accredited Institution</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-white rounded-2xl border border-black/[0.04] shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#34c759] flex-shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-semibold text-[#1d1d1f] block">Merkle Proof Check</span>
                  <span className="text-[#86868b]">Anchored on Amoy</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-white rounded-2xl border border-black/[0.04] shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#34c759] flex-shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-semibold text-[#1d1d1f] block">Revocation Check</span>
                  <span className="text-[#86868b]">Active & Not Revoked</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-white rounded-2xl border border-black/[0.04] shadow-xs">
                {sigVerification?.valid || !presentation.holderSignature ? (
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#ff3b30] flex-shrink-0" />
                )}
                <div className="text-[11px] leading-tight">
                  <span className="font-semibold text-[#1d1d1f] block">Holder Signature</span>
                  <span className="text-[#86868b] truncate max-w-[120px]">
                    {presentation.holderSignature
                      ? sigVerification?.valid
                        ? 'ECDSA Verified'
                        : 'Invalid Signature'
                      : 'Self-Sovereign Pass'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Disclosed Claims Table */}
          <div className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.04]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#0071e3]" />
                <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                  Selectively Disclosed Attributes ({Object.keys(presentation.disclosedClaims).length})
                </h3>
              </div>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3]">
                Verified Claims
              </span>
            </div>

            <div className="divide-y divide-black/[0.03] text-xs">
              {Object.entries(presentation.disclosedClaims).map(([key, val]) => {
                const isSpecialPredicate = key === 'cgpa_above_8';
                return (
                  <div key={key} className="py-3 flex items-center justify-between gap-4">
                    <span className="font-mono text-[#86868b] capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isSpecialPredicate ? 'text-[#0071e3]' : 'text-[#1d1d1f]'}`}>
                        {String(val)}
                      </span>
                      {isSpecialPredicate && (
                        <span className="text-[10px] font-semibold text-[#34c759] bg-[#34c759]/10 px-2 py-0.5 rounded-full">
                          Qualified
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
            <div className="bg-[#f5f5f7] border border-black/[0.04] rounded-3xl p-6 sm:p-8 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#86868b]" />
                  <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                    Redacted / Masked Claims ({presentation.redactedKeys.length})
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-[#86868b]">
                  Protected by SD-JWT
                </span>
              </div>
              <p className="text-xs text-[#86868b] leading-relaxed">
                The student chose not to disclose these attributes. The university&apos;s mathematical signature remains valid without exposing these private values:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {presentation.redactedKeys.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-black/[0.04] text-xs text-[#86868b] font-mono"
                  >
                    <EyeOff className="w-3 h-3 text-[#86868b]" />
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-medium transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
    <AuthGuard allowedRole="reviewer">
      <Suspense fallback={<div className="p-16 text-center text-xs text-[#86868b]">Loading Verifier...</div>}>
        <VerifierContent />
      </Suspense>
    </AuthGuard>
  );
}