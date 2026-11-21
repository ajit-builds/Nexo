const hre = require("hardhat");

async function main() {
  console.log("Starting Nexo Contracts Deployment on Polygon Amoy...");

  const signers = await hre.ethers.getSigners();
  if (!signers || signers.length === 0) {
    console.error("\n❌ Error: No deployer account found!");
    console.error("Please add your MetaMask testnet private key to .env.local:");
    console.error('DEPLOYER_PRIVATE_KEY="your_private_key_here"\n');
    process.exit(1);
  }
  const deployer = signers[0];
  console.log("Deploying contracts with account:", deployer.address);

  // Polygon Amoy requires high priority fee (~30-40 gwei) for fast block inclusion
  const feeData = await hre.ethers.provider.getFeeData();
  const maxPriorityFeePerGas = hre.ethers.parseUnits("35", "gwei");
  const maxFeePerGas = feeData.maxFeePerGas 
    ? (feeData.maxFeePerGas * 3n) / 2n + hre.ethers.parseUnits("20", "gwei")
    : hre.ethers.parseUnits("120", "gwei");
  const overrides = { maxPriorityFeePerGas, maxFeePerGas };
  console.log(`Gas settings: Priority=${hre.ethers.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei, MaxFee=${hre.ethers.formatUnits(maxFeePerGas, 'gwei')} gwei`);

  // 1. Deploy TrustRegistry
  const TrustRegistry = await hre.ethers.getContractFactory("TrustRegistry");
  const trustRegistry = await TrustRegistry.deploy(overrides);
  console.log("TrustRegistry deployment submitted, waiting for confirmation...");
  await trustRegistry.waitForDeployment();
  const trustRegistryAddress = await trustRegistry.getAddress();
  console.log("TrustRegistry deployed at:", trustRegistryAddress);

  // 2. Deploy CredentialAnchor
  const CredentialAnchor = await hre.ethers.getContractFactory("CredentialAnchor");
  const credentialAnchor = await CredentialAnchor.deploy(trustRegistryAddress, overrides);
  console.log("CredentialAnchor deployment submitted, waiting for confirmation...");
  await credentialAnchor.waitForDeployment();
  const credentialAnchorAddress = await credentialAnchor.getAddress();
  console.log("CredentialAnchor deployed at:", credentialAnchorAddress);

  // 3. Deploy RevocationRegistry
  const RevocationRegistry = await hre.ethers.getContractFactory("RevocationRegistry");
  const revocationRegistry = await RevocationRegistry.deploy(trustRegistryAddress, overrides);
  console.log("RevocationRegistry deployment submitted, waiting for confirmation...");
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

