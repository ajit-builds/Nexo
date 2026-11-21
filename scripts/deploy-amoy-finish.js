const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  console.log(`\n======================================================`);
  console.log(` Deploying to [${networkName}] with ${deployer.address}`);
  console.log(`======================================================`);

  const trustRegistryAddress = "0xEC3984A0692dDCE5c6fD604Fe0A7ba4d8fC13Be2";
  const credentialAnchorAddress = "0x42254C752a6705c69ce9a1BFbd0E2111c2CBF649";

  const overrides = {
    maxPriorityFeePerGas: 45000000000n,
    maxFeePerGas: 150000000000n,
  };

  console.log("\n[1/2] Deploying RevocationRegistry...");
  const RevocationRegistry = await hre.ethers.getContractFactory("RevocationRegistry");
  const revocationRegistry = await RevocationRegistry.deploy(trustRegistryAddress, overrides);
  await revocationRegistry.waitForDeployment();
  const revocationRegistryAddress = await revocationRegistry.getAddress();
  console.log(`✔ RevocationRegistry deployed at: ${revocationRegistryAddress}`);

  console.log("\n[2/2] Pre-seeding TrustRegistry on Polygon Amoy...");
  const trustRegistry = await hre.ethers.getContractAt("TrustRegistry", trustRegistryAddress);

  try {
    const tx0 = await trustRegistry.registerIssuer(
      deployer.address,
      "Nexo Accredited University (Admin/Deployer)",
      "UGC-NEXO-001",
      0,
      deployer.address,
      overrides
    );
    await tx0.wait();
    console.log(`✔ Registered Deployer (${deployer.address}) in TrustRegistry`);
  } catch (e) {
    console.log("Deployer register notice:", e.message);
  }

  try {
    const demoUniv = "0x1234567890123456789012345678901234567890";
    const tx1 = await trustRegistry.registerIssuer(
      demoUniv,
      "Indian Institute of Technology Bombay (IIT Bombay)",
      "UGC-ENG-001",
      0,
      demoUniv,
      overrides
    );
    await tx1.wait();
    console.log(`✔ Registered IIT Bombay in TrustRegistry`);
  } catch (e) {
    console.log("IITB register notice:", e.message);
  }

  try {
    const demoEmployer = "0x9876543210987654321098765432109876543210";
    const tx2 = await trustRegistry.registerIssuer(
      demoEmployer,
      "Tata Consultancy Services Limited (TCS)",
      "CIN-IT-002",
      1,
      demoEmployer,
      overrides
    );
    await tx2.wait();
    console.log(`✔ Registered TCS in TrustRegistry`);
  } catch (e) {
    console.log("TCS register notice:", e.message);
  }

  const addrs = {
    network: "amoy",
    chainId: "80002",
    trustRegistry: trustRegistryAddress,
    credentialAnchor: credentialAnchorAddress,
    revocationRegistry: revocationRegistryAddress,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync("src/lib/contracts/addresses.json", JSON.stringify(addrs, null, 2));

  console.log("\n=======================================================");
  console.log(" 🎉 ALL 3 SMART CONTRACTS ARE LIVE ON POLYGON AMOY!");
  console.log(` 1. TrustRegistry:      ${trustRegistryAddress}`);
  console.log(` 2. CredentialAnchor:   ${credentialAnchorAddress}`);
  console.log(` 3. RevocationRegistry: ${revocationRegistryAddress}`);
  console.log("=======================================================\n");
}

main().catch(console.error);
