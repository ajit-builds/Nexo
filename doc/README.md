# 📚 Nexo Documentation Hub
## Master Technical & Product Documentation Index

Welcome to the comprehensive documentation suite for **Nexo — Tamper-Proof Digital Credential Network on Polygon Amoy**.

---

## 📑 Documentation Index

| Document | Purpose & Contents | Primary Stakeholders |
| :--- | :--- | :--- |
| **[1. Master PRD](./PRD.md)** | Product Requirements Document: Problem Statement, Vision, User Personas, Functional & Non-Functional Requirements, Success Metrics, Roadmap. | Product Managers, Engineering Leads, Executives |
| **[2. System Architecture](./SYSTEM_ARCHITECTURE.md)** | Multi-tier architecture, Standard Merkle Tree double-hashing, SD-JWT salted disclosures, client-side Web Crypto key derivation (PBKDF2/AES-GCM), and QR scanner engine. | System Architects, Cryptographers, Full-Stack Engineers |
| **[3. Blockchain & Smart Contracts](./BLOCKCHAIN_AND_SMART_CONTRACTS.md)** | Polygon Amoy setup, `TrustRegistry.sol`, `CredentialAnchor.sol`, `RevocationRegistry.sol`, Gas economics (12,500x savings), Hardhat deployment & Polygonscan verification. | Blockchain Developers, Smart Contract Auditors, DevOps |
| **[4. Database & Schemas](./DATABASE_AND_SCHEMAS.md)** | On-chain storage slots, client-side `localStorage`/`sessionStorage` registry, CSV ingestion schemas, TypeScript domain models, and PostgreSQL / Prisma DDL blueprint. | Backend Developers, Database Administrators, Data Engineers |
| **[5. Authentication & RBAC](./AUTHENTICATION_AND_RBAC.md)** | Real-time domain heuristic detection (`detectRoleFromEmail`), `<AuthGuard>` implementation, Permissions Matrix, Threat Models, DPDP Act 2023 & GDPR compliance. | Security Engineers, Compliance Officers, Frontend Developers |
| **[6. Workflows & Sequence Diagrams](./WORKFLOWS_AND_SEQUENCES.md)** | Visual Mermaid sequence diagrams for: 1) University Bulk Issuance, 2) Student Wallet Selective Disclosure, 3) Recruiter QR Verification, 4) Instant Revocation. | QA Engineers, Integration Partners, Solution Architects |
| **[7. API Reference](./API_REFERENCE.md)** | Next.js Serverless Route Handlers: `/api/credentials`, `/api/presentation`, `/api/student/presentation`, `/api/student/consent`, request/response JSON schemas and curl examples. | API Integrators, Mobile App Developers, External Partners |
| **[8. Project Progress & Module Audit](./PROGRESS.md)** | Granular progress report for every part: module status dashboard, deliverables checklist, test proofs, file inventory, and QA benchmarks. | Team Members, Project Managers, Auditors |

---

## 🚀 Quick Execution Guide

```bash
# 1. Compile smart contracts & export typed ABIs
npm run compile
npm run export:abi

# 2. Run smart contract test suite (15 passing tests)
npm test

# 3. Deploy contracts to Polygon Amoy
npm run deploy:amoy

# 4. Verify contracts on Polygonscan Amoy
npm run verify:amoy

# 5. Launch full-stack Next.js dev server
npm run dev
```

---

## 🏛️ Ecosystem Overview

```
                         ┌──────────────────────────────────────────────┐
                         │               NEXO NETWORK                   │
                         │    Tamper-Proof Credentials on Polygon Amoy  │
                         └──────────────────────┬───────────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐                  ┌──────────────────┐
│  ISSUER PORTAL   │                  │  STUDENT WALLET  │                  │  RECRUITER DESK  │
│  (Universities)  │                  │  (Holders/Alum)  │                  │  (Corporates)    │
│  /university     │                  │  /student        │                  │  /verify         │
└──────────────────┘                  └──────────────────┘                  └──────────────────┘
```
