"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/auth";
import { ShieldAlert, ArrowLeft, LogIn, Lock, Building2, GraduationCap, QrCode } from "lucide-react";

interface Props {
  allowedRole: UserRole;
  children: React.ReactNode;
}

export function AuthGuard({ allowedRole, children }: Props) {
  const { user, isLoading, quickLoginPreset } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Case 1: Not logged in
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
            This screen is protected by Nexo Role-Based Access Control. Please sign in with your authorized email.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
          <span className="font-bold text-slate-700 block">Required Authorization:</span>
          {allowedRole === "ISSUER" && (
            <p className="text-blue-700 flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4 shrink-0" /> College / University Institutional Email (@*.ac.in / @*.edu)
            </p>
          )}
          {allowedRole === "STUDENT" && (
            <p className="text-indigo-700 flex items-center gap-1.5 font-medium">
              <GraduationCap className="w-4 h-4 shrink-0" /> Student / Alumni Email (@student.* / student ID)
            </p>
          )}
          {allowedRole === "RECRUITER" && (
            <p className="text-emerald-700 flex items-center gap-1.5 font-medium">
              <QrCode className="w-4 h-4 shrink-0" /> Company Corporate Email (@google.com / corporate domain)
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
            onClick={() => quickLoginPreset(allowedRole)}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            ⚡ Quick Demo Sign In as {allowedRole === "ISSUER" ? "College Admin" : allowedRole === "STUDENT" ? "Student" : "Reviewer"}
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Role mismatch (e.g. Student trying to view Issuer Portal)
  if (user.role !== allowedRole) {
    const roleLabels = {
      ISSUER: { name: "College / University Admin", path: "/university", icon: "🏛️" },
      STUDENT: { name: "Student / Holder", path: "/student", icon: "🎓" },
      RECRUITER: { name: "Company Reviewer", path: "/verify", icon: "🔍" }
    };

    const target = roleLabels[user.role];

    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-red-200 rounded-3xl shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
            Role Authorization Mismatch
          </span>
          <h2 className="text-2xl font-black text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            You are logged in with <strong className="text-slate-900">{user.email}</strong> as{" "}
            <span className="font-bold text-indigo-600">{user.roleTitle} ({user.role})</span>.
          </p>
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {allowedRole === "ISSUER" && "Only authorized College / University emails can access the Issuer Portal to mint and revoke credentials."}
            {allowedRole === "STUDENT" && "Only registered Student accounts can access the personal student wallet."}
            {allowedRole === "RECRUITER" && "Only corporate Company Reviewer emails can access the Recruiter Verifier portal."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={target.path}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Go to My Portal ({target.icon} {target.name})
          </Link>
          <button
            onClick={() => quickLoginPreset(allowedRole)}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            Switch to {allowedRole === "ISSUER" ? "College Email" : allowedRole === "STUDENT" ? "Student Email" : "Company Email"}
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Authorized!
  return <>{children}</>;
}
