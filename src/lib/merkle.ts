import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { ethers } from "ethers";
import { StudentRecord, MerkleLeafData } from "@/types";

/**
 * Hash sensitive string with SHA-256 for Merkle leaf commitment
 */
export function hashData(val: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(val));
}

/**
 * Convert student record to standardized Merkle tree leaf values
 */
export function recordToLeafValues(record: StudentRecord): [
  string, // credentialId
  string, // studentId
  string, // fullNameHash
  string, // degree
  string, // major
  bigint, // graduationYear
  string, // cgpaHash
  boolean,// cgpaAbove8
  string  // issueDate
] {
  return [
    record.id,
    record.studentId,
    hashData(record.fullName),
    record.degree,
    record.major,
    BigInt(record.graduationYear),
    hashData(record.cgpa.toFixed(2)),
    record.cgpaAbove8,
    record.issueDate
  ];
}

/**
 * Leaf types schema for @openzeppelin/merkle-tree
 */
export const MERKLE_LEAF_TYPES = [
  "string",  // credentialId
  "string",  // studentId
  "bytes32", // fullNameHash
  "string",  // degree
  "string",  // major
  "uint256", // graduationYear
  "bytes32", // cgpaHash
  "bool",    // cgpaAbove8
  "string"   // issueDate
];

/**
 * Build StandardMerkleTree from student records
 */
export function buildMerkleTree(records: StudentRecord[]) {
  const leaves = records.map(recordToLeafValues);
  const tree = StandardMerkleTree.of(leaves, MERKLE_LEAF_TYPES);
  return tree;
}

/**
 * Get individual Merkle proofs for all records in the tree
 */
export function getProofsForRecords(tree: any, records: StudentRecord[]): string[][] {
  const proofs: string[][] = [];
  for (let i = 0; i < records.length; i++) {
    proofs.push(tree.getProof(i));
  }
  return proofs;
}

/**
 * Verify an individual leaf proof against the batch root
 */
export function verifyMerkleProof(
  root: string,
  record: StudentRecord,
  proof: string[]
): boolean {
  try {
    const leafValues = recordToLeafValues(record);
    return StandardMerkleTree.verify(root, MERKLE_LEAF_TYPES, leafValues, proof);
  } catch (err) {
    console.error("Merkle verification error:", err);
    return false;
  }
}
