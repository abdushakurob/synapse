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
    { id: "errors", label: "Error Handling" },
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
                  <h3 className="text-lg font-medium mb-4">Profile Architecture</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Manage a fleet of agents from a single machine using the profile system. Identities are stored centrally in <code className="text-primary">~/.synapse/profiles/</code>.
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground uppercase tracking-widest list-disc pl-4">
                    <li>Use <code className="text-foreground">synapse init --profile [name]</code></li>
                    <li>List all local agents with <code className="text-foreground">synapse profiles</code></li>
                    <li>Update security with <code className="text-foreground">synapse set-accept</code></li>
                  </ul>
                </div>
                <div className="panel p-8">
                  <h3 className="text-lg font-medium mb-4">Agentic Firewall (CORS)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Restrict who can connect to your agent at the protocol layer. Unauthorized requests are rejected on-chain before touching your compute.
                  </p>
                  <CodeBlock title="firewall" language="bash" code={`# Allow specific partners\nsynapse set-accept partner-alias 7xKf...9mPq\n\n# Open to all\nsynapse set-accept --open`} />
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
                    <h4 className="font-medium mb-2">Discovery & Metadata</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Broadcast your agent's category and capabilities on-chain. Other agents can query the protocol directory using <code className="text-primary">synapse.discover()</code> to find specialized partners.
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
              <h2 className="headline text-4xl mb-8">SDK Integration</h2>
              <div className="space-y-12">
                <div className="panel p-8">
                  <h3 className="text-lg font-medium mb-4">Initialization</h3>
                  <CodeBlock
                    title="config"
                    language="typescript"
                    code={`import { Synapse } from "@synapse-io/sdk";\n\nconst synapse = new Synapse({\n  profile: "apex-capital",\n  secretKey: process.env.SYNAPSE_SECRET_KEY, // Base58 string\n  accept: ["meridian-trading", "*.trusted.agents"],\n  maxConcurrent: 20,\n  network: "devnet"\n});`}
                  />
                </div>

                <div className="panel p-8">
                  <h3 className="text-lg font-medium mb-4">Core API Methods</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <div className="font-mono text-primary">.register(alias, metadata)</div>
                      <p className="text-muted-foreground text-xs">Claims an alias and publishes category/caps on-chain.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">.connect(target)</div>
                      <p className="text-muted-foreground text-xs">Initiates a handshake with an alias or PublicKey.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">.onConnection(handler)</div>
                      <p className="text-muted-foreground text-xs">Registers callback for new authorized P2P channels.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">.discover(filters)</div>
                      <p className="text-muted-foreground text-xs">Returns list of agents matching on-chain metadata.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="errors">
              <h2 className="headline text-4xl mb-8">Error Handling & Resilience</h2>
              <div className="panel p-8 border-l-4 border-l-amber-500/50">
                <h3 className="text-lg font-medium mb-4">Protocol-Specific Errors</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-amber-500 font-bold">ConnectionRejectedError</code>
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded uppercase">Firewall</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Thrown when your agent's public key is not on the responder's <code className="text-foreground">accept_list</code>. Handled on-chain at the protocol level.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <code className="text-amber-500 font-bold">AliasTakenError</code>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Thrown during <code className="text-foreground">register()</code> if the requested alias is already owned by another public key on-chain.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <code className="text-amber-500 font-bold">ConnectionTimeoutError</code>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Handshake failed to complete within 60s. Usually due to the responder being offline or having no available concurrency slots.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="cli">
              <h2 className="headline text-4xl mb-8">Global CLI</h2>
              <CodeBlock
                title="terminal"
                language="bash"
                code={`synapse profiles          # List all local identities\nsynapse register [alias]   # Claim alias + publish metadata\nsynapse set-accept [list]  # Update on-chain firewall\nsynapse publish --caps ... # Update discovery metadata\nsynapse export-key         # Get cloud-ready Base58 key`}
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
