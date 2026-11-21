/**
 * Centralized Approved Email Domain Registry
 *
 * Strict mapping:
 * - Approved university domains -> 'issuer' (Issuer Portal: /university)
 * - college.isu.ac.in -> 'student' (Student Wallet: /student)
 * - Approved company domains -> 'reviewer' (Reviewer Portal: /verify)
 */

export type AppRole = 'issuer' | 'student' | 'reviewer';

export interface DomainConfig {
  domain: string;
  role: AppRole;
  roleLabel: string;
  organizationName: string;
  portalPath: string; // The canonical route for this role
  aliasPaths: string[];
}

// Canonical route definitions
export const ROLE_PORTALS: Record<AppRole, { canonical: string; aliases: string[]; label: string }> = {
  issuer: {
    canonical: '/university',
    aliases: ['/issuer', '/university'],
    label: 'University Issuer Portal',
  },
  student: {
    canonical: '/student',
    aliases: ['/student-wallet', '/student'],
    label: 'Student In-App Wallet',
  },
  reviewer: {
    canonical: '/verify',
    aliases: ['/reviewer', '/verify'],
    label: 'Company Reviewer Portal',
  },
};

export const UNREGISTERED_DOMAIN_ERROR =
  'Access denied. Your email domain is not authorized to access this platform. Please contact your university or organization administrator.';

/**
 * Approved Email Domains
 * Exact match only. No wildcard substring matching or username checking.
 */
export const APPROVED_DOMAINS: Record<string, DomainConfig> = {
  // 1. Student Domain (Designated domain: college.isu.ac.in)
  'college.isu.ac.in': {
    domain: 'college.isu.ac.in',
    role: 'student',
    roleLabel: 'Student (Credential Holder)',
    organizationName: 'ISU College of Engineering',
    portalPath: '/student',
    aliasPaths: ['/student-wallet'],
  },

  // 2. University Domains (Approved Issuers)
  'university.edu.in': {
    domain: 'university.edu.in',
    role: 'issuer',
    roleLabel: 'University (Issuer)',
    organizationName: 'National University System',
    portalPath: '/university',
    aliasPaths: ['/issuer'],
  },
  'isu.ac.in': {
    domain: 'isu.ac.in',
    role: 'issuer',
    roleLabel: 'University (Issuer)',
    organizationName: 'Indian State University',
    portalPath: '/university',
    aliasPaths: ['/issuer'],
  },
  'iitb.ac.in': {
    domain: 'iitb.ac.in',
    role: 'issuer',
    roleLabel: 'University (Issuer)',
    organizationName: 'IIT Bombay',
    portalPath: '/university',
    aliasPaths: ['/issuer'],
  },
  'bits-pilani.ac.in': {
    domain: 'bits-pilani.ac.in',
    role: 'issuer',
    roleLabel: 'University (Issuer)',
    organizationName: 'BITS Pilani',
    portalPath: '/university',
    aliasPaths: ['/issuer'],
  },
  'du.ac.in': {
    domain: 'du.ac.in',
    role: 'issuer',
    roleLabel: 'University (Issuer)',
    organizationName: 'Delhi University',
    portalPath: '/university',
    aliasPaths: ['/issuer'],
  },
  'annauniv.edu': {
    domain: 'annauniv.edu',
    role: 'issuer',
    roleLabel: 'University (Issuer)',
    organizationName: 'Anna University',
    portalPath: '/university',
    aliasPaths: ['/issuer'],
  },

  // 3. Company Domains (Approved Reviewers)
  'company.com': {
    domain: 'company.com',
    role: 'reviewer',
    roleLabel: 'Company (Reviewer)',
    organizationName: 'Global Enterprise Corp',
    portalPath: '/verify',
    aliasPaths: ['/reviewer'],
  },
  'google.com': {
    domain: 'google.com',
    role: 'reviewer',
    roleLabel: 'Company (Reviewer)',
    organizationName: 'Google India',
    portalPath: '/verify',
    aliasPaths: ['/reviewer'],
  },
  'tcs.com': {
    domain: 'tcs.com',
    role: 'reviewer',
    roleLabel: 'Company (Reviewer)',
    organizationName: 'Tata Consultancy Services',
    portalPath: '/verify',
    aliasPaths: ['/reviewer'],
  },
  'infosys.com': {
    domain: 'infosys.com',
    role: 'reviewer',
    roleLabel: 'Company (Reviewer)',
    organizationName: 'Infosys Limited',
    portalPath: '/verify',
    aliasPaths: ['/reviewer'],
  },
  'wipro.com': {
    domain: 'wipro.com',
    role: 'reviewer',
    roleLabel: 'Company (Reviewer)',
    organizationName: 'Wipro Technologies',
    portalPath: '/verify',
    aliasPaths: ['/reviewer'],
  },
  'techmahindra.com': {
    domain: 'techmahindra.com',
    role: 'reviewer',
    roleLabel: 'Company (Reviewer)',
    organizationName: 'Tech Mahindra',
    portalPath: '/verify',
    aliasPaths: ['/reviewer'],
  },
  'microsoft.com': {
    domain: 'microsoft.com',
    role: 'reviewer',
    roleLabel: 'Company (Reviewer)',
    organizationName: 'Microsoft Corporation',
    portalPath: '/verify',
    aliasPaths: ['/reviewer'],
  },
};

