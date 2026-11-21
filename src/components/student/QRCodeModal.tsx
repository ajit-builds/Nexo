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
import { copyToClipboard } from '@/lib/clipboard';

interface QRCodeModalProps {
  payload: VerificationPresentationPayload | null;
  isOpen: boolean;
  onClose: () => void;
  onConsentLogged: () => void;
}

export function QRCodeModal({ payload, isOpen, onClose, onConsentLogged }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [verificationUrl, setVerificationUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    if (payload && isOpen) {
      generatePresentationQRCode(payload)
        .then((res) => {
          setQrDataUrl(res.dataUrl);
          setVerificationUrl(res.verificationUrl);
        })
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

  const copyLink = async () => {
    if (!verificationUrl) return;
    const ok = await copyToClipboard(verificationUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const copyJson = async () => {
    const ok = await copyToClipboard(JSON.stringify(payload, null, 2));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
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
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5">
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

            {/* Live Disclosed Claims in QR */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Disclosed Data Inside QR:
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {Object.entries(payload.disclosedClaims).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-mono capitalize">{k.replace(/_/g, ' ')}:</span>
                    <span className="font-semibold text-indigo-700">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Redacted Claims Notice */}
            {payload.redactedKeys.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                  Redacted (Protected by SD-JWT):
                </span>
                <div className="flex flex-wrap gap-1">
                  {payload.redactedKeys.map((k) => (
                    <span key={k} className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {k.replace(/_/g, ' ')}: [HIDDEN]
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick action buttons */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            <button
              onClick={copyLink}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied URL!' : 'Copy Verification URL'}</span>
            </button>
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm text-center"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Test Verify in New Tab ↗</span>
            </a>
            <button
              onClick={downloadQR}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Image</span>
            </button>
            <button
              onClick={copyJson}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition border border-slate-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
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
