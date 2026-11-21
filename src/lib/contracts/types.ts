export enum IssuerCategory {
  University = 0,
  Employer = 1,
  CertificationBody = 2,
}

export interface IssuerInfo {
  address: string;
  name: string;
  registrationNumber: string;
  category: IssuerCategory;
  isActive: boolean;
  publicSigningAddress: string;
  registeredAt: number;
}

export interface BatchAnchorRecord {
  batchId: string;
  merkleRoot: string;
  issuer: string;
  ipfsMetadataUri: string;
  totalCredentials: number;
  timestamp: number;
}

export interface RevocationStatus {
  isRevoked: boolean;
  revokedBy: string;
  reason: string;
  revokedAt: number;
}

export interface AnchorBatchResult {
  batchId: string;
  txHash: string;
  blockNumber: number;
}

export interface RevokeCredentialResult {
  txHash: string;
  timestamp: number;
}

export interface ContractAddresses {
  trustRegistry: string;
  credentialAnchor: string;
  revocationRegistry: string;
}
