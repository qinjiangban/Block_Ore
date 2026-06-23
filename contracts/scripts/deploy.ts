import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const treasuryAddress = process.env.TREASURY_ADDRESS;
  if (!treasuryAddress) throw new Error("TREASURY_ADDRESS not set");

  const nftBaseUri = process.env.NFT_BASE_URI || "ipfs://block-ore/";
  const usdcAddress = resolveUsdcAddress();
  const initialOwner = process.env.OWNER_ADDRESS || deployer.address;

  console.log("Network:", network.name, "Chain ID:", network.config.chainId);
  console.log("Treasury:", treasuryAddress);
  console.log("USDC:", usdcAddress);
  console.log("Initial Owner:", initialOwner);

  const OreNFT = await ethers.getContractFactory("OreNFT");
  const oreNft = await OreNFT.deploy(initialOwner, nftBaseUri);
  await oreNft.waitForDeployment();
  console.log("OreNFT:", await oreNft.getAddress());

  const BlockOre = await ethers.getContractFactory("BlockOre");
  const blockOre = await BlockOre.deploy(
    initialOwner,
    treasuryAddress,
    await oreNft.getAddress(),
    usdcAddress,
  );
  await blockOre.waitForDeployment();
  console.log("BlockOre:", await blockOre.getAddress());

  await oreNft.setMinter(await blockOre.getAddress());
  console.log("OreNFT minter set to BlockOre");

  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    blockOre: await blockOre.getAddress(),
    oreNft: await oreNft.getAddress(),
    usdc: usdcAddress,
    owner: initialOwner,
    treasury: treasuryAddress,
  };

  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, `${network.name}.json`),
    JSON.stringify(deployment, null, 2),
  );
  console.log("Deployment info saved to deployments/", network.name + ".json");
}

function resolveUsdcAddress(): string {
  if (process.env.USDC_ADDRESS) return process.env.USDC_ADDRESS;

  const chainId = network.config.chainId;
  if (chainId === 8453) return "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  if (chainId === 84532) return "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  throw new Error("USDC_ADDRESS_REQUIRED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
