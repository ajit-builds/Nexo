"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppRole, ROLE_PORTALS, validateEmailDomain, UNREGISTERED_DOMAIN_ERROR } from "@/lib/domain-registry";

export type UserRole = AppRole | "ISSUER" | "STUDENT" | "RECRUITER";

export interface AuthUser {
  id?: string;
  email: string;
  name: string;
  role: AppRole;
  domain: string;
  organization: string;
  organizationName?: string;
  roleTitle: string;
  portalPath: string;
  avatarUrl?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  role?: AppRole;
  portalPath?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<LoginResult>;
  register: (email: string, password?: string, name?: string) => Promise<LoginResult>;
  updateUserProfile: (updates: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
  quickLoginPreset: (role: UserRole | string) => Promise<LoginResult>;
}

const AUTH_STORAGE_KEY = "nexo_auth_session_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeAppRole(role: string): AppRole {
  const lower = role.toLowerCase();
  if (lower === "issuer") return "issuer";
  if (lower === "student") return "student";
  return "reviewer";
}

function getRoleTitle(role: AppRole): string {
  switch (role) {
    case "issuer":
      return "University Issuer Admin";
    case "student":
      return "Credential Holder / Student";
    case "reviewer":
      return "Corporate Reviewer & Verifier";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore authenticated session from HTTP-only cookie via /api/auth/me
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          const rawRole = normalizeAppRole(data.user.role);
          const fullUser: AuthUser = {
            email: data.user.email,
            name: data.user.name,
            role: rawRole,
            domain: data.user.domain,
            organization: data.user.organizationName || "Nexo Network",
            organizationName: data.user.organizationName,
            roleTitle: getRoleTitle(rawRole),
            portalPath: data.user.portalPath || ROLE_PORTALS[rawRole].canonical,
          };
          setUser(fullUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fullUser));
          return fullUser;
        }
      }
      // If server says not authenticated, check fallback in localStorage
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Verify with domain registry
          const check = validateEmailDomain(parsed.email);
          if (check.valid) {
            setUser(parsed);
            return parsed;
          }
        } catch {
          // ignore
        }
      }
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    } catch (e) {
      console.warn("Session restore warning:", e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string = "Password@123"): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        return {
          success: false,
          error: data.error || "Failed to authenticate.",
        };
      }

      const role = normalizeAppRole(data.user.role);
      const loggedUser: AuthUser = {
        email: data.user.email,
        name: data.user.name,
        role,
        domain: data.user.domain,
        organization: data.user.organizationName || "Nexo Partner",
        organizationName: data.user.organizationName,
        roleTitle: getRoleTitle(role),
        portalPath: data.portalPath || ROLE_PORTALS[role].canonical,
      };

      setUser(loggedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
      setIsLoading(false);

      return {
        success: true,
        role,
        portalPath: loggedUser.portalPath,
      };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err.message || "Network error during authentication.",
      };
    }
  };

  const register = async (
    email: string,
    password: string = "Password@123",
    name?: string
  ): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        return {
          success: false,
          error: data.error || "Failed to register.",
        };
      }

      const role = normalizeAppRole(data.user.role);
      const newUser: AuthUser = {
        email: data.user.email,
        name: data.user.name,
        role,
        domain: data.user.domain,
        organization: data.user.organizationName || "Nexo Partner",
        organizationName: data.user.organizationName,
        roleTitle: getRoleTitle(role),
        portalPath: data.portalPath || ROLE_PORTALS[role].canonical,
      };

      setUser(newUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setIsLoading(false);

      return {
        success: true,
        role,
        portalPath: newUser.portalPath,
      };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err.message || "Network error during registration.",
      };
    }
  };

  const updateUserProfile = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated: AuthUser = { ...prev, ...updates };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout error:", e);
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push("/login");
  };

  const quickLoginPreset = async (roleInput: UserRole | string): Promise<LoginResult> => {
    const role = normalizeAppRole(roleInput);
    let demoEmail = "student@college.isu.ac.in";
    if (role === "issuer") demoEmail = "admin@university.edu.in";
    else if (role === "reviewer") demoEmail = "hr@company.com";

    const result = await login(demoEmail, "Password@123");
    if (result.success && result.portalPath) {
      router.push(result.portalPath);
    }
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        updateUserProfile,
        logout,
        quickLoginPreset,
      }}
    >
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
