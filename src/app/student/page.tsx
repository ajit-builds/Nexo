'use client';

import React, { useState, useEffect } from 'react';
import { StudentProfileBanner } from '@/components/student/StudentProfileBanner';
import { StudentStats } from '@/components/student/StudentStats';
import { StudentTimeline } from '@/components/student/StudentTimeline';
import { CredentialCard } from '@/components/student/CredentialCard';
import { ConsentHistoryTable } from '@/components/student/ConsentHistoryTable';
import { WalletHeader } from '@/components/student/WalletHeader';
import { SelectiveDisclosureModal } from '@/components/student/SelectiveDisclosureModal';
import { QRCodeModal } from '@/components/student/QRCodeModal';
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
  FileCheck2
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function StudentDashboardPage() {
  const [wallet, setWallet] = useState<StoredStudentWallet | null>(null);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [credentials, setCredentials] = useState<NexoCredential[]>(INITIAL_MOCK_CREDENTIALS);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string>('IITB-2024-001');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [consentLogs, setConsentLogs] = useState<ConsentLogEntry[]>([]);
  
  // Dashboard Sub-navigation Tabs
  const [dashboardTab, setDashboardTab] = useState<'portfolio' | 'timeline' | 'dpdp' | 'security'>('portfolio');
  
  // Credential Category Filters (under portfolio tab)
  const [activeCategory, setActiveCategory] = useState<'all' | 'academic' | 'experience'>('all');

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
    // 1. Fetch credentials
    fetchCredentialsFromApi(activeStudentId);
    setConsentLogs(getConsentLogs());

    // 2. Initialize in-app WebCrypto wallet
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
  };

  // Derive active scholar profile info
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

  const filteredCredentials = credentials.filter((c) => {
    if (activeCategory === 'academic') return c.type === 'academic';
    if (activeCategory === 'experience') return c.type === 'experience';
    return true;
  });

  const handleGeneratedPresentation = (payload: VerificationPresentationPayload) => {
    setSelectedForShare(null);
    setPresentationPayload(payload);
  };

  return (
    <AuthGuard allowedRole="STUDENT">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar gap-2 sm:gap-6">
          <button
            onClick={() => setDashboardTab('portfolio')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 whitespace-nowrap transition ${
              dashboardTab === 'portfolio'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Credential Portfolio</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              {credentials.length}
            </span>
          </button>

          <button
            onClick={() => setDashboardTab('timeline')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 whitespace-nowrap transition ${
              dashboardTab === 'timeline'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Academic &amp; Career Timeline</span>
          </button>

          <button
            onClick={() => setDashboardTab('dpdp')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 whitespace-nowrap transition ${
              dashboardTab === 'dpdp'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>DPDP Consent Manager</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
              {consentLogs.length}
            </span>
          </button>

          <button
            onClick={() => setDashboardTab('security')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 whitespace-nowrap transition ${
              dashboardTab === 'security'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Sovereign Security</span>
          </button>
        </div>

        {/* 4. Tab Panels */}

        {/* TAB 1: PORTFOLIO */}
        {dashboardTab === 'portfolio' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Filter Sub-Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Cryptographically Anchored Credentials
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selectively disclose claims or view your official verified certificate card.
                </p>
              </div>

              {/* Sub-Filters */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeCategory === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({credentials.length})
                </button>
                <button
                  onClick={() => setActiveCategory('academic')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeCategory === 'academic'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Degrees ({credentials.filter((c) => c.type === 'academic').length})
                </button>
                <button
                  onClick={() => setActiveCategory('experience')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeCategory === 'experience'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Experience ({credentials.filter((c) => c.type === 'experience').length})
                </button>
              </div>
            </div>

            {/* Credentials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCredentials.map((cred) => (
                <CredentialCard
                  key={cred.id}
                  credential={cred}
                  onShare={(credential) => setSelectedForShare(credential)}
                />
              ))}
            </div>

            {/* Privacy & Selective Disclosure Explainer Banner */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
              <div className="max-w-2xl relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  SD-JWT Zero-Knowledge Predicates
                </span>
                <h3 className="text-2xl font-bold tracking-tight">
                  Prove qualification without surrendering your transcript.
                </h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Nexo allows you to share derived mathematical predicates such as{' '}
                  <strong className="text-white">&quot;CGPA ≥ 8.0: true&quot;</strong> without revealing your exact GPA,
                  semester marks, or home address. Recruiters verify the proof instantly against the university&apos;s on-chain
                  Merkle root.
                </p>
              </div>
              <div className="hidden lg:block absolute -right-6 -bottom-10 opacity-15">
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
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
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

            {/* Architecture Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">WebCrypto AES-GCM Encryption</h3>
                    <span className="text-xs text-slate-500 font-mono">Client-Side Key Management</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your private key never leaves this browser sandbox. All SD-JWT holder signatures (KB-JWT) are generated in local Web Workers using native subtle WebCrypto primitives. Even Nexo servers cannot access your credentials.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hardware-accelerated cryptographic security active</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Zero-Gas Relayer Infrastructure</h3>
                    <span className="text-xs text-slate-500 font-mono">ERC-2771 Meta-Transactions</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Students never pay gas to receive, store, or present credentials. Verification is done off-chain using Merkle inclusion proofs against the state of Polygon Amoy, eliminating transaction friction completely.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-700 font-medium">
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
    </AuthGuard>
  );
}
