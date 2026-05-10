export function Footer() {
  const cols: [string, string[]][] = [
    ["Protocol", ["Overview", "Architecture", "Roadmap", "Whitepaper"]],
    ["Build", ["Docs", "SDK", "Examples", "GitHub"]],
    ["Network", ["Explorer", "Status", "Validators", "Bridges"]],
    ["Community", ["Discord", "X", "Blog", "Brand"]],
  ];
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rotate-45 bg-primary" />
              <span className="text-sm font-semibold tracking-tight text-foreground">Synapse</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              No servers. No middlemen. Just agents.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 border border-border px-3 py-1.5">
              <span className="status-dot" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Devnet · operational
              </span>
            </div>
          </div>
          {cols.map(([head, links]) => (
            <div key={head}>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {head}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-foreground/85 transition hover:text-primary">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 md:flex-row md:items-center">
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
            © 2026 Synapse · Open protocol · Built on Solana
          </p>
          <div className="flex gap-6">
            <a href="#" className="font-mono text-[11px] text-muted-foreground transition hover:text-foreground">Privacy</a>
            <a href="#" className="font-mono text-[11px] text-muted-foreground transition hover:text-foreground">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
