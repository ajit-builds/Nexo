'use client';

import React, { useState, useEffect } from 'react';
import { WalletHeader } from '@/components/student/WalletHeader';
import { CredentialCard } from '@/components/student/CredentialCard';
import { SelectiveDisclosureModal } from '@/components/student/SelectiveDisclosureModal';
import { QRCodeModal } from '@/components/student/QRCodeModal';
import { ConsentHistoryTable } from '@/components/student/ConsentHistoryTable';
import { 
  StoredStudentWallet, 
  NexoCredential, 
  VerificationPresentationPayload, 
  ConsentLogEntry 
} from '@/lib/types';
import { getOrCreateStudentWallet } from '@/lib/wallet';
import { getStudentCredentials } from '@/lib/mock-credentials';
import { getConsentLogs } from '@/lib/sd-jwt-helper';
import { 
  GraduationCap, 
  Briefcase, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle 
} from 'lucide-react';

export default function StudentWalletPage() {
  const [wallet, setWallet] = useState<StoredStudentWallet | null>(null);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [credentials, setCredentials] = useState<NexoCredential[]>([]);
  const [consentLogs, setConsentLogs] = useState<ConsentLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'academic' | 'experience'>('all');

  // Modals
  const [selectedForShare, setSelectedForShare] = useState<NexoCredential | null>(null);
  const [presentationPayload, setPresentationPayload] = useState<VerificationPresentationPayload | null>(null);

  const initWallet = async () => {
    try {
      const res = await getOrCreateStudentWallet();
      setWallet(res.walletData);
      setPrivateKey(res.decryptedPrivateKey);
    } catch (e) {
      console.error('Wallet initialization error:', e);
    }
    setCredentials(getStudentCredentials());
    setConsentLogs(getConsentLogs());
  };

  useEffect(() => {
    initWallet();
  }, []);

  const filteredCredentials = credentials.filter((c) => {
    if (activeTab === 'academic') return c.type === 'academic';
    if (activeTab === 'experience') return c.type === 'experience';
    return true;
  });

  const handleGeneratedPresentation = (payload: VerificationPresentationPayload) => {
    setSelectedForShare(null);
    setPresentationPayload(payload);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* 1. Wallet Identity Header */}
      <WalletHeader wallet={wallet} onRefresh={initWallet} />

      {/* 2. Portfolio Section Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            My Credential Portfolio
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {credentials.length} Documents
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-proof credentials issued by accredited institutions and anchored to Polygon Amoy.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({credentials.length})
          </button>
          <button
            onClick={() => setActiveTab('academic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'academic'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Degrees ({credentials.filter((c) => c.type === 'academic').length})
          </button>
          <button
            onClick={() => setActiveTab('experience')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'experience'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Experience ({credentials.filter((c) => c.type === 'experience').length})
          </button>
        </div>
      </div>

      {/* 3. Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {filteredCredentials.map((cred) => (
          <CredentialCard
            key={cred.id}
            credential={cred}
            onShare={(credential) => setSelectedForShare(credential)}
          />
        ))}
      </div>

      {/* 4. Privacy & Selective Disclosure Explainer Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-8 mb-12 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            SD-JWT Technology
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

      {/* 5. DPDP Consent & Sharing History */}
      <div className="mb-12">
        <ConsentHistoryTable logs={consentLogs} />
      </div>

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
