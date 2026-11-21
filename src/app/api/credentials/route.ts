import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { ethers } from 'ethers';
import { NexoCredential } from '@/lib/types';

// In-memory cache for dynamic additions
let additionalCredentials: NexoCredential[] = [];

function loadCsvData<T>(fileName: string): T[] {
  try {
    const filePath = path.join(process.cwd(), 'data', fileName);
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = Papa.parse<T>(content, { header: true, skipEmptyLines: true });
    return parsed.data;
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || 'IITB-2024-001';
  const typeFilter = searchParams.get('type'); // 'academic' | 'experience' | null

  // 1. Load Academic Credentials from CSV
  const studentRows = loadCsvData<any>('sample_students_batch.csv');
  const experienceRows = loadCsvData<any>('sample_experience_letters.csv');

  // Merkle Batch Root computation for Academic Batch
  const academicLeaves = studentRows.map((row) =>
    ethers.keccak256(
      ethers.toUtf8Bytes(
        `${row.student_id}:${row.full_name}:${row.degree}:${row.major}:${row.cgpa}`
      )
    )
  );

  const academicBatchId = '0x' + ethers.keccak256(ethers.toUtf8Bytes('BATCH-IITB-2024-BTECH-CSE')).slice(2, 66);
  // Merkle root approximation from leaf hashes
  const academicMerkleRoot = academicLeaves.length > 0
    ? ethers.keccak256(ethers.concat(academicLeaves.slice(0, 4)))
    : ethers.ZeroHash;

  const academicCredentials: NexoCredential[] = studentRows.map((row, index) => {
    const credHash = academicLeaves[index] || ethers.keccak256(ethers.toUtf8Bytes(row.student_id));
    return {
      id: `cred-${row.student_id?.toLowerCase() || 'academic-' + index}`,
      type: 'academic',
      title: `${row.degree} in ${row.major}`,
      issuerName: row.institution_name || 'IIT Bombay',
      issuerAddress: '0x1234567890123456789012345678901234567890',
      issuerCategory: 'University',
      issuedAt: row.issue_date || '2024-06-15',
      batchId: academicBatchId,
      merkleRoot: academicMerkleRoot,
      merkleProof: [
        ethers.keccak256(ethers.toUtf8Bytes(`proof-step-1-${index}`)),
        ethers.keccak256(ethers.toUtf8Bytes(`proof-step-2-${index}`)),
      ],
      credentialHash: credHash,
      claims: {
        student_id: row.student_id,
        full_name: row.full_name,
        degree: row.degree,
        major: row.major,
        graduation_year: Number(row.graduation_year) || 2024,
        cgpa: parseFloat(row.cgpa) || 0,
        cgpa_above_8: String(row.cgpa_above_8).toLowerCase() === 'true',
        institution_name: row.institution_name,
        issue_date: row.issue_date,
      },
      isRevoked: false,
      status: 'valid',
    };
  });

  // 2. Load Experience Credentials from CSV
  const expBatchId = '0x' + ethers.keccak256(ethers.toUtf8Bytes('BATCH-TCS-2024-EXP-LETTERS')).slice(2, 66);
  const expLeaves = experienceRows.map((row) =>
    ethers.keccak256(
      ethers.toUtf8Bytes(`${row.employee_id}:${row.employee_name}:${row.company_name}:${row.designation}`)
    )
  );
  const expMerkleRoot = expLeaves.length > 0
    ? ethers.keccak256(ethers.concat(expLeaves.slice(0, 3)))
    : ethers.ZeroHash;

  const experienceCredentials: NexoCredential[] = experienceRows.map((row, index) => {
    const credHash = expLeaves[index] || ethers.keccak256(ethers.toUtf8Bytes(row.employee_id));
    return {
      id: `cred-${row.employee_id?.toLowerCase() || 'exp-' + index}`,
      type: 'experience',
      title: `Experience & Relieving Certificate - ${row.designation}`,
      issuerName: row.company_name,
      issuerAddress: '0x9876543210987654321098765432109876543210',
      issuerCategory: 'Employer',
      issuedAt: row.end_date || '2024-04-30',
      batchId: expBatchId,
      merkleRoot: expMerkleRoot,
      merkleProof: [
        ethers.keccak256(ethers.toUtf8Bytes(`exp-proof-1-${index}`)),
        ethers.keccak256(ethers.toUtf8Bytes(`exp-proof-2-${index}`)),
      ],
      credentialHash: credHash,
      claims: {
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        company_name: row.company_name,
        designation: row.designation,
        department: row.department,
        start_date: row.start_date,
        end_date: row.end_date,
        experience_years: parseFloat(row.experience_years) || 1,
        conduct_rating: row.conduct_rating,
      },
      isRevoked: false,
      status: 'valid',
    };
  });

  // Filter for requested student / employee profile
  // If studentId matches or search is broad
  const matchingAcademic = academicCredentials.find((c) => c.claims.student_id === studentId) || academicCredentials[0];

  // Pick first experience letter for portfolio demo
  const sampleExperience = experienceCredentials[0];

  let results: NexoCredential[] = [];
  if (matchingAcademic) results.push(matchingAcademic);
  if (sampleExperience) results.push(sampleExperience);

  // Append any dynamically added credentials
  results = [...results, ...additionalCredentials];

  if (typeFilter) {
    results = results.filter((r) => r.type === typeFilter);
  }

  return NextResponse.json({
    success: true,
    total: results.length,
    activeStudentId: studentId,
    availableStudents: academicCredentials.map((c) => ({
      studentId: c.claims.student_id,
      name: c.claims.full_name,
      degree: c.claims.degree,
      cgpa: c.claims.cgpa,
      cgpa_above_8: c.claims.cgpa_above_8,
    })),
    credentials: results,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.claims) {
      return NextResponse.json({ success: false, error: 'Invalid credential payload' }, { status: 400 });
    }
    const newCredential: NexoCredential = {
      id: `cred-${Date.now()}`,
      type: body.type || 'academic',
      title: body.title,
      issuerName: body.issuerName || 'Accredited Institution',
      issuerAddress: body.issuerAddress || '0x1234567890123456789012345678901234567890',
      issuerCategory: body.issuerCategory || 'University',
      issuedAt: new Date().toISOString().split('T')[0],
      batchId: '0x' + ethers.keccak256(ethers.toUtf8Bytes(String(Date.now()))).slice(2, 66),
      merkleRoot: '0x' + ethers.keccak256(ethers.toUtf8Bytes('root-' + Date.now())).slice(2, 66),
      merkleProof: [ethers.keccak256(ethers.toUtf8Bytes('p1')), ethers.keccak256(ethers.toUtf8Bytes('p2'))],
      credentialHash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(body.claims))),
      claims: body.claims,
      isRevoked: false,
      status: 'valid',
    };

    additionalCredentials.unshift(newCredential);
    return NextResponse.json({ success: true, credential: newCredential });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
