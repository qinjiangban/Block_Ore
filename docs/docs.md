# Block Ore（挖区块矿石）

## 产品定位

Block Ore 是一个部署在 Base 链上的轻量级 Consumer DApp。

用户每天通过挖掘 Base 区块矿石获得积分、成就 NFT 和稀有矿石 NFT。

项目目标：

- 提升 Base 链活跃交易
- 提升 Base App 用户活跃度
- 构建可持续运营的链上小游戏
- 保持低门槛和高留存
- 通过矿镐销售获得开发者收入

---

# 核心原则

## 不发行 Token

无 ERC20

无空气币

无治理币

---

## 不做质押

无 Staking

无 LP

无收益农场

---

## 不做 DAO

无需治理

无需投票

---

## 所有奖励链上记录

积分

NFT

挖矿次数

排行榜数据

全部来源于链上事件

---

## 无中心化数据库

禁止：

MySQL

PostgreSQL

MongoDB

Supabase

Redis

Firebase

---

## 排行榜

采用 The Graph Subgraph

索引链上事件

前端实时读取

---

# 技术架构

## Frontend

Next.js 最新版

TypeScript

TailwindCSS

shadcn/ui @base-ui/react

framer-motion

Lottie React

react-icons

next-intl

wagmi

viem

Privy

---

## Wallet

Privy

支持：

- Base Wallet
- Coinbase Wallet
- Smart Wallet
- Email Wallet

---

## Contract

Foundry

Solidity

OpenZeppelin

---

## Network

Base Mainnet

Base Sepolia

Event
↓
The Graph
↓
前端读取

无需数据库

IPFS存储NFT图片

---

block-ore/

├── apps
│   └── web
│
├── contracts
│   ├── BlockOre.sol
│   └── OreNFT.sol
│
├── subgraph
│
├── packages
│   ├── ui
│   └── config
│
└── docs
项目文件结构类似
Monorepo。

## Monorepo 依赖策略

### 根目录 `package.json`

只保留：

- workspaces
- 跨 workspace 的统一脚本
- 仓库级开发工具

不要放：

- Next.js
- React
- TailwindCSS
- shadcn/ui 生成组件依赖
- @base-ui/react
- wagmi
- viem
- Privy

原因：

避免和 `apps/web` 重复声明版本

避免 npm workspace 安装时出现 peer dependency 冲突

保持根目录只负责 Monorepo 调度

### `apps/web/package.json`

作为唯一前端依赖入口。

前端运行时与前端构建依赖都放在这里，包括：

- next
- react
- react-dom
- tailwindcss
- @tailwindcss/postcss
- @base-ui/react
- framer-motion
- lottie-react
- react-icons
- next-intl
- wagmi
- viem
- @privy-io/react-auth
- @privy-io/wagmi

规则：

如果某个包只被 Web 前端使用，就只安装在 `apps/web`

### `packages/ui`

只放可复用组件和设计系统代码。

建议：

shadcn/ui 组件先生成在 `apps/web/src/components/ui`

当多个 app 需要复用时，再抽到 `packages/ui`

### `packages/config`

放共享常量、链配置、业务枚举、通用 schema。

不要把前端运行时依赖放进来。

### 安装与加包规则

统一在仓库根目录执行 npm workspace 命令。

安装某个前端依赖：

`npm install <package> --workspace apps/web`

安装某个前端开发依赖：

`npm install -D <package> --workspace apps/web`

给共享包安装依赖：

`npm install <package> --workspace packages/ui`

只要还在使用 npm workspaces，锁文件只保留根目录 `package-lock.json`

不要提交 `apps/web/package-lock.json`

### 当前项目约定

- `apps/web`：唯一前端应用和前端依赖入口
- `packages/ui`：后续沉淀复用 UI 组件
- `packages/config`：共享链配置与业务常量
- `scripts`：部署、同步 ABI、环境处理脚本
- 根目录：workspace、统一脚本、仓库级工具

这样管理最适合当前 `Next.js 16 + TailwindCSS + @base-ui/react + Privy + wagmi + viem` 的结构



## 设计原则

移动端优先

参考：
BaseUI

Base App

Zora

Farcaster

---

最大宽度：

430px

居中显示

---

桌面端

仅放大

不增加侧边栏

不改变交互逻辑

保持与移动端一致

---

# 首页

顶部：

Block Ore Logo

---

显示：

当前积分

今日剩余次数

累计挖矿次数

---

按钮：

开始挖矿

我的矿石

排行榜

---

# 挖矿页面

主视觉：

矿石区域

点击矿石

立即播放动画

动画时间：

2秒

---

动画结束

显示：

正在解析区块...

---

Reveal完成

显示结果

---

获得：

Stone

Iron

Silver

Gold

Diamond

Genesis

---

# 每日次数

免费次数：

10次

每日UTC 00:00重置

---

# 付费矿镐

普通矿镐

价格：

0.0005 ETH

获得：

10次挖矿次数

---

高级矿镐

价格：

0.002 ETH

获得：

50次挖矿次数

---

钻石矿镐

价格：

0.0035 ETH

获得：

100次挖矿次数

---

# 每日限制

免费：

10次

---

付费：

最多100次

---

每日总次数：

110次

---

# 收入模型

用户购买矿镐

资金直接进入：

Treasury

---

合约：

withdrawTreasury()

仅Owner可提取

---

项目收入来源：

矿镐销售

无发币

无手续费

---

# 随机数机制

目标：

开发者无法控制

用户无法控制

无需VRF

无需Oracle

---

用户点击挖矿

mine()

记录：

钱包地址

当前区块

nonce

---

等待：

3个区块

---

Reveal

随机数：

random =
keccak256(
user,
nonce,
blockhash(requestBlock + 3)
)

---

根据随机数

决定矿石结果

---

# 矿石等级

Stone

60%

积分：

1

---

Iron

25%

积分：

5

---

Silver

10%

积分：

20

---

Gold

4%

积分：

100

---

Diamond

0.9%

积分：

500

可铸造NFT

---

Genesis

0.1%

积分：

2000

可铸造NFT

---

# 创世矿

Genesis NFT

永久总量：

1000

---

达到：

1000

后停止产出

---

自动降级：

Diamond

---

# NFT系统

ERC721

---

Diamond NFT

Diamond Ore

---

Genesis NFT

Genesis Ore

---

Metadata存储

Base链上

或IPFS

---

# 用户数据

记录：

总积分

总挖矿次数

Stone数量

Iron数量

Silver数量

Gold数量

Diamond数量

Genesis数量

---

# 排行榜

按积分排序

---

Top 10

Top 100

Top 1000

---

数据来源：

Subgraph

---

不允许后台修改

---

# 智能合约

## BlockOre.sol

核心逻辑

mine()

reveal()

buyMiningPass()

claimReward()

getUserStats()

---

## OreNFT.sol

mintDiamond()

mintGenesis()

tokenURI()

---

# 成就系统

初级矿工

累计10次

---

高级矿工

累计100次

---

黄金矿工

获得10个Gold

---

钻石猎人

获得5个Diamond

---

创世发现者

获得Genesis

---

# Base App兼容

遵循 Builder Codes

支持：

Base App

Base Wallet

Coinbase Smart Wallet

Privy Embedded Wallet

---

# MVP目标

第一版上线内容：

钱包登录

挖矿

Reveal

积分

NFT

排行榜

矿镐购买

Base主网部署

分享挖矿战绩

---

暂不开发其他功能：

市场交易

好友系统

邀请系统

代币系统

DAO

质押

公会

---

本地开发用测试网,部署后用主网
