# ⛓️ Blockchain & Smart Contracts Specification
## Polygon Amoy Testnet & Smart Contract Architecture

---

## 1. Network Topology & Environment

Nexo deploys its on-chain foundation on **Polygon Amoy Testnet**:
- **Network Name**: Polygon Amoy Testnet
- **Chain ID**: `80002` (Hex: `0x13882`)
- **Native Gas Token**: POL (formerly MATIC)
- **EVM Target**: `paris`
- **Compiler Version**: Solidity `0.8.20` with optimizer enabled (`runs: 200`)
- **Primary Block Explorer**: [https://amoy.polygonscan.com](https://amoy.polygonscan.com)
- **Official RPC Endpoints**:
  - `https://polygon-amoy-bor-rpc.publicnode.com`
  - `https://rpc-amoy.polygon.technology`
  - `https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY`

---

## 2. Smart Contract Suite Architecture

```mermaid
classDiagram
    class Ownable {
        -address _owner
        +owner() address
        +onlyOwner() modifier
        +transferOwnership(address newOwner)
    }

    class TrustRegistry {
        +enum IssuerCategory { University, Employer, CertificationBody }
        +struct IssuerInfo
        -mapping(address => IssuerInfo) _issuers
        -address[] _issuerList
        +registerIssuer(address, string, string, IssuerCategory, address)
        +setIssuerStatus(address, bool)
        +updateIssuerSigningKey(address, address)
        +isIssuerTrusted(address) bool
        +getIssuer(address) IssuerInfo
        +totalIssuers() uint256
        +getIssuerAtIndex(uint256) address
    }

    class CredentialAnchor {
        +TrustRegistry public immutable trustRegistry
        +struct BatchRecord
        -mapping(bytes32 => BatchRecord) _batches
        -mapping(bytes32 => bytes32) _rootToBatch
        +anchorBatch(bytes32 merkleRoot, string ipfsMetadataUri, uint256 totalCredentials) bytes32
        +isRootAnchored(bytes32 merkleRoot) (bool, bytes32, address)
        +getBatch(bytes32 batchId) BatchRecord
    }

    class RevocationRegistry {
        +TrustRegistry public immutable trustRegistry
        +struct RevocationRecord
        -mapping(bytes32 => RevocationRecord) _revocations
        +revokeCredential(bytes32 credentialHash, string reason)
        +checkRevocation(bytes32 credentialHash) (bool, address, string, uint256)
        +cancelRevocation(bytes32 credentialHash)
    }

    Ownable <|-- TrustRegistry
    TrustRegistry <.. CredentialAnchor : queries isIssuerTrusted
    TrustRegistry <.. RevocationRegistry : queries isIssuerTrusted
```

---

## 3. Detailed Contract Specifications

### 3.1 `TrustRegistry.sol`
*Authoritative on-chain registry of accredited universities and verified employers.*

#### Struct: `IssuerInfo`
```solidity
struct IssuerInfo {
    string name;                     // e.g. "Indian Institute of Technology Bombay"
    string registrationNumber;       // e.g. "UGC-ENG-001" or Corporate CIN
    IssuerCategory category;         // University (0), Employer (1), CertificationBody (2)
    bool isActive;                   // true if authorized to issue/revoke credentials
    address publicSigningAddress;    // Address holding the private key for signing SD-JWTs
    uint256 registeredAt;            // Timestamp of initial registration
}
```

#### Core Methods
1. **`registerIssuer(...)`**:
   - Signature: `function registerIssuer(address issuerAddress, string calldata name, string calldata registrationNumber, IssuerCategory category, address publicSigningAddress) external onlyOwner`
   - Access Control: `onlyOwner` (Trust Registry Admin).
   - Validations:
     - `require(issuerAddress != address(0), "Invalid issuer address")`
     - `require(bytes(name).length > 0, "Name cannot be empty")`
     - `require(!_issuers[issuerAddress].isActive, "Issuer already registered")`
   - Emits: `IssuerRegistered(...)`

2. **`setIssuerStatus(...)`**:
   - Signature: `function setIssuerStatus(address issuerAddress, bool isActive) external onlyOwner`
   - Purpose: Instantly suspend an institution's issuing privileges if their accreditation is revoked.

3. **`isIssuerTrusted(address issuerAddress)`**:
   - Signature: `function isIssuerTrusted(address issuerAddress) external view returns (bool)`
   - Cost: Pure view function ($O(1)$ gas cost).
   - Used by `CredentialAnchor` and `RevocationRegistry` as an authorization gatekeeper.

---

### 3.2 `CredentialAnchor.sol`
*Batch Merkle root anchoring contract connecting off-chain certificates with on-chain immutability.*

#### Struct: `BatchRecord`
```solidity
struct BatchRecord {
    bytes32 merkleRoot;          // 32-byte cryptographic root computed over batch leaves
    address issuer;              // Institutional address that submitted the anchor
    string ipfsMetadataUri;      // IPFS link to encrypted batch manifest (e.g. ipfs://Qm...)
    uint256 totalCredentials;    // Total count of certificates anchored in this tree
    uint256 timestamp;           // Block timestamp of transaction execution
}
```

#### Core Methods
1. **`anchorBatch(...)`**:
   - Signature: `function anchorBatch(bytes32 merkleRoot, string calldata ipfsMetadataUri, uint256 totalCredentials) external returns (bytes32 batchId)`
   - Security Checks:
     - `require(trustRegistry.isIssuerTrusted(msg.sender), "Caller is not a trusted issuer")`
     - `require(merkleRoot != bytes32(0), "Invalid Merkle root")`
     - `require(_rootToBatch[merkleRoot] == bytes32(0), "Batch root already anchored")`
   - Computes unique batch ID: `batchId = keccak256(abi.encodePacked(msg.sender, merkleRoot, block.timestamp))`
   - Emits: `BatchAnchored(batchId, merkleRoot, msg.sender, ipfsMetadataUri, totalCredentials, block.timestamp)`

2. **`isRootAnchored(bytes32 merkleRoot)`**:
   - Signature: `function isRootAnchored(bytes32 merkleRoot) external view returns (bool, bytes32 batchId, address issuer)`
   - Purpose: Verifiers query this function during candidate verification to confirm that the Merkle root in the candidate's SD-JWT is authentic and anchored on-chain.

---

### 3.3 `RevocationRegistry.sol`
*Real-time revocation lookup with cryptographic audit trail.*

#### Struct: `RevocationRecord`
```solidity
struct RevocationRecord {
    bool isRevoked;          // Flag indicating whether the certificate is currently void
    address revokedBy;       // Issuer address that triggered the revocation
    string reason;           // Human-readable cause (e.g., "Degree cancelled due to academic fraud")
    uint256 revokedAt;       // Block timestamp of revocation
}
```

#### Core Methods
1. **`revokeCredential(...)`**:
   - Signature: `function revokeCredential(bytes32 credentialHash, string calldata reason) external`
   - Access Control: Caller must be trusted in `TrustRegistry.isIssuerTrusted(msg.sender)`.
   - Security Checks:
     - `require(credentialHash != bytes32(0), "Invalid credential hash")`
     - `require(!_revocations[credentialHash].isRevoked, "Credential already revoked")`
   - Emits: `CredentialRevoked(credentialHash, msg.sender, reason, block.timestamp)`

2. **`checkRevocation(bytes32 credentialHash)`**:
   - Signature: `function checkRevocation(bytes32 credentialHash) external view returns (bool isRevoked, address revokedBy, string memory reason, uint256 revokedAt)`
   - Checked during Step 4 of the recruiter verification pipeline. If `isRevoked == true`, verification fails instantly.

3. **`cancelRevocation(...)`**:
   - Signature: `function cancelRevocation(bytes32 credentialHash) external`
   - Security: `require(record.revokedBy == msg.sender, "Only the revoking issuer can cancel revocation")`
   - Allows rectifying administrative misclicks or resolving legal disputes.

---

## 4. Gas Economics & Batch Anchoring Efficiency

Traditional blockchain credential systems mint an individual NFT or ERC-721 token per certificate. On public chains, this becomes economically non-viable for universities graduating 10,000+ students per cohort.

### Mathematical Cost Comparison
| Batch Size ($N$) | Traditional Individual NFT Minting (ERC-721) | Nexo Merkle Tree Batch Anchoring | Efficiency Gain |
| :--- | :--- | :--- | :--- |
| **100 Credentials** | 100 Transactions (~8,500,000 gas) | **1 Transaction (~68,000 gas)** | **125x cheaper** |
| **1,000 Credentials** | 1,000 Transactions (~85,000,000 gas) | **1 Transaction (~68,000 gas)** | **1,250x cheaper** |
| **10,000 Credentials** | 10,000 Transactions (~850,000,000 gas) | **1 Transaction (~68,000 gas)** | **12,500x cheaper** |
| **Gas Cost in USD** | ~\$350.00 – \$1,200.00 | **<\$0.01 (Fraction of a cent)** | **99.99% Savings** |

---

## 5. Deployment & Verification Workflow

### 5.1 Deployment Script (`scripts/deploy.js`)
Deploys all three contracts in sequential dependency order and seeds initial trusted institutions:
```bash
npx hardhat run scripts/deploy.js --network amoy
```
Output:
```
[1/3] Deploying TrustRegistry...
✔ TrustRegistry deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
[2/3] Deploying CredentialAnchor...
✔ CredentialAnchor deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
[3/3] Deploying RevocationRegistry...
✔ RevocationRegistry deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
[4/4] Pre-seeding initial trusted issuers in TrustRegistry...
✔ Registered Deployer as trusted university
✔ Registered IIT Bombay (0x1234...) as trusted university
✔ Registered TCS (0x9876...) as trusted employer
✔ Saved addresses to: src/lib/contracts/addresses.json
```

### 5.2 Standalone Polygonscan Verification (`scripts/verify.js`)
```bash
npx hardhat run scripts/verify.js --network amoy
```
Submits contract source code and constructor parameters directly to Polygonscan Amoy API for public green-badge verification.
