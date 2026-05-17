"use client";

import Link from "next/link";
import { useI18n } from "@/context/I18nContext";
import {
  ArrowUpRight,
  Globe2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export function Footer() {
  const { t } = useI18n();

  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    company: [
      { label: "About", href: "/about" },
      { label: "Support", href: "/dashboard" },
    ],
    legal: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/6 px-4 pb-10 pt-24 md:px-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-[#84CC16]/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 grid grid-cols-1 gap-4 rounded-[2rem] border border-white/8 bg-white/2 p-4 backdrop-blur-xl md:p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border border-white/6 bg-bg-section/85 p-6 md:p-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-citrus text-white font-bold shadow-[0_0_24px_rgba(249,115,22,0.25)]">
                F
              </div>
              <div>
                <span className="block text-lg font-bold tracking-tight text-white">
                  flatmate
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-white/30">
                  household balance
                </span>
              </div>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/45">
              Co-living without the chaos. Split bills, track chores, and keep
              every shared home moving with less friction and more clarity.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { icon: Sparkles, label: "Simple setup" },
                { icon: ShieldCheck, label: "Private by default" },
                { icon: Globe2, label: "Built for shared homes" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-white/55"
                >
                  <item.icon className="h-3.5 w-3.5 text-accent" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-[1.5rem] border border-white/6 bg-white/1.5 p-4 md:p-5">
            {[
              {
                title: "Share less stress",
                body: "Keep expenses, chores, and reminders in one place.",
              },
              {
                title: "Feels more premium",
                body: "Soft glow, clear hierarchy, and stronger closing presence.",
              },
              {
                title: "Still lightweight",
                body: "The footer stays calm, responsive, and easy to scan.",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className={`rounded-2xl border border-white/6 bg-[#050505]/70 p-4 ${
                  index === 0 ? "shadow-[0_0_0_1px_rgba(249,115,22,0.05)]" : ""
                }`}
              >
                <p className="text-sm font-semibold text-white/85">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/38">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 border-t border-white/6 pt-8 md:grid-cols-[1.1fr_0.9fr_0.7fr]">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-[0.16em] text-white/40">
              Product
            </h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-white/35 transition-colors hover:text-white/80"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3.5 w-3.5 text-white/20 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-[0.16em] text-white/40">
              Company
            </h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-white/35 transition-colors hover:text-white/80"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3.5 w-3.5 text-white/20 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-[0.16em] text-white/40">
              Legal
            </h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-white/35 transition-colors hover:text-white/80"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3.5 w-3.5 text-white/20 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/6 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-white/25">
            {t("landing.footer.copyright", {
              year: new Date().getFullYear(),
            }) || `${new Date().getFullYear()} FlatMate. All rights reserved.`}
          </p>
          <div className="flex items-center gap-2 text-xs text-white/25">
            <Zap className="h-3.5 w-3.5 text-accent/50" />
            Designed for modern co-living
          </div>
        </div>
      </div>
    </footer>
  );
}
