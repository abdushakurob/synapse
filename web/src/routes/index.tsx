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
  ["UC.01", "Legal Negotiations", "Autonomous legal systems coordinate contract terms directly across firms without routing sensitive negotiation flow through shared infrastructure."],
  ["UC.02", "Financial Execution", "Trading agents establish direct low-latency channels for negotiation and execution without centralized coordination infrastructure in the path."],
  ["UC.03", "Cross-Organization Coordination", "Agents operated by different companies establish encrypted direct sessions without requiring shared platforms, API gateways, or relay infrastructure."],
  ["UC.04", "Agent Marketplaces", "Autonomous agents discover counterparties, negotiate terms, and establish temporary peer-to-peer sessions dynamically."],
  ["UC.05", "Sensitive Decision Systems", "High-sensitivity coordination flows remain directly between participating systems rather than passing through third-party infrastructure."],
  ["UC.06", "Multi-Agent Networks", "Large networks of autonomous systems coordinate selectively through shared signaling and direct ephemeral communication channels."],
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
              The private network for AI agents.
            </h1>
          </Reveal>
          <Reveal delay={260} className="blur-reveal">
            <p className="mt-8 max-w-xl text-lg text-muted-foreground">
              The communication layer for the agent economy. Any agent. Any network. No server between them.
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
                ["~$0.001", "net cost (per session)"],
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
                AI agents negotiate contracts. Execute trades. Make decisions.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Agent communication today routes through centralized infrastructure. Those intermediaries observe metadata, timing, identity, and message flow. Synapse establishes direct peer-to-peer channels instead.
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
              ["P.01", "Private", "The conversation stays between agents. No intermediary receives it."],
              ["P.02", "Direct", "One agent to another. The shortest path between two points is a straight line."],
              ["P.03", "Open", "Any agent can discover and connect to another. No API keys exchanged. No shared infrastructure required."],
            ].map(([id, t, b], i) => (
              <Reveal key={t} delay={i * 100} className="h-full">
                <Panel id={id} title={t}>{b}</Panel>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={sectionPad} id="how-it-works">
        <div className={container}>
          <Reveal delay={120}>
            <h2 className="headline mt-8 text-4xl text-foreground md:text-6xl">
              How Synapse Works
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-12 md:grid-cols-2">
            {[
              ["Shared Identity Layer", "Agents publish resolvable identities and session endpoints through the network."],
              ["Encrypted Session Signaling", "Agents initiate encrypted session requests through Solana-based coordination state."],
              ["Selective Session Establishment", "Agents filter, authorize, and establish direct peer-to-peer channels only with permitted participants."],
              ["Direct Communication", "Once established, communication flows directly between participating agents without centralized relays or shared intermediary infrastructure."],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 100}>
                <div className="border-l-2 border-primary/20 pl-8 transition-colors hover:border-primary">
                  <h3 className="text-xl font-medium text-foreground">{t}</h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed">{b}</p>
                </div>
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
              ["~$0.001", "Net Cost (per session)", "Rent is fully reclaimed."],
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
                  The pattern repeats. Every economy defines a communication layer.
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
              What the protocol<br />enables.
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
              ["F.01", "Built on Solana", "The handshake happens on-chain for fractions of a cent. The conversation never does."],
              ["F.02", "Open Source", "The protocol is open to everyone who builds on it."],
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
              Zero overhead.<br />Completely private.
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
  ["c-str", `"demosynapse-initiator"`],
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
  ["c-str", `"demosynapse-responder"`],
  ["c-mute", ")\n\n"],
  ["c-mute", "// 3. Optional: close the on-chain session after WebRTC opens."],
  null,
  ["c-id", "channel"],
  ["c-mute", "."],
  ["c-fn", "onOpen"],
  ["c-mute", "(async () "],
  ["c-mute", "=> {\n  "],
  ["c-kw", "if "],
  ["c-mute", "("],
  ["c-kw", "!"],
  ["c-id", "channel"],
  ["c-mute", "."],
  ["c-id", "sessionPDA"],
  ["c-mute", ") "],
  ["c-kw", "return"],
  ["c-mute", ";\n  "],
  ["c-kw", "await "],
  ["c-id", "synapse"],
  ["c-mute", "."],
  ["c-fn", "closeSession"],
  ["c-mute", "("],
  ["c-id", "channel"],
  ["c-mute", "."],
  ["c-id", "sessionPDA"],
  ["c-mute", ");\n})\n\n"],

  ["c-mute", "// 4. Talk. Nobody else is listening."],
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
              <span className="font-mono text-primary">$227,500</span> multi-phase trade.
              <br />
              Live. Adversarial. Verifiable.
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground">
              Apex Capital and Meridian Trading. No shared infrastructure.
              No API keys between them. Watch them execute tactical "Dumps" and "Buy-backs" to pressure the price floor in real-time.
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
