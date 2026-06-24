import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const target = process.argv[2]; // "sepolia" | "base"

if (!target || !["sepolia", "base"].includes(target)) {
  console.error("用法: node ./scripts/sync-deployment-addresses.mjs <sepolia|base>");
  process.exit(1);
}

const networkName = target === "sepolia" ? "baseSepolia" : "base";
const deploymentPath = path.join(
  rootDir,
  "contracts",
  "deployments",
  `${networkName}.json`,
);
const envPaths = [
  path.join(rootDir, "apps", "web", ".env.development.local"),
  path.join(rootDir, "apps", "web", ".env.production.local"),
];

const upsertEnvValue = (content, key, value) => {
  const nextLine = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, nextLine);
  }

  return `${content.trimEnd()}\n${nextLine}\n`;
};

try {
  await access(deploymentPath);

  const deploymentRaw = await readFile(deploymentPath, "utf8");
  const deployment = JSON.parse(deploymentRaw);

  const { blockOre, oreNft } = deployment;

  for (const envPath of envPaths) {
    let envContent = "";
    try {
      envContent = await readFile(envPath, "utf8");
    } catch {
      envContent = "NEXT_PUBLIC_BASE_NETWORK=sepolia\nNEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=\n";
    }

    if (target === "sepolia") {
      envContent = upsertEnvValue(
        envContent,
        "NEXT_PUBLIC_BLOCK_ORE_ADDRESS_BASE_SEPOLIA",
        blockOre,
      );
      envContent = upsertEnvValue(
        envContent,
        "NEXT_PUBLIC_ORE_NFT_ADDRESS_BASE_SEPOLIA",
        oreNft,
      );
    } else {
      envContent = upsertEnvValue(
        envContent,
        "NEXT_PUBLIC_BLOCK_ORE_ADDRESS_BASE",
        blockOre,
      );
      envContent = upsertEnvValue(
        envContent,
        "NEXT_PUBLIC_ORE_NFT_ADDRESS_BASE",
        oreNft,
      );
    }

    await writeFile(envPath, `${envContent.trimEnd()}\n`, "utf8");
  }

  console.log(`已自动回填 ${target} 合约地址到 apps/web/.env.development.local 和 .env.production.local`);
  console.log(`BlockOre: ${blockOre}`);
  console.log(`OreNFT: ${oreNft}`);
} catch (error) {
  console.error("自动回填合约地址失败。");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
