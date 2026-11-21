const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n======================================================");
  console.log(" Verifying Nexo Smart Contracts on Polygonscan Amoy");
  console.log("======================================================");

  let addresses = {};
  const addressesPath = path.join(__dirname, "..", "src", "lib", "contracts", "addresses.json");
  if (fs.existsSync(addressesPath)) {
    addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  }

  const trustRegistryAddress =
    process.env.NEXT_PUBLIC_TRUST_REGISTRY_ADDRESS || addresses.trustRegistry;
  const credentialAnchorAddress =
    process.env.NEXT_PUBLIC_CREDENTIAL_ANCHOR_ADDRESS || addresses.credentialAnchor;
  const revocationRegistryAddress =
    process.env.NEXT_PUBLIC_REVOCATION_REGISTRY_ADDRESS || addresses.revocationRegistry;

  if (!trustRegistryAddress || !credentialAnchorAddress || !revocationRegistryAddress) {
    console.error("Error: Contract addresses not found. Please deploy first or set environment variables.");
    process.exit(1);
  }

  console.log(`TrustRegistry      : ${trustRegistryAddress}`);
  console.log(`CredentialAnchor   : ${credentialAnchorAddress}`);
  console.log(`RevocationRegistry : ${revocationRegistryAddress}\n`);

  // 1. Verify TrustRegistry
  console.log("[1/3] Verifying TrustRegistry...");
  try {
    await hre.run("verify:verify", {
      address: trustRegistryAddress,
      constructorArguments: [],
    });
    console.log("✔ TrustRegistry verified successfully!");
  } catch (err) {
    if (err.message.includes("Already Verified")) {
      console.log("✔ TrustRegistry is already verified on Polygonscan.");
    } else {
      console.error("TrustRegistry verification error:", err.message);
    }
  }

  // 2. Verify CredentialAnchor
  console.log("\n[2/3] Verifying CredentialAnchor...");
  try {
    await hre.run("verify:verify", {
      address: credentialAnchorAddress,
      constructorArguments: [trustRegistryAddress],
    });
    console.log("✔ CredentialAnchor verified successfully!");
  } catch (err) {
    if (err.message.includes("Already Verified")) {
      console.log("✔ CredentialAnchor is already verified on Polygonscan.");
    } else {
      console.error("CredentialAnchor verification error:", err.message);
    }
  }

  // 3. Verify RevocationRegistry
  console.log("\n[3/3] Verifying RevocationRegistry...");
  try {
    await hre.run("verify:verify", {
      address: revocationRegistryAddress,
      constructorArguments: [trustRegistryAddress],
    });
    console.log("✔ RevocationRegistry verified successfully!");
  } catch (err) {
    if (err.message.includes("Already Verified")) {
      console.log("✔ RevocationRegistry is already verified on Polygonscan.");
    } else {
      console.error("RevocationRegistry verification error:", err.message);
    }
  }

  console.log("\nVerification process completed.");
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exitCode = 1;
});
