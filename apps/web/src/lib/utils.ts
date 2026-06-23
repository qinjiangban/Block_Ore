import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const shortenAddress = (value?: string) => {
  if (!value) {
    return "未连接";
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("zh-CN").format(value);

export const createMockWallet = () => {
  const segment = () => Math.floor(Math.random() * 16).toString(16);
  const address = Array.from({ length: 40 }, segment).join("");
  return `0x${address}` as `0x${string}`;
};

export const createTxHash = () => {
  const segment = () => Math.floor(Math.random() * 16).toString(16);
  return `0x${Array.from({ length: 64 }, segment).join("")}` as `0x${string}`;
};
