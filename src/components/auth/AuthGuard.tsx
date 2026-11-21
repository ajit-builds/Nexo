"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppRole, ROLE_PORTALS } from "@/lib/domain-registry";
import { ShieldAlert, ArrowRight, LogIn, Lock, Building2, GraduationCap, QrCode } from "lucide-react";

interface Props {
  allowedRole: AppRole | "issuer" | "student" | "reviewer" | "ISSUER" | "STUDENT" | "RECRUITER";
  children: React.ReactNode;
}

function normalizeRole(roleStr: string): AppRole {
  const lower = roleStr.toLowerCase();
  if (lower === "issuer") return "issuer";
  if (lower === "student") return "student";
  return "reviewer";
}

export function AuthGuard({ allowedRole, children }: Props) {
  const { user, isLoading, quickLoginPreset } = useAuth();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  const targetRole = normalizeRole(allowedRole);
  const currentRole = user ? normalizeRole(user.role) : null;
  const isAuthorized = currentRole === targetRole;
  const authorizedDashboard = user ? (user.portalPath || ROLE_PORTALS[currentRole || "student"].canonical) : "/login";

  // Automatic redirect countdown on 403
  useEffect(() => {
    if (user && !isAuthorized) {
      if (countdown <= 0) {
        router.push(authorizedDashboard);
        return;
      }
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthorized, countdown, authorizedDashboard, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Case 1: Unauthenticated
  if (!user) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Authentication Required
          </span>
          <h2 className="text-2xl font-black text-slate-900">Sign in to Access this Portal</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            This portal is strictly protected by Nexo Role-Based Access Control. Please sign in with your authorized email domain.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
          <span className="font-bold text-slate-700 block">Required Domain Authorization:</span>
          {targetRole === "issuer" && (
            <p className="text-blue-700 flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4 shrink-0" /> Approved University Domain (e.g. <code>@university.edu.in</code>)
            </p>
          )}
          {targetRole === "student" && (
            <p className="text-indigo-700 flex items-center gap-1.5 font-medium">
              <GraduationCap className="w-4 h-4 shrink-0" /> Designated Student Domain (<code>@college.isu.ac.in</code>)
            </p>
          )}
          {targetRole === "reviewer" && (
            <p className="text-emerald-700 flex items-center gap-1.5 font-medium">
              <QrCode className="w-4 h-4 shrink-0" /> Approved Company Domain (e.g. <code>@company.com</code>)
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md"
          >
            <LogIn className="w-4 h-4" /> Go to Login Screen
          </Link>
          <button
            onClick={() => quickLoginPreset(targetRole)}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            ⚡ Quick Demo Sign In as {targetRole === "issuer" ? "University Issuer" : targetRole === "student" ? "Student" : "Reviewer"}
          </button>
        </div>
      </div>
    );
  }

  // Case 2: 403 – Unauthorized Access (Role Mismatch)
  if (!isAuthorized) {
    const roleLabels: Record<AppRole, { name: string; path: string; icon: string }> = {
      issuer: { name: "University Issuer Portal", path: "/university", icon: "🏛️" },
      student: { name: "Student In-App Wallet", path: "/student", icon: "🎓" },
      reviewer: { name: "Company Reviewer Portal", path: "/verify", icon: "🔍" },
    };

    const userTarget = roleLabels[currentRole || "student"];

    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border-2 border-red-200 rounded-3xl shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-100 border border-red-200 px-3 py-1 rounded-full">
            HTTP 403 &bull; Unauthorized Access
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">403 &ndash; Unauthorized Access</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            You are authenticated as <strong className="text-slate-900">{user.email}</strong> with role{" "}
            <span className="font-bold text-indigo-600 capitalize">[{user.role}]</span>.
          </p>
          <div className="p-4 bg-red-50/60 rounded-2xl border border-red-200 text-xs text-red-900 text-left space-y-1.5">
            <span className="font-bold block">Access Restriction Enforcement:</span>
            <p>
              Your account domain is restricted to the <strong>{userTarget.name}</strong>. Cross-portal navigation to this section is strictly forbidden.
            </p>
            <p className="text-[11px] text-red-700 pt-1 border-t border-red-200">
              Automatically redirecting to your authorized dashboard in <strong>{countdown}s</strong>...
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={userTarget.path}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Return to Authorized Dashboard ({userTarget.icon} {userTarget.name})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  // Case 3: Authorized!
  return <>{children}</>;
}