/**
 * Normalize email: lowercase, trim whitespace
 */
export function normalizeEmail(email: string): string {
  return email ? email.trim().toLowerCase() : '';
}

/**
 * Validate RFC 5322 standard email format
 */
export function isValidEmailFormat(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) return false;
  // Standard strict email regex
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(normalized);
}

/**
 * Extract complete domain strictly from the email address.
 * Never uses usernames or email prefixes.
 */
export function extractDomain(email: string): string | null {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex === -1 || atIndex === 0 || atIndex === normalized.length - 1) {
    return null;
  }
  const domain = normalized.slice(atIndex + 1);
  if (!domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return null;
  }
  return domain;
}

export type DomainValidationResult =
  | {
      valid: true;
      domain: string;
      config: DomainConfig;
      role: AppRole;
      portalPath: string;
      roleLabel: string;
      organizationName: string;
    }
  | {
      valid: false;
      domain: string | null;
      error: string;
    };

/**
 * Strictly validate the email domain against the approved registry.
 * Exact match only. Unregistered domains are rejected.
 */
export function validateEmailDomain(email: string): DomainValidationResult {
  if (!isValidEmailFormat(email)) {
    return {
      valid: false,
      domain: null,
      error: 'Invalid email address format. Please enter a valid email.',
    };
  }

  const domain = extractDomain(email);
  if (!domain) {
    return {
      valid: false,
      domain: null,
      error: 'Unable to extract a valid domain from email.',
    };
  }

  // Exact complete domain match from centralized registry
  const config = APPROVED_DOMAINS[domain];
  if (!config) {
    return {
      valid: false,
      domain,
      error: UNREGISTERED_DOMAIN_ERROR,
    };
  }

  return {
    valid: true,
    domain,
    config,
    role: config.role,
    portalPath: config.portalPath,
    roleLabel: config.roleLabel,
    organizationName: config.organizationName,
  };
}

export function getRoleForDomain(domain: string): AppRole | null {
  const normDomain = domain.toLowerCase().trim();
  const config = APPROVED_DOMAINS[normDomain];
  return config ? config.role : null;
}

/**
 * Check whether a role is authorized to access a given URL path.
 */
export function isRouteAuthorizedForRole(pathname: string, role: AppRole): boolean {
  const normalized = pathname.toLowerCase();

  // University Issuer Routes
  const isIssuerRoute =
    normalized.startsWith('/university') ||
    normalized.startsWith('/issuer') ||
    normalized.startsWith('/api/issuer');

  // Student Wallet Routes
  const isStudentRoute =
    normalized.startsWith('/student') ||
    normalized.startsWith('/student-wallet') ||
    normalized.startsWith('/api/student');

  // Reviewer Routes
  const isReviewerRoute =
    normalized.startsWith('/verify') ||
    normalized.startsWith('/reviewer') ||
    normalized.startsWith('/api/reviewer');

  if (isIssuerRoute) return role === 'issuer';
  if (isStudentRoute) return role === 'student';
  if (isReviewerRoute) return role === 'reviewer';

  // Public routes (home, login, unauthorized, public assets, verify presentation resolver)
  return true;
}
