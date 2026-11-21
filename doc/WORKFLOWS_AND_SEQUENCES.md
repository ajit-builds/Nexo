# 🔄 Workflows & Sequence Diagrams
## End-to-End Operational Lifecycle & Sequence Diagrams

---

## 1. Workflow 1: University Bulk Issuance & On-Chain Anchoring

This workflow describes how an accredited university (e.g., IIT Bombay) takes a graduation cohort CSV export, computes the Merkle tree, submits a single on-chain transaction to Polygon Amoy, and generates SD-JWT credentials for students.

```mermaid
sequenceDiagram
    autonumber
    actor Registrar as 🏛️ University Registrar
    participant Portal as 💻 Nexo Issuer Portal (/university)
    participant Parser as 📑 PapaParse CSV Engine
    participant Merkle as 🌳 Merkle Tree Engine
    participant SDJWT as 📜 SD-JWT Cryptographic Engine
    participant Contract as ⛓️ CredentialAnchor.sol (Polygon Amoy)
    participant Storage as 💾 LocalStorage / IPFS

    Registrar->>Portal: Upload graduation_batch.csv
    Portal->>Parser: parseStudentCSV(csvContent)
    Parser-->>Portal: Return validated records + error reports

    Registrar->>Portal: Click "Anchor Batch on Polygon Amoy"
    Portal->>Merkle: buildMerkleTree(records)
    Merkle-->>Portal: Merkle Root (0x8f4c...) + Individual Proofs
    
    Portal->>Contract: anchorBatch(merkleRoot, ipfsMetadataUri, totalCredentials)
    Note over Contract: Verifies caller in TrustRegistry<br/>Asserts Merkle root is unique<br/>Computes batchId & stores state
    Contract-->>Portal: Emit BatchAnchored(batchId, merkleRoot, issuer, timestamp)

    Portal->>SDJWT: generateSDJWTCredential(records, merkleRoot, proofs, batchId)
    Note over SDJWT: Generates 128-bit salts for private fields<br/>Computes _sd digests<br/>Signs with University key
    SDJWT-->>Portal: Array of SDJWTCredential objects

    Portal->>Storage: saveBatch(newBatch)
    Portal-->>Registrar: Render Success Banner + Download Batch JSON Manifest
```

---

## 2. Workflow 2: Student In-App Wallet & Selective Disclosure Presentation

This workflow explains how a student accesses their wallet without a seed phrase, views their credentials, selects which fields to disclose, and generates a dynamic, time-bound QR presentation token.

```mermaid
sequenceDiagram
    autonumber
    actor Student as 🎓 Student / Alumni
    participant Wallet as 📱 In-App Student Wallet (/student)
    participant WebCrypto as 🔑 Web Crypto API (Client)
    participant Helper as 🛠️ SD-JWT Helper
    participant QR as 📷 QRCode Generator
    participant API as 🌐 /api/presentation
    actor Recruiter as 🔍 Recruiter / Interviewer

    Student->>Wallet: Opens /student & enters 4-digit PIN
    Wallet->>WebCrypto: decryptPrivateKey(cipherHex, salt, iv, pin)
    WebCrypto-->>Wallet: Unlocked Secp256k1 Keypair (Cached in SessionStorage)

    Wallet->>Wallet: Renders Degree & Experience Cards
    Student->>Wallet: Clicks "Selective Share" on Degree Card
    Wallet->>Wallet: Opens Selective Disclosure Modal

    Note over Student: Student checks:<br/>✔ Full Name<br/>✔ Degree & Major<br/>✔ CGPA >= 8.0 (Predicate Proof)<br/>❌ Exact CGPA (Masked)<br/>❌ Student ID (Masked)

    Student->>Wallet: Clicks "Generate Verification QR"
    Wallet->>Helper: createSelectivePresentation(cred, options, holderAddress, privateKey)
    Helper-->>Wallet: VerificationPresentationPayload (with 60-min expiresAt & nonce)

    Wallet->>API: POST /api/presentation (payload)
    API-->>Wallet: Return { presentationId, verificationUrl }

    Wallet->>QR: generatePresentationQRCode(verificationUrl)
    QR-->>Wallet: QR Code PNG Data URL
    Wallet->>Wallet: Records entry in nexo_consent_logs
    Wallet-->>Student: Displays crisp QR code for recruiter to scan
    Student->>Recruiter: Presents QR code on smartphone screen
```

