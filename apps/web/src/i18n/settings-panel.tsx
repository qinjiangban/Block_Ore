"use client";

import { useState } from "react";
import {
  Globe,
  Music,
  Volume2,
  BookOpen,
  Info,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useSettingsContext } from "@/store/settings-context";
import { locales, localeLabels, type Locale } from "./constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

type SettingsView = "main" | "language";

export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SettingsView>("main");
  const currentLocale = useLocale() as Locale;
  const { musicEnabled, soundEnabled, setMusic, setSound } = useSettingsContext();

  const handleClose = () => {
    setOpen(false);
    setView("main");
  };

  const handleSelectLang = (next: Locale) => {
    // Set cookie and reload — next-intl picks it up server-side
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
    setView("main");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setView("main");
        }}
        className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.06] p-2 text-white/70 transition hover:border-white/20 hover:bg-white/10"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={handleClose} />
          <div className="absolute right-0 top-full z-30 mt-2 w-[250px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1225] shadow-[0_24px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            {view === "main" && (
              <div className="w-[250px] px-2 py-2">
                {/* 语言 */}
                <button
                  type="button"
                  onClick={() => setView("language")}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-xs transition text-white/70 hover:bg-white/5 hover:text-white"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">Language</span>
                  <span className="text-white/40">{localeLabels[currentLocale]}</span>
                </button>

                {/* 音乐 */}
                <div className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-xs text-white/70">
                  <Music className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">Music</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={musicEnabled}
                    onClick={() => setMusic(!musicEnabled)}
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full transition",
                      musicEnabled
                        ? "bg-[#00D4FF]"
                        : "bg-white/15",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                        musicEnabled && "translate-x-4",
                      )}
                    />
                  </button>
                </div>

                {/* 音效 */}
                <div className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-xs text-white/70">
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">Sound Effects</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={soundEnabled}
                    onClick={() => setSound(!soundEnabled)}
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full transition",
                      soundEnabled
                        ? "bg-[#00D4FF]"
                        : "bg-white/15",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                        soundEnabled && "translate-x-4",
                      )}
                    />
                  </button>
                </div>

                <div className="my-1 border-t border-white/[0.06]" />

                {/* 游戏说明 */}
                <Link
                  href="/guide"
                  onClick={handleClose}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-xs text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">Game Guide</span>
                </Link>

                {/* 关于 */}
                <Link
                  href="/about"
                  onClick={handleClose}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-xs text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <Info className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">About</span>
                </Link>
              </div>
            )}

            {view === "language" && (
              <div className="px-2 py-2">
                <button
                  type="button"
                  onClick={() => setView("main")}
                  className="flex w-full items-center gap-1.5 rounded-xl px-2 py-2 text-xs text-white/50 transition hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                <div className="my-1 border-t border-white/[0.06]" />
                {locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => handleSelectLang(l)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-xs transition",
                      currentLocale === l
                        ? "bg-[#00D4FF]/10 text-[#00D4FF]"
                        : "text-white/50 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {localeLabels[l]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
