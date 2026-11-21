"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, LogIn, Lock, Building2, GraduationCap, QrCode } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_PORTALS, AppRole } from '@/lib/domain-registry';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();

  const attemptedPath = searchParams.get('attempted') || 'this portal';
  const paramRole = (searchParams.get('userRole') as AppRole) || user?.role || 'student';
  const paramTarget = searchParams.get('authorizedPortal') || user?.portalPath || ROLE_PORTALS[paramRole]?.canonical || '/';

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      router.push(paramTarget);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, paramTarget, router]);

  const roleMeta: Record<AppRole, { label: string; icon: React.ReactNode; color: string }> = {
    issuer: {
      label: 'University (Issuer)',
      icon: <Building2 className="w-5 h-5" />,
      color: 'blue',
    },
    student: {
      label: 'Student (Credential Holder)',
      icon: <GraduationCap className="w-5 h-5" />,
      color: 'indigo',
    },
    reviewer: {
      label: 'Company (Reviewer)',
      icon: <QrCode className="w-5 h-5" />,
      color: 'emerald',
    },
  };

  const currentRoleMeta = roleMeta[paramRole] || roleMeta.student;

  return (
    <div className="max-w-xl mx-auto my-16 px-4">
      <div className="bg-white border-2 border-red-200 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Top 403 Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
          <ShieldAlert className="w-3.5 h-3.5" />
          HTTP 403 &bull; Forbidden
        </div>

        {/* Big Alert Icon */}
        <div className="w-20 h-20 rounded-3xl bg-red-50 border-2 border-red-100 flex items-center justify-center text-red-600 mx-auto shadow-inner">
          <Lock className="w-10 h-10" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            403 – Unauthorized Access
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            You do not have permission to access <code className="px-2 py-0.5 rounded bg-slate-100 text-red-600 font-mono text-xs font-bold">{attemptedPath}</code>.
          </p>
        </div>

        {/* Context Details */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Your Authenticated Role:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              {currentRoleMeta.icon}
              {currentRoleMeta.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Authorized Portal:</span>
            <span className="font-bold text-indigo-600 font-mono">{paramTarget}</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Access to portals is strictly partitioned based on your registered email domain. Universities can only access the Issuer Portal, students can only access the Student Wallet, and companies can only access the Reviewer Portal.
          </p>
        </div>

        {/* Auto-redirect countdown notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center justify-center gap-2">
          <span>Redirecting to your authorized dashboard in</span>
          <span className="font-black text-amber-900 px-2 py-0.5 bg-amber-200/80 rounded-md font-mono">{countdown}s</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => router.push(paramTarget)}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Go to Authorized Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            Sign Out & Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Verifying authorization...</div>}>
      <UnauthorizedContent />
    </Suspense>
  );
}
