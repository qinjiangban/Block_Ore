"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { RiGithubLine, RiTwitterLine, RiGlobeLine, RiArrowLeftLine, RiHeartLine } from "react-icons/ri";

import { AppShell, Panel } from "@/components/app-shell";

const SOCIAL_LINKS = [
  {
    label: "GitHub",
    url: "https://github.com",
    icon: RiGithubLine,
  },
  {
    label: "Twitter / X",
    url: "https://x.com",
    icon: RiTwitterLine,
  },
  {
    label: "Website",
    url: "https://example.com",
    icon: RiGlobeLine,
  },
];

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <AppShell
      aside={
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-xs text-white/60 transition hover:border-white/20 hover:text-white"
        >
          <RiArrowLeftLine className="h-3.5 w-3.5" />
          {t("back")}
        </Link>
      }
    >
      <Panel>
        <p className="text-xs text-cobalt/70">{t("about")}</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Block Ore</h2>
        <p className="mt-4 text-sm leading-relaxed text-white/65">
          {t("desc1")}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          {t("desc2")}
        </p>
      </Panel>

      <Panel>
        <p className="text-xs text-cobalt/70">{t("developer")}</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{t("builtWith")}</h2>
        <p className="mt-4 text-sm leading-relaxed text-white/65">
          {t("devDesc")}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-white/50">
          <RiHeartLine className="h-3.5 w-3.5 text-[#FF6B7A]" />
          <span>{t("thanks")}</span>
        </div>
      </Panel>

      <Panel>
        <p className="text-xs text-cobalt/70">{t("connect")}</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{t("socials")}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {SOCIAL_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </a>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <p className="text-xs text-cobalt/70">{t("techStack")}</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{t("poweredBy")}</h2>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
          {[
            "Next.js",
            "Wagmi",
            "Privy",
            "Solana",
            "Tailwind CSS",
            "shadcn/ui",
            "Viem",
            "next-intl",
          ].map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1.5"
            >
              {tech}
            </span>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
