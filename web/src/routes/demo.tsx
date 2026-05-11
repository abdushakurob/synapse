import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/synapse/Nav";
import { Footer } from "@/components/synapse/Footer";
import { Aurora } from "@/components/synapse/Aurora";
import { Reveal } from "@/components/synapse/Reveal";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
});

function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="relative pt-32 pb-20 overflow-hidden">
        <Aurora />
        
        <div className="relative mx-auto max-w-4xl px-6 z-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono uppercase tracking-widest mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Live Autonomous Protocol Demonstration
            </div>
            <h1 className="headline text-4xl md:text-6xl text-foreground">
              Adversarial P2P Intelligence.
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Watch two autonomous agents execute a <span className="text-foreground">$227,500</span> accumulation strategy using tactical market pressure and verifiable P2P negotiation.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-16 grid md:grid-cols-2 gap-8">
              {/* Agent A Context */}
              <div className="p-8 rounded-2xl border border-border bg-card/40 backdrop-blur">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6] font-bold text-xl border border-[#3b82f6]/30">AC</div>
                  <div>
                    <h3 className="font-medium text-lg">Apex Capital</h3>
                    <p className="text-sm font-mono text-muted-foreground">The Accumulator</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  A buy-side fund acquiring <strong>500,000 SYN</strong>. Uses tactical "Dumps" to induce panic and force the seller's floor lower.
                </p>
                <div className="bg-background/50 rounded-lg p-4 font-mono text-sm border border-border/50">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Capital:</span>
                    <span className="text-foreground">$500,000 USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tactic:</span>
                    <span className="text-primary uppercase text-[10px]">Market Pressure</span>
                  </div>
                </div>
              </div>

              {/* Agent B Context */}
              <div className="p-8 rounded-2xl border border-border bg-card/40 backdrop-blur">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#10b981]/20 flex items-center justify-center text-[#10b981] font-bold text-xl border border-[#10b981]/30">MT</div>
                  <div>
                    <h3 className="font-medium text-lg">Meridian Trading</h3>
                    <p className="text-sm font-mono text-muted-foreground">The Market Maker</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Managing massive inventory. Defends the price floor with strategic "Buy-backs" while offloading at a premium.
                </p>
                <div className="bg-background/50 rounded-lg p-4 font-mono text-sm border border-border/50">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Inventory:</span>
                    <span className="text-foreground">2,000,000 SYN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tactic:</span>
                    <span className="text-primary uppercase text-[10px]">Floor Defense</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-20 border-t border-border pt-16 text-center">
              <h2 className="text-2xl font-medium mb-4">What to look for:</h2>
              <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
                {[
                  ["Cognitive Reasoning", "Watch the live reasoning logs to see the agents analyze price trends and adjust tactics in real-time."],
                  ["Verified Handshake", "Solana-verified sessions ensure that only authorized partners can connect. Cost: ~$0.001 after rent recovery."],
                  ["Atomic Settlement", "Watch the agents converge on price through multiple settlement blocks until the target goal is met."]
                ].map(([t, b]) => (
                  <div key={t} className="p-5 rounded-xl bg-card/20 border border-border/50">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-primary mb-2">{t}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to="/agent-a" 
                  target="_blank"
                  className="w-full sm:w-auto px-8 py-4 bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30 hover:bg-[#3b82f6]/20 transition-colors rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  Open Apex Capital
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </Link>
                
                <Link 
                  to="/agent-b" 
                  target="_blank"
                  className="w-full sm:w-auto px-8 py-4 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981]/20 transition-colors rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  Open Meridian Trading
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
