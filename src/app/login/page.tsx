"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  validateEmailDomain, 
  UNREGISTERED_DOMAIN_ERROR, 
  AppRole,
  ROLE_PORTALS
} from "@/lib/domain-registry";
import { 
  ShieldCheck, 
  Building2, 
  GraduationCap, 
  QrCode, 
  ArrowRight, 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  Loader2
} from "lucide-react";

function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, register, quickLoginPreset } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  // Real-time domain validation as user types
  const domainValidation = useMemo(() => {
    if (!email || !email.includes("@")) {
      return null;
    }
    return validateEmailDomain(email);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    // Verify domain before submitting
    const check = validateEmailDomain(email);
    if (!check.valid) {
      setErrorMessage(UNREGISTERED_DOMAIN_ERROR);
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "login") {
        const result = await login(email, password);
        if (!result.success) {
          setErrorMessage(result.error || "Invalid email or password. Please try again.");
          setSubmitting(false);
          return;
        }
        // Redirect to authorized portal or requested redirect if authorized
        const target = result.portalPath || ROLE_PORTALS[result.role || "student"].canonical;
        router.push(target);
      } else {
        const result = await register(email, password, name);
        if (!result.success) {
          setErrorMessage(result.error || "Registration failed. Please check your details.");
          setSubmitting(false);
          return;
        }
        const target = result.portalPath || ROLE_PORTALS[result.role || "student"].canonical;
        router.push(target);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  const handleSelectPreset = async (presetRole: AppRole) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await quickLoginPreset(presetRole);
      if (!result.success) {
        setErrorMessage(result.error || "Preset login failed.");
        setSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Preset login failed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      {/* Top Heading */}
      <div className="text-center max-w-xl mx-auto space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Domain-Based Role Authentication</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Nexo Identity & Portal Sign In
        </h1>
        <p className="text-sm text-slate-600">
          Sign in using your institutional email. The platform automatically determines your role and grants access exclusively to your authorized portal:
          <strong> University Domain</strong> &rarr; Issuer Portal, <strong>@college.isu.ac.in</strong> &rarr; Student Wallet, <strong>Company Domain</strong> &rarr; Reviewer Portal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Common Auth Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-lg space-y-6">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In to Existing Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Register Approved Account
            </button>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Authentication Notice</span>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Kumar or Aarav Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Official Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@university.edu.in, student@college.isu.ac.in, hr@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono text-xs"
                />
              </div>

              {/* Real-time Email Domain Detection and Security Verification Banner */}
              {domainValidation && (
                <div className="mt-3">
                  {domainValidation.valid ? (
                    <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 transition-all ${
                      domainValidation.role === "issuer"
                        ? "bg-blue-50/90 border-blue-200 text-blue-900"
                        : domainValidation.role === "student"
                        ? "bg-indigo-50/90 border-indigo-200 text-indigo-900"
                        : "bg-emerald-50/90 border-emerald-200 text-emerald-900"
                    }`}>
                      <span className="text-xl">
                        {domainValidation.role === "issuer" ? "🏛️" : domainValidation.role === "student" ? "🎓" : "🔍"}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black">
                            {domainValidation.role === "issuer"
                              ? "University Issuer Domain Approved"
                              : domainValidation.role === "student"
                              ? "Designated Student Domain Approved"
                              : "Company Reviewer Domain Approved"}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 uppercase">
                            {domainValidation.role}
                          </span>
                        </div>
                        <span className="text-[11px] opacity-85 block mt-0.5">
                          Organization: <strong>{domainValidation.organizationName}</strong> &bull; Authorized Portal:{" "}
                          <strong>{ROLE_PORTALS[domainValidation.role].canonical}</strong>
                        </span>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                      <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Unapproved Email Domain</span>
                        <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                          {UNREGISTERED_DOMAIN_ERROR}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Default demo password for seeded accounts: <code>Password@123</code></p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & Domain...</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In & Open Authorized Portal" : "Register & Open Portal"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security guarantee note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Strict server-side RBAC active: Access to portals outside your domain is rejected with HTTP 403.</span>
          </div>
        </div>

        {/* Right Column: 1-Click Approved Test Personas */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Authorized Role Personas
            </div>
            <h3 className="text-xl font-black">Pre-Approved Test Accounts</h3>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Click any of the three pre-seeded accounts to log in with an authorized domain and verify that portal routing and backend protections are enforced.
            </p>
          </div>

          {/* Preset 1: University Issuer */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSelectPreset("issuer")}
            className="w-full text-left p-5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl shadow-sm hover:shadow-md transition group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> University (Issuer)
              </span>
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Dr. S. K. Mukherjee</h4>
              <p className="text-xs font-mono text-slate-600">admin@university.edu.in</p>
            </div>
            <div className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span>Domain: <code>university.edu.in</code></span>
              <strong className="text-blue-700">&rarr; /university ONLY</strong>
            </div>
          </button>

          {/* Preset 2: Student */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSelectPreset("student")}
            className="w-full text-left p-5 bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl shadow-sm hover:shadow-md transition group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> Student (Credential Holder)
              </span>
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Aarav Sharma</h4>
              <p className="text-xs font-mono text-slate-600">student@college.isu.ac.in</p>
            </div>
            <div className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span>Designated Domain: <code>college.isu.ac.in</code></span>
              <strong className="text-indigo-700">&rarr; /student ONLY</strong>
            </div>
          </button>

          {/* Preset 3: Company Reviewer */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSelectPreset("reviewer")}
            className="w-full text-left p-5 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-sm hover:shadow-md transition group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" /> Company (Reviewer)
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Sarah Jenkins</h4>
              <p className="text-xs font-mono text-slate-600">hr@company.com</p>
            </div>
            <div className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span>Domain: <code>company.com</code></span>
              <strong className="text-emerald-700">&rarr; /verify ONLY</strong>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-sm text-slate-500">Loading Login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
