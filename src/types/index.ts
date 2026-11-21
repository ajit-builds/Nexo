export interface StudentRecord {
  id: string;
  studentId: string;
  fullName: string;
  degree: string;
  major: string;
  graduationYear: number;
  cgpa: number;
  cgpaAbove8: boolean;
  institutionName: string;
  issueDate: string;
  email?: string;
}

export interface ExperienceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  companyName: string;
  designation: string;
  department: string;
  startDate: string;
  endDate: string;
  experienceYears: number;
  conductRating: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface MerkleLeafData {
  credentialId: string;
  studentId: string;
  fullNameHash: string;
  degree: string;
  major: string;
  graduationYear: number;
  cgpaHash: string;
  cgpaAbove8: boolean;
  issueDate: string;
}

export interface SDJWTCredential {
  credentialId: string;
  issuer: {
    name: string;
    address: string;
    category: 'University' | 'Employer';
  };
  issuanceDate: string;
  expirationDate?: string;
  merkleRoot: string;
  merkleProof: string[];
  batchId: string;
  txHash?: string;
  // Disclosed claims by default (plain)
  disclosedClaims: {
    institutionName: string;
    degree: string;
    major: string;
    graduationYear: number;
    cgpa_above_8: boolean;
  };
  // Salted private disclosures
  disclosures: {
    salt: string;
    key: string;
    value: string | number;
    digest: string;
  }[];
  // Encoded token
  encodedToken: string;
  signature: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export interface BatchRecord {
  batchId: string;
  merkleRoot: string;
  issuerAddress: string;
  issuerName: string;
  credentialType: 'Degree' | 'ExperienceLetter';
  totalCredentials: number;
  timestamp: number;
  txHash: string;
  ipfsUri: string;
  credentials: SDJWTCredential[];
}

export interface RevocationRecord {
  credentialHash: string;
  credentialId: string;
  studentName: string;
  degree: string;
  revokedBy: string;
  reason: string;
  timestamp: number;
  txHash: string;
}
