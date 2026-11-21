'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StudentProfileBanner } from '@/components/student/StudentProfileBanner';
import { StudentStats } from '@/components/student/StudentStats';
import { StudentTimeline } from '@/components/student/StudentTimeline';
import { CredentialCard } from '@/components/student/CredentialCard';
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
import { 
  GraduationCap, 
  Briefcase, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  KeyRound, 
  Share2, 
  Lock, 
  Info,
  CheckCircle2,
  FileCheck2,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';

function StudentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as 'all' | 'academic' | 'experience' | null;
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const tabParam = searchParams.get('tab') as 'portfolio' | 'timeline' | 'dpdp' | 'security' | null;

  const { updateUserProfile } = useAuth();

  const [wallet, setWallet] = useState<StoredStudentWallet | null>(null);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [credentials, setCredentials] = useState<NexoCredential[]>(INITIAL_MOCK_CREDENTIALS);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string>('IITB-2024-001');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [consentLogs, setConsentLogs] = useState<ConsentLogEntry[]>([]);

  // Dashboard Sub-navigation Tabs
  const [dashboardTab, setDashboardTab] = useState<'portfolio' | 'timeline' | 'dpdp' | 'security'>(tabParam || 'portfolio');

  // Category filters & pagination
  const activeCategory = typeParam === 'academic' || typeParam === 'experience' ? typeParam : 'all';
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = 4;

  // Modals
  const [selectedForShare, setSelectedForShare] = useState<NexoCredential | null>(null);
  const [presentationPayload, setPresentationPayload] = useState<VerificationPresentationPayload | null>(null);

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

  const handleCategoryChange = (cat: 'all' | 'academic' | 'experience') => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'all') {
      params.delete('type');
    } else {
      params.set('type', cat);
    }
    params.set('page', '1');
    router.push(`/student?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/student?${params.toString()}`);
  };

  // Active student metadata derivation
  const primaryAcademic = credentials.find((c) => c.type === 'academic');
  const currentStudentData = availableStudents.find((s) => s.studentId === activeStudentId) || {
    studentId: activeStudentId,
    name: primaryAcademic?.claims.full_name || 'Aarav Sharma',
    degree: primaryAcademic?.claims.degree || 'Bachelor of Technology',
    major: primaryAcademic?.claims.major || 'Computer Science and Engineering',
    institution: primaryAcademic?.issuerName || 'Indian Institute of Technology Bombay',
    cgpa: primaryAcademic?.claims.cgpa || 8.85,
    cgpa_above_8: primaryAcademic?.claims.cgpa_above_8 ?? true,
    graduation_year: primaryAcademic?.claims.graduation_year || 2024,
  };

  const filteredCredentials = useMemo(() => {
    return credentials.filter((c) => {
      if (activeCategory === 'academic') return c.type === 'academic';
      if (activeCategory === 'experience') return c.type === 'experience';
      return true;
    });
  }, [credentials, activeCategory]);

  const pagedCredentials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCredentials.slice(start, start + pageSize);
  }, [filteredCredentials, currentPage, pageSize]);

  const handleGeneratedPresentation = (payload: VerificationPresentationPayload) => {
    setSelectedForShare(null);
    setPresentationPayload(payload);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
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
          onClick={() => setDashboardTab('portfolio')}
          className={`flex items-center gap-2 pb-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            dashboardTab === 'portfolio'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Credentials</span>
          <span className="text-[11px] px-2 py-0.2 rounded-full bg-neutral-100 text-neutral-600 font-medium">
            {credentials.length}
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

      {/* 4. Tab Panels */}

      {/* TAB 1: PORTFOLIO */}
      {dashboardTab === 'portfolio' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub-header & category filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                Credentials
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Official degrees and employment records verifiable on Polygon Amoy.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100/80 rounded-xl border border-neutral-200/60 self-start sm:self-auto">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                  activeCategory === 'all'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                All ({credentials.length})
              </button>
              <button
                onClick={() => handleCategoryChange('academic')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition ${
                  activeCategory === 'academic'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Degrees ({credentials.filter((c) => c.type === 'academic').length})
              </button>
              <button
                onClick={() => handleCategoryChange('experience')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition ${
                  activeCategory === 'experience'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Experience ({credentials.filter((c) => c.type === 'experience').length})
              </button>
            </div>
          </div>

          {/* Credentials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pagedCredentials.map((cred) => (
              <CredentialCard
                key={cred.id}
                credential={cred}
                onShare={(credential) => setSelectedForShare(credential)}
              />
            ))}
          </div>

          {/* Pagination */}
          {filteredCredentials.length > pageSize && (
            <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredCredentials.length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                itemLabel="credentials"
              />
            </div>
          )}

          {/* Privacy & Selective Disclosure Explainer Banner */}
          <div className="bg-[#1d1d1f] text-white rounded-3xl p-8 sm:p-10 shadow-lg relative overflow-hidden">
            <div className="max-w-2xl relative z-10 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-[#2997ff]" />
                SD-JWT Zero-Knowledge Predicates
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Prove qualification without surrendering your transcript.
              </h3>
              <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed">
                Nexo allows you to share derived mathematical predicates such as{' '}
                <strong className="text-white">&quot;CGPA ≥ 8.0: true&quot;</strong> without revealing your exact GPA,
                semester marks, or home address. Recruiters verify the proof instantly against the university&apos;s on-chain
                Merkle root.
              </p>
            </div>
            <div className="hidden lg:block absolute -right-6 -bottom-10 opacity-5 pointer-events-none">
              <ShieldCheck className="w-80 h-80 text-white" />
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

      {/* 5. Modals */}
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
    <AuthGuard allowedRole="STUDENT">
      <Suspense fallback={
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-[#86868b]">
          Loading student dashboard...
        </div>
      }>
        <StudentDashboardContent />
      </Suspense>
    </AuthGuard>
  );
}
