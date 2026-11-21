# Nexo - Tamper-Proof Digital Credential Network

[![Polygon Amoy](https://img.shields.io/badge/Blockchain-Polygon%20Amoy-8247E5?logo=polygon&logoColor=white)](https://amoy.polygonscan.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Verifiable digital credentials for universities and employers, a zero-friction privacy wallet for students, and instant mathematical verification for recruiters without contacting the registrar.**

---

## 1. Problem Statement

India faces a severe trust gap in modern hiring:
* **Rampant Document Forgery**: Forged university degrees and fabricated corporate experience letters are pervasive and visually indistinguishable from genuine PDFs.
* **Slow Background Verification (BGV)**: Background checks take **2 to 4 weeks**, relying on manual emails, phone calls, and third-party agencies chasing registrars and HR desks.
* **Administrative Bottlenecks**: Universities are flooded with manual verification requests, consuming immense administrative bandwidth.
* **Loss of Student Privacy**: To prove a single fact (e.g., *"CGPA $\ge$ 8.0"*), students must surrender their entire unredacted transcript containing roll numbers, personal addresses, and semester-by-semester marks.
* **No Path for Experience Letters**: Employment history and relieving certificates lack any standard cryptographic verification path once issued.

---

## 2. The Solution

**Nexo** is a decentralized, privacy-preserving credential network where:
1. **Accredited Issuers** (universities and employers) issue tamper-proof digital certificates in bulk from existing ERP/CSV exports.
2. **Batch Anchoring via Merkle Trees**: Thousands of credentials are anchored in **a single on-chain transaction** on Polygon Amoy, keeping gas and latency near zero.
3. **Selective Disclosure via SD-JWT**: Students hold credentials in an in-app browser wallet and disclose only what is needed (e.g., *"Prove CGPA $\ge$ 8.0"* without revealing exact GPA or transcripts).
4. **Instant Recruiter Verification (< 2 seconds)**: Recruiters verify digital signatures, issuer registration in the Trust Registry, Merkle inclusion, and revocation status without ever calling the institution.

---

## 3. Architecture & End-to-End Flow

```
                      ┌──────────────────────────────────────────────┐
                      │            Trust Registry Admin              │
                      │   (Verifies legitimate Universities/HRs)     │
                      └──────────────────────┬───────────────────────┘
                                             │ Registers Issuer
                                             ▼
┌───────────────────────────┐      [TrustRegistry.sol]      ┌───────────────────────────┐
│     ISSUER PORTAL         │      [CredentialAnchor.sol]   │     RECRUITER PORTAL      │
│  (University / Employer)  │◄──── [RevocationRegistry.sol] ┼────► (Verifier / Company)  │
│                           │         (Polygon Amoy)         │                           │
│ • Bulk CSV / ERP export   │                                │ • Scan QR / Verify Link   │
│ • Merkle batch generation │                                │ • Check Trust & Anchor    │
│ • 1 On-chain anchor tx    │                                │ • Check Revocation status │
│ • Issues SD-JWT to student│                                │ • Instant Pass/Fail (<2s) │
└─────────────┬─────────────┘                                └─────────────▲─────────────┘
              │ Claim Notification                                         │
              ▼                                                            │ Selective Proof
┌──────────────────────────────────────────────────────────────────────────┴─────────────┐
│                             STUDENT IN-APP WALLET (Holder)                              │
│ • Zero gas fees (Relayer pays) & Zero seed-phrase friction (Browser encrypted keys)     │
│ • Holds degrees & experience letters in one unified portfolio                          │
│ • Selective Disclosure (SD-JWT): Shares "CGPA ≥ 8.0: true" while hiding exact marks     │
│ • Generates time-bound verification QR code / consent link                             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Tech Stack (100% Free & Open-Source)

| Layer | Choice | Purpose |
| :--- | :--- | :--- |
| **Blockchain** | Polygon Amoy Testnet | EVM-compatible, high throughput, zero testnet cost |
| **Smart Contracts** | Solidity 0.8.20 + Hardhat | Audited OpenZeppelin standards for on-chain state |
| **Web3 Client** | ethers.js v6 | Reading contract state & submitting transactions |
| **Batching** | `@openzeppelin/merkle-tree` | Merkle root anchoring for 1000s of credentials per tx |
| **Credentials** | SD-JWT (`@sd-jwt/core`) | W3C-aligned verifiable credentials with selective disclosure |
| **App Framework** | Next.js 14 (TypeScript) | Full-stack frontend & API routes in a single codebase |
| **Styling** | Tailwind CSS + Lucide Icons | Responsive dashboards for Issuers, Students & Recruiters |
| **CSV Engine** | PapaParse | High-performance client/server CSV ingestion |
| **QR Engine** | `qrcode` + `html5-qrcode` | Generation and webcam scanning of verification tokens |
| **Offline Engine** | PWA + Service Worker + IndexedDB | Local caching of trusted issuer public keys and Merkle roots |

---

## 5. Team Roles & Module Division

The project is architected into 4 independent, decoupled modules assigned across team members:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   TEAM MODULE ASSIGNMENTS                                        │
├───────────┬───────────────────────────────┬──────────────────────────────────────────────────────┤
│ Member    │ GitHub Profile                │ Assigned Module & Core Focus                         │
├───────────┼───────────────────────────────┼──────────────────────────────────────────────────────┤
│ Member 1  │ https://github.com/ajit-builds │ Module 1: Smart Contracts & Web3 Core (On-Chain)     │
│ Member 2  │ https://github.com/pratikswain070-blip │ Module 2: Issuer Portal & Batch Issuance Engine     │
│ Member 3  │ https://github.com/Ankitraj-17 │ Module 3: Student In-App Wallet & Selective Disclosure│
│ Member 4  │ https://github.com/foggypants │ Module 4: Recruiter Verifier, Offline Mode & Audit Log│
└───────────┴───────────────────────────────┴──────────────────────────────────────────────────────┘
```

### Module 1: Smart Contracts & Web3 Core
* **Owner**: [@ajit-builds](https://github.com/ajit-builds)
* **Contracts**:
  * `TrustRegistry.sol`: Manage whitelist of accredited universities and registered employers.
  * `CredentialAnchor.sol`: Anchor batch Merkle roots with metadata URI.
  * `RevocationRegistry.sol`: On-chain revocation mapping with timestamp and reason.
* **Deliverables**: Hardhat test suite, Polygon Amoy deployment scripts, exported ABIs and typed helper methods.

### Module 2: Issuer Portal & Batch Issuance Engine
* **Owner**: [@pratikswain070-blip](https://github.com/pratikswain070-blip)
* **Components**:
  * CSV/ERP batch upload with PapaParse and schema validation.
  * Merkle tree generation (`@openzeppelin/merkle-tree`) and SD-JWT batch issuance.
  * One-click on-chain anchoring transaction to Polygon Amoy.
  * Issuer management dashboard for revocations and issuance history.

### Module 3: Student In-App Wallet & Selective Disclosure
* **Owner**: [@Ankitraj-17](https://github.com/Ankitraj-17)
* **Components**:
  * In-app encrypted browser wallet (ethers.js keypair + IndexedDB; no MetaMask required for students).
  * Unified credential portfolio for Degrees and Experience Letters.
  * Selective disclosure builder (reveal degree while hiding exact CGPA or marks).
  * Dynamic QR code generator and consent tracking history.

### Module 4: Recruiter Verifier Portal, Offline Mode & Audit Log
* **Owner**: [@foggypants](https://github.com/foggypants)
* **Components**:
  * In-browser QR code scanner (`html5-qrcode`) and manual token verifier.
  * Mathematical verification pipeline (Signature $\rightarrow$ Trust Registry $\rightarrow$ Merkle Inclusion $\rightarrow$ Revocation $\rightarrow$ Expiry).
  * Pre-built verification templates for common hiring requirements.
  * Service worker offline verification mode with honest status reporting.
  * On-chain audit log viewer aggregating contract events.

---

## 6. Smart Contracts Overview

1. **`TrustRegistry.sol`**
   ```solidity
   function registerIssuer(address issuer, string memory name, uint8 category) external onlyOwner;
   function isIssuerTrusted(address issuer) external view returns (bool);
   ```
2. **`CredentialAnchor.sol`**
   ```solidity
   function anchorBatch(bytes32 merkleRoot, string memory ipfsUri) external returns (bytes32 batchId);
   function isBatchAnchored(bytes32 batchId, bytes32 merkleRoot) external view returns (bool);
   ```
3. **`RevocationRegistry.sol`**
   ```solidity
   function revokeCredential(bytes32 credentialHash, string memory reason) external;
   function isCredentialRevoked(bytes32 credentialHash) external view returns (bool, string memory, uint256);
   ```

---

## 7. Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MetaMask** with Polygon Amoy testnet configured

### Installation
```bash
# Clone the repository
git clone https://github.com/ajit-builds/Nexo.git
cd Nexo

# Install all dependencies
npm install

# Compile smart contracts
npm run compile

# Run smart contract tests
npm run test

# Start the development server
npm run dev
```

The web application will be accessible at `http://localhost:3000`.

---

## 8. Environment Variables Setup

Copy `.env.example` to `.env.local` and configure:
```env
# Polygon Amoy RPC
NEXT_PUBLIC_POLYGON_AMOY_RPC="https://rpc-amoy.polygon.technology"
ALCHEMY_AMOY_RPC_URL="https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY"

# Private key for deploying contracts and backend relayer (do not commit!)
DEPLOYER_PRIVATE_KEY="your_private_key_here"

# Deployed Contract Addresses (Polygon Amoy)
NEXT_PUBLIC_TRUST_REGISTRY_ADDRESS=""
NEXT_PUBLIC_CREDENTIAL_ANCHOR_ADDRESS=""
NEXT_PUBLIC_REVOCATION_REGISTRY_ADDRESS=""
```

---

## 9. Demo Scenarios

1. **Bulk Issuance**: Upload sample `students_batch.csv` $\rightarrow$ Validate $\rightarrow$ Anchor Merkle root on Amoy.
2. **Selective Disclosure**: Student selects *"Prove CGPA $\ge$ 8.0"* $\rightarrow$ generates QR code without disclosing exact marks.
3. **Instant Verification**: Recruiter scans QR $\rightarrow$ passes in $<2$ seconds without contacting the university.
4. **Fake Issuer Rejection**: Present credential signed by an unverified issuer $\rightarrow$ flagged immediately as `UNTRUSTED ISSUER`.
5. **Revocation Catch**: Issuer revokes degree on-chain $\rightarrow$ recruiter verification fails immediately with reason.
6. **Offline Verification**: Disconnect network $\rightarrow$ verifies mathematical signature with local cache.
7. **Audit Log**: Inspect immutable on-chain event trail.

---

## 10. License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
