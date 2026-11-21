'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  EyeOff, 
  Lock, 
  Sparkles, 
  QrCode, 
  Clock, 
  Building
} from 'lucide-react';
import { NexoCredential, SelectiveDisclosureClaim, VerificationPresentationPayload } from '@/lib/types';
import { getDisclosureOptions, createSelectivePresentation } from '@/lib/sd-jwt-helper';
import { Slider } from '@/components/ui/Slider';

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

  // Format validity for Apple Slider
  const formatValidityDisplay = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    if (mins === 60) return '1 hour';
    if (mins < 1440) {
      const hrs = Math.round(mins / 60);
      return `${hrs} hours`;
    }
    return '24 hours';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-black/[0.06] overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-black/[0.06] flex items-center justify-between bg-[#fbfbfd]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#0071e3]/10 text-[#0071e3]">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-[#1d1d1f] tracking-tight">Selective Disclosure Studio</h2>
            </div>
            <p className="text-xs text-[#86868b] mt-1">
              Select which attributes to reveal. Unchecked items remain mathematically masked and tamper-proof.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#86868b] hover:text-[#1d1d1f] rounded-full hover:bg-[#f5f5f7] transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Claims Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6">
          {/* Recruiter / Purpose Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#f5f5f7] p-5 rounded-3xl border border-black/[0.04]">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#86868b]" />
                Target Recruiter / Company
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Google India, Infosys HR"
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#d2d2d7]/60 rounded-xl focus:outline-none focus:border-[#0071e3] text-[#1d1d1f] transition"
              />
            </div>

            {/* Apple Interactive Slider for QR Code Validity */}
            <div className="space-y-1">
              <Slider
                min={15}
                max={1440}
                step={15}
                value={validity}
                onChange={setValidity}
                label="QR Code Validity"
                valueDisplay={formatValidityDisplay}
                minLabel="15m"
                maxLabel="24h"
              />
            </div>
          </div>

          {/* Zero-Knowledge Predicate Claim Card */}
          {claims.find((c) => c.isPredicate) && (
            <div className="bg-[#0071e3]/5 border border-[#0071e3]/20 rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#0071e3] text-white rounded-xl mt-0.5 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#1d1d1f]">
                        Zero-Knowledge Predicate: &quot;CGPA ≥ 8.0&quot;
                      </h4>
                      <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-[#0071e3]/10 text-[#0071e3] rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-[#86868b] mt-1 leading-relaxed">
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
                  className="w-5 h-5 accent-[#0071e3] rounded-md cursor-pointer mt-1"
                />
              </div>
            </div>
          )}

          {/* List of Claims */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                Credential Attributes ({disclosedCount} Revealed / {redactedCount} Hidden)
              </h3>
              <span className="text-xs text-[#86868b]">Toggle to show / redact</span>
            </div>

            <div className="space-y-2">
              {claims
                .filter((c) => !c.isPredicate)
                .map((claim) => (
                  <div
                    key={claim.key}
                    onClick={() => toggleClaim(claim.key)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      claim.disclosed
                        ? 'bg-white border-[#d2d2d7]/70 shadow-sm'
                        : 'bg-[#f5f5f7] border-black/[0.04] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${claim.disclosed ? 'bg-[#34c759]/10 text-[#34c759]' : 'bg-[#e5e5ea] text-[#86868b]'}`}>
                        {claim.disclosed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-[#1d1d1f]">{claim.label}</span>
                          {!claim.disclosed && (
                            <span className="text-[10px] font-semibold text-[#ff9500] bg-[#ff9500]/10 px-2 py-0.5 rounded-full">
                              Redacted
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#86868b] font-mono mt-0.5">
                          {claim.disclosed ? String(claim.value) : '•••••••••••• (Hidden from verifier)'}
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={claim.disclosed}
                      onChange={() => {}} // handled by parent onClick
                      className="w-4 h-4 accent-[#0071e3] rounded cursor-pointer"
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer - Apple Pill Buttons */}
        <div className="p-6 border-t border-black/[0.06] bg-[#fbfbfd] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#86868b] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#34c759]" />
            <span>Digital signature & Merkle proof automatically attached.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full transition"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || disclosedCount === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white font-medium text-xs rounded-full transition shadow-[0_2px_8px_rgba(0,113,227,0.25)] disabled:opacity-40"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating...' : 'Generate Verification QR'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}