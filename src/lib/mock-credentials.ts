import { NexoCredential } from './types';
import { ethers } from 'ethers';

// Compute deterministic mock Merkle root and proof for demo
const MOCK_BATCH_ID_IITB = '0x' + ethers.keccak256(ethers.toUtf8Bytes('BATCH-IITB-2024-BTECH-CSE')).slice(2, 66);
const MOCK_MERKLE_ROOT_IITB = '0x8f4c82b6e1a90c4d8e72f9104b2819c9e830b7e419b48c6a2d103b417e29b104';

const MOCK_BATCH_ID_TCS = '0x' + ethers.keccak256(ethers.toUtf8Bytes('BATCH-TCS-2024-EXP-LETTERS')).slice(2, 66);
const MOCK_MERKLE_ROOT_TCS = '0x5a1b3c9d7e8f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b';

export const INITIAL_MOCK_CREDENTIALS: NexoCredential[] = [
  {
    id: 'cred-iitb-2024-001',
    type: 'academic',
    title: 'Bachelor of Technology in Computer Science',
    issuerName: 'Indian Institute of Technology Bombay (IIT Bombay)',
    issuerAddress: '0x1234567890123456789012345678901234567890',
    issuerCategory: 'University',
    issuedAt: '2024-06-15',
    batchId: MOCK_BATCH_ID_IITB,
    merkleRoot: MOCK_MERKLE_ROOT_IITB,
    merkleProof: [
      '0x3d94b15091a0c41d7e2e8f192b47c0a9b31d8e47a9f02c6b4d1a8e3f9a7b5c1d',
      '0x7c2b4d9e1a8f3c5b0d6e9f2a4b8c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c',
      '0x1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b'
    ],
    credentialHash: ethers.keccak256(ethers.toUtf8Bytes('IITB-2024-001:Aarav Sharma:BTech:CSE:8.85')),
    claims: {
      student_id: 'IITB-2024-001',
      full_name: 'Aarav Sharma',
      degree: 'Bachelor of Technology',
      major: 'Computer Science and Engineering',
      graduation_year: 2024,
      cgpa: 8.85,
      cgpa_above_8: true, // Derived claim for selective disclosure
      institution_name: 'IIT Bombay',
      issue_date: '2024-06-15'
    },
    isRevoked: false,
    status: 'valid'
  },
  {
    id: 'cred-tcs-2024-1092',
    type: 'experience',
    title: 'Relieving & Experience Certificate',
    issuerName: 'Tata Consultancy Services Limited (TCS)',
    issuerAddress: '0x9876543210987654321098765432109876543210',
    issuerCategory: 'Employer',
    issuedAt: '2024-05-02',
    batchId: MOCK_BATCH_ID_TCS,
    merkleRoot: MOCK_MERKLE_ROOT_TCS,
    merkleProof: [
      '0x2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c',
      '0x8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f'
    ],
    credentialHash: ethers.keccak256(ethers.toUtf8Bytes('EMP-TCS-1092:Aarav Sharma:Senior Systems Engineer')),
    claims: {
      employee_id: 'EMP-TCS-1092',
      employee_name: 'Aarav Sharma',
      company_name: 'Tata Consultancy Services',
      designation: 'Senior Systems Engineer',
      department: 'Cloud & Infrastructure Solutions',
      start_date: '2021-08-01',
      end_date: '2024-04-30',
      experience_years: 2.75,
      conduct_rating: 'Exemplary'
    },
    isRevoked: false,
    status: 'valid'
  }
];

const CREDENTIALS_KEY = 'nexo_student_credentials';

export function getStudentCredentials(): NexoCredential[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_CREDENTIALS;
  const stored = localStorage.getItem(CREDENTIALS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback to initial
    }
  }
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(INITIAL_MOCK_CREDENTIALS));
  return INITIAL_MOCK_CREDENTIALS;
}

export function saveStudentCredentials(creds: NexoCredential[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
  }
}
