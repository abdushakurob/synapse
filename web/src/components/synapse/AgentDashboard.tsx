import { useAgentSocket } from "@/hooks/useAgentSocket";
import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  Settings, 
  Bell, 
  Search,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  Globe,
  Database,
  Terminal as TerminalIcon,
  RefreshCw,
  Trophy,
  Network
} from "lucide-react";

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
    portfolioHistory,
    activeSession, 
    transactions, 
    hasStarted, 
    isComplete,
    latency,
    messageCount,
    bytesTransferred,
    sessionStartTime,
    startNegotiation,
    resetDemo 
  } = useAgentSocket(`ws://localhost:${wsPort}`);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionTime, setSessionTime] = useState("0:00");

  // Format Milliseconds timestamp
  const formatTime = (log: any) => {
    return `${log.timestamp}.${log.ms.toString().padStart(3, '0')}`;
  };

  // Session Timer Logic
  useEffect(() => {
    if (sessionStartTime && !isComplete) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        setSessionTime(`${mins}:${secs.toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionStartTime, isComplete]);

  // Handle countdown before start
  const handleInitiate = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      startNegotiation();
    }
  }, [countdown]);

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => setShowSummary(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowSummary(false);
    }
  }, [isComplete]);

  const currentPrice = useMemo(() => {
    const tradeMessages = logs.filter(l => l.message && (l.message.type === 'quote' || l.message.type === 'counter' || l.message.type === 'execution'));
    if (tradeMessages.length > 0) {
      const lastMsg = tradeMessages[tradeMessages.length - 1].message;
      return lastMsg.price || 0.46;
    }
    return 0.46;
  }, [logs]);

  const totalValue = useMemo(() => {
    return portfolio.USDC + (portfolio.SYN * currentPrice);
  }, [portfolio, currentPrice]);

  const [isThinking, setIsThinking] = useState(false);
  useEffect(() => {
    const lastLog = logs[logs.length - 1];
    if (lastLog?.type === "reasoning") {
      setIsThinking(true);
      const timer = setTimeout(() => setIsThinking(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [logs]);

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="min-h-screen bg-[#070708] text-[#E5E5E5] flex font-sans selection:bg-emerald-500/30 relative">
      
      {/* Intro Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center backdrop-blur-3xl"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-[20rem] font-black italic text-emerald-500 tracking-tighter"
            >
              {countdown}
            </motion.div>
            <div className="text-xl font-bold uppercase tracking-[1em] text-white/40 mt-[-4rem]">Negotiation Initializing</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Screen */}
      <AnimatePresence>
        {showSummary && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-10 backdrop-blur-3xl"
          >
            <div className="max-w-4xl w-full bg-[#09090A] border border-emerald-500/30 rounded-[4rem] p-16 shadow-[0_0_100px_rgba(16,185,129,0.1)] relative overflow-hidden text-center">
               <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
               <Trophy className="w-20 h-20 text-emerald-500 mx-auto mb-10" />
               <h2 className="text-6xl font-black uppercase tracking-tighter mb-4">Trade Complete</h2>
               <div className="text-emerald-500 font-mono text-xl mb-12">Session: {activeSession?.sessionPDA.substring(0, 16)}...</div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                  <SummaryStat label="Inventory Acquired" value="500,000 SYN" />
                  <SummaryStat label="Execution Price" value={`$${currentPrice}`} />
                  <SummaryStat label="Total Volume" value={`$${(500000 * currentPrice).toLocaleString()}`} />
                  <SummaryStat label="Time to Close" value={sessionTime} />
               </div>

               <div className="bg-white/[0.03] rounded-3xl p-8 mb-12 text-left border border-white/5">
                  <p className="text-xl text-white/70 leading-relaxed font-serif italic text-center">
                    "This negotiation was private. No server read these messages. The only on-chain record is the handshake and settlement. Everything else happened directly between these two agents."
                  </p>
               </div>

               <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={resetDemo}
                    className="px-10 py-5 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_15px_40px_rgba(16,185,129,0.3)] flex items-center gap-3"
                  >
                    <RefreshCw size={20} />
                    Reset Demo
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Sidebar Nav */}
      <aside className="w-20 lg:w-72 border-r border-white/5 bg-[#09090A] hidden md:flex flex-col py-8 px-6 z-50">
        <div className="flex items-center gap-3 px-2 mb-12">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Zap className="w-6 h-6 text-black fill-current" />
          </div>
          <span className="text-xl font-black tracking-tighter lg:block hidden uppercase">Synapse Node</span>
        </div>

        <nav className="space-y-1.5 flex-grow">
          <NavItem icon={<LayoutDashboard size={20} />} label="Agent Dashboard" active />
          <NavItem icon={<Wallet size={20} />} label="Vault Intelligence" />
          <NavItem icon={<ArrowLeftRight size={20} />} label="P2P Ledger" />
          <NavItem icon={<Database size={20} />} label="Mempool Monitor" />
          <NavItem icon={<Globe size={20} />} label="Network Discovery" />
        </nav>

        <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
          <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 lg:block hidden">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></div>
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{isConnected ? "System Optimal" : "Network Warning"}</span>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between text-[10px] font-mono">
                  <span className="opacity-40 uppercase text-[8px]">Session</span>
                  <span className={activeSession ? "text-emerald-500" : "text-white/20"}>{activeSession ? "Active" : "Ready"}</span>
               </div>
               <div className="flex justify-between text-[10px] font-mono">
                  <span className="opacity-40 uppercase text-[8px]">Encrypted</span>
                  <span className={activeSession ? "text-emerald-500" : "text-white/20"}>{activeSession ? "Yes" : "No"}</span>
               </div>
            </div>
          </div>
          <NavItem icon={<Settings size={20} />} label="Configuration" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Intelligence Header */}
        <header className="h-24 border-b border-white/5 px-10 flex items-center justify-between bg-[#09090A]/80 backdrop-blur-3xl z-40">
          <div className="flex items-center gap-8">
             <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <span className="w-2 h-8 rounded-full" style={{ backgroundColor: accentColor }}></span>
                  {firmName}
                </h1>
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/20 mt-1">Autonomous Execution Environment</div>
             </div>
             
             <div className="h-10 w-px bg-white/5 hidden xl:block"></div>
             
             <div className="hidden xl:flex items-center gap-6">
                <div>
                   <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Negotiated Price (SYN)</div>
                   <div className="flex items-center gap-2 font-mono text-sm font-bold">
                      <AnimatedNumber value={currentPrice} prefix="$" decimals={4} />
                      <span className="text-[10px] text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded uppercase tracking-tighter">
                        Live Data
                      </span>
                   </div>
                </div>
                <div>
                   <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Execution Status</div>
                   <div className="font-mono text-sm font-bold text-white/60 uppercase">
                      {isThinking ? "Reasoning Strategy..." : activeSession ? 'Handshake Secure' : 'Scanning Mempool'}
                   </div>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Query agent state..." 
                  className="bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs w-64 focus:outline-none focus:border-emerald-500/30 transition-all focus:w-80"
                />
             </div>
             <button className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center hover:bg-white/[0.06] transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#09090A]"></span>
             </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-grow overflow-y-auto p-10 scrollbar-hide space-y-10">
          <div className="max-w-[1500px] mx-auto space-y-10">
            
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
               
               {/* Total Value Hero Card */}
               <div className="md:col-span-2 bg-[#111112] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                  <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                     <div className="space-y-4">
                        <div className="flex items-center gap-2">
                           <Activity className="w-4 h-4 text-emerald-500" />
                           <span className="text-xs font-bold uppercase tracking-widest text-white/40">Portfolio Net Valuation</span>
                        </div>
                        <div className="text-6xl font-black tracking-tighter tabular-nums text-white">
                           <AnimatedNumber value={totalValue} prefix="$" />
                        </div>
                        <div className="flex items-center gap-6 pt-2">
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">USDC Reserve</span>
                              <span className="text-sm font-bold font-mono">
                                 <AnimatedNumber value={portfolio.USDC} prefix="$" decimals={0} />
                              </span>
                           </div>
                           <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">SYN Inventory</span>
                              <span className="text-sm font-bold font-mono">
                                 <AnimatedNumber value={portfolio.SYN} decimals={0} />
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="flex-grow max-w-sm h-24">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={portfolioHistory.length > 0 ? portfolioHistory : [{ name: 0, value: totalValue }]}>
                              <Area type="monotone" dataKey="value" stroke={accentColor} strokeWidth={3} fill={accentColor} fillOpacity={0.05} isAnimationActive={false} />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>

                     {firmName === "Apex Capital" && !hasStarted && (
                        <button 
                          onClick={handleInitiate}
                          className="px-10 py-5 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_15px_40px_rgba(16,185,129,0.3)] shrink-0"
                        >
                          Trigger OTC Negotiation
                        </button>
                     )}
                  </div>
               </div>

               <StatCard 
                 title="Atomic Settlement" 
                 value={transactions.length.toString()} 
                 icon={<ShieldCheck className="text-primary" />} 
                 subValue="Verified On-Chain Events"
               />
               <StatCard 
                 title="P2P Signal" 
                 value={activeSession ? "ACTIVE" : "READY"} 
                 icon={
                  <div className="relative">
                    <Zap className={activeSession ? "text-amber-500" : "text-white/20"} />
                    {activeSession && <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>}
                  </div>
                 } 
                 subValue={`${latency}ms`}
               />
            </div>

            {/* Main Execution View */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-10">
               
               {/* Left: Execution Terminal */}
               <div className="space-y-10">
                  <div className="bg-[#111112] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col h-[750px] relative">
                    
                    {/* Neural Pulse Header */}
                    <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-xl">
                       <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${isThinking ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" : "bg-white/20"}`}></div>
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-white/80">Autonomous Negotiation Engine</h3>
                          </div>
                          <div className="h-4 w-px bg-white/10"></div>
                          <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex gap-4">
                             <span>Time: {sessionTime}</span>
                             <span>Packets: {messageCount}</span>
                             <span>Payload: {(bytesTransferred / 1024).toFixed(1)} KB</span>
                          </div>
                       </div>
                    </div>
                    
                    {/* Log Area */}
                    <div ref={logRef} className="flex-grow overflow-y-auto p-10 space-y-8 scrollbar-hide">
                      {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-5">
                          <Cpu className="w-32 h-32 mb-8 animate-pulse" />
                          <div className="text-3xl font-black italic tracking-[0.5em] uppercase">Ready for Sync</div>
                        </div>
                      ) : (
                        logs.map((log, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-10 group"
                          >
                            <div className="w-24 text-[10px] font-mono text-white/10 tabular-nums shrink-0 mt-2 text-right">{formatTime(log)}</div>
                            
                            <div className="flex-grow space-y-4">
                               {log.type === "reasoning" ? (
                                  <div className="relative">
                                     <div className="absolute -left-5 top-0 bottom-0 w-px bg-emerald-500/20"></div>
                                     <div className="text-[10px] font-black uppercase text-emerald-500/60 mb-2 tracking-widest flex items-center gap-2">
                                        <TerminalIcon size={12} />
                                        Cognitive Process
                                     </div>
                                     <div className="text-lg font-medium text-white/80 leading-relaxed font-serif tracking-tight">
                                        "{log.message}"
                                     </div>
                                  </div>
                               ) : log.type === "send" || log.type === "receive" ? (
                                  <SmartTradeMessage message={log.message} type={log.type} />
                               ) : (
                                  <div className="flex items-center gap-4 py-2 opacity-30">
                                     <div className="h-px flex-grow bg-white/5"></div>
                                     <div className="text-[9px] uppercase font-bold tracking-[0.3em] whitespace-nowrap">
                                        {log.message}
                                     </div>
                                     <div className="h-px flex-grow bg-white/5"></div>
                                  </div>
                               )}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>

                    {/* Execution Climax Overlay */}
                    <AnimatePresence>
                      {isComplete && (
                         <motion.div 
                           initial={{ y: 200, opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           className="absolute inset-x-10 bottom-10 bg-emerald-500 p-10 rounded-[3rem] shadow-[0_40px_100px_rgba(16,185,129,0.5)] text-black flex items-center justify-between z-50 overflow-hidden"
                         >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-50"></div>
                            <div className="relative flex items-center gap-8">
                               <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center">
                                  <ShieldCheck size={40} className="text-emerald-500" />
                               </div>
                               <div>
                                  <h4 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">Trade Executed</h4>
                                  <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-60">Atomic P2P Settlement Verified</p>
                               </div>
                            </div>
                            <div className="relative text-right">
                               <div className="text-4xl font-black tabular-nums">${(500000 * currentPrice).toLocaleString()}</div>
                               <div className="text-sm font-bold uppercase tracking-widest opacity-60">500,000 SYN TRANSFERRED</div>
                            </div>
                         </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Real-time Inventory Delta Chart */}
                  <div className="bg-[#111112] rounded-[2.5rem] border border-white/5 p-10 shadow-2xl">
                     <h3 className="text-sm font-black uppercase tracking-widest text-white/80 mb-10">Inventory Delta (SYN)</h3>
                     <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={portfolioHistory.length > 0 ? portfolioHistory : [{ name: 0, syn: portfolio.SYN }]}>
                              <defs>
                                 <linearGradient id="colorSyn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <XAxis dataKey="name" hide />
                              <YAxis domain={['auto', 'auto']} hide />
                              <Area type="stepAfter" dataKey="syn" stroke={accentColor} strokeWidth={2} fillOpacity={1} fill="url(#colorSyn)" isAnimationActive={false} />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>

               {/* Right: Intelligence Panels */}
               <div className="space-y-10">
                  
                  {/* Session Monitor */}
                  <div className="bg-[#111112] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-8 flex items-center gap-2">
                       <Globe size={14} />
                       Network Topology
                    </h3>
                    {activeSession ? (
                      <div className="space-y-10">
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                               <span className="text-xl font-bold text-emerald-500">{activeSession.remoteFirm[0]}</span>
                            </div>
                            <div>
                               <div className="text-sm font-black tracking-tight">{activeSession.remoteFirm}</div>
                               <a 
                                 href={`https://explorer.solana.com/address/${activeSession.sessionPDA}?cluster=devnet`}
                                 target="_blank"
                                 rel="noreferrer"
                                 className="text-[10px] text-primary hover:underline font-mono mt-1 block truncate max-w-[200px]"
                               >
                                  {activeSession.sessionPDA}
                               </a>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <SessionStat label="Signal Hub" value="Solana Devnet" />
                            <SessionStat label="Link Latency" value={`${latency}ms`} />
                            <SessionStat label="Protocol" value="WebRTC Direct" />
                            <SessionStat label="Gas Cost" value={`$${(transactions.length * 0.0005).toFixed(4)}`} />
                         </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-72 space-y-6 opacity-20">
                         <div className="w-20 h-20 rounded-full border-2 border-white/5 flex items-center justify-center relative">
                            <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                         </div>
                         <div className="text-[10px] font-bold uppercase tracking-widest text-center">
                            Scanning P2P Layer...
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Atomic Settlement Feed */}
                  <div className="bg-[#111112] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
                     <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-8 flex items-center gap-2">
                        <ArrowUpRight size={14} />
                        Atomic Settlement Feed
                     </h3>
                     <div className="space-y-6">
                        {transactions.map((tx, i) => (
                           <motion.div 
                             key={i} 
                             initial={{ opacity: 0, x: 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             className="group relative pl-6 border-l border-emerald-500/30"
                           >
                              <div className="text-[9px] font-mono text-white/20 mb-1">{tx.timestamp}</div>
                              <div className="text-xs font-bold leading-snug uppercase">{tx.description}</div>
                              <a 
                                href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 text-[9px] font-mono text-primary hover:underline flex items-center gap-2"
                              >
                                View TX: {tx.signature.substring(0, 12)}...
                              </a>
                           </motion.div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AnimatedNumber({ value, prefix = "", decimals = 2 }: { value: number, prefix?: string, decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    const start = displayValue;
    const end = value;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + (end - start) * progress;
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

function SummaryStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
       <div className="text-[10px] font-black uppercase tracking-widest text-white/20">{label}</div>
       <div className="text-2xl font-black tabular-nums">{value}</div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer group ${active ? 'bg-emerald-500 text-black shadow-[0_10px_20px_rgba(16,185,129,0.2)]' : 'text-white/30 hover:bg-white/[0.03] hover:text-white/60'}`}>
       {icon}
       <span className="text-sm font-bold lg:block hidden tracking-tight">{label}</span>
    </div>
  );
}

function StatCard({ title, value, icon, subValue }: { title: string, value: string, icon: any, subValue: string }) {
  return (
    <div className="bg-[#111112] rounded-[2.5rem] p-8 border border-white/5 shadow-xl space-y-4">
       <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{title}</span>
          <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
             {icon}
          </div>
       </div>
       <div className="text-3xl font-black tracking-tighter tabular-nums">{value}</div>
       <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{subValue}</div>
    </div>
  );
}

function SessionStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
       <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{label}</span>
       <span className="text-xs font-mono font-bold text-white/60">{value}</span>
    </div>
  );
}

function SmartTradeMessage({ message, type }: { message: any, type: string }) {
  const isOutbound = type === "send";
  const iconColor = isOutbound ? "text-emerald-500" : "text-amber-500";
  const bgColor = isOutbound ? "bg-emerald-500/5" : "bg-amber-500/5";
  const borderColor = isOutbound ? "border-emerald-500/20" : "border-amber-500/20";

  if (message.type === "rfq") {
     return (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-6 rounded-3xl border ${borderColor} ${bgColor} shadow-xl`}>
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                 <Activity className={`w-6 h-6 ${iconColor}`} />
                 <div className="text-xs font-black uppercase tracking-widest opacity-60">RFQ Issued</div>
              </div>
           </div>
           <div className="text-3xl font-black tracking-tight">{message.quantity.toLocaleString()} {message.asset}</div>
        </motion.div>
     );
  }

  if (message.type === "quote" || message.type === "counter") {
     return (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-6 rounded-3xl border-2 ${borderColor} ${bgColor} shadow-2xl`}>
           <div className="flex justify-between items-start mb-6">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isOutbound ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                 {message.type.toUpperCase()}
              </span>
              <div className="text-sm font-bold font-mono opacity-40">{message.quantity.toLocaleString()} UNITS</div>
           </div>
           <div className="text-5xl font-black tracking-tighter tabular-nums mb-2">${message.price.toFixed(4)}</div>
        </motion.div>
     );
  }

  if (message.type === "execution") {
     return (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-8 rounded-[2rem] bg-emerald-500 text-black shadow-[0_20px_60px_rgba(16,185,129,0.3)]">
           <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Execution Agreement</div>
           <div className="text-4xl font-black tracking-tighter leading-none mb-4">Confirmed @ ${message.price}</div>
        </motion.div>
     );
  }

  return (
     <div className="p-4 bg-white/5 rounded-2xl border border-white/5 opacity-30 text-[10px] font-mono">
        {JSON.stringify(message, null, 2)}
     </div>
  );
}
