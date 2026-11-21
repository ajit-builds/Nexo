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
        const redirectParam = searchParams.get("redirect");
        const defaultTarget = result.portalPath || ROLE_PORTALS[result.role || "student"].canonical;
        let target = defaultTarget;
        if (redirectParam) {
          if (redirectParam.startsWith("/verify") && result.role === "reviewer") target = redirectParam;
          else if (redirectParam.startsWith("/student") && result.role === "student") target = redirectParam;
          else if (redirectParam.startsWith("/university") && result.role === "issuer") target = redirectParam;
        }
        router.push(target);
      } else {
        const result = await register(email, password, name);
        if (!result.success) {
          setErrorMessage(result.error || "Registration failed. Please check your details.");
          setSubmitting(false);
          return;
        }
        const redirectParam = searchParams.get("redirect");
        const defaultTarget = result.portalPath || ROLE_PORTALS[result.role || "student"].canonical;
        let target = defaultTarget;
        if (redirectParam) {
          if (redirectParam.startsWith("/verify") && result.role === "reviewer") target = redirectParam;
          else if (redirectParam.startsWith("/student") && result.role === "student") target = redirectParam;
          else if (redirectParam.startsWith("/university") && result.role === "issuer") target = redirectParam;
        }
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
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-20 space-y-12">
      {/* Top Heading */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0071e3]/10 text-xs font-semibold text-[#0071e3]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Domain-Based Role Authentication</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight">
          Nexo Identity & Portal Sign In
        </h1>
        <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed">
          Sign in using your institutional email. The platform automatically determines your role and grants access exclusively to your authorized portal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Common Auth Form */}
        <div className="lg:col-span-7 bg-white border border-black/[0.06] rounded-3xl p-8 sm:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-6">
          {/* Mode Switcher - Apple Segmented Control */}
          <div className="flex p-1 bg-[#f5f5f7] rounded-full border border-black/[0.04]">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-full transition-all duration-200 ${
                mode === "login" ? "bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.06)]" : "text-[#86868b] hover:text-[#1d1d1f]"
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
              className={`flex-1 py-2 text-xs font-medium rounded-full transition-all duration-200 ${
                mode === "register" ? "bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.06)]" : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              Register Approved Account
            </button>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-[#ff3b30] text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Authentication Notice</span>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1d1d1f]">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Kumar or Aarav Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-[#d2d2d7]/50 rounded-2xl text-xs text-[#1d1d1f] focus:bg-white focus:outline-none focus:border-[#0071e3] transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1d1d1f]">
                Official Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@university.edu.in, student@college.isu.ac.in, hr@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-[#d2d2d7]/50 rounded-2xl text-xs font-mono text-[#1d1d1f] focus:bg-white focus:outline-none focus:border-[#0071e3] transition"
                />
              </div>

              {/* Real-time Email Domain Detection and Security Verification Banner */}
              {domainValidation && (
                <div className="mt-3">
                  {domainValidation.valid ? (
                    <div className="p-3.5 rounded-2xl border border-black/[0.04] bg-[#f5f5f7] text-xs flex items-center gap-3">
                      <span className="text-xl">
                        {domainValidation.role === "issuer" ? "🏛️" : domainValidation.role === "student" ? "🎓" : "🔍"}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1d1d1f]">
                            {domainValidation.role === "issuer"
                              ? "University Issuer Domain Approved"
                              : domainValidation.role === "student"
                              ? "Designated Student Domain Approved"
                              : "Company Reviewer Domain Approved"}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-black/[0.06] uppercase text-[#1d1d1f]">
                            {domainValidation.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#86868b] block mt-0.5">
                          Organization: <strong className="text-[#1d1d1f]">{domainValidation.organizationName}</strong> &bull; Portal:{" "}
                          <strong className="text-[#0071e3]">{ROLE_PORTALS[domainValidation.role].canonical}</strong>
                        </span>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-[#34c759] shrink-0" />
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-[#ff9500]/10 border border-[#ff9500]/20 text-xs flex items-start gap-2.5">
                      <XCircle className="w-4 h-4 text-[#ff9500] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#1d1d1f] block">Unapproved Email Domain</span>
                        <p className="text-[11px] text-[#86868b] leading-relaxed mt-0.5">
                          {UNREGISTERED_DOMAIN_ERROR}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1d1d1f]">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-[#d2d2d7]/50 rounded-2xl text-xs text-[#1d1d1f] focus:bg-white focus:outline-none focus:border-[#0071e3] transition"
                />
              </div>
              <p className="text-[11px] text-[#86868b]">Demo password: <code className="bg-[#f5f5f7] px-1.5 py-0.5 rounded text-[#1d1d1f]">Password@123</code></p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-50 text-white font-medium text-xs rounded-full transition shadow-[0_2px_8px_rgba(0,113,227,0.25)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & Domain...</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In & Open Authorized Portal" : "Register & Open Portal"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Security guarantee note */}
          <div className="p-3.5 bg-[#f5f5f7] border border-black/[0.04] rounded-2xl text-[11px] text-[#86868b] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0071e3] shrink-0" />
            <span>Strict server-side RBAC: Access to portals outside your domain is rejected with HTTP 403.</span>
          </div>
        </div>

        {/* Right Column: 1-Click Approved Test Personas - Clean Apple Solid Card (No Gradients) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#1d1d1f] text-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] space-y-3">
            <div className="flex items-center gap-2 text-[#2997ff] font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Authorized Role Personas
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">Pre-Approved Test Accounts</h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Click any of the three pre-seeded accounts to log in with an authorized domain and verify portal routing and backend protections.
            </p>
          </div>

          {/* Preset 1: University Issuer */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSelectPreset("issuer")}
            className="w-full text-left p-5 bg-white border border-black/[0.06] hover:border-[#0071e3]/40 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Building2 className="w-3 h-3" /> University Issuer
              </span>
              <span className="text-xs text-[#86868b] group-hover:text-[#0071e3] font-medium transition">
                One-Click Sign In &rarr;
              </span>
            </div>
            <div className="text-sm font-bold text-[#1d1d1f]">Dr. Ramesh Rao (Registrar)</div>
            <p className="text-xs font-mono text-[#86868b]">admin@university.edu.in</p>
          </button>

          {/* Preset 2: Student */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSelectPreset("student")}
            className="w-full text-left p-5 bg-white border border-black/[0.06] hover:border-[#0071e3]/40 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#5856d6] bg-[#5856d6]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Student Candidate
              </span>
              <span className="text-xs text-[#86868b] group-hover:text-[#5856d6] font-medium transition">
                One-Click Sign In &rarr;
              </span>
            </div>
            <div className="text-sm font-bold text-[#1d1d1f]">Aarav Sharma (B.Tech CSE)</div>
            <p className="text-xs font-mono text-[#86868b]">student@college.isu.ac.in</p>
          </button>

          {/* Preset 3: Recruiter */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSelectPreset("reviewer")}
            className="w-full text-left p-5 bg-white border border-black/[0.06] hover:border-[#0071e3]/40 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#34c759] bg-[#34c759]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <QrCode className="w-3 h-3" /> Hiring Recruiter
              </span>
              <span className="text-xs text-[#86868b] group-hover:text-[#34c759] font-medium transition">
                One-Click Sign In &rarr;
              </span>
            </div>
            <div className="text-sm font-bold text-[#1d1d1f]">Priya Nair (Lead Technical Recruiter)</div>
            <p className="text-xs font-mono text-[#86868b]">recruiter@company.com</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-[#86868b]">
        Loading sign in portal...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}