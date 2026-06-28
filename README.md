# Block Ore

链上挖矿游戏 — 购买矿镐、挖掘矿石、Reveal 稀有 NFT，全部在 Base 链上真实执行。

## 项目结构

```
Block_Ore/
├── apps/
│   └── web/                      # 前端 Next.js 应用
│       ├── src/
│       │   ├── app/              # 页面路由
│       │   │   ├── page.tsx              # 首页
│       │   │   ├── mine/page.tsx         # 挖矿页
│       │   │   ├── shop/page.tsx         # 商店（矿镐购买）
│       │   │   ├── inventory/page.tsx    # 背包（NFT 列表）
│       │   │   ├── leaderboard/page.tsx  # 排行榜
│       │   │   ├── player/[address]/     # 玩家主页
│       │   │   ├── admin/page.tsx        # 管理面板
│       │   │   ├── about/page.tsx        # 游戏介绍
│       │   │   └── guide/page.tsx        # 玩法指南
│       │   ├── components/       # UI 组件
│       │   │   ├── providers/             # 全局 Provider
│       │   │   ├── ui/                    # 基础 UI（button 等）
│       │   │   ├── app-shell.tsx          # 应用壳（导航 + 钱包）
│       │   │   ├── mine-crystal.tsx       # 挖矿水晶动画
│       │   │   ├── ore-result-card.tsx    # 挖矿结果卡片
│       │   │   ├── pickaxe-shop.tsx       # 矿镐商店组件
│       │   │   ├── ore-inventory-grid.tsx # NFT 网格
│       │   │   ├── leaderboard-tabs.tsx   # 排行榜标签
│       │   │   ├── player-stats-card.tsx  # 玩家统计卡片
│       │   │   ├── wallet-session-card.tsx# 钱包会话
│       │   │   ├── purchase-receipt-card.tsx # 购买凭证
│       │   │   ├── reveal-timeline.tsx    # Reveal 时间线
│       │   │   ├── share-battle-card.tsx  # 分享战斗卡
│       │   │   ├── achievement-list.tsx   # 成就列表
│       │   │   └── toast-stack.tsx        # 提示堆栈
│       │   ├── lib/
│       │   │   ├── adapters/             # 链上数据适配层
│       │   │   │   ├── provider.tsx/.ts          # 数据 Provider
│       │   │   │   └── onchain-block-ore-adapter.ts # 链上读/写适配器
│       │   │   ├── contracts/
│       │   │   │   ├── abis/                     # ABI（编译时自动同步）
│       │   │   │   └── addresses.ts              # 合约地址注册
│       │   │   ├── web3/
│       │   │   │   ├── wagmi-config.ts           # Wagmi 配置
│       │   │   │   ├── use-wallet-identity.ts    # ENS/钱包身份
│       │   │   │   └── chains.ts                 # 链定义
│       │   │   ├── shims/               # 传递依赖的类型垫片
│       │   │   ├── env.ts               # 环境变量 + 默认值
│       │   │   ├── types.ts             # 公共类型
│       │   │   ├── utils.ts             # 工具函数
│       │   │   └── game-data.ts         # 游戏数据定义
│       │   ├── store/
│       │   │   ├── game-store.ts        # 游戏状态（Zustand）
│       │   │   └── settings-store.ts    # 设置状态
│       │   └── i18n/
│       │       ├── locale-provider.tsx   # 国际化 Provider
│       │       ├── locale-store.ts       # 语言状态（Zustand + 持久化）
│       │       ├── settings-panel.tsx    # 语言设置面板
│       │       ├── request.ts           # next-intl 请求配置
│       │       ├── detect.ts            # 浏览器语言检测
│       │       ├── constants.ts         # 语言列表常量
│       │       └── locale-constants.ts  # 语言文件加载
│       ├── messages/            # 7 国语言翻译 JSON
│       │   ├── en.json
│       │   ├── zh-Hans.json
│       │   ├── zh-Hant.json
│       │   ├── ja.json
│       │   ├── ko.json
│       │   ├── fr.json
│       │   └── es.json
│       ├── public/metadata/     # NFT 元数据
│       │   ├── diamond.json
│       │   └── genesis.json
│       ├── next.config.ts
│       └── package.json
│
├── contracts/                   # Hardhat 3 合约工程
│   ├── contracts/
│   │   ├── BlockOre.sol          # 主合约（挖矿、Reveal、Treasury）
│   │   ├── OreNFT.sol            # NFT 铸造合约
│   │   └── mocks/MockUSDC.sol    # 本地测试 Mock USDC
│   ├── scripts/deploy.ts         # 部署脚本
│   ├── test/BlockOre.test.ts     # 4 个核心测试用例
│   ├── hardhat.config.ts         # Hardhat 3 配置（viem 插件）
│   └── package.json
│
├── scripts/                     # 根级自动化脚本
│   ├── sync-contract-artifacts.mjs    # 同步 ABI 到前端
│   ├── sync-deployment-addresses.mjs  # 部署地址回填 .env
│   ├── push-vercel-production-env.mjs # 推送 .env.production.local 到 Vercel
│
├── docs/                        # 设计文档
├── subgraph/                    # 子图索引（待开发）
├── packages/                    # 共享包（待开发）
├── package.json                 # 根级脚本编排
└── .gitignore
```

