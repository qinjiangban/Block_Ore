/**
 * 将部署的合约地址推送到 Vercel 生产环境变量
 *
 * 用法:
 *   1. 先部署合约: npm run contracts:deploy:sepolia
 *   2. 推送环境变量: node ./scripts/vercel-sync-env.mjs sepolia
 *
 * 需要设置以下环境变量（放在根目录 .env 中）:
 *   VERCEL_TOKEN      - Vercel Access Token (https://vercel.com/account/tokens)
 *   VERCEL_PROJECT_ID - Vercel 项目 ID (Project Settings → Project ID)
 */

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 加载根目录 .env 文件
try {
  const envContent = await readFile(path.join(rootDir, ".env"), "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eqIdx = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // 没有 .env 文件，依赖系统环境变量
}

// 解析参数
const target = process.argv[2]; // "sepolia" | "base"
if (!target || !["sepolia", "base"].includes(target)) {
  console.error("用法: node ./scripts/vercel-sync-env.mjs <sepolia|base>");
  process.exit(1);
}

const networkName = target === "sepolia" ? "baseSepolia" : "base";
const deploymentPath = path.join(
  rootDir,
  "contracts",
  "deployments",
  `${networkName}.json`,
);

// 从环境变量或 .env 读取 Vercel 凭证
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
  console.error(
    "请设置 VERCEL_TOKEN 和 VERCEL_PROJECT_ID 环境变量\n" +
    "  VERCEL_TOKEN: https://vercel.com/account/tokens\n" +
    "  VERCEL_PROJECT_ID: Vercel Dashboard → Project Settings → Project ID",
  );
  process.exit(1);
}

// Key 映射：部署字段 → Vercel 环境变量名
const envVarMap = {
  baseSepolia: [
    ["NEXT_PUBLIC_BLOCK_ORE_ADDRESS_BASE_SEPOLIA", "blockOre"],
    ["NEXT_PUBLIC_ORE_NFT_ADDRESS_BASE_SEPOLIA", "oreNft"],
  ],
  base: [
    ["NEXT_PUBLIC_BLOCK_ORE_ADDRESS_BASE", "blockOre"],
    ["NEXT_PUBLIC_ORE_NFT_ADDRESS_BASE", "oreNft"],
  ],
};

async function main() {
  // 读取部署文件
  try {
    await access(deploymentPath);
  } catch {
    console.error(`部署文件不存在: ${deploymentPath}`);
    console.error("请先运行 npm run contracts:deploy:${target}");
    process.exit(1);
  }

  const deploymentRaw = await readFile(deploymentPath, "utf8");
  const deployment = JSON.parse(deploymentRaw);

  const keys = envVarMap[networkName];
  const results = [];

  for (const [envKey, deployKey] of keys) {
    const value = deployment[deployKey];
    if (!value) {
      console.warn(`  跳过 ${envKey}: 部署文件中缺少 ${deployKey}`);
      continue;
    }

    // 先查询该变量是否已存在
    const listRes = await fetch(
      `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env?key=${envKey}`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } },
    );
    const existing = await listRes.json();
    const existingEnv = Array.isArray(existing.envs)
      ? existing.envs.find((e) => e.key === envKey)
      : null;

    const response = await fetch(
      existingEnv
        ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env/${existingEnv.id}`
        : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env`,
      {
        method: existingEnv ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "encrypted",
          key: envKey,
          value,
          target: ["production"],
          comment: `Auto-synced from ${networkName} deployment`,
        }),
      },
    );

    if (response.ok) {
      results.push(`  ✅ ${envKey}=${value}${existingEnv ? " (已更新)" : ""}`);
    } else {
      const err = await response.json();
      results.push(`  ❌ ${envKey}: ${err.error?.message || response.status}`);
    }
  }

  console.log("━━━ Vercel 环境变量同步结果 ━━━");
  console.log(`网络: ${networkName}`);
  console.log(`项目: ${VERCEL_PROJECT_ID}`);
  console.log(results.join("\n"));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((error) => {
  console.error("同步失败:", error.message);
  process.exitCode = 1;
});
