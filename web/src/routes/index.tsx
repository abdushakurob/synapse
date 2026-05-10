import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/synapse/Nav";
import { Footer } from "@/components/synapse/Footer";
import { Aurora } from "@/components/synapse/Aurora";
import { Reveal } from "@/components/synapse/Reveal";
import { Panel } from "@/components/synapse/Panel";

export const Route = createFileRoute("/")({
  component: Index,
});

const ctaSolid =
  "btn-pill bg-primary text-primary-foreground hover:bg-primary/90";
const ctaGhost =
  "btn-pill border border-border bg-card/40 text-foreground hover:border-primary/50 hover:bg-primary/5";
const sectionPad = "py-28 md:py-40";
const container = "mx-auto max-w-6xl px-6";

const useCases: [string, string, string][] = [
  ["UC.01", "Legal Negotiations", "Two firm agents. Direct conversation. No server reads the terms. No platform that can be subpoenaed."],
  ["UC.02", "Financial Deals", "Agents execute directly. Nobody in the path means nobody can front-run the trade."],
  ["UC.03", "Business Agreements", "Agents coordinate across companies and clouds. Private by default. Nothing to compromise."],
  ["UC.04", "AI-to-AI Negotiation", "Bid. Counter. Accept. No coordinator in the loop. No platform reading the terms."],
  ["UC.05", "Medical Decisions", "Sensitive agent interactions that should never touch a third-party server. They don't."],
  ["UC.06", "Cross-Company Coordination", "Different firms. Different infrastructure. One direct private line between them."],
];

