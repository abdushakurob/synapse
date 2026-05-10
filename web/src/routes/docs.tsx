import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/synapse/Nav";
import { Footer } from "@/components/synapse/Footer";
import { Aurora } from "@/components/synapse/Aurora";
import { Reveal } from "@/components/synapse/Reveal";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

const container = "mx-auto max-w-4xl px-6";

function CodeBlock({ code, title, language }: { code: string; title: string; language: string }) {
  return (
    <div className="panel overflow-hidden mt-6 mb-12">
      <div className="flex items-center justify-between border-b border-border bg-background/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {title}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{language}</span>
      </div>
      <pre className="overflow-x-auto p-6 font-mono text-[13.5px] leading-7 text-foreground md:p-8">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function DocsPage() {
  const sections = [
    { id: "quickstart", label: "Quickstart" },
    { id: "multi-agent", label: "Multi-Agent" },
    { id: "concurrency", label: "Concurrency" },
    { id: "architecture", label: "Protocol Layers" },
    { id: "integration", label: "SDK Integration" },
    { id: "cli", label: "Global CLI" },
    { id: "deployment", label: "Cloud Hosting" },
    { id: "economics", label: "Costs & Limits" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="relative pt-32 pb-20">
        <Aurora />

        <div className={`relative ${container} z-10 flex flex-col md:flex-row gap-12`}>
          {/* Sidebar Navigation */}
          <aside className="md:w-64 flex-shrink-0">
            <div className="sticky top-32 space-y-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 px-3 font-bold">Documentation</div>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all border border-transparent hover:border-primary/10"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-32">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono uppercase tracking-widest mb-8">
                Synapse Protocol v0.1.3
              </div>
              <h1 className="headline text-5xl md:text-8xl text-foreground mb-8">
                Build the Autonomous Future.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                The decentralized communication backbone for AI agents. No central servers. Zero-cost peer-to-peer streams. Solana-verified security.
              </p>
            </Reveal>

            <section id="quickstart">
              <h2 className="headline text-4xl mb-8">60-Second Quickstart</h2>
              <div className="space-y-12">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-sm">01</div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Install and Initialize</h3>
                    <p className="text-muted-foreground text-sm mb-4">Claim your global identity in the terminal.</p>
                    <CodeBlock title="terminal" language="bash" code="npm install -g @synapse-io/cli\nsynapse init\nsynapse airdrop" />
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-sm">02</div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Initialize the SDK</h3>
                    <p className="text-muted-foreground text-sm mb-4">Connect your agent code to the Solana identity.</p>
                    <CodeBlock title="agent.ts" language="typescript" code={`import { Synapse } from "@synapse-io/sdk";\nconst synapse = Synapse.initSolana({ profile: "my-alias", ... });`} />
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-sm">03</div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Start P2P Messaging</h3>
                    <p className="text-muted-foreground text-sm mb-4">Agents talk directly. No gas fees after the initial handshake.</p>
                    <CodeBlock title="agent.ts" language="typescript" code={`const channel = await synapse.connect("meridian-trading");\nchannel.send({ type: "hello" });`} />
                  </div>
                </div>
              </div>
            </section>

            <section id="multi-agent">
              <h2 className="headline text-4xl mb-8">Multi-Agent Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="panel p-8">
                  <h3 className="text-lg font-medium mb-4">Handling Multiple Identities</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    On a single machine, you can manage multiple agents by creating distinct wallet files (e.g., <code className="text-primary">dev-wallet-a.json</code>).
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground uppercase tracking-widest list-disc pl-4">
                    <li>Use <code className="text-foreground">synapse init</code> to generate new keys</li>
                    <li>The CLI scans all <code className="text-foreground">dev-wallet*.json</code> files</li>
                    <li>Use <code className="text-foreground">synapse whoami</code> to check status of all agents</li>
                  </ul>
                </div>
                <div className="panel p-8">
                  <h3 className="text-lg font-medium mb-4">Port Orchestration</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    When running multiple agents on one host, you must offset the WebSocket Bridge ports to avoid collisions.
                  </p>
                  <CodeBlock title="orchestration" language="typescript" code={`// Agent A\nnew UIBridge(3001);\n\n// Agent B\nnew UIBridge(3002);`} />
                </div>
              </div>
            </section>

            <section id="concurrency">
              <h2 className="headline text-4xl mb-8">Listener & Concurrency</h2>
              <div className="space-y-8">
                <div className="bg-primary/5 border border-primary/20 p-8 rounded-2xl">
                  <h3 className="text-xl font-medium mb-4">The Request Queue</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    Synapse uses a managed session queue to handle "Fan-in" (multiple inbound connections). If an agent is busy, new on-chain requests are held in a local queue until a slot opens.
                  </p>
                  <CodeBlock title="config" language="typescript" code={`const synapse = new Synapse({\n  maxConcurrent: 10, // Default slot limit\n  allowQueuing: true // Enable auto-queue\n});`} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-background/50 rounded-xl border border-border">
                    <h4 className="font-medium mb-2">Session TTL</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      On-chain sessions have a 5-minute expiry. If an agent fails to respond within this window, the session PDA can be closed by any party to reclaim rent.
                    </p>
                  </div>
                  <div className="p-6 bg-background/50 rounded-xl border border-border">
                    <h4 className="font-medium mb-2">Auto-Cleanup</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The SDK automatically calls <code className="text-primary">close_session</code> when a WebRTC channel is terminated, ensuring no stranded accounts remain on-chain.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="architecture">
              <h2 className="headline text-3xl mb-6">Core Protocol Layers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="space-y-4">
                  <div className="text-emerald-500 font-mono text-xs uppercase tracking-widest font-bold">Identity</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Solana-based discovery. Your public key is your universal ID. Human-readable aliases map to identities on-chain.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="text-blue-500 font-mono text-xs uppercase tracking-widest font-bold">Handshake</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Encrypted offers/answers written to Solana PDAs. Establishes the P2P pipe with 100% verifiability.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="text-purple-500 font-mono text-xs uppercase tracking-widest font-bold">Communication</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Off-chain WebRTC data streams. Direct peer-to-peer. Encrypted. Sub-50ms latency. Zero cost per message.
                  </p>
                </div>
              </div>
            </section>

            <section id="integration">
              <h2 className="headline text-3xl mb-6">SDK Integration</h2>
              <CodeBlock
                title="agent.ts"
                language="typescript"
                code={`// 1. Initialize\nconst synapse = Synapse.initSolana({ ... });\n\n// 2. Listen for requests\nsynapse.onRequest(async (req) => {\n  const channel = await synapse.acceptSession(req.sessionPDA);\n  channel.onMessage((msg) => console.log("Received:", msg));\n});\n\n// 3. Connect to others\nconst channel = await synapse.connect("agent-alias");\nchannel.send({ type: "negotiate" });`}
              />
            </section>

            <section id="cli">
              <h2 className="headline text-3xl mb-6">Global CLI</h2>
              <CodeBlock
                title="terminal"
                language="bash"
                code={`synapse init       # Create local identity\nsynapse register   # Claim alias on-chain\nsynapse whoami     # Check fleet status\nsynapse export-key # Get cloud-ready Base58 key`}
              />
            </section>

            <section id="deployment">
              <h2 className="headline text-3xl mb-6">Moving Beyond localhost</h2>
              <div className="bg-primary/5 border border-primary/20 p-8 rounded-2xl">
                <div className="space-y-8 mt-4">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Env Var: SYNAPSE_SECRET_KEY</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Pass your Base58 identity string. Use the CLI to get your stringified key:
                    </p>
                    <CodeBlock title=".env" language="bash" code={`SYNAPSE_SECRET_KEY="4zVWmaC7...k9nQ" # Your Base58 secret key`} />
                  </div>
                  <div className="p-6 bg-background/50 rounded-xl border border-border">
                    <h4 className="font-medium mb-2">Stateful Infrastructure Only</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Agents require **persistent processes** (Docker/Railway/EC2). Serverless environments disconnect immediately, killing the P2P pipe.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="economics">
              <h2 className="headline text-3xl mb-6">Economics & Limits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="panel p-8">
                  <h3 className="text-sm font-mono text-primary uppercase tracking-widest mb-4">Cost per Session</h3>
                  <div className="text-4xl font-medium mb-2">~$0.001</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Handshake fees only. Rent for session PDAs is fully returned to your agent on close.
                  </p>
                </div>
                <div className="panel p-8">
                  <h3 className="text-sm font-mono text-primary uppercase tracking-widest mb-4">Latency</h3>
                  <div className="text-4xl font-medium mb-2">&lt; 50ms</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Once the handshake completes on-chain, communication is direct P2P at the speed of your network.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
