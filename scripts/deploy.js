const hre = require("hardhat");

async function main() {
  console.log("Starting Nexo Contracts Deployment on Polygon Amoy...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy TrustRegistry
  const TrustRegistry = await hre.ethers.getContractFactory("TrustRegistry");
  const trustRegistry = await TrustRegistry.deploy();
  await trustRegistry.waitForDeployment();
  const trustRegistryAddress = await trustRegistry.getAddress();
  console.log("TrustRegistry deployed at:", trustRegistryAddress);

  // 2. Deploy CredentialAnchor
  const CredentialAnchor = await hre.ethers.getContractFactory("CredentialAnchor");
  const credentialAnchor = await CredentialAnchor.deploy(trustRegistryAddress);
  await credentialAnchor.waitForDeployment();
  const credentialAnchorAddress = await credentialAnchor.getAddress();
  console.log("CredentialAnchor deployed at:", credentialAnchorAddress);

  // 3. Deploy RevocationRegistry
  const RevocationRegistry = await hre.ethers.getContractFactory("RevocationRegistry");
  const revocationRegistry = await RevocationRegistry.deploy(trustRegistryAddress);
  await revocationRegistry.waitForDeployment();
  const revocationRegistryAddress = await revocationRegistry.getAddress();
  console.log("RevocationRegistry deployed at:", revocationRegistryAddress);

  console.log("\n--- Deployment Summary ---");
  console.log("NEXT_PUBLIC_TRUST_REGISTRY_ADDRESS=" + trustRegistryAddress);
  console.log("NEXT_PUBLIC_CREDENTIAL_ANCHOR_ADDRESS=" + credentialAnchorAddress);
  console.log("NEXT_PUBLIC_REVOCATION_REGISTRY_ADDRESS=" + revocationRegistryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

