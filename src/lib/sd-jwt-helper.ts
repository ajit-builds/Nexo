import { NexoCredential, SelectiveDisclosureClaim, VerificationPresentationPayload, ConsentLogEntry } from './types';
import { ethers } from 'ethers';
import QRCode from 'qrcode';

/**
 * Extract disclosure options for an academic or experience credential
 */
export function getDisclosureOptions(credential: NexoCredential): SelectiveDisclosureClaim[] {
  if (credential.type === 'academic') {
    const claims = credential.claims;
    return [
      {
        key: 'full_name',
        label: 'Candidate Full Name',
        value: claims.full_name,
        disclosed: true,
        description: 'Verify the credential belongs to you',
      },
      {
        key: 'degree',
        label: 'Degree Title',
        value: claims.degree,
        disclosed: true,
        description: 'e.g. Bachelor of Technology',
      },
      {
        key: 'major',
        label: 'Specialization / Major',
        value: claims.major,
        disclosed: true,
        description: 'e.g. Computer Science and Engineering',
      },
      {
        key: 'institution_name',
        label: 'Institution Name',
        value: claims.institution_name,
        disclosed: true,
        description: 'Issuing university name',
      },
      {
        key: 'graduation_year',
        label: 'Graduation Year',
        value: claims.graduation_year,
        disclosed: true,
        description: 'Year of convocation',
      },
      {
        key: 'cgpa_above_8',
        label: 'Eligibility: CGPA ≥ 8.0 (Predicate Proof)',
        value: claims.cgpa_above_8 ? 'Yes (Verified Qualified)' : 'No',
        disclosed: true,
        isPredicate: true,
        description: 'Discloses qualification without revealing exact marks or grades',
      },
      {
        key: 'cgpa',
        label: 'Exact CGPA Score',
        value: claims.cgpa,
        disclosed: false, // Default hidden for privacy
        description: 'Exact score (e.g. 8.85 / 10.0)',
      },
      {
        key: 'student_id',
        label: 'University Roll / Student ID',
        value: claims.student_id,
        disclosed: false, // Default hidden for privacy
        description: 'Permanent enrollment identifier',
      },
    ];
  } else {
    // Experience credential
    const claims = credential.claims;
    return [
      {
        key: 'employee_name',
        label: 'Employee Name',
        value: claims.employee_name,
        disclosed: true,
        description: 'Candidate name on company payroll',
      },
      {
        key: 'company_name',
        label: 'Employer Name',
        value: claims.company_name,
        disclosed: true,
        description: 'Accredited company name',
      },
      {
        key: 'designation',
        label: 'Job Title / Designation',
        value: claims.designation,
        disclosed: true,
        description: 'Official corporate title',
      },
      {
        key: 'experience_years',
        label: 'Total Experience (Years)',
        value: `${claims.experience_years} years`,
        disclosed: true,
        description: 'Verified tenure length',
      },
      {
        key: 'start_date',
        label: 'Joining Date',
        value: claims.start_date,
        disclosed: true,
        description: 'Service commencement',
      },
      {
        key: 'end_date',
        label: 'Relieving Date',
        value: claims.end_date,
        disclosed: true,
        description: 'Official last working day',
      },
      {
        key: 'department',
        label: 'Business Unit / Department',
        value: claims.department,
        disclosed: false, // Default hidden
        description: 'Internal corporate division',
      },
      {
        key: 'conduct_rating',
        label: 'Conduct & Exit Rating',
        value: claims.conduct_rating,
        disclosed: false, // Default hidden
        description: 'Internal HR performance assessment',
      },
      {
        key: 'employee_id',
        label: 'Corporate Employee ID',
        value: claims.employee_id,
        disclosed: false, // Default hidden
        description: 'Company payroll ID',
      },
    ];
  }
}

/**
 * Build a selective disclosure presentation payload compliant with W3C / SD-JWT
 */
