"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { detectRoleFromEmail, UserRole, DEMO_PRESET_USERS } from "@/lib/auth";
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
  AlertCircle 
} from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [selectedRoleOverride, setSelectedRoleOverride] = useState<UserRole | null>(null);

  const { login, register, quickLoginPreset } = useAuth();
  const router = useRouter();

  // Dynamic role detection as user types
  const detected = detectRoleFromEmail(email);
  const activeRole = selectedRoleOverride || detected.role;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (mode === "login") {
      const assignedRole = login(email, password, activeRole);
      if (assignedRole === "ISSUER") router.push("/university");
      else if (assignedRole === "STUDENT") router.push("/student");
      else router.push("/verify");
    } else {
      register(email, name, activeRole, organization);
      if (activeRole === "ISSUER") router.push("/university");
      else if (activeRole === "STUDENT") router.push("/student");
      else router.push("/verify");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      {/* Top Heading */}
      <div className="text-center max-w-xl mx-auto space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Role-Based Authorization System</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Nexo Identity & Portal Sign In
        </h1>
        <p className="text-sm text-slate-600">
          Register or sign in with your email. Your portal is automatically configured based on your domain:
          <strong> College Email</strong> for Issuers, <strong>Student Email</strong> for Wallets, and <strong>Company Email</strong> for Reviewers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Auth Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-lg space-y-6">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In to Existing Account
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Create New Account
            </button>
          </div>

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
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. registrar@iitb.ac.in, student@iitb.ac.in, or hr@google.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Real-time Email Domain Detection Banner */}
              {email.includes("@") && (
                <div className={`mt-2.5 p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                  activeRole === "ISSUER"
                    ? "bg-blue-50/80 border-blue-200 text-blue-900"
                    : activeRole === "STUDENT"
                    ? "bg-indigo-50/80 border-indigo-200 text-indigo-900"
                    : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                }`}>
                  <span className="text-lg">{detected.icon}</span>
                  <div className="flex-1">
                    <span className="font-bold block">
                      {activeRole === "ISSUER" ? "College / University Domain Detected" : activeRole === "STUDENT" ? "Student Account Detected" : "Company Recruiter Domain Detected"}
                    </span>
                    <span className="text-[11px] opacity-80">
                      Authorizes access exclusively to: <strong>{detected.targetPath}</strong> ({detected.roleTitle})
                    </span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              )}
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Institution / Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. IIT Bombay or Google India"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Role Manual Override Selector (Optional) */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Or Select Role Target Explicitly:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoleOverride("ISSUER")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    activeRole === "ISSUER"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>College Issuer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRoleOverride("STUDENT")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    activeRole === "STUDENT"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRoleOverride("RECRUITER")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    activeRole === "RECRUITER"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Reviewer</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition shadow-md"
            >
              <span>{mode === "login" ? "Sign In & Open Authorized Portal" : "Create Account & Enter Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: 1-Click Quick Demo Presets */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" /> 1-Click Quick Evaluation Access
            </div>
            <h3 className="text-xl font-black">Experience Role Authorization Instantly</h3>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Click any of the 3 real-world test personas below to simulate logging in with that official domain and watch the access controls in action.
            </p>
          </div>

          {/* Preset 1: College Admin */}
          <button
            onClick={() => quickLoginPreset("ISSUER")}
            className="w-full text-left p-5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl shadow-sm hover:shadow-md transition group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> College / University Email
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{DEMO_PRESET_USERS.ISSUER.name}</h4>
              <p className="text-xs font-mono text-slate-500">{DEMO_PRESET_USERS.ISSUER.email}</p>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
              ⚡ Grants access <strong>ONLY to the Issuer Portal (`/university`)</strong>.
            </p>
          </button>

          {/* Preset 2: Student */}
          <button
            onClick={() => quickLoginPreset("STUDENT")}
            className="w-full text-left p-5 bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl shadow-sm hover:shadow-md transition group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> Student Email
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{DEMO_PRESET_USERS.STUDENT.name}</h4>
              <p className="text-xs font-mono text-slate-500">{DEMO_PRESET_USERS.STUDENT.email}</p>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
              ⚡ Grants access <strong>ONLY to Student In-App Wallet (`/student`)</strong>.
            </p>
          </button>

          {/* Preset 3: Company Reviewer */}
          <button
            onClick={() => quickLoginPreset("RECRUITER")}
            className="w-full text-left p-5 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-sm hover:shadow-md transition group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" /> Company Recruiter Email
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{DEMO_PRESET_USERS.RECRUITER.name}</h4>
              <p className="text-xs font-mono text-slate-500">{DEMO_PRESET_USERS.RECRUITER.email}</p>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
              ⚡ Grants access <strong>ONLY to Recruiter Verifier (`/verify`)</strong>.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
