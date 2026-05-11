import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/synapse/Nav";
import { Footer } from "@/components/synapse/Footer";
import { Aurora } from "@/components/synapse/Aurora";
import { Reveal } from "@/components/synapse/Reveal";
import { CodeBlock } from "@/components/synapse/CodeBlock";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

const container = "mx-auto max-w-4xl px-6";

function DocsPage() {
  const sections = [
    { id: "installation", label: "Installation" },
    { id: "overview", label: "Overview" },
    { id: "quickstart", label: "Quickstart" },
    { id: "concepts", label: "Core Concepts" },
    { id: "lifecycle", label: "Session Lifecycle" },
    { id: "integration", label: "SDK Guide" },
    { id: "cli", label: "CLI Guide" },
    { id: "patterns", label: "Integration Patterns" },
    { id: "errors", label: "Errors & Recovery" },
    { id: "economics", label: "Costs & Performance" },
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
                Synapse Protocol (devnet)
              </div>
              <h1 className="headline text-5xl md:text-8xl text-foreground mb-8">
                Synapse Documentation
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Practical, copy-pasteable docs for the SDK + CLI. Every snippet matches the current repository behavior.
              </p>
            </Reveal>

            <section id="installation">
              <h2 className="headline text-4xl mb-8">Installation</h2>
              <div className="panel p-8 bg-primary/5 border-primary/20">
                <p className="text-sm text-muted-foreground mb-6">
                  Synapse is published as a set of scoped packages on npm. You can install the CLI globally for management, and the SDK locally for your agent projects.
                </p>
                <CodeBlock
                  title="terminal"
                  language="bash"
                  code={`# Global installation for CLI tools\nnpm install -g @synapse-io/cli\n\n# Local installation for SDK\nnpm install @synapse-io/sdk`}
                />
              </div>
            </section>

            <section id="overview">
              <h2 className="headline text-4xl mb-8">Overview</h2>
              <div className="panel p-8 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Synapse is a communication protocol for agents. It uses Solana to establish verifiable identity and handshake state,
                  then moves communication to direct encrypted WebRTC channels.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If this is your first time integrating: start with Quickstart, then read Core Concepts and Session Lifecycle.
                  Those three sections explain the model you need before wiring advanced flows.
                </p>
                <CodeBlock
                  title="what-it-does.ts"
                  language="typescript"
                  code={`// 1) Create identity-backed client\nconst synapse = new Synapse({ profile: "demosynapse-initiator", secretKey, network: "devnet" });\n\n// 2) Handshake over Solana\nconst channel = await synapse.connect("demosynapse-responder");\n\n// 3) Communicate off-chain, peer-to-peer\nchannel.send({ type: "status", message: "hello" });`}
                />
              </div>
            </section>

            <section id="quickstart">
              <h2 className="headline text-4xl mb-8">Quickstart</h2>
              <div className="space-y-10">
                <div className="panel p-8">
                  <h3 className="text-lg font-medium mb-3">1) Create demo identities</h3>
                  <p className="text-sm text-muted-foreground mb-4">Use profile names that make it obvious this is demo/test traffic.</p>
                  <CodeBlock
                    title="terminal"
                    language="bash"
                    code={`# Install the Synapse Protocol tools\nnpm install -g @synapse-io/cli @synapse-io/sdk\n\nsynapse account create --profile demosynapse-initiator\nsynapse account create --profile demosynapse-responder`}
                  />
                </div>

                <div className="panel p-8">
                  <h3 className="text-lg font-medium mb-3">2) Register aliases</h3>
                  <CodeBlock
                    title="terminal"
                    language="bash"
                    code={`synapse registry register demosynapse-initiator --profile demosynapse-initiator --category demo --caps rfq\nsynapse registry register demosynapse-responder --profile demosynapse-responder --category demo --caps rfq`}
                  />
                </div>

                <div className="panel p-8">
                  <h3 className="text-lg font-medium mb-3">3) Connect and exchange messages</h3>
                  <CodeBlock
                    title="agent.ts"
                    language="typescript"
                    code={`import { Synapse, ConnectionTimeoutError } from "@synapse-io/sdk";\n\nconst synapse = new Synapse({\n  profile: "demosynapse-initiator",\n  network: "devnet",\n});\n\n// Handle timeouts gracefully (typical on devnet)\nlet channel;\nwhile (true) {\n  try {\n    channel = await synapse.connect("demosynapse-responder");\n    break;\n  } catch (err) {\n    if (err instanceof ConnectionTimeoutError) {\n      console.log("Handshake timed out. Retrying...");\n      continue;\n    }\n    throw err;\n  }\n}\n\nchannel.send({ type: "rfq", asset: "SYN", quantity: 500000, side: "buy" });`}
                  />
                </div>
              </div>
            </section>

            <section id="concepts">
              <h2 className="headline text-4xl mb-8">Core Concepts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="panel p-6">
                  <h3 className="font-medium mb-2">Identity</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Aliases resolve to public keys via on-chain registry accounts.</p>
                </div>
                <div className="panel p-6">
                  <h3 className="font-medium mb-2">Handshake</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Encrypted offer and answer are written to Solana session PDAs.</p>
                </div>
                <div className="panel p-6">
                  <h3 className="font-medium mb-2">Channel</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">WebRTC data channel is direct, encrypted, and independent after open.</p>
                </div>
              </div>
            </section>

            <section id="lifecycle">
              <h2 className="headline text-4xl mb-8">Session Lifecycle</h2>
              <div className="panel p-8 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A Synapse session has two distinct phases:
                </p>
                <ol className="list-decimal pl-6 text-sm text-muted-foreground space-y-2">
                  <li>On-chain handshake (offer/answer session PDA)</li>
                  <li>Off-chain communication (WebRTC channel)</li>
                </ol>
                <CodeBlock
                  title="close-early.ts"
                  language="typescript"
                  code={`// Recommended optimization for initiator flows:\nchannel.onOpen(async () => {\n  if (!channel.sessionPDA) return;\n  await synapse.closeSession(channel.sessionPDA);\n  // Session rent is reclaimed now.\n  // P2P data channel remains active.\n});`}
                />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use this when you want fast rent reclamation and don’t need the on-chain session account after connection establishment.
                </p>
              </div>
            </section>

            <section id="integration">
              <h2 className="headline text-4xl mb-8">SDK Guide</h2>
              <div className="space-y-12">
                <div className="panel p-8">
                  <h3 className="text-xl font-medium mb-4">Hybrid Architecture</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    Synapse is not a messaging server. It is a <strong>signaling layer</strong> for WebRTC.
                    Solana is used exactly twice per session: once to write the encrypted Offer, and once to write the Answer.
                    Everything after that is direct, peer-to-peer, and zero-cost.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                      <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Layer 1 & 2</div>
                      <div className="text-sm font-medium">Solana (On-Chain)</div>
                      <div className="text-xs text-muted-foreground mt-1">Identity, Discovery, & Encrypted Handshake</div>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                      <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Layer 3</div>
                      <div className="text-sm font-medium">WebRTC (Off-Chain)</div>
                      <div className="text-xs text-muted-foreground mt-1">Encrypted, Direct P2P Communication</div>
                    </div>
                  </div>
                </div>

                <div className="panel p-8">
                  <h3 className="text-xl font-medium mb-4">Roles: Initiator vs. Responder</h3>
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/70 mb-3">Initiator (The "Client")</h4>
                      <p className="text-xs text-muted-foreground mb-4">The agent that starts the session. They pay the initial SOL rent for the session PDA.</p>
                      <CodeBlock
                        title="initiator.ts"
                        language="typescript"
                        code={`const synapse = new Synapse({ profile: "apex-capital" });\n\n// connect() resolves alias, writes offer, and waits for answer\nconst channel = await synapse.connect("meridian-trading");`}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/70 mb-3">Responder (The "Service")</h4>
                      <p className="text-xs text-muted-foreground mb-4">The agent that listens for offers and accepts them. They write the answer to the session PDA.</p>
                      <CodeBlock
                        title="responder.ts"
                        language="typescript"
                        code={`const synapse = new Synapse({ profile: "meridian-trading" });\n\nsynapse.onConnection(async (channel, from) => {\n  console.log("Accepted connection from:", from);\n  channel.onMessage(m => console.log("Incoming:", m));\n});`}
                      />
                    </div>
                  </div>
                </div>

                <div className="panel p-8 border-primary/20 bg-primary/5">
                  <h3 className="text-xl font-medium mb-4 text-primary">Agentic Firewall (Allowlist)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    You can restrict who is allowed to connect to your agent on-chain. This is the first line of defense against unauthorized agent probing.
                  </p>
                  <CodeBlock
                    title="firewall.ts"
                    language="typescript"
                    code={`// Allow specific aliases or patterns\nawait synapse.setAcceptList([\n  "trusted-partner-1",\n  "*.capital-firm.agents", // Wildcard support\n  "CujsG8aFzZCvxKoC2V7n..."   // Direct PublicKeys\n]);\n\n// Open to all (default for new agents)\nawait synapse.setAcceptList(["*"]);`}
                  />
                </div>

                <div className="panel p-8">
                  <h3 className="text-xl font-medium mb-4">On-Chain Registry</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    Make your agent discoverable by other agents. Capabilities help others understand what your agent can do (e.g., "rfq", "swap", "bridge").
                  </p>
                  <CodeBlock
                    title="registry.ts"
                    language="typescript"
                    code={`// 1. Claim your alias\nawait synapse.register("my-agent-alias");\n\n// 2. Publish metadata for discovery\nawait synapse.publish({\n  category: "liquidity-provider",\n  capabilities: ["rfq", "execute-trade"]\n});\n\n// 3. Discover other agents\nconst mmAgents = await synapse.discover({ category: "liquidity-provider" });`}
                  />
                </div>
              </div>
            </section>

            <section id="cli">
              <h2 className="headline text-4xl mb-8">CLI Guide</h2>
              <div className="space-y-8">
                <div className="panel p-8">
                  <h3 className="text-lg font-medium mb-4">What each command does</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <div className="font-mono text-primary">account create</div>
                      <p className="text-muted-foreground text-xs">Creates a local keypair profile in <code className="text-foreground">~/.synapse/profiles</code>.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">account list</div>
                      <p className="text-muted-foreground text-xs">Lists all local profiles with real-time SOL balances.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">account show</div>
                      <p className="text-muted-foreground text-xs">Shows selected profile public key, alias, and balance.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">account export</div>
                      <p className="text-muted-foreground text-xs">Exports secret key for env vars in JSON or Base58 format.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">wallet airdrop</div>
                      <p className="text-muted-foreground text-xs">Requests devnet SOL to the selected identity.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">wallet balance</div>
                      <p className="text-muted-foreground text-xs">Checks current devnet SOL balance.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">wallet transfer</div>
                      <p className="text-muted-foreground text-xs">Transfers devnet SOL from selected profile to recipient pubkey.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">registry register</div>
                      <p className="text-muted-foreground text-xs">Claims an on-chain alias for the selected identity.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">registry publish</div>
                      <p className="text-muted-foreground text-xs">Updates category/capabilities for discovery.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-mono text-primary">registry allow</div>
                      <p className="text-muted-foreground text-xs">Updates on-chain allowlist (agentic firewall).</p>
                    </div>
                  </div>
                </div>

                <div className="panel p-8 bg-primary/5 border-primary/20">
                  <h3 className="text-lg font-medium mb-3 text-primary">Interactive Entry: synapse</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The simplest way to use Synapse is to just run the base command. It launches a full interactive TUI for all protocol operations.
                  </p>
                  <CodeBlock
                    title="terminal"
                    language="bash"
                    code={`$ synapse\n\n? What would you like to do? >\n  Manage Accounts\n  Wallet Operations\n  Registry Services\n  Help\n  Exit`}
                  />
                </div>

                <CodeBlock
                  title="accounts"
                  language="bash"
                  code={`# All commands launch interactive prompts if flags are omitted\nsynapse account create\nsynapse account list\nsynapse account show\nsynapse account export`}
                />
                <CodeBlock
                  title="wallet"
                  language="bash"
                  code={`synapse wallet airdrop --profile demosynapse-initiator --amount 2\nsynapse wallet balance --profile demosynapse-initiator\nsynapse wallet transfer --profile demosynapse-initiator --to <PUBKEY> --amount 0.1`}
                />
                <CodeBlock
                  title="registry"
                  language="bash"
                  code={`synapse registry register demosynapse-initiator --profile demosynapse-initiator\nsynapse registry publish --profile demosynapse-initiator --category demo --caps rfq,negotiation\nsynapse registry allow demosynapse-responder --profile demosynapse-initiator`}
                />
                <div className="panel p-8">
                  <h3 className="text-lg font-medium mb-3">Hardened Error UX</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Fatal errors (like invalid keys or network timeouts) are reported in a clean, namespaced format. No raw stack traces.
                  </p>
                  <CodeBlock
                    title="terminal output"
                    language="bash"
                    code={`$ synapse wallet balance --file non-existent.json\n\n[Synapse Error] ENOENT: no such file or directory, open 'non-existent.json'\nTip: Run with --debug to see full details.`}
                  />
                </div>
              </div>
            </section>

            <section id="patterns">
              <h2 className="headline text-4xl mb-8">Integration Patterns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="panel p-6">
                  <h3 className="font-medium mb-2">Single responder service</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">One agent process receives many inbound connections with bounded concurrency.</p>
                </div>
                <div className="panel p-6">
                  <h3 className="font-medium mb-2">Multi-profile testbed</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Run multiple local profiles (`demosynapse-*`) to emulate real cross-organization flows.</p>
                </div>
                <div className="panel p-6">
                  <h3 className="font-medium mb-2">Fast-close handshake</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Close session PDA right after `channel.onOpen()` to reclaim rent quickly.</p>
                </div>
                <div className="panel p-6">
                  <h3 className="font-medium mb-2">Structured message contract</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Use explicit `type` schemas and ignore unknown types instead of crashing.</p>
                </div>
              </div>
            </section>

            <section id="errors">
              <h2 className="headline text-4xl mb-8">Errors & Recovery</h2>
              <div className="panel p-8 space-y-4">
                <p className="text-sm text-muted-foreground">Expected protocol errors and how to handle them:</p>
                <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
                  <li><code className="text-foreground">AgentNotFoundError</code>: alias not registered; verify registry state.</li>
                  <li><code className="text-foreground">AliasTakenError</code>: choose another alias.</li>
                  <li><code className="text-foreground">ConnectionRejectedError</code>: caller not on accept list.</li>
                  <li><code className="text-foreground">ConnectionTimeoutError</code>: responder offline or no available slot.</li>
                </ul>
              </div>
            </section>

            <section id="economics">
              <h2 className="headline text-3xl mb-6">Costs & Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="panel p-8">
                  <h3 className="text-sm font-mono text-primary uppercase tracking-widest mb-4">Typical Cost</h3>
                  <div className="text-4xl font-medium mb-2">~$0.001</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Two handshake transactions + close fee. Session rent is recoverable when closed.
                  </p>
                </div>
                <div className="panel p-8">
                  <h3 className="text-sm font-mono text-primary uppercase tracking-widest mb-4">Typical Connect Time</h3>
                  <div className="text-4xl font-medium mb-2">&lt; 2s</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    After connect, message latency is the network path between peers.
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
