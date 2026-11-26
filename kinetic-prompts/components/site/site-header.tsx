"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

const link =
  "rounded-control px-3 py-2 text-14 font-medium outline-none transition-colors duration-(--dur-hover) ease-kp kp-hover:text-text kp-focus:outline-(length:--focus-w) kp-focus:outline-offset-2 kp-focus:outline-accent kp-focus:outline-solid";

/** Cabecera fija de 64 px. Al hacer scroll se vuelve translúcida con desenfoque de 12 px (única translucidez permitida). */
export function SiteHeader({ count }: { count: number }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-30 h-16 border-b border-transparent transition-colors duration-(--dur-ui) ease-kp data-scrolled:border-border data-scrolled:bg-bg/80 data-scrolled:backdrop-blur-header"
    >
      <div className="mx-auto flex h-full max-w-page items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-control font-display text-16 font-bold tracking-display text-text outline-none kp-focus:outline-(length:--focus-w) kp-focus:outline-offset-2 kp-focus:outline-accent kp-focus:outline-solid"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-control bg-accent font-mono text-14 text-on-accent"
          >
            K
          </span>
          Kinetic Prompts
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          <Link
            href="/animaciones"
            aria-current={pathname === "/animaciones" ? "page" : undefined}
            className={cn(link, pathname === "/animaciones" ? "bg-surface-2 text-text" : "text-text-muted")}
          >
            Animaciones <span className="font-mono text-12 text-text-muted">{count}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
