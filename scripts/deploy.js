const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const networkName = hre.network.name;
  console.log(`\n======================================================`);
  console.log(` Starting Nexo Contracts Deployment on [${networkName}]`);
  console.log(`======================================================`);

  const signers = await hre.ethers.getSigners();
  if (signers.length === 0) {
    console.error("Error: No deployer signer found. Please check DEPLOYER_PRIVATE_KEY in .env");
    process.exit(1);
  }

  const deployer = signers[0];
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Address : ${deployer.address}`);
  console.log(`Account Balance  : ${hre.ethers.formatEther(balance)} POL/ETH`);

  if (networkName === "amoy" && balance === 0n) {
    console.warn("\n[WARNING] Deployer account has 0 POL balance on Polygon Amoy!");
    console.warn("Please get free testnet POL from the faucet:");
    console.warn("  -> https://faucet.polygon.technology/");
    console.warn("  -> https://www.alchemy.com/faucets/polygon-amoy\n");
  }

  // EIP-1559 gas settings for Polygon Amoy
  const overrides = {
    maxPriorityFeePerGas: 45000000000n, // 45 gwei priority tip
    maxFeePerGas: 120000000000n, // 120 gwei max fee
  };

  // 1. Deploy TrustRegistry
  console.log("\n[1/3] Deploying TrustRegistry...");
  const TrustRegistry = await hre.ethers.getContractFactory("TrustRegistry");
  const trustRegistry = await TrustRegistry.deploy(overrides);
  await trustRegistry.waitForDeployment();
  const trustRegistryAddress = await trustRegistry.getAddress();
  console.log(`✔ TrustRegistry deployed at: ${trustRegistryAddress}`);

  // 2. Deploy CredentialAnchor
  console.log("\n[2/3] Deploying CredentialAnchor...");
  const CredentialAnchor = await hre.ethers.getContractFactory("CredentialAnchor");
  const credentialAnchor = await CredentialAnchor.deploy(trustRegistryAddress, overrides);
  await credentialAnchor.waitForDeployment();
  const credentialAnchorAddress = await credentialAnchor.getAddress();
  console.log(`✔ CredentialAnchor deployed at: ${credentialAnchorAddress}`);

  // 3. Deploy RevocationRegistry
  console.log("\n[3/3] Deploying RevocationRegistry...");
  const RevocationRegistry = await hre.ethers.getContractFactory("RevocationRegistry");
  const revocationRegistry = await RevocationRegistry.deploy(trustRegistryAddress, overrides);
  await revocationRegistry.waitForDeployment();
  const revocationRegistryAddress = await revocationRegistry.getAddress();
  console.log(`✔ RevocationRegistry deployed at: ${revocationRegistryAddress}`);

  // 4. Seed initial accredited issuers in TrustRegistry
  console.log("\n[4/4] Pre-seeding initial trusted issuers in TrustRegistry...");
  try {
    // Register deployer itself
    const tx0 = await trustRegistry.registerIssuer(
      deployer.address,
      "Nexo Accredited University (Admin/Deployer)",
      "UGC-NEXO-001",
      0, // University
      deployer.address,
      overrides
    );
    await tx0.wait();
    console.log(`✔ Registered Deployer (${deployer.address}) as trusted university`);

    // Register demo IIT Bombay
    const demoUniv = "0x1234567890123456789012345678901234567890";
    const tx1 = await trustRegistry.registerIssuer(
      demoUniv,
      "Indian Institute of Technology Bombay (IIT Bombay)",
      "UGC-ENG-001",
      0, // University
      demoUniv,
      overrides
    );
    await tx1.wait();
    console.log(`✔ Registered IIT Bombay (${demoUniv}) as trusted university`);

    // Register demo TCS
    const demoEmployer = "0x9876543210987654321098765432109876543210";
    const tx2 = await trustRegistry.registerIssuer(
      demoEmployer,
      "Tata Consultancy Services Limited (TCS)",
      "CIN-IT-002",
      1, // Employer
      demoEmployer,
      overrides
    );
    await tx2.wait();
    console.log(`✔ Registered TCS (${demoEmployer}) as trusted employer`);
  } catch (seedErr) {
    console.warn("Notice: Initial issuer seeding skipped or partially completed:", seedErr.message);
  }

  // 5. Save addresses to src/lib/contracts/addresses.json
  const addressesData = {
    network: networkName,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    trustRegistry: trustRegistryAddress,
    credentialAnchor: credentialAnchorAddress,
    revocationRegistry: revocationRegistryAddress,
    deployedAt: new Date().toISOString(),
  };

  const addressesPath = path.join(__dirname, "..", "src", "lib", "contracts", "addresses.json");
  fs.writeFileSync(addressesPath, JSON.stringify(addressesData, null, 2));
  console.log(`\n✔ Saved addresses to: src/lib/contracts/addresses.json`);

  // Update .env / .env.local if present
  const envFiles = [".env", ".env.local"];
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, "..", envFile);
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, "utf8");
      content = updateEnvVar(content, "NEXT_PUBLIC_TRUST_REGISTRY_ADDRESS", trustRegistryAddress);
      content = updateEnvVar(content, "NEXT_PUBLIC_CREDENTIAL_ANCHOR_ADDRESS", credentialAnchorAddress);
      content = updateEnvVar(content, "NEXT_PUBLIC_REVOCATION_REGISTRY_ADDRESS", revocationRegistryAddress);
      fs.writeFileSync(envPath, content);
      console.log(`✔ Updated contract addresses in ${envFile}`);
    }
  }

  // 6. Export ABIs
  try {
    require("./export-abi.js");
  } catch (e) {
    // abi export
  }

  // 7. Verify on Polygonscan if on Amoy and API key is present
  if (networkName === "amoy" && process.env.POLYGONSCAN_API_KEY) {
    console.log("\nWaiting 5 block confirmations before Polygonscan verification...");
    await trustRegistry.deploymentTransaction().wait(5);
    await credentialAnchor.deploymentTransaction().wait(5);
    await revocationRegistry.deploymentTransaction().wait(5);

    console.log("\nVerifying contracts on Polygonscan Amoy...");
    try {
      await hre.run("verify:verify", {
        address: trustRegistryAddress,
        constructorArguments: [],
      });
      console.log("✔ TrustRegistry verified successfully");
    } catch (e) {
      console.warn("TrustRegistry verification:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: credentialAnchorAddress,
        constructorArguments: [trustRegistryAddress],
      });
      console.log("✔ CredentialAnchor verified successfully");
    } catch (e) {
      console.warn("CredentialAnchor verification:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: revocationRegistryAddress,
        constructorArguments: [trustRegistryAddress],
      });
      console.log("✔ RevocationRegistry verified successfully");
    } catch (e) {
      console.warn("RevocationRegistry verification:", e.message);
    }
  }

  console.log("\n======================================================");
  console.log(" Deployment Completed Successfully!");
  console.log("======================================================");
  console.log(`NEXT_PUBLIC_TRUST_REGISTRY_ADDRESS="${trustRegistryAddress}"`);
  console.log(`NEXT_PUBLIC_CREDENTIAL_ANCHOR_ADDRESS="${credentialAnchorAddress}"`);
  console.log(`NEXT_PUBLIC_REVOCATION_REGISTRY_ADDRESS="${revocationRegistryAddress}"`);
  console.log("======================================================\n");
}

function updateEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, `${key}="${value}"`);
  }
  return content + `\n${key}="${value}"`;
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