const buildCards: [string, string, string, string][] = [
  ["B.01", "Start Building", "Everything you need to ship an agent on Synapse.", "/docs"],
  ["B.02", "Explore the Protocol", "Understand how Synapse works under the hood.", "/docs"],
  ["B.03", "Contribute", "Open source. Open to everyone.", "https://github.com/abdushakurob/synapse"],
  ["B.04", "Get Support", "Questions? The community is always open.", "#"],
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-14">
        <Aurora />
        <div className="grid-overlay absolute inset-0" aria-hidden />
        <div className={`relative ${container} w-full`}>
          <Reveal className="blur-reveal">
            <h1 className="headline mt-8 max-w-5xl text-[clamp(3rem,9vw,8.5rem)] text-foreground">
              The private internet for AI agents.
            </h1>
          </Reveal>
          <Reveal delay={260} className="blur-reveal">
            <p className="mt-8 max-w-xl text-lg text-muted-foreground">
              The communication layer for the agentic economy. Any agent. Any network. No server between them.
            </p>
          </Reveal>
          <Reveal delay={380}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/docs" className={ctaSolid}>Start Building →</Link>
              <Link to="/docs" className={ctaGhost}>Read the Docs</Link>
            </div>
          </Reveal>
          <Reveal delay={520}>
            <div className="mt-20 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ["~$0.001", "per session"],
                ["< 2s", "to connect"],
                ["0", "servers"],
                ["0", "third parties"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-2xl border border-border bg-card/60 px-5 py-5 backdrop-blur">
                  <div className="text-2xl font-medium tracking-tight text-foreground">{n}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION 01 */}
      <section className={sectionPad}>
        <div className={container}>
          <Reveal delay={120}>
            <h2 className="headline mt-8 max-w-4xl text-4xl text-foreground md:text-6xl">
              Built for what agents<br />actually do.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-12 md:grid-cols-2">
            <Reveal delay={200}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                AI agents are negotiating contracts. Executing trades. Making decisions that matter.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Every one of those conversations passes through a server today. That server sees everything —
                who, when, what. It can be hacked. Subpoenaed. Shut down. Synapse removes it entirely.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 02 — Principles */}
      <section className={sectionPad} id="protocol">
        <div className={container}>
          <Reveal delay={120}>
            <h2 className="headline mt-8 text-4xl text-foreground md:text-6xl">
              Private. Direct. Open.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {[
              ["P.01", "Private", "The conversation belongs to the two agents. Nothing touches a server. Not ours. Not anyone's."],
              ["P.02", "Direct", "One agent to another. The shortest path between two points is a straight line."],
              ["P.03", "Open", "Any agent finds any other and connects. No API keys exchanged. No shared infrastructure needed."],
            ].map(([id, t, b], i) => (
              <Reveal key={t} delay={i * 100} className="h-full">
                <Panel id={id} title={t}>{b}</Panel>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 03 — STATS */}
      <section className={sectionPad}>
        <div className={container}>
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {[
              ["~$0.001", "Cost per session", "Most of it returned."],
              ["< 2s", "Time to open channel", "From initiation to handshake."],
              ["0", "Servers in the path", "Direct, peer-to-peer, by design."],
            ].map(([n, l, sub], i) => (
              <Reveal key={l} delay={i * 100}>
                <div className="panel h-full p-8 md:p-10">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Metric {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="mt-6 text-5xl font-medium tracking-tight text-foreground md:text-6xl">
                    {n}
                  </div>
                  <div className="mt-6 text-sm font-medium text-foreground">{l}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 04 — agentic economy */}
      <section className={sectionPad}>
        <div className={container}>
          <div className="grid items-center gap-16 md:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <h2 className="headline mt-8 text-4xl text-foreground md:text-5xl">
                Every economy needs a communication layer.
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <div className="border-l border-border pl-8">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  The pattern repeats. New economy, new wire.
                </p>
                <ul className="mt-6 space-y-3 font-mono text-sm">
                  <li className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">The human internet</span>
                    <span className="text-foreground">TCP/IP</span>
                  </li>
                  <li className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Global finance</span>
                    <span className="text-foreground">SWIFT</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">The agentic economy</span>
                    <span className="text-primary">Synapse</span>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 05 — USE CASES */}
      <section className={sectionPad}>
        <div className={container}>
          <Reveal delay={120}>
            <h2 className="headline mt-8 max-w-3xl text-4xl text-foreground md:text-6xl">
              What Synapse<br />makes possible.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {useCases.map(([id, t, b], i) => (
              <Reveal key={id} delay={(i % 3) * 80} className="h-full">
                <Panel id={id} title={t}>{b}</Panel>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 06 — FACTS */}
      <section className={sectionPad}>
        <div className={container}>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["F.01", "Built on Solana", "The handshake happens on-chain. Fractions of a cent. The conversation never does."],
              ["F.02", "Open Source", "The protocol belongs to everyone who builds on it."],
              ["F.03", "Production Ready", "Devnet today. Mainnet architecture. Built to scale."],
            ].map(([id, t, b], i) => (
              <Reveal key={id} delay={i * 100} className="h-full">
                <Panel id={id} title={t}>{b}</Panel>
              </Reveal>
            ))}
          </div>
          <Reveal delay={300}>
            <div className="mt-12">
              <a href="https://github.com/abdushakurob/synapse" target="_blank" rel="noreferrer" className={ctaGhost}>View on GitHub →</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION 07 — CODE */}
      <section className={sectionPad} id="docs">
        <div className={container}>
          <Reveal delay={120}>
            <h2 className="headline mt-8 text-4xl text-foreground md:text-6xl">
              Three lines.<br />Completely private.
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <div className="panel mt-14 overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-background/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    synapse.ts
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">TypeScript</span>
              </div>
              <pre className="overflow-x-auto p-6 font-mono text-[13.5px] leading-7 text-foreground md:p-8">
<code>
{[
  ["c-mute", "// 1. Your agent. Your identity."],
  null,
  ["c-kw", "const "],
  ["c-id", "synapse "],
  ["c-mute", "= "],
  ["c-kw", "new "],
  ["c-fn", "Synapse"],
  ["c-mute", "({ "],
  ["c-id", "profile"],
  ["c-mute", ": "],
  ["c-str", `"apex-capital"`],
  ["c-mute", " })\n\n"],
  ["c-mute", "// 2. Find them. Connect directly. No shared server."],
  null,
  ["c-kw", "const "],
  ["c-id", "channel "],
  ["c-mute", "= "],
  ["c-kw", "await "],
  ["c-id", "synapse"],
  ["c-mute", "."],
  ["c-fn", "connect"],
  ["c-mute", "("],
  ["c-str", `"meridian-trading"`],
  ["c-mute", ")\n\n"],
  ["c-mute", "// 3. Talk. Nobody else is listening."],
  null,
  ["c-id", "channel"],
  ["c-mute", "."],
  ["c-fn", "send"],
  ["c-mute", "({ "],
  ["c-id", "type"],
  ["c-mute", ": "],
  ["c-str", `"rfq"`],
  ["c-mute", ", "],
  ["c-id", "asset"],
  ["c-mute", ": "],
  ["c-str", `"SYN"`],
  ["c-mute", ", "],
  ["c-id", "quantity"],
  ["c-mute", ": "],
  ["c-num", "500_000"],
  ["c-mute", " })"],
].map((tok, idx) => {
  if (tok === null) return "\n";
  const [cls, txt] = tok;
  const color =
    cls === "c-kw" ? "text-primary" :
    cls === "c-fn" ? "text-foreground" :
    cls === "c-str" ? "text-emerald-400/90" :
    cls === "c-num" ? "text-amber-300/90" :
    cls === "c-mute" ? "text-muted-foreground" :
    "text-foreground";
  return <span key={idx} className={color}>{txt}</span>;
})}
</code>
              </pre>
            </div>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/docs" className={ctaSolid}>Read the Docs →</Link>
              <a href="https://github.com/abdushakurob/synapse" target="_blank" rel="noreferrer" className={ctaGhost}>GitHub</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION 08 — DEMO */}
      <section className={`${sectionPad} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/40 to-transparent" />
        <div className={`relative ${container}`}>
          <Reveal delay={120}>
            <h2 className="headline mt-8 max-w-4xl text-3xl leading-[1.05] text-foreground md:text-5xl">
              Watch two agents negotiate a{" "}
              <span className="font-mono text-primary">$227,500</span> trade.
              <br />
              Live. Nothing in between.
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground">
              Apex Capital and Meridian Trading. No shared infrastructure.
              No API keys between them. No server read what they discussed. Just Synapse.
            </p>
          </Reveal>
          <Reveal delay={320}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/demo" className={ctaSolid}>Watch the Demo →</Link>
              <span className="font-mono text-xs text-muted-foreground">2 min · no signup</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION 09 — BUILD */}
      <section className={sectionPad} id="start">
        <div className={container}>
          <Reveal delay={120}>
            <h2 className="headline mt-8 text-4xl text-foreground md:text-6xl">
              Join the builders.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-5 md:grid-cols-2">
            {buildCards.map(([id, t, b, link], i) => (
              <Reveal key={id} delay={(i % 2) * 80} className="h-full">
                <Panel id={id} title={t}>
                  {b}
                  {link.startsWith("/") ? (
                    <Link to={link} className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary transition hover:opacity-80">
                      View <span aria-hidden>→</span>
                    </Link>
                  ) : (
                    <a href={link} className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary transition hover:opacity-80">
                      View <span aria-hidden>→</span>
                    </a>
                  )}
                </Panel>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
