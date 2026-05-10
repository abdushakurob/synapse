import { useAgentSocket } from "@/hooks/useAgentSocket";
import { Nav } from "./Nav";
import { Aurora } from "./Aurora";
import { Panel } from "./Panel";
import { useEffect, useState } from "react";

interface AgentDashboardProps {
  firmName: string;
  wsPort: number;
  accentColor: string;
}

export function AgentDashboard({ firmName, wsPort, accentColor }: AgentDashboardProps) {
  const { 
    isConnected, 
    logs, 
    portfolio, 
    activeSession, 
    transactions, 
    hasStarted, 
    startNegotiation 
  } = useAgentSocket(`ws://localhost:${wsPort}`);

  // Auto-scroll to bottom of log
  useEffect(() => {
    const logContainer = document.getElementById("log-container");
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Nav />
      
      <main className="relative flex-grow flex flex-col pt-24 px-6 max-w-7xl mx-auto w-full">
        <Aurora />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-8 border-b border-border pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl headline flex items-center gap-4">
              <span style={{ color: accentColor }}>◈</span> {firmName}
            </h1>
            <p className="text-muted-foreground mt-2 uppercase tracking-widest text-xs font-mono">
              Autonomous AI Trading Agent
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
            <div className="flex items-center gap-3 font-mono text-sm bg-card/60 backdrop-blur border border-border px-4 py-2 rounded-full">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
              {isConnected ? "WEBSOCKET LIVE" : "DISCONNECTED"}
            </div>
            {activeSession && (
               <div className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">
                 P2P CHANNEL SECURE
               </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr_1.2fr] gap-6 flex-grow relative z-10 pb-12">
          
          {/* Left Sidebar: Portfolio & Session */}
          <div className="space-y-6 flex flex-col order-2 lg:order-1">
            <Panel id="PORT" title="Portfolio Assets">
              <div className="space-y-4 mt-2">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="font-mono text-muted-foreground text-sm">USDC</span>
                  <span className="font-mono text-lg font-medium">${portfolio.USDC.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-mono text-muted-foreground text-sm">SYN</span>
                  <span className="font-mono text-lg font-medium">{portfolio.SYN.toLocaleString()}</span>
                </div>
              </div>
            </Panel>

            <Panel id="SESS" title="Session Identity" className="flex-grow">
              {activeSession ? (
                <div className="space-y-4 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-mono">Remote:</span>
                    <span className="font-medium">{activeSession.remoteFirm}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-mono">PDA:</span>
                    <a 
                      href={`https://explorer.solana.com/address/${activeSession.sessionPDA}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-primary hover:underline truncate max-w-[140px]" 
                    >
                      {activeSession.sessionPDA}
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/50">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground font-mono">Latency</div>
                      <div className="font-mono text-sm">{activeSession.latency}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground font-mono">Network Cost</div>
                      <div className="font-mono text-sm">{activeSession.cost}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground italic text-sm text-center">
                  <span className="animate-pulse mb-2">●</span>
                  Awaiting encrypted handshake...
                </div>
              )}
            </Panel>
          </div>

          {/* Center Terminal: Negotiation Log */}
          <div className="lg:col-span-1 border border-border rounded-xl bg-card/40 backdrop-blur overflow-hidden flex flex-col shadow-2xl order-1 lg:order-2">
            <div className="bg-background/80 border-b border-border px-4 py-3 flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">P2P Negotiation Stream</span>
              
              {isConnected && firmName === "Apex Capital" && !hasStarted && (
                <button 
                  onClick={startNegotiation}
                  className="px-4 py-1.5 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all rounded-lg text-[10px] font-mono uppercase tracking-widest animate-pulse"
                >
                  Connect & Negotiate
                </button>
              )}
              {hasStarted && !activeSession && (
                <div className="text-[10px] font-mono text-amber-500 animate-pulse uppercase">Handshaking...</div>
              )}
            </div>
            
            <div id="log-container" className="p-6 flex-grow overflow-y-auto font-mono text-sm space-y-4 max-h-[650px] scrollbar-hide">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20 space-y-4">
                  <div className="text-6xl">◈</div>
                  <div className="italic text-xs tracking-widest uppercase">System Standby</div>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-4 items-start animate-in fade-in slide-in-from-left-2 duration-500">
                    <span className="text-[10px] text-muted-foreground/50 shrink-0 mt-1">{log.timestamp}</span>
                    
                    <div className="flex-grow break-words">
                      {log.type === "send" && (
                        <div className="bg-emerald-500/5 p-2 rounded border-l-2 border-emerald-500/50">
                          <span className="text-emerald-400 font-bold">OUTBOUND: </span>
                          <span className="text-foreground/90 font-mono text-xs leading-relaxed">{JSON.stringify(log.message, null, 2)}</span>
                        </div>
                      )}
                      {log.type === "receive" && (
                        <div className="bg-amber-500/5 p-2 rounded border-l-2 border-amber-500/50">
                          <span className="text-amber-400 font-bold">INBOUND: </span>
                          <span className="text-foreground/90 font-mono text-xs leading-relaxed">{JSON.stringify(log.message, null, 2)}</span>
                        </div>
                      )}
                      {log.type === "info" && (
                        <div className="text-primary italic text-xs tracking-wide">{log.message}</div>
                      )}
                      {log.type === "reasoning" && (
                        <div className="text-muted-foreground/80 italic text-xs mt-1 border-l-2 border-muted pl-4 py-2 bg-muted/10 rounded-r-lg">
                          <span className="not-italic font-bold text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Agent Reasoning</span>
                          {log.message}
                        </div>
                      )}
                      {log.type === "status" && (
                        <div className="text-blue-400 bg-blue-500/10 px-3 py-2 rounded mt-1 border border-blue-500/20 text-xs">
                          {log.message}
                        </div>
                      )}
                      {log.type === "blockchain" && (
                        <div className="text-[10px] font-mono text-emerald-500/70 py-1 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-pulse"></span>
                           {log.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar: Blockchain Activity */}
          <div className="space-y-6 flex flex-col order-3">
             <Panel id="CHAIN" title="On-Chain Events">
                <div className="space-y-4 mt-2">
                  {transactions.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground/30 text-xs italic font-mono text-center">
                      No transactions recorded yet
                    </div>
                  ) : (
                    transactions.map((tx, i) => (
                      <div key={i} className="group border-b border-border/40 pb-3 last:border-0 animate-in fade-in slide-in-from-right-2">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-mono text-muted-foreground">{tx.timestamp}</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Confirmed</span>
                        </div>
                        <div className="text-xs font-medium mb-1 line-clamp-1">{tx.description}</div>
                        <a 
                          href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-mono text-primary hover:underline block truncate opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          {tx.signature.substring(0, 16)}...
                        </a>
                      </div>
                    ))
                  )}
                </div>
             </Panel>

             <Panel id="P2P" title="P2P State">
                <div className="space-y-3 mt-1 font-mono text-[10px]">
                   <div className="flex justify-between">
                     <span className="text-muted-foreground uppercase">Encryption</span>
                     <span className="text-emerald-400 font-bold">X25519 (active)</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground uppercase">Protocol</span>
                     <span>WebRTC DataChannel</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground uppercase">Compression</span>
                     <span>ZLIB-9 (active)</span>
                   </div>
                </div>
             </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
