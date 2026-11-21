'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Wallet, 
  ShieldCheck, 
  ShieldAlert, 
  GraduationCap, 
  Building2, 
  Calendar, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  QrCode, 
  Layers, 
  CheckCircle2, 
  Wifi, 
  RefreshCw, 
  Award, 
  AlertCircle,
  FileCheck2,
  ChevronRight,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';

// Digital Credential Pass Interface
export interface CredentialPass {
  id: string;
  meritUid: string;
  fullUid: string;
  universityName: string;
  universityShort: string;
  degreeTitle: string;
  major: string;
  graduationYear: string;
  cgpa: number;
  cgpaAbove8: boolean;
  enrollmentId: string;
  attestationUid: string;
  issuerName: string;
  issuerAddress: string;
  timestamp: string;
  network: string;
  status: 'valid' | 'revoked';
  gradientTheme: string;
  accentColor: string;
}

const DEFAULT_SAMPLE_PASSES: CredentialPass[] = [
  {
    id: 'pass-iitb-2024-001',
    meritUid: 'uid-merit-iitb-2024-001',
    fullUid: 'uid-full-iitb-2024-001',
    universityName: 'Indian Institute of Technology Bombay',
    universityShort: 'IIT Bombay',
    degreeTitle: 'Bachelor of Technology',
    major: 'Computer Science and Engineering',
    graduationYear: 'Class of 2024',
    cgpa: 8.85,
    cgpaAbove8: true,
    enrollmentId: 'IITB-2024-001',
    attestationUid: '0x85638cca9a9df3e282e9c3646a5c2bd0aa1a79a4b26272a4f9d71facbd47e76c',
    issuerName: 'IIT Bombay Registrar Office',
    issuerAddress: '0x71C83d95B309A20165b4F435F649BCE286a1172A',
    timestamp: 'June 15, 2024 10:30 UTC',
    network: 'Base',
    status: 'valid',
    gradientTheme: 'from-[#0f172a] via-[#1e293b] to-[#0a0f1d]',
    accentColor: '#38bdf8',
  },
  {
    id: 'pass-iisc-2023-042',
    meritUid: 'uid-merit-iisc-2023-042',
    fullUid: 'uid-full-iisc-2023-042',
    universityName: 'Indian Institute of Science Bangalore',
    universityShort: 'IISc Bangalore',
    degreeTitle: 'Master of Science',
    major: 'Artificial Intelligence & Robotics',
    graduationYear: 'Class of 2023',
    cgpa: 9.12,
    cgpaAbove8: true,
    enrollmentId: 'IISC-2023-042',
    attestationUid: '0x426d3ded7d90b57e6c4e0613b386fc17644f7950f18fb4d30cf05476691cfc28',
    issuerName: 'IISc Academic Senate',
    issuerAddress: '0x3A2199bE6271c7A01684B2956286B14C286a9117',
    timestamp: 'July 28, 2023 14:15 UTC',
    network: 'Base',
    status: 'valid',
    gradientTheme: 'from-[#022c22] via-[#064e3b] to-[#022c22]',
    accentColor: '#34d399',
  },
  {
    id: 'pass-du-2022-819',
    meritUid: 'uid-merit-du-2022-819',
    fullUid: 'uid-full-du-2022-819',
    universityName: 'University of Delhi',
    universityShort: 'Delhi University',
    degreeTitle: 'Bachelor of Science (Honours)',
    major: 'Mathematics & Data Computing',
    graduationYear: 'Class of 2022',
    cgpa: 8.40,
    cgpaAbove8: true,
    enrollmentId: 'DU-2022-819',
    attestationUid: '0x19a0c41d7e2e8f192b47c0a9b31d8e47a9f02c6b4d1a8e3f9a7b5c1d3e5f7a9b',
    issuerName: 'DU Controller of Examinations',
    issuerAddress: '0x8B145c7190018a38c20164b4F239BCE386a1172A',
    timestamp: 'May 20, 2022 09:00 UTC',
    network: 'Base',
    status: 'valid',
    gradientTheme: 'from-[#31102f] via-[#4a154b] to-[#200b23]',
    accentColor: '#f472b6',
  },
];

