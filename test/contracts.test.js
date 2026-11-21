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
    });

    it("Should reject duplicate registration", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);
      await expect(
        trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address)
      ).to.be.revertedWith("Issuer already registered");
    });
  });

  describe("CredentialAnchor", function () {
    it("Should allow only trusted issuer to anchor batch root", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);

      const fakeRoot = ethers.keccak256(ethers.toUtf8Bytes("Batch-2026-BTech-CS"));
      await expect(
        credentialAnchor.connect(university).anchorBatch(fakeRoot, "ipfs://QmSampleHash", 100)
      ).to.emit(credentialAnchor, "BatchAnchored");

      const [isAnchored] = await credentialAnchor.isRootAnchored(fakeRoot);
      expect(isAnchored).to.equal(true);
    });

    it("Should reject anchoring from untrusted issuer", async function () {
      const fakeRoot = ethers.keccak256(ethers.toUtf8Bytes("Batch-Fake"));
      await expect(
        credentialAnchor.connect(rogueIssuer).anchorBatch(fakeRoot, "ipfs://fake", 50)
      ).to.be.revertedWith("Caller is not a trusted issuer");
    });
  });

  describe("RevocationRegistry", function () {
    it("Should allow authorized issuer to revoke a credential", async function () {
      await trustRegistry.registerIssuer(university.address, "IIT Bombay", "UGC-01", 0, university.address);

      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("DEGREE-IITB-2026-001"));
      await expect(
        revocationRegistry.connect(university).revokeCredential(credentialHash, "Academic misconduct")
      ).to.emit(revocationRegistry, "CredentialRevoked");

      const [isRevoked, revokedBy, reason] = await revocationRegistry.checkRevocation(credentialHash);
      expect(isRevoked).to.equal(true);
      expect(revokedBy).to.equal(university.address);
      expect(reason).to.equal("Academic misconduct");
    });
  });
});

