import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 backdrop-blur-xl transition-colors ${
        scrolled
          ? "bg-background/75 border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rotate-45 bg-primary" />
          <span className="text-sm font-semibold tracking-tight text-foreground">Synapse</span>
          <span className="ml-2 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
            v0.1 · devnet
          </span>
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          <Link to="/docs" hash="protocol" className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground">
            Protocol
          </Link>
          <Link to="/docs" className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground">
            Docs
          </Link>
          <a href="https://github.com/abdushakurob/synapse" target="_blank" rel="noreferrer" className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground">
            GitHub
          </a>
        </nav>
        <Link
          to="/docs"
          className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Start Building
        </Link>
      </div>
    </header>
  );
}
