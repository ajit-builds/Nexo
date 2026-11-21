export type UserRole = "ISSUER" | "STUDENT" | "RECRUITER";

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  organization: string;
  roleTitle: string;
  avatarUrl?: string;
}

export interface RoleDetection {
  role: UserRole;
  roleTitle: string;
  defaultOrganization: string;
  targetPath: string;
  reason: string;
  icon: string;
}

/**
 * Intelligent role detection based on email domain and format:
 * - College / University emails (.edu, .ac.in, .edu.in, registrar, univ, college, admin) -> ISSUER
 * - Student emails (student.*, alumni.*, roll/std, or student domains) -> STUDENT
 * - Company / Recruiter emails (corporate domains, google, tcs, infosys, .corp, hr, recruiter) -> RECRUITER
 */
export function detectRoleFromEmail(email: string): RoleDetection {
  const lower = email.trim().toLowerCase();
  const parts = lower.split("@");
  if (parts.length < 2) {
    return {
      role: "STUDENT",
      roleTitle: "Student / Alumni",
      defaultOrganization: "Registered Student",
      targetPath: "/student",
      reason: "Default account type",
      icon: "🎓"
    };
  }

  const username = parts[0];
  const domain = parts[1];

  // 1. Explicit Student Check
  if (
    username.includes("student") ||
    domain.includes("student") ||
    domain.includes("alumni") ||
    username.match(/^[0-9]{4,}/) || // Roll number e.g. 2024101@...
    domain.startsWith("std.") ||
    domain.startsWith("mail.")
  ) {
    const org = domain.split(".")[1]?.toUpperCase() || "University Student";
    return {
      role: "STUDENT",
      roleTitle: "Student / Holder",
      defaultOrganization: org.includes("AC") || org.includes("EDU") ? "University Scholar" : org,
      targetPath: "/student",
      reason: `Detected Student Email address (@${domain})`,
      icon: "🎓"
    };
  }

  // 2. College / University Check (.edu, .ac.in, .edu.in, or university keywords)
  if (
    domain.endsWith(".edu") ||
    domain.endsWith(".ac.in") ||
    domain.endsWith(".edu.in") ||
    domain.endsWith(".org.in") ||
    domain.includes("college") ||
    domain.includes("university") ||
    domain.includes("iit") ||
    domain.includes("bits") ||
    domain.includes("nit") ||
    username.includes("registrar") ||
    username.includes("examcell") ||
    username.includes("dean") ||
    username.includes("admin")
  ) {
    const collegeName = domain.split(".")[0].toUpperCase();
    return {
      role: "ISSUER",
      roleTitle: "College / University Admin",
      defaultOrganization: collegeName.length > 2 ? `${collegeName} Administration` : "Accredited University",
      targetPath: "/university",
      reason: `Detected Institutional/College Domain (@${domain})`,
      icon: "🏛️"
    };
  }

  // 3. Company / Recruiter Check (Corporate domains)
  if (
    domain.endsWith(".com") ||
    domain.endsWith(".corp") ||
    domain.endsWith(".io") ||
    domain.endsWith(".tech") ||
    domain.endsWith(".co") ||
    username.includes("recruiter") ||
    username.includes("hr") ||
    username.includes("talent") ||
    username.includes("hiring")
  ) {
    const company = domain.split(".")[0];
    const companyName = company.charAt(0).toUpperCase() + company.slice(1);
    return {
      role: "RECRUITER",
      roleTitle: "Corporate Reviewer / Verifier",
      defaultOrganization: `${companyName} Talent Acquisition`,
      targetPath: "/verify",
      reason: `Detected Corporate Company Domain (@${domain})`,
      icon: "🔍"
    };
  }

  // Fallback
  return {
    role: "RECRUITER",
    roleTitle: "Reviewer / Recruiter",
    defaultOrganization: "Verification Desk",
    targetPath: "/verify",
    reason: "Standard corporate verification email",
    icon: "🔍"
  };
}

export const DEMO_PRESET_USERS: Record<UserRole, AuthUser> = {
  ISSUER: {
    email: "registrar@iitb.ac.in",
    name: "Dr. K. Ramaswamy",
    role: "ISSUER",
    organization: "IIT Bombay (Registrar Office)",
    roleTitle: "University Exam Controller"
  },
  STUDENT: {
    email: "aarav.sharma@student.iitb.ac.in",
    name: "Aarav Sharma",
    role: "STUDENT",
    organization: "IIT Bombay (B.Tech CS 2024)",
    roleTitle: "Graduating Scholar"
  },
  RECRUITER: {
    email: "priya.hr@google.com",
    name: "Priya Sundaram",
    role: "RECRUITER",
    organization: "Google India (Talent Operations)",
    roleTitle: "Senior Background Reviewer"
  }
};