## 技术栈

### 前端（`apps/web/`）

| 技术                    | 用途                        |
| ----------------------- | --------------------------- |
| **Next.js 16**          | React 框架（Turbopack）     |
| **Wagmi 3 + Viem**      | 链上交互                    |
| **Privy**               | 社交登录/钱包登录           |
| **Zustand**             | 状态管理 + 持久化           |
| **next-intl**           | 国际化（7 国语言）          |
| **Tailwind CSS**        | 样式                        |
| **shadcn/ui + Base UI** | UI 组件库                   |
| **ox**                  | ERC-8021 Builder Codes 支持 |

### 合约（`contracts/`）

| 技术                 | 用途                    |
| -------------------- | ----------------------- |
| **Hardhat 3**        | 编译、测试、部署框架    |
| **Solidity ^0.8.29** | 合约语言（EVM `osaka`） |
| **viem**             | 合约交互工具链          |
| **node:test**        | 测试框架                |
| **OpenZeppelin**     | ERC-721、Ownable 标准   |

## 快速开始

```powershell
# 安装前端依赖
npm run web:install

# 安装合约依赖
npm run contracts:install

# 启动开发服务器
npm run web:dev
```

## 常用命令

| 命令                                  | 说明                                                         |
| ------------------------------------- | ------------------------------------------------------------ |
| `npm run web:dev`                     | 启动前端开发服务器                                           |
| `npm run web:build`                   | 构建前端                                                     |
| `npm run contracts:compile`           | 编译合约并同步 ABI 到前端                                    |
| `npm run contracts:test`              | 运行合约测试                                                 |
| `npm run contracts:deploy:sepolia`   | 部署合约到 Base Sepolia                                      |
| `npm run contracts:deploy:base`      | 部署合约到 Base 主网                                         |
| `npm run deploy:sepolia`             | 编译 + 部署 + 同步地址到本地 .env                            |
| `npm run deploy:base`                | 编译 + 部署到 Base 主网 + 同步地址到本地 .env                |
| `npm run vercel:push:production`     | 将 `apps/web/.env.production.local` 全量推送到 Vercel production |

## 数据流

```
用户操作 → Privy/Wagmi → 链上交易（BlockOre / OreNFT 合约）
                ↓
        链上事件 → onchain-block-ore-adapter 解析 → GameContext → 页面渲染
```

- **Privy**：负责钱包连接、社交登录、签名授权
- **Wagmi/Viem**：发起合约调用、读取链上状态
- **onchain-block-ore-adapter**：封装所有链上数据访问，统一解析合约事件与状态
- **GameContext（React Context + useReducer）**：管理用户会话、钱包地址、链上统计、通知 toast

## 支持的网络

