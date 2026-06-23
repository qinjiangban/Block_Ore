"use client";

import { useCallback, useRef, useState } from "react";
import { useSwitchChain, useAccount } from "wagmi";

import { supportedChains, chainLabelById, defaultChain } from "@/lib/web3/chains";

export function NetworkSwitcher() {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const currentId = chain?.id ?? defaultChain.id;
  const currentLabel = chainLabelById[currentId] ?? "Base";

  const handleSelect = useCallback(
    (chainId: number) => {
      if (chainId === currentId) {
        setOpen(false);
        return;
      }
      switchChain?.({ chainId });
      setOpen(false);
    },
    [currentId, switchChain],
  );

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] text-white/70 transition hover:border-white/20 hover:text-white"
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            backgroundColor:
              currentId === 8453 || currentId === 84532
                ? "#0052FF"
                : "#627EEA",
          }}
        />
        {currentLabel}
        <svg
          className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-white/10 bg-[#111827] shadow-xl">
            {supportedChains.map((ch) => {
              const active = ch.id === currentId;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelect(ch.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-xs transition ${
                    active
                      ? "bg-cobalt/15 text-cobalt"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        ch.id === 8453 || ch.id === 84532
                          ? "#0052FF"
                          : "#627EEA",
                    }}
                  />
                  {chainLabelById[ch.id] ?? `Chain #${ch.id}`}
                  {active && (
                    <svg
                      className="ml-auto h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