function StudentWalletContent() {
  const { user } = useAuth();
  
  // States
  const [passes, setPasses] = useState<CredentialPass[]>(DEFAULT_SAMPLE_PASSES);
  const [selectedPassId, setSelectedPassId] = useState<string>(DEFAULT_SAMPLE_PASSES[0].id);
  const [qrMode, setQrMode] = useState<'merit' | 'full'>('merit'); // 'merit' is default
  const [revealedCgpaIds, setRevealedCgpaIds] = useState<Record<string, boolean>>({});
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('https://nexo-network.vercel.app');

  // Set window origin safely on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Currently selected pass
  const selectedPass = useMemo(() => {
    return passes.find((p) => p.id === selectedPassId) || passes[0] || null;
  }, [passes, selectedPassId]);

  // Computed verification URL encoded into QR Code
  const verificationUrl = useMemo(() => {
    if (!selectedPass) return '';
    const uid = qrMode === 'merit' ? selectedPass.meritUid : selectedPass.fullUid;
    return `${origin}/recruiter?uid=${encodeURIComponent(uid)}`;
  }, [selectedPass, qrMode, origin]);

  // Toast trigger helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Copy Verification Link
  const handleCopyLink = async () => {
    if (!verificationUrl) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(verificationUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = verificationUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('Verification link copied to clipboard!');
    } catch {
      showToast('Link copied to clipboard!');
    }
  };

  // Open Recruiter Preview
  const handleOpenRecruiterPreview = () => {
    if (!verificationUrl) return;
    window.open(verificationUrl, '_blank');
  };

  // Toggle CGPA mask for a pass
  const toggleCgpaMask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering pass selection
    setRevealedCgpaIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Simulate loading / refreshing passes
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setPasses(DEFAULT_SAMPLE_PASSES);
      setSelectedPassId(DEFAULT_SAMPLE_PASSES[0].id);
      setIsLoading(false);
      showToast('Pass deck synchronized with Base network.');
    }, 600);
  };

  // Fallback: Preview Sample Pass if cleared
  const handleLoadSamplePasses = () => {
    setIsLoading(true);
    setTimeout(() => {
      setPasses(DEFAULT_SAMPLE_PASSES);
      setSelectedPassId(DEFAULT_SAMPLE_PASSES[0].id);
      setIsWalletConnected(true);
      setIsLoading(false);
      showToast('Sample credential passes loaded.');
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#1d1d1f] text-white text-xs font-semibold shadow-2xl border border-white/10 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header: Apple Wallet Identity Bar */}
      <div className="bg-white rounded-3xl border border-black/[0.06] p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shadow-xs">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] tracking-tight">
                Student Credential Wallet
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#34c759]/10 text-[#34c759] border border-[#34c759]/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse"></span>
                Base Verified
              </span>
            </div>
            <p className="text-xs text-[#86868b] mt-0.5">
              Self-sovereign digital credential passes with zero-knowledge merit sharing.
            </p>
          </div>
        </div>

        {/* Wallet Connection Status & Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isWalletConnected ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5f5f7] border border-black/[0.04] text-xs font-mono text-[#1d1d1f]">
                <span className="w-2 h-2 rounded-full bg-[#34c759]"></span>
                <span>0x71C8...3D8b</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                title="Sync passes"
                className="p-2.5 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => {
                  setIsWalletConnected(false);
                  showToast('Wallet disconnected.');
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#86868b] hover:text-[#ff3b30] text-xs font-medium transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsWalletConnected(true);
                showToast('Student wallet connected.');
              }}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition active:scale-[0.98]"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Student Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* DISCONNECTED STATE */}
      {!isWalletConnected ? (
        <div className="bg-white rounded-3xl border border-black/[0.06] p-12 sm:p-16 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-[#f5f5f7] border border-black/[0.04] flex items-center justify-center text-[#86868b] mx-auto shadow-inner">
            <Wallet className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">Wallet Disconnected</h2>
            <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed">
              Connect your student self-sovereign wallet to access and manage your verified academic credentials and generate selective disclosure proofs.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setIsWalletConnected(true);
                showToast('Student wallet connected.');
              }}
              className="px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white font-semibold text-xs rounded-full shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition"
            >
              Connect Student Wallet
            </button>
            <button
              onClick={handleLoadSamplePasses}
              className="px-6 py-3 bg-[#f5f5f7] hover:bg-[#e8e8ed] active:scale-[0.98] text-[#1d1d1f] font-semibold text-xs rounded-full border border-black/[0.06] transition"
            >
              Preview Sample Pass
            </button>
          </div>
        </div>
      ) : isLoading ? (
        /* LOADING SKELETONS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="h-6 w-36 bg-slate-200/80 rounded-lg animate-pulse" />
            <div className="h-56 bg-slate-200/70 rounded-2xl animate-pulse" />
            <div className="h-56 bg-slate-200/70 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-5 bg-white border border-black/[0.06] rounded-3xl p-6 h-[480px] animate-pulse" />
        </div>
      ) : passes.length === 0 ? (
        /* EMPTY PASS DECK FALLBACK */
        <div className="bg-white rounded-3xl border border-black/[0.06] p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#86868b] mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#1d1d1f]">No Credential Passes in Wallet</h3>
          <p className="text-xs text-[#86868b] max-w-sm mx-auto">
            You do not currently have any anchored credentials issued to this wallet address.
          </p>
          <button
            onClick={handleLoadSamplePasses}
            className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold rounded-full shadow-sm transition"
          >
            Preview Sample Pass
          </button>
        </div>
      ) : (
        /* MAIN SPLIT-VIEW DESKTOP LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: CREDENTIAL PASS DECK */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                  Credential Passes
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-black/[0.06] text-[#86868b]">
                  {passes.length} Issued
                </span>
              </div>
              <span className="text-[11px] text-[#86868b]">
                Click pass to inspect on-chain details
              </span>
            </div>

            {/* Pass Deck Stack */}
            <div className="space-y-4">
              {passes.map((pass) => {
                const isSelected = selectedPass?.id === pass.id;
                const isCgpaRevealed = !!revealedCgpaIds[pass.id];

                return (
                  <div
                    key={pass.id}
                    onClick={() => setSelectedPassId(pass.id)}
                    className={`group relative rounded-2xl p-6 sm:p-7 text-white cursor-pointer select-none transition-all duration-300 shadow-md bg-gradient-to-br ${pass.gradientTheme} border ${
                      isSelected
                        ? 'ring-2 ring-[#0071e3] ring-offset-2 ring-offset-[#f5f5f7] scale-[1.01] shadow-xl border-white/25'
                        : 'border-white/10 hover:border-white/20 hover:scale-[1.005] opacity-95 hover:opacity-100'
                    }`}
                  >
                    {/* Background Apple Wallet Watermark Icon */}
                    <div className="absolute right-4 bottom-3 opacity-10 pointer-events-none">
                      <GraduationCap className="w-32 h-32 text-white" />
                    </div>

                    {/* Top Row: Institution Name & Badge */}
                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-xs">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-semibold opacity-75 block">
                            {pass.universityShort}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                            {pass.universityName}
                          </h3>
                        </div>
                      </div>

                      {/* Verified Badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {pass.status === 'valid' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Verified • {pass.network}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-md">
                            <ShieldAlert className="w-3 h-3 text-red-400" />
                            Revoked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Degree Title & Major */}
                    <div className="my-6 relative z-10">
                      <div className="text-xs uppercase tracking-wider font-semibold opacity-70">
                        Degree Program
                      </div>
                      <h4 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                        {pass.degreeTitle}
                      </h4>
                      <p className="text-xs text-white/80 font-medium mt-0.5">
                        {pass.major}
                      </p>
                    </div>

                    {/* Bottom Row: Graduation Year & Masked CGPA */}
                    <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs relative z-10">
                      <div className="flex items-center gap-2 text-white/90">
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        <span className="font-semibold">{pass.graduationYear}</span>
                      </div>

                      {/* Masked CGPA with Eye Toggle */}
                      <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="text-[11px] text-white/70">CGPA:</span>
                        <span className="font-mono font-bold tracking-wider text-sm text-white">
                          {isCgpaRevealed ? pass.cgpa.toFixed(2) : '•.••'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => toggleCgpaMask(pass.id, e)}
                          title={isCgpaRevealed ? 'Mask CGPA' : 'Reveal CGPA'}
                          className="p-1 rounded-md hover:bg-white/15 text-white/80 hover:text-white transition"
                        >
                          {isCgpaRevealed ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Helper Note */}
            <div className="p-4 rounded-2xl bg-white border border-black/[0.06] text-xs text-[#86868b] flex items-center gap-2.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#0071e3] shrink-0" />
              <span>
                All passes are cryptographically anchored to <strong>Polygon Amoy & Base</strong>. Merkle proofs are verified client-side without gas.
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY LIVE PASS INSPECTOR & QR TICKET */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                Live Pass Inspector & Ticket
              </span>
              <span className="text-[11px] font-semibold text-[#0071e3] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Scannable
              </span>
            </div>

            {selectedPass ? (
              <div className="bg-white rounded-3xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
                {/* 1. Header Details Section */}
                <div className="p-6 bg-[#fbfbfd] border-b border-black/[0.04] space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full">
                        Selected Pass
                      </span>
                      <h3 className="text-base font-bold text-[#1d1d1f] mt-1.5">
                        {selectedPass.degreeTitle}
                      </h3>
                      <p className="text-xs text-[#86868b]">
                        {selectedPass.universityName}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#34c759]/10 text-[#34c759] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>

                  {/* On-Chain Attestation Details */}
                  <div className="space-y-2 text-xs pt-1">
                    <div className="flex items-center justify-between py-1 border-b border-black/[0.03]">
                      <span className="text-[#86868b]">Attestation UID</span>
                      <span className="font-mono text-[#1d1d1f] text-[11px] font-semibold truncate max-w-[170px]" title={selectedPass.attestationUid}>
                        {selectedPass.attestationUid.slice(0, 10)}...{selectedPass.attestationUid.slice(-6)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-black/[0.03]">
                      <span className="text-[#86868b]">Issuing Authority</span>
                      <span className="text-[#1d1d1f] font-medium text-[11px] truncate max-w-[180px]">
                        {selectedPass.issuerName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-black/[0.03]">
                      <span className="text-[#86868b]">Issuer Address</span>
                      <span className="font-mono text-[#86868b] text-[11px]">
                        {selectedPass.issuerAddress.slice(0, 6)}...{selectedPass.issuerAddress.slice(-4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#86868b]">Timestamp</span>
                      <span className="text-[#1d1d1f] font-medium text-[11px]">
                        {selectedPass.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Boarding Pass Ticket Perforation Divider */}
                <div className="relative flex items-center justify-between bg-white py-1">
                  <div className="w-4 h-8 bg-[#f5f5f7] rounded-r-full -ml-2 border-r border-black/[0.06]" />
                  <div className="flex-1 border-t-2 border-dashed border-black/[0.08] mx-2" />
                  <div className="w-4 h-8 bg-[#f5f5f7] rounded-l-full -mr-2 border-l border-black/[0.06]" />
                </div>

                {/* 3. QR Ticket Section */}
                <div className="p-6 pt-4 space-y-5">
                  {/* Segmented Mode Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#1d1d1f]">
                      <span>Selective Disclosure Ticket</span>
                      <span className="text-[10px] text-[#0071e3] font-bold uppercase">
                        {qrMode === 'merit' ? 'Privacy Active' : 'Full Access'}
                      </span>
                    </div>
                    <div className="flex p-1 bg-[#f5f5f7] rounded-full border border-black/[0.04]">
                      <button
                        type="button"
                        onClick={() => setQrMode('merit')}
                        className={`flex-1 py-1.5 px-2 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                          qrMode === 'merit'
                            ? 'bg-white text-[#0071e3] shadow-sm'
                            : 'text-[#86868b] hover:text-[#1d1d1f]'
                        }`}
                      >
                        Proof of Merit Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrMode('full')}
                        className={`flex-1 py-1.5 px-2 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                          qrMode === 'full'
                            ? 'bg-white text-[#1d1d1f] shadow-sm'
                            : 'text-[#86868b] hover:text-[#1d1d1f]'
                        }`}
                      >
                        Full Transcript
                      </button>
                    </div>
                  </div>

                  {/* Scannable QR Code */}
                  <div className="flex flex-col items-center justify-center p-5 bg-[#fbfbfd] rounded-2xl border border-black/[0.04] space-y-3">
                    <div className="p-3 bg-white rounded-xl shadow-xs border border-black/[0.06]">
                      <QRCodeSVG
                        value={verificationUrl}
                        size={168}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[11px] font-bold text-[#1d1d1f]">
                        {qrMode === 'merit' ? (
                          <span className="text-[#0071e3]">Zero-Knowledge Merit Pass (CGPA &gt; 8.0)</span>
                        ) : (
                          <span>Complete Academic Transcript Pass</span>
                        )}
                      </p>
                      <p className="text-[10px] text-[#86868b] max-w-[220px] mx-auto leading-tight">
                        {qrMode === 'merit'
                          ? 'Reveals qualification predicate without disclosing exact GPA, semester marks, or address.'
                          : 'Includes complete verified course history, marks breakdown, and honors certification.'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white text-xs font-semibold rounded-full shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Verification Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenRecruiterPreview}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#f5f5f7] hover:bg-[#e8e8ed] active:scale-[0.98] text-[#1d1d1f] text-xs font-semibold rounded-full border border-black/[0.04] transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#86868b]" />
                      <span>Open Recruiter Preview</span>
                    </button>
                  </div>

                  {/* Serial Barcode Footer */}
                  <div className="pt-2 text-center border-t border-black/[0.04]">
                    <span className="font-mono text-[10px] text-[#86868b] tracking-widest uppercase">
                      TICKET // {selectedPass.enrollmentId} // BASE-{selectedPass.graduationYear.replace(/\D/g, '')}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentWalletPage() {
  return (
    <AuthGuard allowedRole="student">
      <Suspense fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-[#86868b]">
          Loading student wallet passes...
        </div>
      }>
        <StudentWalletContent />
      </Suspense>
    </AuthGuard>
  );
}
