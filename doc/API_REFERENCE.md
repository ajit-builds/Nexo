# 🌐 API Specifications & Endpoint Contracts
## Next.js Serverless Route Reference

---

## 1. Overview & General Conventions

Nexo implements serverless edge API endpoints using **Next.js 14 App Router Route Handlers**.

- **Base URL**: `http://localhost:3000` (Local) / `https://<production-domain>`
- **Content Type**: `application/json`
- **Error Format**:
  ```json
  {
    "success": false,
    "error": "Descriptive error message"
  }
  ```
- **Success Format**:
  ```json
  {
    "success": true,
    "...data": "..."
  }
  ```

---

## 2. Endpoint Specifications

### 2.1 Query Credentials & Student Batch
Returns academic degrees and employment experience letters from ingested records or in-memory caches.

- **Route**: `/api/credentials`
- **Method**: `GET`
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `studentId` | `string` | No | `IITB-2024-001` | Roll number or student identifier |
  | `type` | `string` | No | `null` | Filter by `academic` or `experience` |

#### Request Example
```bash
curl -X GET "http://localhost:3000/api/credentials?studentId=IITB-2024-001"
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "studentId": "IITB-2024-001",
  "totalCredentials": 2,
  "credentials": [
    {
      "id": "cred-iitb-2024-001",
      "type": "academic",
      "title": "Bachelor of Technology in Computer Science and Engineering",
      "issuerName": "IIT Bombay",
      "issuerAddress": "0x1234567890123456789012345678901234567890",
      "issuerCategory": "University",
      "issuedAt": "2024-06-15",
      "batchId": "0x8a7b9c...",
      "merkleRoot": "0x8f4c82b6e1a90c4d8e72f9104b2819c9e830b7e419b48c6a2d103b417e29b104",
      "merkleProof": [
        "0x3d94b15091a0c41d7e2e8f192b47c0a9b31d8e47a9f02c6b4d1a8e3f9a7b5c1d",
        "0x7c2b4d9e1a8f3c5b0d6e9f2a4b8c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c"
      ],
      "credentialHash": "0x4e6d2b...",
      "claims": {
        "student_id": "IITB-2024-001",
        "full_name": "Aarav Sharma",
        "degree": "Bachelor of Technology",
        "major": "Computer Science and Engineering",
        "graduation_year": 2024,
        "cgpa": 8.85,
        "cgpa_above_8": true,
        "institution_name": "IIT Bombay",
        "issue_date": "2024-06-15"
      },
      "isRevoked": false,
      "status": "valid"
    }
  ],
  "availableStudents": [
    { "id": "IITB-2024-001", "name": "Aarav Sharma" },
    { "id": "IITB-2024-002", "name": "Priya Patel" }
  ]
}
```

---

### 2.2 Register Presentation Token
Persists an active candidate presentation payload with a unique ID and expiration time.

- **Route**: `/api/presentation`
- **Method**: `POST`
- **Request Headers**: `Content-Type: application/json`

#### Request Body Schema
```json
{
  "presentationId": "pres_8a9f20c1d4e5",
  "credentialId": "cred-iitb-2024-001",
  "credentialType": "academic",
  "issuerName": "IIT Bombay",
  "issuerAddress": "0x1234567890123456789012345678901234567890",
  "batchId": "0x8a7b9c...",
  "merkleProof": ["0x3d94..."],
  "merkleRoot": "0x8f4c...",
  "credentialHash": "0x4e6d...",
  "disclosedClaims": {
    "full_name": "Aarav Sharma",
    "degree": "Bachelor of Technology",
    "major": "Computer Science and Engineering",
    "cgpa_above_8": true
  },
  "redactedKeys": ["cgpa", "student_id"],
  "holderAddress": "0xStudentWallet1234...",
  "purpose": "Employment Verification for Google India",
  "issuedAt": "2026-11-21T11:00:00.000Z",
  "expiresAt": "2026-11-21T12:00:00.000Z",
  "nonce": "0x8a7192bd"
}
```

#### Request Example
```bash
curl -X POST "http://localhost:3000/api/presentation" \
  -H "Content-Type: application/json" \
  -d '{"presentationId": "pres_8a9f", "disclosedClaims": {"degree": "B.Tech"}, "expiresAt": "2026-11-21T12:00:00Z"}'
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "presentationId": "pres_8a9f",
  "verificationUrl": "http://localhost:3000/verify?id=pres_8a9f",
  "expiresAt": "2026-11-21T12:00:00Z"
}
```

---

### 2.3 Fetch Presentation Token by ID
Called by the recruiter's QR code scanner to retrieve the candidate's disclosed claims and Merkle proofs.

- **Route**: `/api/presentation`
- **Method**: `GET`
- **Query Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `id` | `string` | Yes | Unique presentation ID extracted from QR URL |

#### Request Example
```bash
curl -X GET "http://localhost:3000/api/presentation?id=pres_8a9f20c1d4e5"
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "isExpired": false,
  "presentation": {
    "version": "1.0",
    "presentationId": "pres_8a9f20c1d4e5",
    "credentialId": "cred-iitb-2024-001",
    "credentialType": "academic",
    "issuerName": "Indian Institute of Technology Bombay",
    "issuerAddress": "0x1234567890123456789012345678901234567890",
    "batchId": "0x8a7b9c...",
    "merkleRoot": "0x8f4c...",
    "merkleProof": ["0x3d94..."],
    "credentialHash": "0x4e6d...",
    "disclosedClaims": {
      "full_name": "Aarav Sharma",
      "degree": "Bachelor of Technology",
      "major": "Computer Science and Engineering",
      "graduation_year": 2024,
      "cgpa_above_8": true
    },
    "redactedKeys": ["cgpa", "student_id"],
    "holderAddress": "0xStudentWallet1234...",
    "purpose": "Employment Verification for Google India",
    "issuedAt": "2026-11-21T11:00:00.000Z",
    "expiresAt": "2026-11-21T12:00:00.000Z",
    "nonce": "0x8a7192bd"
  }
}
```

#### Error Response Example (`404 Not Found`)
```json
{
  "success": false,
  "error": "Presentation expired or not found"
}
```

---

### 2.4 Candidate Consent Logging
Records third-party consent transactions in the student's audit trail.

- **Route**: `/api/student/consent`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "recipient": "Google India (Talent Operations)",
    "purpose": "Employment Verification",
    "credentialTitle": "Bachelor of Technology in Computer Science",
    "disclosedClaims": ["full_name", "degree", "major", "cgpa_above_8"],
    "redactedClaims": ["cgpa", "student_id"],
    "expiresAt": "2026-11-21T12:00:00.000Z"
  }
  ```
- **Response**: `200 OK` with saved consent entry.
