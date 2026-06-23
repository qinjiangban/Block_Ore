# Block Ore Contracts

`contracts/` 是 Block Ore 的 Hardhat 合约工程目录。

## 依赖

Node.js >= 18

```powershell
cd contracts
npm install
```

## 目录说明

- `contracts/BlockOre.sol`: 挖矿、Reveal、矿镐购买、积分与 Treasury 主逻辑
- `contracts/OreNFT.sol`: Diamond / Genesis NFT 铸造合约
- `contracts/mocks/MockUSDC.sol`: 本地测试用的 Mock USDC
- `scripts/deploy.ts`: 部署脚本（支持 Base / Base Sepolia）
- `test/BlockOre.test.ts`: TypeScript 测试

## 常用命令

通过根目录统一执行：

```powershell
npm run contracts:compile   # 编译 + 同步 ABI
npm run contracts:test      # 运行测试
```

## 部署

### Base Sepolia

```powershell
npm run contracts:deploy:sepolia
```

### Base Mainnet

```powershell
npm run contracts:deploy:base
```

部署后合约地址会自动写入 `apps/web/.env.development.local`。

## 环境变量

参见 `.env.example`：

- `BASE_RPC_URL`: Base 主网 RPC
- `BASE_SEPOLIA_RPC_URL`: Base Sepolia RPC
- `PRIVATE_KEY`: 部署私钥
- `TREASURY_ADDRESS`: 项目金库地址
- `NFT_BASE_URI`: NFT 元数据前缀，例如 `ipfs://.../`
- `USDC_ADDRESS`: 自定义 USDC 地址（不填则自动使用 Base 官方 USDC）
- `OWNER_ADDRESS`: 合约 Owner 地址（不填则默认使用部署账号）
- `BASESCAN_API_KEY`: BaseScan API Key（用于合约验证）

## 部署顺序

部署脚本自动执行：
1. 部署 `OreNFT`
2. 部署 `BlockOre`
3. 调用 `OreNFT.setMinter(address(blockOre))`

部署结果保存到 `contracts/deployments/` 目录。
