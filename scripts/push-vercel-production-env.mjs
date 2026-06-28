/**
 * 将 apps/web/.env.production.local 全量推送到 Vercel production 环境变量
 *
 * 用法:
 *   node ./scripts/push-vercel-production-env.mjs
 *
 * 需要设置以下环境变量（放在根目录 .env 中）:
 *   VERCEL_TOKEN      - Vercel Access Token (https://vercel.com/account/tokens)
 *   VERCEL_PROJECT_ID - Vercel 项目 ID (Project Settings → Project ID)
 *
 * 行为：
 *   1. 读取 apps/web/.env.production.local 中的所有 KEY=VALUE
 *   2. 获取 Vercel 上当前 production 环境变量列表
 *   3. 对本地存在且 Vercel 已存在的变量执行 PATCH 更新
 *   4. 对本地存在但 Vercel 不存在的变量执行 POST 创建
 *   5. 对 Vercel 存在但本地不存在的变量执行 DELETE 删除（默认开启）
 */

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envFilePath = path.join(rootDir, "apps", "web", ".env.production.local");

// 加载根目录 .env 文件
async function loadRootEnv() {
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
}

await loadRootEnv();

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
  console.error("请设置 VERCEL_TOKEN 和 VERCEL_PROJECT_ID 环境变量");
  console.error("  VERCEL_TOKEN: https://vercel.com/account/tokens");
  console.error("  VERCEL_PROJECT_ID: Vercel Dashboard → Project Settings → Project ID");
  process.exit(1);
}

async function parseEnvFile(filePath) {
  await access(filePath);
  const content = await readFile(filePath, "utf8");
  const vars = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (!trimmed.includes("=")) continue;

    const eqIdx = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key) {
      vars[key] = value;
    }
  }

  return vars;
}

async function listVercelEnvs() {
  const all = [];
  let nextId = null;

  do {
    const url = new URL(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env`);
    if (nextId) url.searchParams.set("next", nextId);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `获取 Vercel 环境变量失败: ${res.status} ${res.statusText} - ${err.error?.message || ""}`,
      );
    }

    const data = await res.json();
    all.push(...(data.envs || []));
    nextId = data.pagination?.next || null;
  } while (nextId);

  return all;
}

async function createEnv(key, value) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "encrypted",
        key,
        value,
        target: ["production"],
        comment: "Auto-synced from apps/web/.env.production.local",
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`创建 ${key} 失败: ${err.error?.message || res.status}`);
  }
}

async function updateEnv(envId, key, value) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env/${envId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "encrypted",
        key,
        value,
        target: ["production"],
        comment: "Auto-synced from apps/web/.env.production.local",
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`更新 ${key} 失败: ${err.error?.message || res.status}`);
  }
}

async function deleteEnv(envId, key) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env/${envId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`删除 ${key} 失败: ${err.error?.message || res.status}`);
  }
}

async function main() {
  const localVars = await parseEnvFile(envFilePath);
  const localKeys = Object.keys(localVars);

  console.log(`读取到 ${localKeys.length} 个本地环境变量`);
  console.log(`正在获取 Vercel 项目 ${VERCEL_PROJECT_ID} 的 production 环境变量...\n`);

  const vercelEnvs = await listVercelEnvs();
  const productionEnvs = vercelEnvs.filter(
    (env) => Array.isArray(env.target) && env.target.includes("production"),
  );

  const vercelEnvMap = new Map();
  for (const env of productionEnvs) {
    vercelEnvMap.set(env.key, env);
  }

  const results = [];

  // 创建或更新
  for (const key of localKeys) {
    const value = localVars[key];
    const existing = vercelEnvMap.get(key);

    try {
      if (existing) {
        await updateEnv(existing.id, key, value);
        results.push(`🔄 更新: ${key}`);
      } else {
        await createEnv(key, value);
        results.push(`✅ 创建: ${key}`);
      }
    } catch (error) {
      results.push(`❌ 失败: ${key} - ${error.message}`);
    }
  }

  // 删除 Vercel 上本地不存在的变量
  const keysToDelete = productionEnvs.filter((env) => !localVars.hasOwnProperty(env.key));

  for (const env of keysToDelete) {
    try {
      await deleteEnv(env.id, env.key);
      results.push(`🗑️ 删除: ${env.key}`);
    } catch (error) {
      results.push(`❌ 删除失败: ${env.key} - ${error.message}`);
    }
  }

  console.log("━━━ Vercel production 环境变量同步结果 ━━━");
  console.log(results.join("\n"));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((error) => {
  console.error("同步失败:", error.message);
  process.exitCode = 1;
});
