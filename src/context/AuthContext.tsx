"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthUser, UserRole, detectRoleFromEmail, DEMO_PRESET_USERS } from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password?: string, roleOverride?: UserRole) => UserRole;
  register: (email: string, name: string, role: UserRole, organization?: string) => void;
  updateUserProfile: (updates: Partial<AuthUser>) => void;
  logout: () => void;
  quickLoginPreset: (role: UserRole) => void;
}

const AUTH_STORAGE_KEY = "nexo_auth_session_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not load auth state:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (email: string, _password?: string, roleOverride?: UserRole): UserRole => {
    const detection = detectRoleFromEmail(email);
    const finalRole = roleOverride || detection.role;

    const loggedUser: AuthUser = {
      email,
      name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      role: finalRole,
      organization: detection.defaultOrganization,
      roleTitle: detection.roleTitle
    };

    setUser(loggedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
    return finalRole;
  };

  const register = (email: string, name: string, role: UserRole, organization?: string) => {
    const detection = detectRoleFromEmail(email);
    const newUser: AuthUser = {
      email,
      name: name || email.split("@")[0],
      role,
      organization: organization || detection.defaultOrganization,
      roleTitle: detection.roleTitle
    };

    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
  };

  const updateUserProfile = (updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated: AuthUser = { ...prev, ...updates };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push("/login");
  };

  const quickLoginPreset = (role: UserRole) => {
    const preset = DEMO_PRESET_USERS[role];
    setUser(preset);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(preset));

    if (role === "ISSUER") router.push("/university");
    else if (role === "STUDENT") router.push("/student");
    else router.push("/verify");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, updateUserProfile, logout, quickLoginPreset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
