'use client';

import React from 'react';

interface StudentVerifyCardProps {
  title?: string;
  recipient?: string;
  issuer?: string;
  issuerUrl?: string;
  issueDate?: string;
  transactionId?: string;
  txUrl?: string;
  isVerified?: boolean;
  onVerify?: () => void;
  onReset?: () => void;
}

export function StudentVerifyCard({
  title = 'Certified Degree / Credential',
  recipient = 'Jessica Smith',
  issuer = 'Northern University',
  issuerUrl = 'www.learningmachine.com',
  issueDate = 'November 10, 2017',
  transactionId = 'ae0789d1a055d1dd7...',
  txUrl,
  isVerified = true,
  onVerify,
  onReset,
}: StudentVerifyCardProps) {
  // Truncate transaction ID if long
  const displayTx =
    transactionId.length > 20
      ? `${transactionId.slice(0, 18)}...`
      : transactionId;

  const explorerUrl =
    txUrl ||
    (transactionId.startsWith('0x')
      ? `https://amoy.polygonscan.com/tx/${transactionId}`
      : `https://amoy.polygonscan.com/`);

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/90 p-8 sm:p-10 font-sans tracking-normal transition-all hover:shadow-md">
      {/* Top Row: Logo Badge + Title/Name + VERIFY Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* Multi-colored Circular Cloud Badge matching Blockcerts / Learning Machine reference */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-sm select-none"
              aria-label="Credential Emblem"
            >
              {/* Outer segmented color ring */}
              {/* Red-Orange segment */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#FF5522"
                strokeWidth="12"
                strokeDasharray="62.8 188.4"
                strokeDashoffset="31.4"
              />
              {/* Yellow-Orange segment */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#FFAA00"
                strokeWidth="12"
                strokeDasharray="62.8 188.4"
                strokeDashoffset="94.2"
              />
              {/* Cyan segment */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#00C4DF"
                strokeWidth="12"
                strokeDasharray="62.8 188.4"
                strokeDashoffset="157"
              />
              {/* Dark Violet / Plum segment */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#6B1D56"
                strokeWidth="12"
                strokeDasharray="62.8 188.4"
                strokeDashoffset="219.8"
              />

              {/* Inner White Cloud Icon */}
              <g transform="translate(26, 30) scale(0.96)">
                <path
                  d="M38 18.5c0-4.14-3.36-7.5-7.5-7.5-1.04 0-2.03.22-2.93.6C26.15 6.94 21.5 4 16 4 8.27 4 2 10.27 2 18c0 .28.02.56.04.84C.84 20.08 0 21.69 0 23.5 0 26.54 2.46 29 5.5 29h32c3.59 0 6.5-2.91 6.5-6.5 0-3.32-2.48-6.07-5.72-6.44.14-.5.22-1.02.22-1.56z"
                  fill="#FFFFFF"
                />
              </g>
            </svg>
          </div>

          {/* Title, Name, Domain */}
          <div className="space-y-0.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E6FD9] leading-tight tracking-tight">
              {title}
            </h2>
            <div className="text-xl sm:text-2xl font-bold text-slate-700 tracking-tight">
              {recipient}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-normal pt-0.5">
              {issuerUrl}
            </p>
          </div>
        </div>

        {/* VERIFY Button */}
        <div className="flex-shrink-0 self-start sm:self-center">
          <button
            onClick={onVerify}
            className="px-7 py-2.5 bg-[#00C271] hover:bg-[#00ab63] active:scale-95 text-white font-extrabold text-sm uppercase tracking-wider rounded-lg shadow-sm transition duration-150 flex items-center gap-1.5"
          >
            {isVerified && <span>VERIFY</span>}
          </button>
        </div>
      </div>

      {/* Thin Horizontal Divider */}
      <div className="border-t border-slate-200/80 my-8" />

      {/* Bottom Metadata 4-Column Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
        {/* 1. Recipient */}
        <div>
          <span className="block text-xs font-normal text-slate-400 mb-1">
            Recipient
          </span>
          <span className="text-sm sm:text-base font-semibold text-slate-700">
            {recipient}
          </span>
        </div>

        {/* 2. Issue Date */}
        <div>
          <span className="block text-xs font-normal text-slate-400 mb-1">
            Issue Date
          </span>
          <span className="text-sm sm:text-base font-semibold text-slate-700">
            {issueDate}
          </span>
        </div>

        {/* 3. Issuer */}
        <div>
          <span className="block text-xs font-normal text-slate-400 mb-1">
            Issuer
          </span>
          <span className="text-sm sm:text-base font-semibold text-slate-700">
            {issuer}
          </span>
        </div>

        {/* 4. Transaction ID */}
        <div>
          <span className="block text-xs font-normal text-slate-400 mb-1">
            Transaction ID
          </span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={transactionId}
            className="text-sm sm:text-base font-semibold text-[#00C271] hover:text-[#009e5b] underline underline-offset-2 transition"
          >
            {displayTx}
          </a>
        </div>
      </div>

      {/* "Try another certificate" Centered Footer */}
      {onReset && (
        <div className="text-center pt-8 mt-2">
          <button
            onClick={onReset}
            className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-4 font-normal transition"
          >
            Try another certificate
          </button>
        </div>
      )}
    </div>
  );
}
