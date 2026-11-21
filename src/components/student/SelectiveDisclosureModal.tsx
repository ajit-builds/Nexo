'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  EyeOff, 
  Lock, 
  CheckCircle, 
  Sparkles, 
  QrCode, 
  ShieldAlert, 
  Clock, 
  Building
} from 'lucide-react';
import { NexoCredential, SelectiveDisclosureClaim, VerificationPresentationPayload } from '@/lib/types';
import { getDisclosureOptions, createSelectivePresentation } from '@/lib/sd-jwt-helper';

interface SelectiveDisclosureModalProps {
  credential: NexoCredential | null;
  holderAddress: string;
  holderPrivateKey?: string;
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (payload: VerificationPresentationPayload) => void;
}

export function SelectiveDisclosureModal({
  credential,
  holderAddress,
  holderPrivateKey,
  isOpen,
  onClose,
  onGenerated,
}: SelectiveDisclosureModalProps) {
  const [claims, setClaims] = useState<SelectiveDisclosureClaim[]>([]);
  const [recipient, setRecipient] = useState('Google India Campus Drive');
  const [validity, setValidity] = useState(60); // 60 minutes
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (credential) {
      setClaims(getDisclosureOptions(credential));
    }
  }, [credential]);

  if (!isOpen || !credential) return null;

  const toggleClaim = (key: string) => {
    setClaims((prev) =>
      prev.map((c) => (c.key === key ? { ...c, disclosed: !c.disclosed } : c))
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const payload = await createSelectivePresentation(
        credential,
        claims,
        holderAddress,
        holderPrivateKey,
        `Verification requested by ${recipient}`,
        validity
      );
      onGenerated(payload);
    } catch (e) {
      console.error('Error generating presentation:', e);
      alert('Failed to generate selective disclosure proof.');
    } finally {
      setIsGenerating(false);
    }
  };

  const disclosedCount = claims.filter((c) => c.disclosed).length;
  const redactedCount = claims.length - disclosedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">Selective Disclosure Studio</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select which attributes to reveal. Unchecked items remain completely redacted and mathematically masked.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Claims Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Recruiter / Purpose Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                Target Recruiter / Company
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Google India, Infosys HR"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                QR Code Validity
              </label>
              <select
                value={validity}
                onChange={(e) => setValidity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                <option value={15}>15 Minutes (High Security)</option>
                <option value={60}>1 Hour (Standard Interview)</option>
                <option value={1440}>24 Hours (Day Pass)</option>
                <option value={10080}>7 Days</option>
              </select>
            </div>
          </div>

          {/* Special Highlight: Predicate Claim (e.g. CGPA >= 8.0) */}
          {claims.find((c) => c.isPredicate) && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-indigo-950">
                        Zero-Knowledge Predicate: &quot;CGPA ≥ 8.0&quot;
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-200/70 text-indigo-800 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-indigo-800/80 mt-1">
                      Proves you meet the minimum CGPA 8.0 requirement without disclosing your exact transcript or marks.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={claims.find((c) => c.isPredicate)?.disclosed ?? false}
                  onChange={() => {
                    const pred = claims.find((c) => c.isPredicate);
                    if (pred) toggleClaim(pred.key);
                  }}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
                />
              </div>
            </div>
          )}

          {/* List of Claims */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Credential Attributes ({disclosedCount} Revealed / {redactedCount} Hidden)
              </h3>
              <span className="text-xs text-slate-500">Click checkboxes to toggle</span>
            </div>

            <div className="space-y-2.5">
              {claims
                .filter((c) => !c.isPredicate)
                .map((claim) => (
                  <div
                    key={claim.key}
                    onClick={() => toggleClaim(claim.key)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer select-none ${
                      claim.disclosed
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-slate-50/80 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${claim.disclosed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                        {claim.disclosed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{claim.label}</span>
                          {!claim.disclosed && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                              Redacted
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {claim.disclosed ? String(claim.value) : '•••••••••••• (Hidden from verifier)'}
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={claim.disclosed}
                      onChange={() => {}} // handled by parent onClick
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Digital signature & Merkle proof automatically attached.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || disclosedCount === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Generate Verification QR'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
