import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const artifactMappings = [
  {
    artifactPath: path.join(
      rootDir,
      "contracts",
      "artifacts",
      "contracts",
      "BlockOre.sol",
      "BlockOre.json",
    ),
    targetPath: path.join(
      rootDir,
      "apps",
      "web",
      "src",
      "lib",
      "contracts",
      "abis",
      "block-ore.ts",
    ),
    exportName: "blockOreAbi",
  },
  {
    artifactPath: path.join(
      rootDir,
      "contracts",
      "artifacts",
      "contracts",
      "OreNFT.sol",
      "OreNFT.json",
    ),
    targetPath: path.join(
      rootDir,
      "apps",
      "web",
      "src",
      "lib",
      "contracts",
      "abis",
      "ore-nft.ts",
    ),
    exportName: "oreNftAbi",
  },
];

const formatAbiModule = (exportName, abi) =>
  `export const ${exportName} = ${JSON.stringify(abi, null, 2)} as const;\n`;

const syncArtifact = async ({ artifactPath, targetPath, exportName }) => {
  const artifactRaw = await readFile(artifactPath, "utf8");
  const artifact = JSON.parse(artifactRaw);

  if (!artifact.abi) {
    throw new Error(`未在产物中找到 ABI: ${artifactPath}`);
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, formatAbiModule(exportName, artifact.abi), "utf8");
};

try {
  for (const mapping of artifactMappings) {
    await syncArtifact(mapping);
    console.log(
      `已同步 ABI -> ${path.relative(rootDir, mapping.targetPath)}`,
    );
  }
} catch (error) {
  console.error("同步合约 ABI 失败。请先确认已经成功执行 hardhat compile。");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
