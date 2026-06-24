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
│   └── vercel-sync-env.mjs            # 推送到 Vercel 环境变量
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

| 命令                               | 说明                                |
| ---------------------------------- | ----------------------------------- |
| `npm run web:dev`                  | 启动前端开发服务器                  |
| `npm run web:build`                | 构建前端                            |
| `npm run contracts:compile`        | 编译合约 + 同步 ABI 到前端          |
| `npm run contracts:test`           | 运行合约测试                        |
| `npm run contracts:deploy:sepolia` | 部署合约到 Base Sepolia             |
| `npm run contracts:deploy:base`    | 部署合约到 Base 主网                |
| `npm run deploy:sepolia`           | 编译 + 部署 + 同步地址（本地 .env） |
| `npm run deploy:sepolia:vercel`    | 编译 + 部署 + 同步 + 推送到 Vercel  |

## 数据流

```
用户操作 → Wagmi/Privy → 链上交易（BlockOre 合约）
                ↓
        链上事件 → Adapter 解析 → Zustand Store → 页面渲染
```

前端通过 `onchain-block-ore-adapter` 读取链上数据（事件日志、合约状态），不依赖中心化后端。

## 支持的网络

| 网络              | 用途           | USDC                   |
| ----------------- | -------------- | ---------------------- |
| **Base Sepolia**  | 当前生产环境   | `0x036CbD...`（官方）  |
| **Base 主网**     | 正式上线后切换 | `0x833589f...`（官方） |
| **Hardhat Local** | 本地开发测试   | MockUSDC 自动部署      |

## 环境变量

首次运行前需配置：

- **前端** → 复制 `apps/web/.env.example` 为 `.env.development.local`，填入 Privy App ID 和合约地址
- **合约** → 复制 `contracts/.env.example` 为 `contracts/.env`，填入部署私钥和金库地址
- **Vercel**（可选）→ 在根目录 `.env` 中设置 `VERCEL_TOKEN` 和 `VERCEL_PROJECT_ID`

## Vercel 部署

1. 在 [vercel.com](https://vercel.com) 导入 `apps/web` 作为 Root Directory
2. 在 Dashboard 设置环境变量（参考 `apps/web/.env.production.local`）
3. 部署新合约后运行 `npm run deploy:sepolia:vercel` 自动同步地址


