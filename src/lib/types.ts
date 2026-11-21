export type CredentialType = 'academic' | 'experience';

export interface AcademicClaims {
  student_id: string;
  full_name: string;
  degree: string;
  major: string;
  graduation_year: number | string;
  cgpa: string | number;
  cgpa_above_8: boolean;
  institution_name: string;
  issue_date: string;
  [key: string]: any;
}

export interface ExperienceClaims {
  employee_id: string;
  employee_name: string;
  company_name: string;
  designation: string;
  department: string;
  start_date: string;
  end_date: string;
  experience_years: string | number;
  conduct_rating: string;
  [key: string]: any;
}

export interface NexoCredential {
  id: string;
  type: CredentialType;
  title: string;
  issuerName: string;
  issuerAddress: string;
  issuerCategory: 'University' | 'Employer';
  issuedAt: string;
  batchId: string;
  merkleProof: string[];
  merkleRoot: string;
  credentialHash: string;
  claims: AcademicClaims | ExperienceClaims;
  isRevoked: boolean;
  status: 'valid' | 'revoked' | 'expired';
}

export interface StoredStudentWallet {
  address: string;
  encryptedPrivateKey: string;
  salt: string;
  createdAt: string;
  isPinProtected: boolean;
}

export interface SelectiveDisclosureClaim {
  key: string;
  label: string;
  value: string | number | boolean;
  disclosed: boolean;
  isPredicate?: boolean; // e.g. "cgpa_above_8"
  description?: string;
}

export interface VerificationPresentationPayload {
  version: '1.0';
  presentationId: string;
  credentialId: string;
  credentialType: CredentialType;
  issuerName: string;
  issuerAddress: string;
  batchId: string;
  merkleProof: string[];
  merkleRoot: string;
  credentialHash: string;
  disclosedClaims: Record<string, any>;
  redactedKeys: string[];
  holderAddress: string;
  holderSignature?: string;
  purpose: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
}

export interface ConsentLogEntry {
  id: string;
  recipient: string;
  purpose: string;
  credentialTitle: string;
  disclosedClaims: string[];
  redactedClaims: string[];
  timestamp: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
}
