import { describe, it } from "node:test";
import { strict as assert } from "node:assert/strict";
import hre from "hardhat";

const { viem, networkHelpers } = await hre.network.getOrCreate();

describe("BlockOre", async function () {
  async function deployFixture() {
    const [ownerClient, treasuryClient, minerClient] =
      await viem.getWalletClients();

    const usdc = await viem.deployContract("MockUSDC");
    const oreNft = await viem.deployContract("OreNFT", [
      ownerClient.account.address,
      "ipfs://block-ore/",
    ]);
    const blockOre = await viem.deployContract("BlockOre", [
      ownerClient.account.address,
      treasuryClient.account.address,
      oreNft.address,
      usdc.address,
    ]);

    await oreNft.write.setMinter([blockOre.address], {
      account: ownerClient.account,
    });
    await usdc.write.mint([minerClient.account.address, 100_000_000n], {
      account: minerClient.account,
    });

    return { blockOre, oreNft, usdc, ownerClient, treasuryClient, minerClient };
  }

  it("buyMiningPass adds paid mines", async function () {
    const { blockOre, usdc, minerClient } =
      await networkHelpers.loadFixture(deployFixture);

    await usdc.write.approve([blockOre.address, 8_990_000n], {
      account: minerClient.account,
    });
    await blockOre.write.buyMiningPass([1], {
      account: minerClient.account,
    });

    const stats = await blockOre.read.getUserStats([
      minerClient.account.address,
    ]);
    assert.strictEqual(stats.remainingPaidMines, 50n);
    assert.strictEqual(await blockOre.read.usdcTreasuryBalance(), 8_990_000n);
  });

  it("mine consumes free quota", async function () {
    const { blockOre, minerClient } =
      await networkHelpers.loadFixture(deployFixture);

    await blockOre.write.mine({ account: minerClient.account });

    const stats = await blockOre.read.getUserStats([
      minerClient.account.address,
    ]);
    assert.strictEqual(stats.remainingFreeMines, 9n);
  });

  it("reveal updates points and total mines", async function () {
    const { blockOre, minerClient } =
      await networkHelpers.loadFixture(deployFixture);

    await blockOre.write.mine({ account: minerClient.account });
    const nonce = await blockOre.read.latestNonce([
      minerClient.account.address,
    ]);

    for (let i = 0; i < 4; i++) {
      await networkHelpers.mine();
    }

    await blockOre.write.reveal([nonce], { account: minerClient.account });

    const stats = await blockOre.read.getUserStats([
      minerClient.account.address,
    ]);
    assert.strictEqual(stats.totalMines, 1n);
    assert.ok(stats.points > 0n);
  });

  it("withdrawTreasury transfers USDC to treasury", async function () {
    const { blockOre, usdc, ownerClient, treasuryClient, minerClient } =
      await networkHelpers.loadFixture(deployFixture);

    await usdc.write.approve([blockOre.address, 1_990_000n], {
      account: minerClient.account,
    });
    await blockOre.write.buyMiningPass([0], {
      account: minerClient.account,
    });

    await blockOre.write.withdrawTreasury([1_990_000n], {
      account: ownerClient.account,
    });

    assert.strictEqual(
      await usdc.read.balanceOf([treasuryClient.account.address]),
      1_990_000n,
    );
    assert.strictEqual(await blockOre.read.usdcTreasuryBalance(), 0n);
  });
});
