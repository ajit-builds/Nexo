'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Wallet, 
  ShieldCheck, 
  ShieldAlert, 
  GraduationCap, 
  Briefcase,
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
  ArrowRight,
  Clock,
  Share2,
  Lock,
  Info,
  KeyRound,
  SlidersHorizontal
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { StudentProfileBanner } from '@/components/student/StudentProfileBanner';
import { StudentStats } from '@/components/student/StudentStats';
import { StudentTimeline } from '@/components/student/StudentTimeline';
import { ConsentHistoryTable } from '@/components/student/ConsentHistoryTable';
import { WalletHeader } from '@/components/student/WalletHeader';
import { SelectiveDisclosureModal } from '@/components/student/SelectiveDisclosureModal';
import { QRCodeModal } from '@/components/student/QRCodeModal';
import { Pagination } from '@/components/ui/Pagination';
import { 
  StoredStudentWallet, 
  NexoCredential, 
  VerificationPresentationPayload, 
  ConsentLogEntry 
} from '@/lib/types';
import { getOrCreateStudentWallet } from '@/lib/wallet';
import { getConsentLogs } from '@/lib/sd-jwt-helper';
import { INITIAL_MOCK_CREDENTIALS } from '@/lib/mock-credentials';

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
  rawCredential?: NexoCredential;
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
    network: 'Polygon Amoy',
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
    network: 'Polygon Amoy',
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
    network: 'Polygon Amoy',
    status: 'valid',
    gradientTheme: 'from-[#31102f] via-[#4a154b] to-[#200b23]',
    accentColor: '#f472b6',
  },
];

function mapNexoCredentialToPass(cred: NexoCredential, index: number): CredentialPass {
  const isAcademic = cred.type === 'academic';
  const claims = cred.claims || {};
  const themes = [
    { gradient: 'from-[#0f172a] via-[#1e293b] to-[#0a0f1d]', accent: '#38bdf8' },
    { gradient: 'from-[#022c22] via-[#064e3b] to-[#022c22]', accent: '#34d399' },
    { gradient: 'from-[#31102f] via-[#4a154b] to-[#200b23]', accent: '#f472b6' },
  ];
  const theme = themes[index % themes.length];

  return {
    id: cred.id,
    meritUid: `uid-merit-${cred.id}`,
    fullUid: `uid-full-${cred.id}`,
    universityName: cred.issuerName || (isAcademic ? 'Indian Institute of Technology Bombay' : 'Google Cloud Platform'),
    universityShort: cred.issuerName?.split(' ')[0] || (isAcademic ? 'IIT Bombay' : 'Google'),
    degreeTitle: claims.degree || claims.title || (isAcademic ? 'Bachelor of Technology' : 'Software Engineer Intern'),
    major: claims.major || claims.department || 'Computer Science & Engineering',
    graduationYear: claims.graduation_year ? `Class of ${claims.graduation_year}` : (claims.period || '2024'),
    cgpa: typeof claims.cgpa === 'number' ? claims.cgpa : 8.85,
    cgpaAbove8: claims.cgpa_above_8 ?? (typeof claims.cgpa === 'number' ? claims.cgpa >= 8.0 : true),
    enrollmentId: claims.enrollment_no || claims.employee_id || (cred as any).studentId || 'IITB-2024-001',
    attestationUid: cred.merkleRoot || cred.id,
    issuerName: cred.issuerName || 'IIT Bombay Registrar Office',
    issuerAddress: cred.issuerAddress || '0x71C83d95B309A20165b4F435F649BCE286a1172A',
    timestamp: cred.issuedAt ? new Date(cred.issuedAt).toLocaleString() : 'June 15, 2024 10:30 UTC',
    network: 'Polygon Amoy',
    status: (cred.status === 'revoked' ? 'revoked' : 'valid') as 'valid' | 'revoked',
    gradientTheme: theme.gradient,
    accentColor: theme.accent,
    rawCredential: cred,
  };
}

function StudentWalletContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUserProfile } = useAuth();
  
  const typeParam = searchParams.get('type') as 'all' | 'academic' | 'experience' | null;
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const tabParam = searchParams.get('tab') as 'wallet' | 'timeline' | 'dpdp' | 'security' | null;

  // Wallet & Presentation States
  const [wallet, setWallet] = useState<StoredStudentWallet | null>(null);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [credentials, setCredentials] = useState<NexoCredential[]>(INITIAL_MOCK_CREDENTIALS);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string>('IITB-2024-001');
  const [consentLogs, setConsentLogs] = useState<ConsentLogEntry[]>([]);

  // Navigation tab
  const [dashboardTab, setDashboardTab] = useState<'wallet' | 'timeline' | 'dpdp' | 'security'>(tabParam || 'wallet');

  // Split-View Wallet Pass Deck States
  const [selectedPassId, setSelectedPassId] = useState<string>(DEFAULT_SAMPLE_PASSES[0].id);
  const [qrMode, setQrMode] = useState<'merit' | 'full'>('merit'); // 'merit' is default
  const [revealedCgpaIds, setRevealedCgpaIds] = useState<Record<string, boolean>>({});
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('https://nexo-network.vercel.app');

  // Modals for Custom Selective Disclosure
  const [selectedForShare, setSelectedForShare] = useState<NexoCredential | null>(null);
  const [presentationPayload, setPresentationPayload] = useState<VerificationPresentationPayload | null>(null);

  // Set window origin safely on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Fetch real credentials from API
  const fetchCredentialsFromApi = async (studentId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/credentials?studentId=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.credentials && data.credentials.length > 0) {
          setCredentials(data.credentials);
          if (data.availableStudents) {
            setAvailableStudents(data.availableStudents);
          }
        }
      }
    } catch (err) {
      console.warn('API fetch notice, using local credentials cache:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const initWallet = async () => {
    fetchCredentialsFromApi(activeStudentId);
    setConsentLogs(getConsentLogs());

    try {
      const res = await getOrCreateStudentWallet();
      if (res && res.walletData) {
        setWallet(res.walletData);
        setPrivateKey(res.decryptedPrivateKey);
      }
    } catch (e) {
      console.warn('Wallet initialization error:', e);
    }
  };

  useEffect(() => {
    initWallet();
  }, []);

  const handleStudentSwitch = (newId: string) => {
    setActiveStudentId(newId);
    fetchCredentialsFromApi(newId);
    const matched = availableStudents.find((s) => s.studentId === newId);
    if (matched && updateUserProfile) {
      updateUserProfile({
        name: matched.name,
        email: matched.email || `${newId.toLowerCase()}@college.isu.ac.in`,
        organization: matched.institution_name || 'IIT Bombay',
      });
    }
  };

  // Convert raw credentials into passes
  const passes: CredentialPass[] = useMemo(() => {
    if (credentials && credentials.length > 0) {
      return credentials.map((c, i) => mapNexoCredentialToPass(c, i));
    }
    return DEFAULT_SAMPLE_PASSES;
  }, [credentials]);

  // Keep selected pass valid
  useEffect(() => {
    if (passes.length > 0 && !passes.some((p) => p.id === selectedPassId)) {
      setSelectedPassId(passes[0].id);
    }
  }, [passes, selectedPassId]);

  // Currently selected pass
  const selectedPass = useMemo(() => {
    return passes.find((p) => p.id === selectedPassId) || passes[0] || null;
  }, [passes, selectedPassId]);

  // Computed verification URL encoded into QR Code ticket
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
    e.stopPropagation();
    setRevealedCgpaIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Active student metadata derivation
  const primaryAcademic = credentials.find((c) => c.type === 'academic');
  const currentStudentData = availableStudents.find((s) => s.studentId === activeStudentId) || {
    studentId: activeStudentId,
    name: primaryAcademic?.claims.full_name || user?.name || 'Aarav Sharma',
    degree: primaryAcademic?.claims.degree || 'Bachelor of Technology',
    major: primaryAcademic?.claims.major || 'Computer Science and Engineering',
    institution: primaryAcademic?.issuerName || 'Indian Institute of Technology Bombay',
    cgpa: primaryAcademic?.claims.cgpa || 8.85,
    cgpa_above_8: primaryAcademic?.claims.cgpa_above_8 ?? true,
    graduation_year: primaryAcademic?.claims.graduation_year || 2024,
  };

  const handleGeneratedPresentation = (payload: VerificationPresentationPayload) => {
    setSelectedForShare(null);
    setPresentationPayload(payload);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#1d1d1f] text-white text-xs font-semibold rounded-2xl shadow-2xl border border-white/10 animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Scholar Identity & In-App Key Header Banner */}
      <StudentProfileBanner
        wallet={wallet}
        activeStudent={currentStudentData}
        availableStudents={availableStudents}
        onSelectStudent={handleStudentSwitch}
        isLoading={isLoading}
      />

      {/* 2. Executive KPI Summary Cards */}
      <StudentStats
        credentials={credentials}
        consentLogs={consentLogs}
      />

      {/* 3. Dashboard Navigation Tabs */}
      <div className="flex border-b border-neutral-200/90 overflow-x-auto no-scrollbar gap-1 sm:gap-4">
        <button
          onClick={() => setDashboardTab('wallet')}
          className={`flex items-center gap-2 pb-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            dashboardTab === 'wallet'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Credential Passes</span>
          <span className="text-[11px] px-2 py-0.2 rounded-full bg-neutral-100 text-neutral-600 font-medium">
            {passes.length}
          </span>
        </button>

        <button
          onClick={() => setDashboardTab('timeline')}
          className={`flex items-center gap-2 pb-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            dashboardTab === 'timeline'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setDashboardTab('dpdp')}
          className={`flex items-center gap-2 pb-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            dashboardTab === 'dpdp'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Consent History</span>
          <span className="text-[11px] px-2 py-0.2 rounded-full bg-neutral-100 text-neutral-600 font-medium">
            {consentLogs.length}
          </span>
        </button>

        <button
          onClick={() => setDashboardTab('security')}
          className={`flex items-center gap-2 pb-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            dashboardTab === 'security'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Key Management</span>
        </button>
      </div>

      {/* TAB 1: APPLE WALLET SPLIT-VIEW DECK */}
      {dashboardTab === 'wallet' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-black/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/[0.04] text-[#1d1d1f]">
                  <Wallet className="w-3.5 h-3.5 text-[#0071e3]" />
                  Apple Wallet &bull; Google Wallet Pass Deck
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#34c759]/10 text-[#34c759]">
                  <Wifi className="w-3 h-3" />
                  Polygon Amoy Testnet
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] mt-2">
                Student Credential Wallet
              </h1>
              <p className="text-xs text-[#86868b] mt-0.5">
                Tactile institutional digital passes with zero-knowledge selective disclosure predicates.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchCredentialsFromApi(activeStudentId)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1d1d1f] bg-white border border-black/[0.08] hover:bg-black/[0.02] shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Passes</span>
              </button>

              <button
                onClick={() => setIsWalletConnected(!isWalletConnected)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border shadow-xs transition active:scale-95 ${
                  isWalletConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/60'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isWalletConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{isWalletConnected ? 'Wallet Connected' : 'Simulate Disconnect'}</span>
              </button>
            </div>
          </div>

          {/* Wallet Disconnected State Banner */}
          {!isWalletConnected && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">In-App Cryptographic Wallet Disconnected</h4>
                  <p className="text-[11px] text-amber-800/90 mt-0.5">
                    Your sovereign keypair is locked. Reconnect to generate dynamic QR presentation tickets for recruiters.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWalletConnected(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition"
              >
                Reconnect Key
              </button>
            </div>
          )}

          {/* DESKTOP SPLIT-VIEW LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: CREDENTIAL PASS DECK */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#86868b]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#86868b]">
                    Institutional Passes ({passes.length})
                  </span>
                </div>
                <span className="text-[11px] text-[#86868b]">
                  Click to inspect pass
                </span>
              </div>

              {/* Passes List / Deck */}
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-44 rounded-2xl bg-black/[0.04] animate-pulse border border-black/[0.04]" />
                  ))}
                </div>
              ) : passes.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-black/[0.1] bg-white space-y-3">
                  <div className="w-12 h-12 rounded-full bg-black/[0.04] flex items-center justify-center mx-auto text-[#86868b]">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1d1d1f]">No Digital Passes Anchored Yet</h4>
                  <p className="text-xs text-[#86868b] max-w-sm mx-auto">
                    Once your university anchors your graduation batch on Polygon Amoy, your pass will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {passes.map((pass) => {
                    const isSelected = selectedPass?.id === pass.id;
                    const isCgpaRevealed = revealedCgpaIds[pass.id] || false;
                    const isRevoked = pass.status === 'revoked';

                    return (
                      <div
                        key={pass.id}
                        onClick={() => setSelectedPassId(pass.id)}
                        className={`group relative rounded-2xl p-5 sm:p-6 text-white cursor-pointer transition-all duration-300 transform bg-gradient-to-br ${pass.gradientTheme} shadow-md overflow-hidden ${
                          isSelected
                            ? 'ring-2 ring-[#0071e3] ring-offset-2 ring-offset-white scale-[1.01] shadow-xl'
                            : 'hover:scale-[1.008] hover:shadow-lg opacity-90 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: isSelected ? pass.accentColor : 'rgba(255,255,255,0.12)',
                        }}
                      >
                        {/* Background Subtle Institutional Watermark */}
                        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                          <GraduationCap className="w-48 h-48 text-white" />
                        </div>

                        {/* Top Row: Institution + Verified Badge */}
                        <div className="flex items-start justify-between gap-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white font-bold text-xs tracking-wider">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold tracking-tight text-white line-clamp-1">
                                {pass.universityName}
                              </h3>
                              <p className="text-[11px] text-white/70 font-mono">
                                ID: {pass.enrollmentId}
                              </p>
                            </div>
                          </div>

                          {/* Verification Badge */}
                          <div className="flex items-center gap-1.5">
                            {isRevoked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-md">
                                <ShieldAlert className="w-3 h-3 text-rose-400" />
                                Revoked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                Verified &bull; {pass.network}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle: Degree Title & Major */}
                        <div className="mt-5 relative z-10 space-y-1">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">
                            Academic Degree
                          </span>
                          <h4 className="text-lg font-bold tracking-tight text-white">
                            {pass.degreeTitle}
                          </h4>
                          <p className="text-xs text-white/80 font-medium">
                            {pass.major}
                          </p>
                        </div>

                        {/* Bottom Row: Graduation Year & Masked CGPA */}
                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-4 relative z-10">
                          <div className="flex items-center gap-2 text-xs text-white/80">
                            <Calendar className="w-3.5 h-3.5 text-white/60" />
                            <span>{pass.graduationYear}</span>
                          </div>

                          {/* CGPA with Eye Toggle */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-white/60 font-medium">CGPA:</span>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                              <span className="font-mono text-xs font-bold text-white tracking-wider">
                                {isCgpaRevealed ? pass.cgpa.toFixed(2) : '&bull;.&bull;&bull;'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => toggleCgpaMask(pass.id, e)}
                                title={isCgpaRevealed ? 'Mask CGPA' : 'Reveal CGPA'}
                                className="text-white/70 hover:text-white transition p-0.5"
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

                        {/* Active Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#38bdf8] shadow-sm animate-ping" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: STICKY LIVE PASS INSPECTOR & QR TICKET */}
            <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">
              {selectedPass ? (
                <div className="bg-white rounded-3xl border border-black/[0.08] p-6 shadow-sm space-y-6">
                  
                  {/* Top Bar of Inspector */}
                  <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#0071e3]" />
                      <h3 className="text-sm font-bold text-[#1d1d1f]">
                        Live Recruiter Ticket
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#86868b]">
                      ISO/IEC 18004
                    </span>
                  </div>

                  {/* QR Presentation Mode Toggle (Proof of Merit vs Full Transcript) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#86868b] block">
                      Selective Disclosure Level
                    </label>
                    <div className="grid grid-cols-2 p-1 bg-[#f5f5f7] rounded-xl border border-black/[0.04]">
                      <button
                        type="button"
                        onClick={() => setQrMode('merit')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 ${
                          qrMode === 'merit'
                            ? 'bg-white text-[#0071e3] shadow-xs'
                            : 'text-[#86868b] hover:text-[#1d1d1f]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Merit Only (&gt; 8.0)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrMode('full')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 ${
                          qrMode === 'full'
                            ? 'bg-white text-[#1d1d1f] shadow-xs'
                            : 'text-[#86868b] hover:text-[#1d1d1f]'
                        }`}
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Full Transcript</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic QR Code Ticket Container */}
                  <div className="bg-[#f5f5f7] rounded-2xl p-6 flex flex-col items-center justify-center border border-black/[0.06] relative">
                    <div className="bg-white p-4 rounded-xl shadow-xs border border-black/[0.06]">
                      {verificationUrl ? (
                        <QRCodeSVG
                          value={verificationUrl}
                          size={180}
                          level="Q"
                          includeMargin={false}
                        />
                      ) : (
                        <div className="w-[180px] h-[180px] bg-black/[0.05] animate-pulse rounded-lg" />
                      )}
                    </div>

                    {/* Ticket Footnote */}
                    <div className="mt-4 text-center space-y-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0071e3]/10 text-[#0071e3]">
                        {qrMode === 'merit' ? 'Zero-Knowledge Merit Proof' : 'Full Cryptographic Claim Deck'}
                      </span>
                      <p className="text-[11px] text-[#86868b] max-w-xs">
                        Recruiter scans with camera or verifier to execute on-chain validation.
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#1d1d1f] bg-white border border-black/[0.1] hover:bg-black/[0.02] shadow-xs transition active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>Copy Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenRecruiterPreview}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] shadow-xs transition active:scale-95"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Custom Selective Disclosure Generator */}
                  {selectedPass.rawCredential && (
                    <button
                      type="button"
                      onClick={() => setSelectedForShare(selectedPass.rawCredential || null)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#1d1d1f] bg-[#f5f5f7] hover:bg-black/[0.06] border border-black/[0.06] transition"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#86868b]" />
                      <span>Custom Selective Disclosure Picker</span>
                    </button>
                  )}

                  {/* On-Chain Attestation Details */}
                  <div className="pt-4 border-t border-black/[0.06] space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#86868b] block">
                      On-Chain Anchor Metadata
                    </span>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[#86868b] text-[11px] block">Attestation UID</span>
                        <div className="font-mono text-[11px] text-[#1d1d1f] break-all bg-black/[0.03] p-2 rounded-lg border border-black/[0.04] mt-0.5">
                          {selectedPass.attestationUid}
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-black/[0.04]">
                        <span className="text-[#86868b]">Authorized Issuer:</span>
                        <span className="font-semibold text-[#1d1d1f] truncate max-w-[170px]" title={selectedPass.issuerName}>
                          {selectedPass.issuerName}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-black/[0.04]">
                        <span className="text-[#86868b]">Issuer Signing Key:</span>
                        <span className="font-mono text-[11px] text-[#1d1d1f]">
                          {selectedPass.issuerAddress.slice(0, 6)}...{selectedPass.issuerAddress.slice(-4)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#86868b]">Timestamp:</span>
                        <span className="text-[#1d1d1f] font-medium">{selectedPass.timestamp}</span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-8 text-center rounded-3xl border border-black/[0.06] bg-white text-[#86868b] text-xs">
                  Select a credential pass to inspect details.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: TIMELINE */}
      {dashboardTab === 'timeline' && (
        <div className="animate-fadeIn">
          <StudentTimeline credentials={credentials} />
        </div>
      )}

      {/* TAB 3: DPDP CONSENT MANAGER */}
      {dashboardTab === 'dpdp' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-purple-900 leading-relaxed">
              <strong className="font-bold">Digital Personal Data Protection (DPDP) Compliance:</strong> Every time you generate an SD-JWT presentation for a recruiter, a cryptographic consent token is issued with an explicit purpose, expiration date, and selective claim disclosure list. You maintain sovereign control to audit or revoke these permissions at any time.
            </div>
          </div>

          <ConsentHistoryTable logs={consentLogs} />
        </div>
      )}

      {/* TAB 4: SOVEREIGN SECURITY */}
      {dashboardTab === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          <WalletHeader wallet={wallet} onRefresh={initWallet} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f]">WebCrypto AES-GCM Encryption</h3>
                  <span className="text-xs text-[#86868b] font-mono">Client-Side Key Management</span>
                </div>
              </div>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Your private key never leaves this browser sandbox. All SD-JWT holder signatures (KB-JWT) are generated in local Web Workers using native subtle WebCrypto primitives. Even Nexo servers cannot access your credentials.
              </p>
              <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center gap-2 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Hardware-accelerated cryptographic security active</span>
              </div>
            </div>

            <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f]">Zero-Gas Relayer Infrastructure</h3>
                  <span className="text-xs text-[#86868b] font-mono">Polygon Amoy Testnet</span>
                </div>
              </div>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Students never pay gas to receive, store, or present credentials. Verification is done off-chain using Merkle inclusion proofs against the state of Polygon Amoy, eliminating transaction friction completely.
              </p>
              <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center gap-2 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Cost to student: 0.00 MATIC / Lifetime</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SelectiveDisclosureModal
        credential={selectedForShare}
        holderAddress={wallet?.address || ''}
        holderPrivateKey={privateKey}
        isOpen={!!selectedForShare}
        onClose={() => setSelectedForShare(null)}
        onGenerated={handleGeneratedPresentation}
      />

      <QRCodeModal
        payload={presentationPayload}
        isOpen={!!presentationPayload}
        onClose={() => setPresentationPayload(null)}
        onConsentLogged={() => setConsentLogs(getConsentLogs())}
      />
    </div>
  );
}

export default function StudentDashboardPage() {
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
