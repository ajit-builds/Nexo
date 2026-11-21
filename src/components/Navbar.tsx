"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  ShieldCheck, 
  GraduationCap, 
  Building2, 
  QrCode, 
  LogIn, 
  LogOut, 
  UserCircle2, 
  ChevronDown 
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900">NEXO</span>
            <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase block -mt-1">
              Credential Network
            </span>
          </div>
        </Link>

        {/* Role-Filtered Navigation */}
        <nav className="flex items-center gap-2">
          {/* If Logged Out: Show all three with subtle cues */}
          {!user && (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
              >
                <span>Browse Portals</span>
              </Link>
            </div>
          )}

          {/* When logged in as COLLEGE EMAIL: ONLY Issuer Portal is displayed */}
          {user?.role === "ISSUER" && (
            <Link
              href="/university"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                pathname.startsWith("/university")
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>🏛️ University Issuer Portal</span>
            </Link>
          )}

          {/* When logged in as STUDENT EMAIL: ONLY Student Wallet is displayed */}
          {user?.role === "STUDENT" && (
            <Link
              href="/student"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                pathname.startsWith("/student")
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>🎓 Student In-App Wallet</span>
            </Link>
          )}

          {/* When logged in as COMPANY EMAIL: ONLY Reviewer Portal is displayed */}
          {user?.role === "RECRUITER" && (
            <Link
              href="/verify"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                pathname.startsWith("/verify")
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>🔍 Recruiter Verifier</span>
            </Link>
          )}

          {/* User Profile / Auth State Controls */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-1">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 leading-tight flex items-center justify-end gap-1">
                  <span>{user.name}</span>
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                  {user.organization}
                </span>
              </div>

              <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                user.role === "ISSUER"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : user.role === "STUDENT"
                  ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}>
                {user.role}
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm ml-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