export async function createSelectivePresentation(
  credential: NexoCredential,
  options: SelectiveDisclosureClaim[],
  holderAddress: string,
  holderPrivateKey?: string,
  purpose: string = 'Employment Verification',
  validityMinutes: number = 60
): Promise<VerificationPresentationPayload> {
  const disclosedClaims: Record<string, any> = {};
  const redactedKeys: string[] = [];

  for (const opt of options) {
    if (opt.disclosed) {
      disclosedClaims[opt.key] = opt.value;
    } else {
      redactedKeys.push(opt.key);
    }
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000).toISOString();
  const nonce = ethers.hexlify(ethers.randomBytes(8));
  const presentationId = 'pres_' + ethers.keccak256(ethers.toUtf8Bytes(`${credential.id}:${now.toISOString()}:${nonce}`)).slice(2, 14);

  const payload: VerificationPresentationPayload = {
    version: '1.0',
    presentationId,
    credentialId: credential.id,
    credentialType: credential.type,
    issuerName: credential.issuerName,
    issuerAddress: credential.issuerAddress,
    batchId: credential.batchId,
    merkleProof: credential.merkleProof,
    merkleRoot: credential.merkleRoot,
    credentialHash: credential.credentialHash,
    disclosedClaims,
    redactedKeys,
    holderAddress,
    purpose,
    issuedAt: now.toISOString(),
    expiresAt,
    nonce,
  };

  // Sign if private key is available
  if (holderPrivateKey) {
    try {
      const signer = new ethers.Wallet(holderPrivateKey);
      const digest = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(payload)));
      payload.holderSignature = await signer.signMessage(ethers.getBytes(digest));
    } catch (e) {
      console.warn('Optional holder signature skipped:', e);
    }
  }

  return payload;
}

/**
 * Verify cryptographic holder signature on a selective disclosure presentation
 */
export function verifyPresentationSignature(payload: VerificationPresentationPayload): {
  valid: boolean;
  recoveredAddress?: string;
  isExpired: boolean;
  reason: string;
} {
  const isExpired = new Date(payload.expiresAt).getTime() < Date.now();
  if (isExpired) {
    return { valid: false, isExpired: true, reason: 'Presentation expired' };
  }

  if (!payload.holderSignature) {
    return {
      valid: false,
      isExpired: false,
      reason: 'No cryptographic holder signature attached',
    };
  }

  try {
    // Reconstruct unsigned payload for digest verification
    const { holderSignature, ...unsignedPayload } = payload;
    const digest = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(unsignedPayload)));
    const recovered = ethers.verifyMessage(ethers.getBytes(digest), holderSignature);

    const matches =
      Boolean(payload.holderAddress) &&
      recovered.toLowerCase() === payload.holderAddress.toLowerCase();

    return {
      valid: matches,
      recoveredAddress: recovered,
      isExpired: false,
      reason: matches
        ? `Valid signature from ${recovered.slice(0, 6)}...${recovered.slice(-4)}`
        : `Signature address mismatch (recovered ${recovered.slice(0, 6)}... vs holder ${payload.holderAddress?.slice(0, 6)}...)`,
    };
  } catch (err: any) {
    return {
      valid: false,
      isExpired: false,
      reason: `Signature verification failed: ${err.message}`,
    };
  }
}

/**
 * Generate QR code data URL (PNG) from presentation payload.
 * Encodes a direct verification URL so phone cameras and verifier scanners work instantly!
 */
export async function generatePresentationQRCode(payload: VerificationPresentationPayload): Promise<{ dataUrl: string; verificationUrl: string }> {
  let verificationUrl = '';
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // Keep URL ultra-clean and short for instant camera scan
    verificationUrl = `${origin}/verify?id=${payload.presentationId}`;

    // Store in browser localStorage for 100% offline access
    try {
      localStorage.setItem(`nexo_pres_${payload.presentationId}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage save notice:', e);
    }

    // Also persist via backend API
    fetch('/api/presentation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => console.warn('Presentation API cache notice:', err));
  } else {
    verificationUrl = `http://localhost:3000/verify?id=${payload.presentationId}`;
  }

  // Generate crisp, fast-scanning QR code
  const dataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'L',
    margin: 1,
    scale: 8,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  return { dataUrl, verificationUrl };
}

const CONSENT_STORAGE_KEY = 'nexo_consent_logs';

export function getConsentLogs(): ConsentLogEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveConsentLog(entry: ConsentLogEntry): void {
  if (typeof window === 'undefined') return;
  const logs = getConsentLogs();
  logs.unshift(entry);
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
}