---

## 3. Workflow 3: Recruiter Multi-Mode Verification Flow

This workflow details what occurs when a corporate recruiter scans a candidate's QR code or uploads a screenshot during background verification.

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as 🔍 Recruiter Verifier
    participant Scanner as 📷 Recruiter Portal (/verify)
    participant API as 🌐 /api/presentation
    participant Relayer as ⚡ Nexo Relayer Engine
    participant TrustReg as ⛓️ TrustRegistry.sol
    participant AnchorReg as ⛓️ CredentialAnchor.sol
    participant RevokeReg as ⛓️ RevocationRegistry.sol

    alt Camera Scanning Mode
        Recruiter->>Scanner: Points webcam at Student QR code
        Scanner->>Scanner: Decodes URL: /verify?id=pres_8a9f...
    else Photo Upload Mode
        Recruiter->>Scanner: Drops QR image/screenshot onto canvas
        Scanner->>Scanner: Decodes QR payload via canvas parser
    else Direct Link / Paste
        Recruiter->>Scanner: Pastes presentation URL or JSON
    end

    Scanner->>API: GET /api/presentation?id=pres_8a9f...
    API-->>Scanner: Return VerificationPresentationPayload

    Note over Scanner: Step 1: Check Expiration<br/>Asserts new Date(expiresAt) > now

    Scanner->>Relayer: checkOnChainIssuerTrust(issuerAddress)
    Relayer->>TrustReg: isIssuerTrusted(issuerAddress)
    TrustReg-->>Relayer: Returns true (Accredited University)
    Relayer-->>Scanner: Issuer is Trusted ✔

    Note over Scanner: Step 2: Merkle Proof Inclusion Check<br/>Computes StandardMerkleTree.verify(root, leaf, proof) == true ✔

    Scanner->>Relayer: checkOnChainMerkleRoot(merkleRoot)
    Relayer->>AnchorReg: isRootAnchored(merkleRoot)
    AnchorReg-->>Relayer: Returns (true, batchId, issuer)
    Relayer-->>Scanner: Merkle Root Anchored on Amoy ✔

    Scanner->>Relayer: checkOnChainRevocation(credentialHash)
    Relayer->>RevokeReg: checkRevocation(credentialHash)
    RevokeReg-->>Relayer: Returns (isRevoked = false)
    Relayer-->>Scanner: Credential Active & Not Revoked ✔

    Scanner-->>Recruiter: Renders Green "Authentic Credential Verified" Card (< 1.5s total)
    Scanner-->>Recruiter: Displays Selectively Disclosed Claims Table
```

---

## 4. Workflow 4: Instant Degree Revocation Flow

This workflow illustrates how an accredited university can immediately invalidate a degree due to academic misconduct, instantly blocking subsequent verifications across the globe.

```mermaid
sequenceDiagram
    autonumber
    actor Registrar as 🏛️ University Exam Controller
    participant Portal as 💻 Issuer Portal (/university)
    participant Contract as ⛓️ RevocationRegistry.sol
    participant Recruiter as 🔍 Recruiter Verifier

    Registrar->>Portal: Navigate to "Revocation Registry" Tab
    Registrar->>Portal: Search for Student Name or Credential ID
    Portal-->>Registrar: Displays issued credential matching query
    
    Registrar->>Portal: Select Reason: "Academic Misconduct / Cheating / Plagiarism"
    Registrar->>Portal: Click "Revoke Credential On-Chain"

    Portal->>Contract: revokeCredential(credentialHash, reason)
    Note over Contract: Verifies caller is trusted issuer in TrustRegistry<br/>Asserts credential is not already revoked<br/>Sets isRevoked = true, stores reason & timestamp
    Contract-->>Portal: Emit CredentialRevoked(credentialHash, msg.sender, reason, timestamp)
    Portal-->>Registrar: Display Green Confirmation with Tx Hash

    Note over Recruiter: Candidate attempts to use old QR code
    Recruiter->>Contract: checkRevocation(credentialHash)
    Contract-->>Recruiter: Returns (isRevoked = true, reason = "Academic Misconduct...")
    Note over Recruiter: Recruiter Portal immediately flashes RED ALERT:<br/>"VERIFICATION FAILED: Credential Revoked on Polygon Amoy"
```
