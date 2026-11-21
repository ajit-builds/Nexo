const fs = require("fs");
const path = require("path");

const contracts = ["TrustRegistry", "CredentialAnchor", "RevocationRegistry"];
const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
const targetDir = path.join(__dirname, "..", "src", "lib", "contracts");
const abisDir = path.join(targetDir, "abis");

if (!fs.existsSync(abisDir)) {
  fs.mkdirSync(abisDir, { recursive: true });
}

const exported = {};

for (const name of contracts) {
  const artifactPath = path.join(artifactsDir, `${name}.sol`, `${name}.json`);
  if (!fs.existsSync(artifactPath)) {
    console.error(`Artifact not found: ${artifactPath}. Run 'npm run compile' first.`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = data.abi;
  fs.writeFileSync(path.join(abisDir, `${name}.json`), JSON.stringify(abi, null, 2));
  exported[name] = abi;
  console.log(`Exported ABI for ${name} (${abi.length} entries)`);
}

// Generate TS ABI constants
const tsContent = `// Auto-generated ABI exports - DO NOT EDIT MANUALLY
// Generated from compiled Hardhat artifacts

export const TRUST_REGISTRY_ABI = ${JSON.stringify(exported.TrustRegistry, null, 2)} as const;

export const CREDENTIAL_ANCHOR_ABI = ${JSON.stringify(exported.CredentialAnchor, null, 2)} as const;

export const REVOCATION_REGISTRY_ABI = ${JSON.stringify(exported.RevocationRegistry, null, 2)} as const;
`;

fs.writeFileSync(path.join(targetDir, "abis.ts"), tsContent);
console.log("Generated src/lib/contracts/abis.ts");
