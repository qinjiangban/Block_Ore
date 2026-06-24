# Block Ore 合约

`contracts/` 是 Block Ore 的 Hardhat 3 合约工程，使用 viem 工具链。

## 技术栈

- **Hardhat 3** — 编译、测试、部署框架
- **Solidity ^0.8.29** — EVM 版本 `osaka`
- **viem** — 合约交互（替代 ethers）
- **node:test** — 测试框架（替代 Mocha + Chai）
- **OpenZeppelin** — ERC-721、Ownable 标准

## 目录

```
contracts/
├── contracts/
│   ├── BlockOre.sol          # 挖矿、Reveal、矿镐购买、积分与 Treasury 主逻辑
│   ├── OreNFT.sol            # Diamond / Genesis NFT 铸造合约
│   └── mocks/
│       └── MockUSDC.sol      # 本地测试用 Mock USDC
├── scripts/
│   └── deploy.ts             # 部署脚本
├── test/
│   └── BlockOre.test.ts      # 单元测试（4 个测试用例）
├── deployments/              # 部署产物（.gitignore）
├── hardhat.config.ts         # Hardhat 3 配置
├── tsconfig.json             # TypeScript ESM 配置
├── .env.example              # 环境变量模板
└── package.json
```

## 快速开始

```powershell
# 安装依赖
cd contracts && npm install

# 编译合约 + 同步 ABI 到前端
npx hardhat build
```

或通过根目录统一管理：

```powershell
npm run contracts:install     # 安装合约依赖
npm run contracts:compile     # 编译 + 同步 ABI 到前端
npm run contracts:test        # 运行测试
```

## 部署

### 本地测试网络

```powershell
# 本地 Hardhat 网络部署（自动部署 MockUSDC）
npx hardhat run scripts/deploy.ts
```

### Base Sepolia（测试网）

```powershell
npm run contracts:deploy:sepolia
```

### Base 主网

```powershell
npm run contracts:deploy:base
```

### 一键部署（编译 → 部署 → 同步）

```powershell
npm run deploy:sepolia                   # 编译 + 部署 + 同步到本地 .env
npm run deploy:sepolia:vercel            # 编译 + 部署 + 本地同步 + 推送到 Vercel
```

部署后合约地址自动写入 `apps/web/.env.development.local` 和 `apps/web/.env.production.local`。

## 环境变量

参见 `.env.example`：

| 变量 | 必填 | 说明 |
|------|------|------|
| `PRIVATE_KEY` | 是 | 部署钱包私钥 |
| `BASE_SEPOLIA_RPC_URL` | 部署 Sepolia 时 | Base Sepolia RPC（默认 `https://sepolia.base.org`） |
| `BASE_RPC_URL` | 部署主网时 | Base 主网 RPC |
| `TREASURY_ADDRESS` | 是 | 金库地址（收取 USDC） |
| `OWNER_ADDRESS` | 否 | 合约 Owner，默认等于部署地址 |
| `NFT_BASE_URI` | 否 | NFT 元数据前缀，默认 `ipfs://block-ore/` |
| `BASESCAN_API_KEY` | 否 | 合约源码验证 |

> USDC 地址无需配置 — Base Sepolia 和 Base 主网的官方 USDC 地址已内置硬编码。本地 Hardhat 网络自动部署 MockUSDC（地址固定 `0x5FbDB...`）。

## 部署顺序

部署脚本自动按序执行：

1. **解析 USDC 地址** — 根据目标网络使用内置地址、环境变量或部署 MockUSDC
2. **部署 OreNFT** — 传入 `initialOwner` 和 NFT 基础 URI
3. **部署 BlockOre** — 关联 OreNFT 和 USDC 地址
4. **授权 Minter** — 调用 `OreNFT.setMinter(blockOre)`
5. **保存部署信息** — 写入 `contracts/deployments/{network}.json`

## 合约特性

### BlockOre.sol
- 矿镐购买（USDC 支付，价格阶梯上涨）
- 免费/付费挖矿配额管理
- 链上可验证 Reveal 挖矿结果
- 积分累计 + 排行榜排名
- USDC 金库提现（Owner 权限）

### OreNFT.sol
- ERC-721 标准
- Diamond / Genesis 两种稀有度
- 仅限 BlockOre 合约铸造
- 元数据 URI 前缀可更新（Owner 权限）

## 测试

```powershell
# 运行全部测试
npx hardhat test

# 通过根目录
npm run contracts:test
```

测试覆盖 4 个核心场景：
- `buyMiningPass` — 购买矿镐后剩余付费挖矿次数
- `mine` — 免费配额消耗
- `reveal` — Reveal 后积分和总次数更新
- `withdrawTreasury` — 金库提取 USDC
