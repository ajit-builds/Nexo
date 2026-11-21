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
  LogOut 
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#1d1d1f] flex items-center justify-center text-white shadow-sm transition group-hover:scale-105">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-[#1d1d1f]">NEXO</span>
            <span className="text-[9px] font-medium tracking-wider text-[#86868b] uppercase -mt-0.5">
              Credential Network
            </span>
          </div>
        </Link>

        {/* Role-Filtered Navigation */}
        <nav className="flex items-center gap-2">
          {!user && (
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#1d1d1f] hover:bg-[#f5f5f7] transition"
            >
              Portals
            </Link>
          )}

          {/* When logged in as COLLEGE EMAIL: ONLY Issuer Portal is displayed */}
          {user?.role === "issuer" && (
            <Link
              href="/university"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full transition ${
                pathname.startsWith("/university")
                  ? "bg-[#1d1d1f] text-white shadow-sm"
                  : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>University Issuer</span>
            </Link>
          )}

          {/* When logged in as STUDENT EMAIL: ONLY Student Wallet is displayed */}
          {user?.role === "student" && (
            <Link
              href="/student"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full transition ${
                pathname.startsWith("/student")
                  ? "bg-[#1d1d1f] text-white shadow-sm"
                  : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Wallet</span>
            </Link>
          )}

          {/* When logged in as COMPANY EMAIL: ONLY Reviewer Portal is displayed */}
          {user?.role === "reviewer" && (
            <Link
              href="/verify"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full transition ${
                pathname.startsWith("/verify")
                  ? "bg-[#1d1d1f] text-white shadow-sm"
                  : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Recruiter Verifier</span>
            </Link>
          )}

          {/* User Profile / Auth State Controls */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-black/[0.06] ml-1">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-medium text-[#1d1d1f] leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-[#86868b] truncate max-w-[130px]">
                  {user.organization}
                </span>
              </div>

              <div className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.04]">
                {user.role}
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-[#86868b] hover:text-[#ff3b30] hover:bg-[#f5f5f7] rounded-full transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1d1d1f] hover:bg-black text-white text-xs font-medium rounded-full transition shadow-sm ml-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
