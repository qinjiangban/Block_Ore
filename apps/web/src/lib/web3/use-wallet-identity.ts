"use client";

import { useEnsName, useEnsAvatar } from "wagmi";
import { mainnet } from "viem/chains";

/**
 * 解析钱包身份信息：
 * 1. 如果钱包在 Base 链上有 Basename，优先使用
 * 2. 否则回退到 Ethereum 主网 ENS
 * 3. 头像同样按 Base → Ethereum 回退
 */
export function useWalletIdentity(address?: `0x${string}`) {
  // 尝试 Base 主网 ENS（Basename）
  const { data: baseEnsName } = useEnsName({
    address,
    chainId: 8453, // Base mainnet
    query: { enabled: Boolean(address) },
  });

  const { data: baseEnsAvatar } = useEnsAvatar({
    name: baseEnsName ?? undefined,
    chainId: 8453,
    query: { enabled: Boolean(baseEnsName) },
  });

  // 回退到 Ethereum 主网 ENS
  const { data: ethEnsName } = useEnsName({
    address,
    chainId: mainnet.id,
    query: { enabled: Boolean(address) && !baseEnsName },
  });

  const { data: ethEnsAvatar } = useEnsAvatar({
    name: ethEnsName ?? undefined,
    chainId: mainnet.id,
    query: { enabled: Boolean(ethEnsName) },
  });

  // Base ENS 优先级 > Ethereum ENS
  const displayName = baseEnsName ?? ethEnsName ?? null;
  const avatarUrl = baseEnsAvatar ?? ethEnsAvatar ?? null;

  return { displayName, avatarUrl };
}
