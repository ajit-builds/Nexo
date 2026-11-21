/**
 * Nexo — IPFS / Pinata Integration
 * Pins credential batch metadata and schemas to IPFS via Pinata.
 * Requires PINATA_JWT in .env.local
 */

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_SECRET_API_KEY;
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

export interface PinResult {
  cid: string;
  ipfsUrl: string;
  gatewayUrl: string;
}

/**
 * Pin JSON metadata to IPFS via Pinata API.
 * Returns the IPFS CID and gateway URL.
 */
export async function pinJSONToIPFS(
  data: Record<string, unknown>,
  name: string
): Promise<PinResult> {
  if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET)) {
    // Graceful mock fallback when Pinata keys are not configured
    console.warn('[IPFS] Pinata keys not set — returning mock CID for dev mode.');
    const mockCid = `Qm${Math.random().toString(36).substr(2, 44)}`;
    return {
      cid: mockCid,
      ipfsUrl: `ipfs://${mockCid}`,
      gatewayUrl: `${IPFS_GATEWAY}${mockCid}`,
    };
  }

  const body = JSON.stringify({
    pinataContent: data,
    pinataMetadata: { name },
    pinataOptions: { cidVersion: 1 },
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (PINATA_JWT) {
    headers['Authorization'] = `Bearer ${PINATA_JWT}`;
  } else {
    headers['pinata_api_key'] = PINATA_API_KEY!;
    headers['pinata_secret_api_key'] = PINATA_SECRET!;
  }

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers,
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata error (${res.status}): ${err}`);
  }

  const json = await res.json();
  const cid: string = json.IpfsHash;

  return {
    cid,
    ipfsUrl: `ipfs://${cid}`,
    gatewayUrl: `${IPFS_GATEWAY}${cid}`,
  };
}

/**
 * Pin a credential batch's metadata to IPFS.
 * Returns the IPFS CID to store alongside the Merkle root on-chain.
 */
export async function pinCredentialBatch(batch: {
  batchId: string;
  merkleRoot: string;
  issuerName: string;
  credentialType: string;
  totalCredentials: number;
  timestamp: number;
  credentials: Array<{
    credentialId: string;
    studentId?: string;
    degree?: string;
    major?: string;
    institutionName?: string;
    issueDate?: string;
    merkleLeafHash: string;
  }>;
}): Promise<PinResult> {
  return pinJSONToIPFS(
    {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: 'NexoCredentialBatch',
      ...batch,
      pinnedAt: new Date().toISOString(),
    },
    `nexo-batch-${batch.batchId.slice(0, 16)}`
  );
}

/**
 * Retrieve JSON data from IPFS via the configured gateway.
 */
export async function fetchFromIPFS(cid: string): Promise<unknown> {
  const url = `${IPFS_GATEWAY}${cid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IPFS fetch failed for CID ${cid}: ${res.statusText}`);
  return res.json();
}

/**
 * Returns whether Pinata is configured with real keys.
 */
export function isPinataConfigured(): boolean {
  return !!(PINATA_JWT || (PINATA_API_KEY && PINATA_SECRET));
}
