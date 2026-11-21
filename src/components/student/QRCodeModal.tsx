'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Lock, 
  FileText 
} from 'lucide-react';
import { VerificationPresentationPayload, ConsentLogEntry } from '@/lib/types';
import { generatePresentationQRCode, saveConsentLog } from '@/lib/sd-jwt-helper';

interface QRCodeModalProps {
  payload: VerificationPresentationPayload | null;
  isOpen: boolean;
  onClose: () => void;
  onConsentLogged: () => void;
}

export function QRCodeModal({ payload, isOpen, onClose, onConsentLogged }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    if (payload && isOpen) {
      generatePresentationQRCode(payload)
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));

      // Auto-save to DPDP consent log
      const consentEntry: ConsentLogEntry = {
        id: payload.presentationId,
        recipient: payload.purpose.replace('Verification requested by ', ''),
        purpose: payload.purpose,
        credentialTitle: payload.disclosedClaims['degree'] || payload.disclosedClaims['designation'] || 'Verified Credential',
        disclosedClaims: Object.keys(payload.disclosedClaims),
        redactedClaims: payload.redactedKeys,
        timestamp: payload.issuedAt,
        expiresAt: payload.expiresAt,
        status: 'active',
      };
      saveConsentLog(consentEntry);
      onConsentLogged();
    }
  }, [payload, isOpen]);

  if (!isOpen || !payload) return null;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `nexo-verification-${payload.presentationId}.png`;
    link.click();
  };

  const expiresDate = new Date(payload.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Presentation Ready
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Verification QR Code</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex flex-col items-center text-center">
          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl border-2 border-indigo-100 shadow-md">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Verification QR Code" className="w-64 h-64 object-contain rounded-lg" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          {/* Verification Target Banner */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Target Verifier:</span>
              <span className="font-medium text-slate-900">{payload.purpose.replace('Verification requested by ', '')}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Expires At:</span>
              <span className="font-medium text-amber-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {expiresDate} (Time-bound)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Disclosed Claims:</span>
              <span className="font-semibold text-emerald-600">{Object.keys(payload.disclosedClaims).length} attributes</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Redacted Claims:</span>
              <span className="font-semibold text-slate-400">{payload.redactedKeys.length} hidden</span>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="w-full flex items-center gap-3">
            <button
              onClick={downloadQR}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Image</span>
            </button>
            <button
              onClick={copyJson}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition border border-indigo-200"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Token' : 'Copy JSON Token'}</span>
            </button>
          </div>

          {/* JSON Payload Inspector Toggle */}
          <div className="w-full text-left">
            <button
              onClick={() => setShowJson(!showJson)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              {showJson ? 'Hide Raw Presentation JSON' : 'Inspect Raw Presentation JSON (For Devs)'}
            </button>

            {showJson && (
              <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] overflow-x-auto max-h-40 font-mono text-left">
                {JSON.stringify(payload, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            DPDP Compliant: Logged to Consent History
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
