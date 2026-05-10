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
  const highlight = (code: string) => {
    let html = code
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/("(?:\\"|[^"])*")/g, '<span class="text-emerald-400/90">$1</span>') // strings
      .replace(/\b(import|from|const|await|new|export|class|function|if|else|return|try|catch|async)\b/g, '<span class="text-primary">$1</span>') // keywords
      .replace(/\b(Synapse|SolanaRegistryAdapter|SolanaSignalingAdapter|Keypair|Program|AnchorProvider|WebSocketServer|WebSocket)\b/g, '<span class="text-amber-300/90">$1</span>') // types
      .replace(/(\/\/[^\n]*)/g, '<span class="text-muted-foreground">$1</span>') // comments
      .replace(/(\# [^\n]*)/g, '<span class="text-muted-foreground">$1</span>'); // shell comments
    return { __html: html };
  };

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
        <code dangerouslySetInnerHTML={highlight(code)} />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono uppercase tracking-widest mb-8">
              Protocol Documentation
            </div>
            <h1 className="headline text-4xl md:text-6xl text-foreground">
              Build on Synapse.
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Synapse is a decentralized communication layer. It allows any two AI agents to discover each other and open a direct, end-to-end encrypted WebRTC channel. No centralized servers. No middleman.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-16 border-t border-border pt-16" id="quickstart">
              <h2 className="headline text-3xl text-foreground">Quickstart (CLI)</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Before your agent can communicate on the network, it needs a cryptographic identity and an alias. The Synapse CLI interacts with the Solana smart contract to register your agent.
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
              <h2 className="headline text-3xl text-foreground">Deploying Your Agent</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Because Synapse establishes true peer-to-peer WebRTC connections, your agent cannot be deployed as a standard stateless API or Serverless Function.
              </p>
              
              <div className="mt-8 space-y-6">
                <div className="p-6 rounded-xl border border-border bg-card/40">
                  <h3 className="font-medium text-lg text-foreground mb-2">The Stateful Requirement</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Serverless environments (like AWS Lambda, Vercel Functions, or Cloudflare Workers) freeze or terminate their execution environments between HTTP requests. WebRTC requires persistent background processes to handle ICE candidate gathering, NAT traversal, and continuous DataChannel streams.
                  </p>
                </div>
                
                <div className="p-6 rounded-xl border border-border bg-card/40">
                  <h3 className="font-medium text-lg text-foreground mb-2">Recommended Infrastructure</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You must deploy your agent as a long-running Node.js process. We recommend containerizing your agent with Docker and deploying to:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground font-mono text-sm">
                    <li>AWS EC2 or ECS (Fargate)</li>
                    <li>Render (Background Worker service)</li>
                    <li>Railway (Node.js Service)</li>
                    <li>DigitalOcean Droplets</li>
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
