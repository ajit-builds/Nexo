import crypto from 'crypto';
import { AppRole, validateEmailDomain, normalizeEmail, APPROVED_DOMAINS } from './domain-registry';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  role: AppRole;
  domain: string;
  organizationName: string;
  createdAt: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// In-memory persistent registry preloaded with approved demo accounts
const userStore = new Map<string, UserAccount>();

/**
 * Helper to seed a user account
 */
function seedUser(email: string, name: string, plainPassword: string) {
  const normEmail = normalizeEmail(email);
  const validation = validateEmailDomain(normEmail);
  if (!validation.valid) {
    throw new Error(`Cannot seed user with unapproved domain: ${normEmail}`);
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(plainPassword, salt);

  userStore.set(normEmail, {
    id: `usr_${crypto.randomUUID().slice(0, 8)}`,
    email: normEmail,
    name,
    passwordHash,
    salt,
    role: validation.role,
    domain: validation.domain,
    organizationName: validation.organizationName,
    createdAt: new Date().toISOString(),
  });
}

// Pre-seed approved user accounts for testing all three categories
seedUser('admin@university.edu.in', 'Dr. S. K. Mukherjee', 'Password@123');
seedUser('registrar@iitb.ac.in', 'Dr. K. Ramaswamy', 'Password@123');
seedUser('student@college.isu.ac.in', 'Aarav Sharma', 'Password@123');
seedUser('aarav.sharma@college.isu.ac.in', 'Aarav Sharma', 'Password@123');
seedUser('candidate@gmail.com', 'Nexo Candidate', 'Password@123');
seedUser('hr@company.com', 'Sarah Jenkins', 'Password@123');
seedUser('recruiter@company.com', 'Priya Nair', 'Password@123');
seedUser('recruiter@google.com', 'Priya Sundaram', 'Password@123');

export type AuthResult =
  | {
      success: true;
      user: {
        id: string;
        email: string;
        name: string;
        role: AppRole;
        domain: string;
        organizationName: string;
        portalPath: string;
      };
    }
  | {
      success: false;
      error: string;
      status: number;
    };

/**
 * Authenticate user credentials with strict domain and password checks
 */
export function authenticateUser(email: string, plainPassword: string): AuthResult {
  const normEmail = normalizeEmail(email);

  // 1. Validate email domain against approved registry
  const domainValidation = validateEmailDomain(normEmail);
  if (!domainValidation.valid) {
    return {
      success: false,
      error: domainValidation.error,
      status: 403,
    };
  }

  // 2. Lookup user in store
  const existing = userStore.get(normEmail);
  if (!existing) {
    // If not found in seed, but domain IS approved, check if demo password matches for instant onboarding
    if (plainPassword === 'Password@123' || plainPassword.length >= 6) {
      // Auto-register valid approved domain user
      const name = normEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const salt = generateSalt();
      const passwordHash = hashPassword(plainPassword, salt);

      const newUser: UserAccount = {
        id: `usr_${crypto.randomUUID().slice(0, 8)}`,
        email: normEmail,
        name,
        passwordHash,
        salt,
        role: domainValidation.role,
        domain: domainValidation.domain,
        organizationName: domainValidation.organizationName,
        createdAt: new Date().toISOString(),
      };
      userStore.set(normEmail, newUser);

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          domain: newUser.domain,
          organizationName: newUser.organizationName,
          portalPath: domainValidation.portalPath,
        },
      };
    }

    return {
      success: false,
      error: 'Invalid email or password. Please check your credentials.',
      status: 401,
    };
  }

  // 3. Verify password
  const testHash = hashPassword(plainPassword, existing.salt);
  if (testHash !== existing.passwordHash) {
    return {
      success: false,
      error: 'Invalid email or password. Please check your credentials.',
      status: 401,
    };
  }

  // 4. Verify user's assigned role matches their domain configuration
  if (existing.role !== domainValidation.role) {
    return {
      success: false,
      error: 'Account role mismatch with registered email domain.',
      status: 403,
    };
  }

  return {
    success: true,
    user: {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      role: existing.role,
      domain: existing.domain,
      organizationName: existing.organizationName,
      portalPath: domainValidation.portalPath,
    },
  };
}

/**
 * Register a new user with strict approved domain enforcement
 */
export function registerUser(email: string, plainPassword: string, name?: string): AuthResult {
  const normEmail = normalizeEmail(email);

  // 1. Validate email domain
  const domainValidation = validateEmailDomain(normEmail);
  if (!domainValidation.valid) {
    return {
      success: false,
      error: domainValidation.error,
      status: 403,
    };
  }

  // 2. Validate password strength
  if (!plainPassword || plainPassword.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters long.',
      status: 400,
    };
  }

  // 3. Check if already exists
  if (userStore.has(normEmail)) {
    return authenticateUser(normEmail, plainPassword);
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(plainPassword, salt);
  const displayName = name || normEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const newUser: UserAccount = {
    id: `usr_${crypto.randomUUID().slice(0, 8)}`,
    email: normEmail,
    name: displayName,
    passwordHash,
    salt,
    role: domainValidation.role,
    domain: domainValidation.domain,
    organizationName: domainValidation.organizationName,
    createdAt: new Date().toISOString(),
  };

  userStore.set(normEmail, newUser);

  return {
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      domain: newUser.domain,
      organizationName: newUser.organizationName,
      portalPath: domainValidation.portalPath,
    },
  };
}
