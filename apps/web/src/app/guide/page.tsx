"use client";

import Link from "next/link";
import { RiArrowLeftLine } from "react-icons/ri";
import { AppShell, Panel } from "@/components/app-shell";

const oreTable = [
  { label: "石头 (STONE)", chance: "60%", points: "1", nft: "—" },
  { label: "铁矿 (IRON)", chance: "25%", points: "5", nft: "—" },
  { label: "银矿 (SILVER)", chance: "10%", points: "20", nft: "—" },
  { label: "金矿 (GOLD)", chance: "4%", points: "100", nft: "—" },
  { label: "钻石 (DIAMOND)", chance: "0.9%", points: "500", nft: "✓" },
  { label: "创世 (GENESIS)", chance: "0.1%", points: "2,000", nft: "✓" },
];

const pickaxeTable = [
  { label: "基础矿镐", price: "1.99 USDC", mines: "10 次" },
  { label: "高级矿镐", price: "8.99 USDC", mines: "50 次" },
  { label: "钻石矿镐", price: "16.99 USDC", mines: "100 次" },
];

export default function GuidePage() {
  return (
    <AppShell
      aside={
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-xs text-white/60 transition hover:border-white/20 hover:text-white"
        >
          <RiArrowLeftLine className="h-3.5 w-3.5" />
          返回
        </Link>
      }
    >
      <Panel>
        <p className="text-xs text-cobalt/70">游戏说明</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Block Ore 挖矿指南</h2>
        <p className="mt-4 text-sm leading-relaxed text-white/65">
          Block Ore 是一款轻量级的链上挖矿小游戏。连接你的钱包，在区块链上挖掘各种矿石——从普通的石头到极其稀有的创世矿石，每种矿石都有独特的稀有度、积分价值和 NFT 潜力。
        </p>
      </Panel>

      {/* 游戏流程 */}
      <Panel>
        <p className="text-xs text-cobalt/70">玩法流程</p>
        <h2 className="mt-2 text-xl font-semibold text-white">如何开始挖矿</h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm leading-relaxed text-white/65">
          <li>连接你的钱包（支持 Privy 登录）</li>
          <li>进入挖矿页面，点击水晶发起挖矿请求</li>
          <li>在钱包中确认交易，等待 3 个区块确认（约 1-2 分钟）</li>
          <li>区块确认后，点击&ldquo;揭晓&rdquo;查看挖矿结果</li>
          <li>获得矿石和积分奖励，稀有矿石可触发 NFT 铸造</li>
        </ol>
      </Panel>

      {/* 免费 vs 付费 */}
      <Panel>
        <p className="text-xs text-cobalt/70">挖矿次数</p>
        <h2 className="mt-2 text-xl font-semibold text-white">免费与付费</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/65">
          <div>
            <h3 className="font-semibold text-white">免费挖矿</h3>
            <p className="mt-1">每天自动获得 10 次免费挖矿机会，UTC 00:00 重置。无需任何费用。</p>
          </div>
          <div>
            <h3 className="font-semibold text-white">付费挖矿</h3>
            <p className="mt-1">通过商店购买矿镐可以增加额外挖矿次数，使用 USDC 支付。每日付费上限为 100 次。</p>
          </div>
        </div>
      </Panel>

      {/* 矿镐价格表 */}
      <Panel>
        <p className="text-xs text-cobalt/70">矿镐商店</p>
        <h2 className="mt-2 text-xl font-semibold text-white">矿镐价格</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.04]">
                <th className="px-4 py-3 text-left font-medium text-white/70">矿镐</th>
                <th className="px-4 py-3 text-left font-medium text-white/70">价格</th>
                <th className="px-4 py-3 text-left font-medium text-white/70">增加次数</th>
              </tr>
            </thead>
            <tbody>
              {pickaxeTable.map((row) => (
                <tr key={row.label} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-4 py-3 text-white">{row.label}</td>
                  <td className="px-4 py-3 text-white/65">{row.price}</td>
                  <td className="px-4 py-3 text-white/65">{row.mines}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-white/40">
          注意：购买前需要先授权对应金额的 USDC，授权按档位进行，不设无限授权。
        </p>
      </Panel>

      {/* 矿石概率表 */}
      <Panel>
        <p className="text-xs text-cobalt/70">矿石数据</p>
        <h2 className="mt-2 text-xl font-semibold text-white">矿石类型与概率</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.04]">
                <th className="px-4 py-3 text-left font-medium text-white/70">矿石</th>
                <th className="px-4 py-3 text-left font-medium text-white/70">概率</th>
                <th className="px-4 py-3 text-left font-medium text-white/70">积分</th>
                <th className="px-4 py-3 text-left font-medium text-white/70">NFT</th>
              </tr>
            </thead>
            <tbody>
              {oreTable.map((row) => (
                <tr key={row.label} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-4 py-3 text-white">{row.label}</td>
                  <td className="px-4 py-3 text-white/65">{row.chance}</td>
                  <td className="px-4 py-3 text-white/65">{row.points}</td>
                  <td className="px-4 py-3 text-white/65">{row.nft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* NFT */}
      <Panel>
        <p className="text-xs text-cobalt/70">NFT 系统</p>
        <h2 className="mt-2 text-xl font-semibold text-white">稀有矿石 NFT</h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-white/65">
          <li>挖掘到钻石或创世矿石时，会自动铸造对应的 NFT</li>
          <li>创世 NFT 全球限量 <strong className="text-white">1,000</strong> 枚，先到先得</li>
          <li>创世总量达到上限后，后续创世概率将自动转为钻石</li>
          <li>NFT 存放在你的钱包中，可在仓库页面查看</li>
          <li>NFT 元数据通过链上 URI 获取，支持在市场中查看</li>
        </ul>
      </Panel>

      {/* 积分与排行榜 */}
      <Panel>
        <p className="text-xs text-cobalt/70">排行榜</p>
        <h2 className="mt-2 text-xl font-semibold text-white">积分与排名</h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-white/65">
          <li>每次揭晓后积分直接计入链上账户，永久保存</li>
          <li>排行榜按积分从高到低排序，积分相同时按创世数量、钻石数量、总挖矿次数依次比较</li>
          <li>支持 Top 10、Top 100、Top 1000 三种视图</li>
          <li>连接钱包后自动标记你的排名位置</li>
        </ul>
      </Panel>

      {/* 常见问题 */}
      <Panel>
        <p className="text-xs text-cobalt/70">FAQ</p>
        <h2 className="mt-2 text-xl font-semibold text-white">常见问题</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/65">
          <div>
            <h3 className="font-semibold text-white">为什么需要等待 3 个区块？</h3>
            <p className="mt-1">
              区块延迟确保随机数的安全性。揭晓时使用历史区块哈希作为随机源，避免矿工操纵结果。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white">免费次数什么时候重置？</h3>
            <p className="mt-1">
              每日 UTC 00:00 自动重置 10 次免费挖矿。如果你在北京时区，大约是上午 8:00 重置。
            </p>
          </div>
 
          <div>
            <h3 className="font-semibold text-white">什么是 Genesis 创世矿石？</h3>
            <p className="mt-1">
              创世矿石是游戏中最稀有的矿石，出现概率仅 0.1%（千分之一），每次获得 2,000 积分并铸造限量 NFT。全球仅限 1,000 枚。
            </p>
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
