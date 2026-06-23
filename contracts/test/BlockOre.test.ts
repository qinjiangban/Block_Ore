import { expect } from "chai";
import { ethers } from "hardhat";
import { BlockOre, MockUSDC, OreNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BlockOre", function () {
  let blockOre: BlockOre;
  let oreNft: OreNFT;
  let usdc: MockUSDC;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let miner: SignerWithAddress;

  beforeEach(async function () {
    [owner, treasury, miner] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const OreNFT = await ethers.getContractFactory("OreNFT");
    oreNft = await OreNFT.deploy(owner.address, "ipfs://block-ore/");
    await oreNft.waitForDeployment();

    const BlockOre = await ethers.getContractFactory("BlockOre");
    blockOre = await BlockOre.deploy(
      owner.address,
      treasury.address,
      await oreNft.getAddress(),
      await usdc.getAddress(),
    );
    await blockOre.waitForDeployment();

    await oreNft.setMinter(await blockOre.getAddress());
    await usdc.mint(miner.address, 100_000_000);
  });

  it("buyMiningPass adds paid mines", async function () {
    await usdc
      .connect(miner)
      .approve(await blockOre.getAddress(), 8_990_000);
    await blockOre.connect(miner).buyMiningPass(1);

    const stats = await blockOre.getUserStats(miner.address);
    expect(stats.remainingPaidMines).to.equal(50);
    expect(await blockOre.usdcTreasuryBalance()).to.equal(8_990_000);
    expect(
      await usdc.balanceOf(await blockOre.getAddress()),
    ).to.equal(8_990_000);
  });

  it("mine consumes free quota", async function () {
    await blockOre.connect(miner).mine();
    const stats = await blockOre.getUserStats(miner.address);
    expect(stats.remainingFreeMines).to.equal(9);
  });

  it("reveal updates points and total mines", async function () {
    await blockOre.connect(miner).mine();
    const nonce = await blockOre.latestNonce(miner.address);

    // Advance past REVEAL_DELAY_BLOCKS (3)
    for (let i = 0; i < 4; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    await blockOre.connect(miner).reveal(nonce);

    const stats = await blockOre.getUserStats(miner.address);
    expect(stats.totalMines).to.equal(1);
    expect(stats.points).to.be.greaterThan(0);
  });

  it("withdrawTreasury transfers USDC to treasury", async function () {
    await usdc
      .connect(miner)
      .approve(await blockOre.getAddress(), 1_990_000);
    await blockOre.connect(miner).buyMiningPass(0);

    await blockOre.connect(owner).withdrawTreasury(1_990_000);

    expect(await usdc.balanceOf(treasury.address)).to.equal(1_990_000);
    expect(await blockOre.usdcTreasuryBalance()).to.equal(0);
  });
});
