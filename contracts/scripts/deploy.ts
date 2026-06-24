import "dotenv/config";
import hre from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 已知网络的官方 USDC 地址
const KNOWN_USDC: Record<string, string> = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

// 不需要真实 USDC 的本地网络（部署 MockUSDC）
const MOCK_NETWORKS = new Set(["default", "hardhat", "localhost"]);

/** 将 key=value 写入 .env 文件（不存在则追加，存在则替换） */
function upsertEnv(key: string, value: string) {
  const envPath = path.join(__dirname, "..", ".env");
  let content = "";
  try {
    content = fs.readFileSync(envPath, "utf8");
  } catch {
    content = "";
  }
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  if (pattern.test(content)) {
    content = content.replace(pattern, line);
  } else {
    content += `${line}\n`;
  }
  fs.writeFileSync(envPath, content, "utf8");
}

async function main() {
  const { viem, networkName: name } = await hre.network.getOrCreate();
  const [deployer] = await viem.getWalletClients();
  const deployerAddress = deployer.account.address;
  console.log("Deployer:", deployerAddress);

  const treasuryAddress = process.env.TREASURY_ADDRESS;
  if (!treasuryAddress) throw new Error("TREASURY_ADDRESS not set");

  const nftBaseUri = process.env.NFT_BASE_URI || "ipfs://block-ore/";
  const initialOwner = process.env.OWNER_ADDRESS || deployerAddress;

  console.log("Network:", name);
  console.log("Treasury:", treasuryAddress);
  console.log("Initial Owner:", initialOwner);

  let usdcAddress: string;

  if (MOCK_NETWORKS.has(name)) {
    // 本地网络：始终部署新的 MockUSDC（每次都是全新链）
    const mockUsdc = await viem.deployContract("MockUSDC");
    usdcAddress = mockUsdc.address;
    upsertEnv("USDC_ADDRESS", usdcAddress);
    console.log("MockUSDC deployed & saved to .env:", usdcAddress);
  } else if (KNOWN_USDC[name]) {
    // 已知网络（base/baseSepolia）：使用内置官方地址，忽略 .env 中的 MockUSDC 地址
    usdcAddress = KNOWN_USDC[name];
    console.log("USDC (known network):", usdcAddress);
  } else if (process.env.USDC_ADDRESS) {
    usdcAddress = process.env.USDC_ADDRESS;
    console.log("USDC (from env):", usdcAddress);
  } else {
    throw new Error(
      `未知网络 "${name}"，请通过 USDC_ADDRESS 环境变量指定 USDC 地址`,
    );
  }

  const oreNft = await viem.deployContract("OreNFT", [
    initialOwner,
    nftBaseUri,
  ]);
  console.log("OreNFT:", oreNft.address);

  const blockOre = await viem.deployContract("BlockOre", [
    initialOwner,
    treasuryAddress,
    oreNft.address,
    usdcAddress,
  ]);
  console.log("BlockOre:", blockOre.address);

  await oreNft.write.setMinter([blockOre.address], {
    account: deployer.account,
  });
  console.log("OreNFT minter set to BlockOre");

  const deployment = {
    network: name,
    blockOre: blockOre.address,
    oreNft: oreNft.address,
    usdc: usdcAddress,
    owner: initialOwner,
    treasury: treasuryAddress,
  };

  const outDir = path.join(import.meta.dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, `${name}.json`),
    JSON.stringify(deployment, null, 2),
  );
  console.log("Deployment info saved to deployments/", name + ".json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
