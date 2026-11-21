const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Nexo Smart Contracts Suite", function () {
  let TrustRegistry, trustRegistry;
  let CredentialAnchor, credentialAnchor;
  let RevocationRegistry, revocationRegistry;
  let owner, university, employer, rogueIssuer, student;

  beforeEach(async function () {
    [owner, university, employer, rogueIssuer, student] = await ethers.getSigners();

    TrustRegistry = await ethers.getContractFactory("TrustRegistry");
    trustRegistry = await TrustRegistry.deploy();
    await trustRegistry.waitForDeployment();

    const trustRegistryAddress = await trustRegistry.getAddress();

    CredentialAnchor = await ethers.getContractFactory("CredentialAnchor");
    credentialAnchor = await CredentialAnchor.deploy(trustRegistryAddress);
    await credentialAnchor.waitForDeployment();

    RevocationRegistry = await ethers.getContractFactory("RevocationRegistry");
    revocationRegistry = await RevocationRegistry.deploy(trustRegistryAddress);
    await revocationRegistry.waitForDeployment();
  });

  describe("TrustRegistry", function () {
    it("Should allow owner to register accredited university", async function () {
      await expect(
        trustRegistry.registerIssuer(
          university.address,
          "IIT Bombay",
          "UGC-ENG-001",
          0, // University
          university.address
        )
      ).to.emit(trustRegistry, "IssuerRegistered");

      expect(await trustRegistry.isIssuerTrusted(university.address)).to.equal(true);
      expect(await trustRegistry.isIssuerTrusted(rogueIssuer.address)).to.equal(false);

      const issuerDetails = await trustRegistry.getIssuer(university.address);
      expect(issuerDetails.name).to.equal("IIT Bombay");
      expect(issuerDetails.registrationNumber).to.equal("UGC-ENG-001");
      expect(issuerDetails.category).to.equal(0n);
      expect(issuerDetails.isActive).to.equal(true);
      expect(issuerDetails.publicSigningAddress).to.equal(university.address);
    });

    it("Should reject duplicate registration", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);
      await expect(
        trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address)
      ).to.be.revertedWith("Issuer already registered");
    });

    it("Should reject registration by non-owner", async function () {
      await expect(
        trustRegistry.connect(rogueIssuer).registerIssuer(
          employer.address,
          "TCS",
          "CIN-001",
          1,
          employer.address
        )
      ).to.be.revertedWithCustomError(trustRegistry, "OwnableUnauthorizedAccount");
    });

    it("Should reject registration with invalid address or empty name", async function () {
      await expect(
        trustRegistry.registerIssuer(ethers.ZeroAddress, "Name", "REG", 0, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid issuer address");

      await expect(
        trustRegistry.registerIssuer(university.address, "", "REG", 0, university.address)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should allow owner to suspend and re-enable issuer status", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);
      expect(await trustRegistry.isIssuerTrusted(university.address)).to.equal(true);

      await expect(trustRegistry.setIssuerStatus(university.address, false))
        .to.emit(trustRegistry, "IssuerStatusUpdated")
        .withArgs(university.address, false);

      expect(await trustRegistry.isIssuerTrusted(university.address)).to.equal(false);

      await trustRegistry.setIssuerStatus(university.address, true);
      expect(await trustRegistry.isIssuerTrusted(university.address)).to.equal(true);
    });

    it("Should allow owner to update issuer signing key", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);

      const newKey = student.address;
      await expect(trustRegistry.updateIssuerSigningKey(university.address, newKey))
        .to.emit(trustRegistry, "IssuerSigningKeyUpdated")
        .withArgs(university.address, newKey);

      const details = await trustRegistry.getIssuer(university.address);
      expect(details.publicSigningAddress).to.equal(newKey);
    });

    it("Should track total issuers and allow indexing", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);
      await trustRegistry.registerIssuer(employer.address, "TCS", "CIN-01", 1, employer.address);

      expect(await trustRegistry.totalIssuers()).to.equal(2n);
      expect(await trustRegistry.getIssuerAtIndex(0)).to.equal(university.address);
      expect(await trustRegistry.getIssuerAtIndex(1)).to.equal(employer.address);
    });
  });

  describe("CredentialAnchor", function () {
    it("Should allow only trusted issuer to anchor batch root", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);

      const fakeRoot = ethers.keccak256(ethers.toUtf8Bytes("Batch-2026-BTech-CS"));
      await expect(
        credentialAnchor.connect(university).anchorBatch(fakeRoot, "ipfs://QmSampleHash", 100)
      ).to.emit(credentialAnchor, "BatchAnchored");

      const [isAnchored, batchId, issuer] = await credentialAnchor.isRootAnchored(fakeRoot);
      expect(isAnchored).to.equal(true);
      expect(issuer).to.equal(university.address);
      expect(batchId).to.not.equal(ethers.ZeroHash);

      const batch = await credentialAnchor.getBatch(batchId);
      expect(batch.merkleRoot).to.equal(fakeRoot);
      expect(batch.issuer).to.equal(university.address);
      expect(batch.ipfsMetadataUri).to.equal("ipfs://QmSampleHash");
      expect(batch.totalCredentials).to.equal(100n);
    });

    it("Should reject anchoring from untrusted issuer", async function () {
      const fakeRoot = ethers.keccak256(ethers.toUtf8Bytes("Batch-Fake"));
      await expect(
        credentialAnchor.connect(rogueIssuer).anchorBatch(fakeRoot, "ipfs://fake", 50)
      ).to.be.revertedWith("Caller is not a trusted issuer");
    });

    it("Should reject zero Merkle root and duplicate anchoring", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);

      await expect(
        credentialAnchor.connect(university).anchorBatch(ethers.ZeroHash, "ipfs://zero", 10)
      ).to.be.revertedWith("Invalid Merkle root");

      const fakeRoot = ethers.keccak256(ethers.toUtf8Bytes("Batch-Duplicate-Test"));
      await credentialAnchor.connect(university).anchorBatch(fakeRoot, "ipfs://first", 10);

      await expect(
        credentialAnchor.connect(university).anchorBatch(fakeRoot, "ipfs://second", 10)
      ).to.be.revertedWith("Batch root already anchored");
    });

    it("Should return false for unanchored root", async function () {
      const unanchoredRoot = ethers.keccak256(ethers.toUtf8Bytes("Unanchored-Batch"));
      const [isAnchored, batchId, issuer] = await credentialAnchor.isRootAnchored(unanchoredRoot);
      expect(isAnchored).to.equal(false);
      expect(batchId).to.equal(ethers.ZeroHash);
      expect(issuer).to.equal(ethers.ZeroAddress);
    });
  });

  describe("RevocationRegistry", function () {
    it("Should allow authorized issuer to revoke a credential", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);

      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("DEGREE-IITB-2026-001"));
      await expect(
        revocationRegistry.connect(university).revokeCredential(credentialHash, "Academic misconduct")
      ).to.emit(revocationRegistry, "CredentialRevoked");

      const [isRevoked, revokedBy, reason, timestamp] = await revocationRegistry.checkRevocation(credentialHash);
      expect(isRevoked).to.equal(true);
      expect(revokedBy).to.equal(university.address);
      expect(reason).to.equal("Academic misconduct");
      expect(timestamp).to.be.gt(0n);
    });

    it("Should reject revocation from untrusted caller", async function () {
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("FAKE-CREDENTIAL"));
      await expect(
        revocationRegistry.connect(rogueIssuer).revokeCredential(credentialHash, "Malicious revocation")
      ).to.be.revertedWith("Caller is not an authorized issuer");
    });

    it("Should reject double revocation and zero credential hash", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);

      await expect(
        revocationRegistry.connect(university).revokeCredential(ethers.ZeroHash, "Invalid hash")
      ).to.be.revertedWith("Invalid credential hash");

      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("DEGREE-002"));
      await revocationRegistry.connect(university).revokeCredential(credentialHash, "First revocation");

      await expect(
        revocationRegistry.connect(university).revokeCredential(credentialHash, "Second revocation")
      ).to.be.revertedWith("Credential already revoked");
    });

    it("Should allow revoking issuer to cancel revocation, but reject others", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);
      await trustRegistry.registerIssuer(employer.address, "TCS", "CIN-01", 1, employer.address);

      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("RECTIFIED-DEGREE-003"));
      await revocationRegistry.connect(university).revokeCredential(credentialHash, "Clerical error");

      // Employer tries to cancel university's revocation
      await expect(
        revocationRegistry.connect(employer).cancelRevocation(credentialHash)
      ).to.be.revertedWith("Only the revoking issuer can cancel revocation");

      // University cancels its own revocation
      await expect(
        revocationRegistry.connect(university).cancelRevocation(credentialHash)
      ).to.emit(revocationRegistry, "RevocationCancelled");

      const [isRevoked] = await revocationRegistry.checkRevocation(credentialHash);
      expect(isRevoked).to.equal(false);
    });
  });
});
