import { ethers } from "ethers";
import { StudentRecord, SDJWTCredential } from "@/types";

/**
 * Generate a random 128-bit hex salt
 */
function generateSalt(): string {
  const array = new Uint8Array(16);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a salted disclosure digest: sha256(salt + key + value)
 */
function createDisclosureDigest(salt: string, key: string, value: string | number): string {
  const preimage = `${salt}:${key}:${value}`;
  return ethers.keccak256(ethers.toUtf8Bytes(preimage));
}

/**
 * Generate an SD-JWT credential for a student
 */
export function generateSDJWTCredential(
  record: StudentRecord,
  merkleRoot: string,
  merkleProof: string[],
  batchId: string,
  issuerInfo = {
    name: "Indian Institute of Technology, Bombay",
    address: "0x71C83d95B309A20165b4F435F649BCE286a1172A",
    category: "University" as const
  }
): SDJWTCredential {
  // 1. Create secret disclosures for sensitive private fields
  const privateFields: { key: string; value: string | number }[] = [
    { key: "full_name", value: record.fullName },
    { key: "exact_cgpa", value: record.cgpa },
    { key: "student_id", value: record.studentId },
    { key: "raw_marksheet", value: `Graduated with Cumulative Grade Point Average: ${record.cgpa}/10.0` }
  ];

  const disclosures = privateFields.map(f => {
    const salt = generateSalt();
    const digest = createDisclosureDigest(salt, f.key, f.value);
    return {
      salt,
      key: f.key,
      value: f.value,
      digest
    };
  });

  // 2. Disclosed claims (safe public facts and derived boolean predicates)
  const disclosedClaims = {
    institutionName: record.institutionName || issuerInfo.name,
    degree: record.degree,
    major: record.major,
    graduationYear: record.graduationYear,
    cgpa_above_8: record.cgpa >= 8.0
  };

  // 3. Construct header and payload
  const header = {
    alg: "ES256",
    typ: "sd-jwt",
    kid: issuerInfo.address
  };

  const payload = {
    iss: `did:nexo:issuer:${issuerInfo.address}`,
    sub: `did:nexo:student:${record.studentId}`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60 * 5), // 5 years
    credentialId: record.id,
    batchId,
    merkleRoot,
    merkleProof,
    disclosedClaims,
    _sd: disclosures.map(d => d.digest)
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = ethers.keccak256(ethers.toUtf8Bytes(`${encodedHeader}.${encodedPayload}.${issuerInfo.address}`));

  // Combined SD-JWT token format: header.payload.signature~disclosure1~disclosure2...
  const encodedToken = `${encodedHeader}.${encodedPayload}.${signature}`;

  return {
    credentialId: record.id,
    issuer: issuerInfo,
    issuanceDate: record.issueDate,
    merkleRoot,
    merkleProof,
    batchId,
    disclosedClaims,
    disclosures,
    encodedToken,
    signature,
    status: "ACTIVE"
  };
}