| 网络              | 环境变量 `NEXT_PUBLIC_BASE_NETWORK` | USDC / 说明                                |
| ----------------- | ----------------------------------- | ------------------------------------------ |
| **Base Sepolia**  | `sepolia`                           | `0x036CbD53842c5426634e7929541eC2318f3dCF7e`（官方测试网 USDC） |
| **Base 主网**     | `mainnet`                           | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`（官方 USDC）        |
| **Hardhat Local** | `sepolia`（开发默认）                | 本地 MockUSDC，通过 `contracts/scripts/deploy.ts` 自动部署       |

- 开发环境（`NODE_ENV=development`）默认启用 **Base Sepolia + Hardhat Local**
- 生产环境（`NODE_ENV=production`）启用 **Ethereum 主网 + Base 主网**
- RPC 默认使用 Alchemy，在 `.env` 中配置 `NEXT_PUBLIC_ALCHEMY_API_KEY`

## 环境变量

前端配置文件：`apps/web/.env.development.local` / `.env.production.local`

| 变量名                                | 说明                                              | 示例值                                      |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_PRIVY_APP_ID`            | Privy App ID                                      | `cm-...`                 |
| `NEXT_PUBLIC_PRIVY_CLIENT_ID`         | Privy Client ID                                   | `client-...`                                |
| `PRIVY_APP_SECRET`                    | Privy App Secret（仅服务端使用，不要加 NEXT_PUBLIC） | `privy_app_secret_...`                      |
| `NEXT_PUBLIC_ALCHEMY_API_KEY`         | Alchemy API Key                                   | `...`                     |
| `BASE_BUILDER_CODE`                   | Base Builder Code                                 | `bc_kvfh7urx`                               |
| `NEXT_PUBLIC_BASE_NETWORK`            | 当前网络：`sepolia` 或 `mainnet`                  | `sepolia`                                   |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`    | Base Sepolia Alchemy RPC URL                      | `https://base-sepolia.g.alchemy.com/v2/`    |
| `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`    | Base Mainnet Alchemy RPC URL                      | `https://base-mainnet.g.alchemy.com/v2/`    |
| `NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL`| Ethereum Sepolia Alchemy RPC URL                  | `https://eth-sepolia.g.alchemy.com/v2/`     |
| `NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL`| Ethereum Mainnet Alchemy RPC URL                  | `https://eth-mainnet.g.alchemy.com/v2/`     |
| `NEXT_PUBLIC_HARDHAT_RPC_URL`         | Hardhat 本地节点 RPC URL                          | `http://127.0.0.1:8545`                     |
| `NEXT_PUBLIC_BLOCK_ORE_ADDRESS_BASE`  | BlockOre 主网合约地址                             | `0x...`                                     |
| `NEXT_PUBLIC_ORE_NFT_ADDRESS_BASE`    | OreNFT 主网合约地址                               | `0x...`                                     |
| `NEXT_PUBLIC_BLOCK_ORE_ADDRESS_BASE_SEPOLIA` | BlockOre Sepolia 合约地址                  | `0x9c49a5b77604c3584079de1445d80f84a981f092` |
| `NEXT_PUBLIC_ORE_NFT_ADDRESS_BASE_SEPOLIA`   | OreNFT Sepolia 合约地址                    | `0xef1525faf0c7886d1fa21852461d4405f6237ab9` |
| `NEXT_PUBLIC_BLOCK_ORE_ADDRESS_HARDHAT` | Hardhat 本地 BlockOre 地址                       | `0x...`                                     |
| `NEXT_PUBLIC_ORE_NFT_ADDRESS_HARDHAT` | Hardhat 本地 OreNFT 地址                         | `0x...`                                     |
| `NEXT_PUBLIC_USDC_ADDRESS_HARDHAT`   | Hardhat 本地 MockUSDC 地址                        | `0x...`                                     |

合约部署配置文件：`contracts/.env`

| 变量名           | 说明                                  |
| ---------------- | ------------------------------------- |
| `PRIVATE_KEY`    | 部署者私钥                            |
| `BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC URL            |
| `BASE_RPC_URL`   | Base 主网 RPC URL                     |
| `OWNER_ADDRESS`  | 合约 owner 地址，默认等于部署地址       |

## Vercel 部署

1. 在 [vercel.com](https://vercel.com) 导入项目，Root Directory 选择 `apps/web`
2. 复制 `apps/web/.env.production.local` 内容到 Vercel 环境变量，或本地配置后运行推送脚本
3. 推送环境变量到 Vercel production：

```bash
# 在根目录 .env 中配置 VERCEL_TOKEN 和 VERCEL_PROJECT_ID
node ./scripts/push-vercel-production-env.mjs
```

脚本会读取 `apps/web/.env.production.local`，对 Vercel production 环境变量执行：

- 本地存在、Vercel 存在 → **更新**
- 本地存在、Vercel 不存在 → **创建**
- Vercel 存在、本地不存在 → **删除**


