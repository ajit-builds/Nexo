'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WalletHeader } from '@/components/student/WalletHeader';
import { CredentialCard } from '@/components/student/CredentialCard';
import { SelectiveDisclosureModal } from '@/components/student/SelectiveDisclosureModal';
import { QRCodeModal } from '@/components/student/QRCodeModal';
import { ConsentHistoryTable } from '@/components/student/ConsentHistoryTable';
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
  ShieldCheck, 
  Sparkles, 
  UserCheck,
  RefreshCw,
  Layers
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';

function StudentWalletContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as 'all' | 'academic' | 'experience' | null;
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const { updateUserProfile } = useAuth();
  const [wallet, setWallet] = useState<StoredStudentWallet | null>(null);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [credentials, setCredentials] = useState<NexoCredential[]>(INITIAL_MOCK_CREDENTIALS);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string>('IITB-2024-001');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [consentLogs, setConsentLogs] = useState<ConsentLogEntry[]>([]);

  // Synchronized activeTab & page from router
  const activeTab = typeParam === 'academic' || typeParam === 'experience' ? typeParam : 'all';
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = 2; // 2 credentials per page to showcase clean pagination

  // Modals
  const [selectedForShare, setSelectedForShare] = useState<NexoCredential | null>(null);
  const [presentationPayload, setPresentationPayload] = useState<VerificationPresentationPayload | null>(null);

  const handleTabChange = (newTab: 'all' | 'academic' | 'experience') => {
    router.push(`/student?type=${newTab}&page=1`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/student?type=${activeTab}&page=${newPage}`, { scroll: false });
  };

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
            const current = data.availableStudents.find((s: any) => s.studentId === studentId);
            if (current && updateUserProfile) {
              updateUserProfile({
                name: current.name,
                organization: `IIT Bombay (${current.studentId})`,
                email: `${current.name.toLowerCase().replace(/\s+/g, '.')}@student.iitb.ac.in`,
              });
            }
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
    const target = availableStudents.find((s) => s.studentId === newId);
    if (target && updateUserProfile) {
      updateUserProfile({
        name: target.name,
        organization: `IIT Bombay (${target.studentId})`,
        email: `${target.name.toLowerCase().replace(/\s+/g, '.')}@student.iitb.ac.in`,
      });
    }
    fetchCredentialsFromApi(newId);
  };

  const filteredCredentials = useMemo(() => {
    return credentials.filter((c) => {
      if (activeTab === 'academic') return c.type === 'academic';
      if (activeTab === 'experience') return c.type === 'experience';
      return true;
    });
  }, [credentials, activeTab]);

  const pagedCredentials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCredentials.slice(start, start + pageSize);
  }, [filteredCredentials, currentPage]);

  const handleGeneratedPresentation = (payload: VerificationPresentationPayload) => {
    setSelectedForShare(null);
    setPresentationPayload(payload);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* 1. Wallet Identity Header */}
      <WalletHeader wallet={wallet} onRefresh={initWallet} />

      {/* 2. Portfolio Section Header & Tabs */}
      <div className="bg-white rounded-3xl border border-black/[0.06] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full">
                Self-Sovereign Identity
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] tracking-tight flex items-center gap-2.5">
              My Credential Portfolio
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.04]">
                {credentials.length} Documents
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#86868b] mt-1 max-w-xl">
              Tamper-proof credentials issued by accredited institutions and anchored to Polygon Amoy.
            </p>
          </div>

          {/* Apple Segmented Pill Control */}
          <div className="flex items-center gap-1 p-1 bg-[#f5f5f7] rounded-full border border-black/[0.04] self-start sm:self-auto">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-4 py-2 text-xs font-medium rounded-full transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              All ({credentials.length})
            </button>
            <button
              onClick={() => handleTabChange('academic')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full transition-all duration-200 ${
                activeTab === 'academic'
                  ? 'bg-white text-[#0071e3] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Degrees ({credentials.filter((c) => c.type === 'academic').length})
            </button>
            <button
              onClick={() => handleTabChange('experience')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full transition-all duration-200 ${
                activeTab === 'experience'
                  ? 'bg-white text-[#34c759] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Experience ({credentials.filter((c) => c.type === 'experience').length})
            </button>
          </div>
        </div>

        {/* 2.1 Live ERP/CSV API Student Profile Selector */}
        {availableStudents.length > 0 && (
          <div className="bg-[#f5f5f7] border border-black/[0.04] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#0071e3] flex-shrink-0" />
              <span className="text-xs font-semibold text-[#1d1d1f]">Live API Profile (from ERP Batch):</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={activeStudentId}
                onChange={(e) => handleStudentSwitch(e.target.value)}
                className="text-xs font-medium bg-white border border-[#d2d2d7]/60 rounded-xl px-3 py-1.5 text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition"
              >
                {availableStudents.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.name} ({s.studentId}) • CGPA: {s.cgpa} {s.cgpa_above_8 ? '✓ [CGPA ≥ 8]' : '✗ [CGPA < 8]'}
                  </option>
                ))}
              </select>
              {isLoading && <RefreshCw className="w-3.5 h-3.5 text-[#0071e3] animate-spin" />}
            </div>
          </div>
        )}
      </div>

      {/* 3. Credentials Grid */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pagedCredentials.map((cred) => (
            <CredentialCard
              key={cred.id}
              credential={cred}
              onShare={(credential) => setSelectedForShare(credential)}
            />
          ))}
        </div>

        {/* Portfolio Pagination */}
        {filteredCredentials.length > pageSize && (
          <div className="bg-white rounded-3xl border border-black/[0.06] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredCredentials.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              itemLabel="credentials"
            />
          </div>
        )}
      </div>

      {/* 4. Privacy & Selective Disclosure Explainer Banner - Clean Apple Dark Card (No Gradients) */}
      <div className="bg-[#1d1d1f] text-white rounded-3xl p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-[#2997ff]" />
            SD-JWT Technology
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

      {/* 5. DPDP Consent & Sharing History with Pagination */}
      <ConsentHistoryTable logs={consentLogs} />

      {/* 6. Modals */}
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

export default function StudentWalletPage() {
  return (
    <AuthGuard allowedRole="STUDENT">
      <Suspense fallback={
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-[#86868b]">
          Loading student wallet...
        </div>
      }>
        <StudentWalletContent />
      </Suspense>
    </AuthGuard>
  );
}