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
const envPath = path.join(rootDir, "apps", "web", ".env.development.local");
const BASE_SEPOLIA_USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

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

  const { blockOre, oreNft, usdc } = deployment;

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
    envContent = upsertEnvValue(
      envContent,
      "NEXT_PUBLIC_USDC_ADDRESS_BASE_SEPOLIA",
      usdc || BASE_SEPOLIA_USDC_ADDRESS,
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
    envContent = upsertEnvValue(
      envContent,
      "NEXT_PUBLIC_USDC_ADDRESS_BASE",
      usdc || "",
    );
  }

  await writeFile(envPath, `${envContent.trimEnd()}\n`, "utf8");

  console.log(`已自动回填 ${target} 合约地址到 apps/web/.env.development.local`);
  console.log(`BlockOre: ${blockOre}`);
  console.log(`OreNFT: ${oreNft}`);
  console.log(`USDC: ${usdc || "使用默认地址"}`);
} catch (error) {
  console.error("自动回填合约地址失败。");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
