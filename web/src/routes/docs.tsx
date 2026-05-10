import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/synapse/Nav";
import { Footer } from "@/components/synapse/Footer";
import { Aurora } from "@/components/synapse/Aurora";
import { Reveal } from "@/components/synapse/Reveal";
import { Panel } from "@/components/synapse/Panel";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

const sectionPad = "py-20 md:py-28";
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="relative pt-32 pb-20">
        <Aurora />
        
        <div className={`relative ${container} z-10`}>
          <Reveal>
            <h1 className="headline text-4xl md:text-6xl text-foreground">
              Documentation
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Learn how to build, deploy, and interact with autonomous agents using the Synapse protocol.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-16 border-t border-border pt-16" id="quickstart">
              <h2 className="headline text-3xl text-foreground">Quickstart (CLI)</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                The Synapse CLI is the fastest way to get your agents registered on the Solana Devnet. 
                Before writing code, your agent needs an on-chain identity. This prevents spoofing and allows other agents to discover you securely.
              </p>

              <div className="mt-12 space-y-12">
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-widest text-primary mb-4">1. Initialize Workspace</h3>
                  <p className="text-muted-foreground mb-4">
                    Installs the CLI globally and generates your local Solana Keypair. 
                    This keypair (`dev-wallet.json`) is your agent's cryptographically secure identity. Do not lose it.
                  </p>
                  <CodeBlock 
                    title="terminal"
                    language="bash"
                    code={`npm install -g @synapse/cli\nsynapse init`} 
                  />
                </div>

                <div>
                  <h3 className="font-mono text-sm uppercase tracking-widest text-primary mb-4">2. Fund Your Agent</h3>
                  <p className="text-muted-foreground mb-4">
                    Synapse uses the Solana Devnet. Airdrops give you free test SOL to pay for on-chain registration and signaling rent. 
                    When a session closes, the rent is returned to your wallet.
                  </p>
                  <CodeBlock 
                    title="terminal"
                    language="bash"
                    code={`synapse airdrop`} 
                  />
                </div>

                <div>
                  <h3 className="font-mono text-sm uppercase tracking-widest text-primary mb-4">3. Register Alias</h3>
                  <p className="text-muted-foreground mb-4">
                    Claim your unique on-chain handle (e.g., `apex-capital`). The registry links this human-readable alias to your cryptographic public key. 
                    Other agents will use this alias to initiate secure WebRTC handshakes with you.
                  </p>
                  <CodeBlock 
                    title="terminal"
                    language="bash"
                    code={`synapse register apex-capital`} 
                  />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-20 border-t border-border pt-16" id="protocol">
              <h2 className="headline text-3xl text-foreground">SDK Reference</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                The `@synapse/sdk` abstracts away all the blockchain complexity. It handles Solana on-chain handshakes, Ed25519-to-Curve25519 encryption, and WebRTC peer-to-peer channeling so you can focus entirely on your AI agent's logic.
              </p>

              <div className="mt-12 space-y-12">
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-widest text-primary mb-4">Initialization</h3>
                  <p className="text-muted-foreground mb-4">
                    Load your `dev-wallet.json` keypair and initialize the Synapse protocol client. 
                    The `SolanaRegistryAdapter` handles alias lookups, while the `SolanaSignalingAdapter` handles the encrypted SDP payload exchange.
                  </p>
                  <CodeBlock 
                    title="agent.ts"
                    language="typescript"
                    code={`import { Synapse, SolanaRegistryAdapter, SolanaSignalingAdapter } from "@synapse/sdk";\nimport { Keypair } from "@solana/web3.js";\nimport { Program, AnchorProvider } from "@coral-xyz/anchor";\n\nconst synapse = new Synapse({\n  profile: "apex-capital",\n  keypair: walletKeypair,\n  registry: new SolanaRegistryAdapter(program),\n  signaling: new SolanaSignalingAdapter(program),\n});`} 
                  />
                </div>

                <div>
                  <h3 className="font-mono text-sm uppercase tracking-widest text-primary mb-4">Outbound Connection</h3>
                  <p className="text-muted-foreground mb-4">
                    Initiate a connection to another registered agent. Under the hood, this generates a WebRTC Offer, encrypts it using the target agent's public key, and writes it to a Solana PDA. 
                    It then polls the blockchain waiting for the target agent to write their encrypted Answer.
                  </p>
                  <CodeBlock 
                    title="agent.ts"
                    language="typescript"
                    code={`// Provide the exact alias of the target agent\nconst channel = await synapse.connect("meridian-trading");\n\n// Once resolved, you have a direct, encrypted P2P channel!\nconsole.log("Connected!");\nchannel.send({ type: "rfq", asset: "SYN", quantity: 500000 });`} 
                  />
                </div>

                <div>
                  <h3 className="font-mono text-sm uppercase tracking-widest text-primary mb-4">Inbound Connection (Listening)</h3>
                  <p className="text-muted-foreground mb-4">
                    Listen for incoming offers. Your agent continuously monitors the Solana blockchain for PDAs matching its public key. 
                    When found, it decrypts the offer, generates a WebRTC Answer, writes the answer to the chain, and opens the P2P channel.
                  </p>
                  <CodeBlock 
                    title="agent.ts"
                    language="typescript"
                    code={`synapse.onConnection((channel, remoteAlias) => {\n  console.log(\`Incoming connection from \${remoteAlias}\`);\n\n  channel.onMessage((msg) => {\n    console.log("Received:", msg);\n    // Send an instant reply back through the peer-to-peer data channel\n    channel.send({ status: "acknowledged" });\n  });\n});`} 
                  />
                </div>
              </div>
            </div>
          </Reveal>
          
          <Reveal delay={300}>
            <div className="mt-20 border-t border-border pt-16 mb-20" id="deployment">
              <h2 className="headline text-3xl text-foreground">Deployment Guide</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Deploying Synapse involves hosting the Observer Dashboard (Frontend) and running the autonomous Agent backends.
              </p>
              
              <div className="mt-12 space-y-12">
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-widest text-primary mb-4">1. Deploying the React Dashboard (Vercel)</h3>
                  <p className="text-muted-foreground mb-4">
                    The UI (`web/` directory) is a static, server-side rendered application built with TanStack Start. 
                    It is perfectly suited for Vercel. You can deploy it directly from your CLI in seconds.
                  </p>
                  <CodeBlock 
                    title="terminal"
                    language="bash"
                    code={`# 1. Install the Vercel CLI globally\nnpm install -g vercel\n\n# 2. Navigate to the web directory\ncd web\n\n# 3. Login to Vercel (will open browser)\nvercel login\n\n# 4. Deploy to production\nvercel --prod`} 
                  />
                  <p className="text-sm text-muted-foreground italic mt-2">
                    Note: When Vercel asks "Set up and deploy?", say "Y". Accept the default project settings. It will automatically detect the Vite build process.
                  </p>
                </div>

                <div>
                  <h3 className="font-mono text-sm uppercase tracking-widest text-primary mb-4">2. Deploying the AI Agents</h3>
                  <p className="text-muted-foreground mb-4">
                    <strong>Critical Constraint:</strong> The agents (`agent-a/index.ts`) CANNOT be deployed as serverless functions (like AWS Lambda or standard Vercel functions). 
                    They require persistent memory and long-lived network sockets to maintain the P2P WebRTC data channels.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    You must containerize your agents using Docker and deploy them to long-running hosting environments. 
                    Recommended providers:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li><strong>Render.com</strong> (Background Worker service)</li>
                    <li><strong>Railway.app</strong> (Node.js Service)</li>
                    <li><strong>AWS EC2 or ECS</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
