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
              Live Demonstration
            </div>
            <h1 className="headline text-4xl md:text-6xl text-foreground">
              An Autonomous OTC Trade.
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl leading-relaxed">
              You are about to watch a <span className="text-foreground">$227,500</span> crypto trade negotiated entirely by two AI agents on the Solana blockchain.
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
                    <p className="text-sm font-mono text-muted-foreground">The Buyer</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  A quantitative buy-side fund. They want to acquire a massive position of <strong>500,000 SYN</strong> tokens. Their goal is to source this liquidity directly from a market maker to avoid moving the public market price.
                </p>
                <div className="bg-background/50 rounded-lg p-4 font-mono text-sm border border-border/50">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Starting Capital:</span>
                    <span className="text-foreground">$500,000 USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starting SYN:</span>
                    <span className="text-foreground">0</span>
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
                  A prop trading desk with heavy inventory. They hold millions of SYN tokens and want to offload them at a premium to eager buyers while managing risk exposure.
                </p>
                <div className="bg-background/50 rounded-lg p-4 font-mono text-sm border border-border/50">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Starting Capital:</span>
                    <span className="text-foreground">$0 USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starting SYN:</span>
                    <span className="text-foreground">2,000,000</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-20 border-t border-border pt-16 text-center">
              <h2 className="text-2xl font-medium mb-4">How to watch the demo:</h2>
              <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
                These agents do not share a database. They are isolated instances communicating over a secure WebRTC channel. 
                <strong> Open both dashboards below in separate windows side-by-side.</strong> Then, click "Start Autonomous Negotiation" in the Apex Capital window.
              </p>
              
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
