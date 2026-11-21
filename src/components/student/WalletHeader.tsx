'use client';

import React, { useState } from 'react';
import { Wallet, ShieldCheck, Copy, Check, RefreshCw, KeyRound, Sparkles } from 'lucide-react';
import { StoredStudentWallet } from '@/lib/types';
import { resetStudentWallet } from '@/lib/wallet';
import { copyToClipboard } from '@/lib/clipboard';

interface WalletHeaderProps {
  wallet: StoredStudentWallet | null;
  onRefresh: () => void;
}

export function WalletHeader({ wallet, onRefresh }: WalletHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!wallet?.address) return;
    const ok = await copyToClipboard(wallet.address);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    if (confirm('Reset demo in-app wallet and restore sample credentials?')) {
      resetStudentWallet();
      onRefresh();
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return 'Creating...';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Identity info */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Student In-App Wallet</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Gas (Relayer Protected)
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Your self-sovereign identity is encrypted directly on this device. No MetaMask or seed phrase required.
            </p>
          </div>
        </div>

        {/* Right: Address & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-700">
            <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
            <span>{truncateAddress(wallet?.address || '')}</span>
            <button
              onClick={copyAddress}
              className="ml-1 text-slate-400 hover:text-slate-600 transition"
              title="Copy Address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            Polygon Amoy
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            title="Reset to Demo State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
