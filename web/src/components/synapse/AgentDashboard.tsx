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
  const { isConnected, logs, portfolio, activeSession, sendMessage } = useAgentSocket(`ws://localhost:${wsPort}`);
  const [hasStarted, setHasStarted] = useState(false);

  // Auto-scroll to bottom of log
  useEffect(() => {
    const logContainer = document.getElementById("log-container");
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav />
      
      <main className="relative flex-grow flex flex-col pt-24 px-6 max-w-6xl mx-auto w-full">
        <Aurora />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-8 border-b border-border pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl headline flex items-center gap-4">
              <span style={{ color: accentColor }}>◈</span> {firmName}
            </h1>
            <p className="text-muted-foreground mt-2 uppercase tracking-widest text-xs font-mono">
              Autonomous Trading Agent
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0 font-mono text-sm bg-card/60 backdrop-blur border border-border px-4 py-2 rounded-full">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
            {isConnected ? "SYSTEM LIVE" : "DISCONNECTED"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 flex-grow relative z-10 pb-12">
          
          {/* Left Sidebar */}
          <div className="space-y-6 flex flex-col">
            <Panel id="PORT" title="Portfolio">
              <div className="space-y-4 mt-2">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="font-mono text-muted-foreground">USDC</span>
                  <span className="font-mono text-lg">${portfolio.USDC.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-mono text-muted-foreground">SYN</span>
                  <span className="font-mono text-lg">{portfolio.SYN.toLocaleString()}</span>
                </div>
              </div>
            </Panel>

            <Panel id="SESS" title="Active Session" className="flex-grow">
              {activeSession ? (
                <div className="space-y-4 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Connected to:</span>
                    <span className="font-medium">{activeSession.remoteFirm}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Session PDA:</span>
                    <span className="font-mono text-xs text-primary truncate max-w-[120px]" title={activeSession.sessionPDA}>
                      {activeSession.sessionPDA.slice(0,4)}...{activeSession.sessionPDA.slice(-4)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/50">
                    <div>
                      <div className="text-xs uppercase text-muted-foreground">Latency</div>
                      <div className="font-mono">{activeSession.latency}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-muted-foreground">Cost</div>
                      <div className="font-mono">{activeSession.cost}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground italic text-sm">
                  Waiting for connection...
                </div>
              )}
            </Panel>
          </div>

          {/* Right Terminal */}
          <div className="border border-border rounded-xl bg-card/60 backdrop-blur overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-background/80 border-b border-border px-4 py-3 flex justify-between items-center">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Negotiation Log</span>
              
              {isConnected && firmName === "Apex Capital" && !hasStarted && (
                <button 
                  onClick={() => {
                    setHasStarted(true);
                    sendMessage({ type: "start" });
                  }}
                  className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors rounded text-xs font-mono uppercase tracking-wider"
                >
                  Start Autonomous Negotiation
                </button>
              )}
            </div>
            
            <div id="log-container" className="p-6 flex-grow overflow-y-auto font-mono text-sm space-y-4 max-h-[600px]">
              {logs.length === 0 ? (
                <div className="text-muted-foreground/50 italic">System initialized. Awaiting events...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="text-muted-foreground shrink-0">[{log.timestamp}]</span>
                    
                    <div className="flex-grow break-all">
                      {log.type === "send" && (
                        <div>
                          <span className="text-emerald-400">→ Sent {log.message?.type?.toUpperCase()}: </span>
                          <span className="text-foreground/80">{JSON.stringify(log.message)}</span>
                        </div>
                      )}
                      {log.type === "receive" && (
                        <div>
                          <span className="text-amber-400">← Rcvd {log.message?.type?.toUpperCase()}: </span>
                          <span className="text-foreground/80">{JSON.stringify(log.message)}</span>
                        </div>
                      )}
                      {log.type === "info" && (
                        <div className="text-primary italic">{log.message}</div>
                      )}
                      {log.type === "reasoning" && (
                        <div className="text-muted-foreground/60 italic text-xs mt-1 border-l-2 border-border pl-2 py-1 bg-card/30">
                          {log.message}
                        </div>
                      )}
                      {log.type === "status" && (
                        <div className="text-blue-400 bg-blue-500/10 px-3 py-2 rounded mt-1 border border-blue-500/20">
                          {log.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
