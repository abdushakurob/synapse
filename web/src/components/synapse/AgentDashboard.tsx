import { useAgentSocket } from "@/hooks/useAgentSocket";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
   AreaChart,
   Area,
   XAxis,
   YAxis,
   Tooltip,
   ResponsiveContainer,
   CartesianGrid
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
   Network,
   TrendingUp,
   X
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
      finalReport,
      negotiationHistory,
      tradeLedger,
      latency,
      messageCount,
      bytesTransferred,
      sessionStartTime,
      startNegotiation,
      resetDemo,
      dismissComplete
   } = useAgentSocket(`ws://localhost:${wsPort}`);

   const scrollRef = useRef<HTMLDivElement>(null);
   const [countdown, setCountdown] = useState<number | null>(null);
   const [showSummary, setShowSummary] = useState(false);
   const [sessionTime, setSessionTime] = useState("0:00");

   // Format HH:MM:SS timestamp
   const ts = () => {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
   };

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
         // setShowSummary(false);
      }
   }, [isComplete]);

   useEffect(() => {
      if (scrollRef.current) {
         scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
   }, [logs]);

   const currentPrice = useMemo(() => {
      const tradeMessages = logs.filter(l => l.message && (l.message.type === 'quote' || l.message.type === 'counter' || l.message.type === 'execution'));
      if (tradeMessages.length > 0) {
         const lastMsg = tradeMessages[tradeMessages.length - 1].message;
         return lastMsg.price || 0.46;
      }
      return 0.46;
   }, [logs]);

   const marketBias = useMemo(() => {
      const diff = currentPrice - 0.46;
      if (Math.abs(diff) < 0.0001) return "NEUTRAL";
      return firmName === "Apex Capital"
         ? (diff > 0 ? "BEARISH" : "BULLISH")
         : (diff > 0 ? "BULLISH" : "BEARISH");
   }, [firmName, currentPrice]);

   const chartData = useMemo(() => {
    const baseline = 0.46;
    if (negotiationHistory.length === 0) return [
      { name: -10, price: baseline },
      { name: -5, price: baseline },
      { name: 0, price: currentPrice }
    ];
    if (negotiationHistory.length === 1) return [
      { name: -5, price: baseline },
      { name: 0, price: baseline },
      ...negotiationHistory
    ];
    return negotiationHistory;
  }, [negotiationHistory, currentPrice]);

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

         {/* Summary Screen Removed per user request - Redundant with Climax Overlay */}

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
                        <span className={activeSession ? "text-emerald-500" : isConnected ? "text-amber-500 animate-pulse" : "text-white/20"}>
                           {activeSession ? "Active" : isConnected ? "Handshaking" : "Offline"}
                        </span>
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
                           {isThinking ? "Reasoning Strategy..." : activeSession ? 'Handshake Secure' : isConnected ? 'Agent Synchronized' : 'Scanning Mempool'}
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
                        title="Market Bias"
                        value={negotiationHistory.length > 5 ? (
                           firmName === "Apex Capital"
                              ? (negotiationHistory[negotiationHistory.length - 1].price > negotiationHistory[negotiationHistory.length - 5].price ? "BEARISH" : "BULLISH")
                              : (negotiationHistory[negotiationHistory.length - 1].price > negotiationHistory[negotiationHistory.length - 5].price ? "BULLISH" : "BEARISH")
                        ) : "NEUTRAL"}
                        icon={<Network className={negotiationHistory.length > 5 && ((firmName === "Apex Capital" && negotiationHistory[negotiationHistory.length - 1].price > negotiationHistory[negotiationHistory.length - 5].price) || (firmName === "Meridian Trading" && negotiationHistory[negotiationHistory.length - 1].price < negotiationHistory[negotiationHistory.length - 5].price)) ? "text-rose-500" : "text-emerald-500"} />}
                        subValue={firmName === "Apex Capital" ? "Buying Pressure Index" : "Inventory Yield Index"}
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
                                    <div className="text-3xl font-black italic tracking-[0.5em] uppercase">
                                       {isConnected ? "Handshake Initialized" : "Ready for Sync"}
                                    </div>
                                 </div>
                              ) : (
                                 logs
                                    .filter(log => {
                                       if (log.type !== "status") return true;
                                       return true;
                                    })
                                    .map((log, i, filteredLogs) => (
                                       <motion.div
                                          key={log.id}
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
                                                   <div className="text-lg font-medium text-white/80 leading-relaxed font-serif tracking-tight whitespace-pre-wrap">
                                                      {log.message}
                                                   </div>
                                                </div>
                                             ) : log.type === "send" || log.type === "receive" ? (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: filteredLogs[i-1]?.type === "reasoning" ? 2.8 : 0 }}
                                  >
                                    <SmartTradeMessage message={log.message} type={log.type} />
                                  </motion.div>
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
                              <div ref={scrollRef} />
                           </div>

                           {/* Execution Climax Overlay */}
                           <AnimatePresence>
                              {isComplete && (
                                 <motion.div
                                    initial={{ y: 500, opacity: 0, scale: 0.9 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    exit={{ y: 500, opacity: 0, scale: 0.9 }}
                                    className="absolute inset-x-6 bottom-6 top-24 bg-emerald-500 rounded-[3rem] shadow-[0_50px_120px_rgba(16,185,129,0.6)] text-black flex flex-col z-50 overflow-hidden"
                                 >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 opacity-90"></div>

                                    {/* Header Section */}
                                    <div className="relative p-10 border-b border-black/10 flex items-center justify-between">
                                       <div className="flex items-center gap-8">
                                          <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center shadow-xl">
                                             <ShieldCheck size={32} className="text-emerald-500" />
                                          </div>
                                          <div>
                                             <h4 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1">Trade Complete</h4>
                                             <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Atomic P2P Settlement Finalized</p>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <button
                                             onClick={resetDemo}
                                             className="px-6 py-3 bg-black text-emerald-500 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-black/80 transition-all"
                                          >
                                             <RefreshCw size={14} />
                                             Reset Simulation
                                          </button>
                                          <button
                                             onClick={() => dismissComplete()}
                                             className="w-12 h-12 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
                                          >
                                             <X size={24} />
                                          </button>
                                       </div>
                                    </div>

                                    {/* Briefing Section */}
                                    <div className="relative flex-grow overflow-y-auto p-10 space-y-10 scrollbar-hide">

                                       {/* Financial Settlement Grid */}
                                       <div className="grid grid-cols-3 gap-6">
                                          <div className="bg-black/10 rounded-3xl p-6 border border-black/5">
                                             <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">USDC Delta</div>
                                             <div className={`text-2xl font-black tabular-nums ${firmName === "Apex Capital" ? "text-rose-900" : "text-emerald-900"}`}>
                                                {firmName === "Apex Capital" ? "-" : "+"}${(500000 * currentPrice).toLocaleString()}
                                             </div>
                                          </div>
                                          <div className="bg-black/10 rounded-3xl p-6 border border-black/5">
                                             <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">SYN Delta</div>
                                             <div className={`text-2xl font-black tabular-nums ${firmName === "Apex Capital" ? "text-emerald-900" : "text-rose-900"}`}>
                                                {firmName === "Apex Capital" ? "+" : "-"}500,000
                                             </div>
                                          </div>
                                          <div className="bg-black/20 rounded-3xl p-6 border border-black/10 shadow-inner">
                                             <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-black/60">Slippage / Premium</div>
                                             <div className="text-2xl font-black tabular-nums text-black/80">
                                                {firmName === "Apex Capital" ? "-" : "+"}{((currentPrice / 0.46 - 1) * 100).toFixed(2)}%
                                             </div>
                                          </div>
                                       </div>

                                       <div className="space-y-4">
                                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50">
                                             <Zap size={12} />
                                             Intelligence Briefing
                                          </div>
                                          <div className="text-2xl font-bold leading-tight tracking-tight font-serif italic text-black/90">
                                             {finalReport ? <div className="text-sm text-white/70 leading-relaxed font-serif italic whitespace-pre-wrap">{finalReport}</div> : "Strategic analysis pending..."}
                                          </div>
                                       </div>

                                       {/* Tactical Performance Analytics */}
                                       <div className="p-8 bg-black/5 rounded-[2.5rem] border border-black/5">
                                          <div className="flex items-center gap-3 mb-6">
                                             <Activity className="text-black/40" size={16} />
                                             <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Execution Analytics</span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-10">
                                             <div>
                                                <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-2">Benchmark Performance</div>
                                                <div className="text-xl font-bold tracking-tight">
                                                   {firmName === "Apex Capital"
                                                      ? (currentPrice < 0.46 ? "EXCEEDED" : "UNDERPERFORMED")
                                                      : (currentPrice > 0.46 ? "EXCEEDED" : "UNDERPERFORMED")}
                                                </div>
                                                <div className="text-[10px] opacity-40 mt-1">Relative to liquidity floor</div>
                                             </div>
                                             <div>
                                                <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-2">Capital Intensity</div>
                                                <div className="text-xl font-bold tracking-tight">MODERATE</div>
                                                <div className="text-[10px] opacity-40 mt-1">Optimized via scaled entries</div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Footer Stats */}
                                    <div className="relative p-10 bg-black text-emerald-500 flex justify-between items-center">
                                       <div className="flex gap-10">
                                          <div>
                                             <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 text-white">Qty Acquired</div>
                                             <div className="text-2xl font-black tabular-nums">
                                                {tradeLedger.reduce((acc, t) => acc + t.quantity, 0).toLocaleString()} SYN
                                             </div>
                                          </div>
                                          <div className="border-l border-white/10 pl-10">
                                             <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 text-white">Execution Avg</div>
                                             <div className="text-2xl font-black tabular-nums">${currentPrice.toFixed(4)}</div>
                                          </div>
                                       </div>
                                       <div className="text-right">
                                          <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 text-white">Total Volume</div>
                                          <div className="text-2xl font-black tabular-nums">${(500000 * currentPrice).toLocaleString()}</div>
                                       </div>
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>

                        {/* Real-time Price Negotiation Chart */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                           {/* Left Column: Metrics & Chart */}
                           <div className="flex flex-col gap-10">

                              {/* Performance Metrics */}
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-[#111112] rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                       <TrendingUp size={48} />
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Unrealized P&L</div>
                                    <div className={`text-3xl font-black tabular-nums tracking-tighter ${Math.abs(currentPrice - 0.46) < 0.0001
                                          ? "text-white/40"
                                          : (firmName === "Apex Capital"
                                             ? (currentPrice < 0.46 ? "text-emerald-500" : "text-rose-500")
                                             : (currentPrice > 0.46 ? "text-emerald-500" : "text-rose-500"))
                                       }`}>
                                       {Math.abs(currentPrice - 0.46) < 0.0001 ? "" : (
                                          firmName === "Apex Capital"
                                             ? (currentPrice < 0.46 ? "+" : "-")
                                             : (currentPrice > 0.46 ? "+" : "-")
                                       )}
                                       ${Math.abs((currentPrice - 0.46) * 500000).toLocaleString()}
                                    </div>
                                    <div className="text-[9px] font-bold text-white/20 mt-2 uppercase tracking-widest">
                                       Rel. to Benchmark $0.4600
                                    </div>
                                 </div>
                                 <div className="bg-[#111112] rounded-3xl p-6 border border-white/5">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Market Pressure</div>
                                    <div className={`text-3xl font-black tracking-tighter ${marketBias === "NEUTRAL" ? "text-white/40" : marketBias === "BULLISH" ? "text-emerald-500" : "text-rose-500"}`}>
                                       {marketBias}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                       <div className="flex-grow h-1 bg-white/5 rounded-full overflow-hidden">
                                          <motion.div
                                             className={`h-full ${marketBias === "NEUTRAL" ? "bg-white/10" : marketBias === "BULLISH" ? "bg-emerald-500" : "bg-rose-500"}`}
                                             initial={{ width: "50%" }}
                                             animate={{ width: marketBias === "NEUTRAL" ? "50%" : marketBias === "BULLISH" ? "85%" : "15%" }}
                                          />
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* Primary Negotiation Chart */}
                              <div className="bg-[#111112] rounded-[2.5rem] p-10 border border-white/5 flex-grow flex flex-col relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-10 opacity-5">
                                    <Network size={120} />
                                 </div>

                                 <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div>
                                       <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/40 mb-2">P2P Price Discovery</h3>
                                       <div className="flex items-baseline gap-3">
                                          <span className="text-5xl font-black tabular-nums tracking-tighter">${currentPrice.toFixed(4)}</span>
                                          <span className={`text-xs font-bold ${currentPrice >= 0.46 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                             {currentPrice >= 0.46 ? '▲' : '▼'} {Math.abs(((currentPrice / 0.46) - 1) * 100).toFixed(2)}%
                                          </span>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Last Update</div>
                                       <div className="text-xs font-mono font-bold text-emerald-500/80">{ts()}</div>
                                    </div>
                                 </div>

                                 <div className="h-[300px] w-full relative z-10 mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                       <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                          <defs>
                                             <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={firmName.toLowerCase().includes("apex") ? "#f43f5e" : "#10b981"} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={firmName.toLowerCase().includes("apex") ? "#f43f5e" : "#10b981"} stopOpacity={0}/>
                                             </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                          <YAxis hide domain={[0.4, 0.5]} />
                                          <XAxis hide dataKey="name" />
                                          <Tooltip
                                             contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                             itemStyle={{ color: '#10b981' }}
                                             labelStyle={{ display: 'none' }}
                                          />
                                          <Area 
                                             type="monotone" 
                                             dataKey="price" 
                                             stroke={firmName.toLowerCase().includes("apex") ? "#f43f5e" : "#10b981"} 
                                             strokeWidth={4} 
                                             fillOpacity={1}
                                             fill="url(#colorPrice)"
                                             animationDuration={500}
                                          />
                                       </AreaChart>
                                    </ResponsiveContainer>
                                 </div>
                              </div>
                           </div>

                           {/* Trade Ledger / Market Activity */}
                           <div className="bg-[#111112] rounded-[2.5rem] border border-white/5 p-10 shadow-2xl flex flex-col">
                              <div className="flex justify-between items-center mb-8">
                                 <h3 className="text-sm font-black uppercase tracking-widest text-white/80">Transaction Ledger</h3>
                                 <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Global P2P Settlements</div>
                              </div>
                              <div className="flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                                 {tradeLedger.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                                       <RefreshCw size={40} className="animate-spin mb-4" />
                                       <span className="text-[10px] font-bold uppercase tracking-widest">Scanning Chain...</span>
                                    </div>
                                 ) : (
                                    tradeLedger.map((trade, i) => (
                                       <motion.div
                                          key={trade.id}
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors"
                                       >
                                          <div className="flex items-center gap-4">
                                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${trade.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                                {trade.side[0]}
                                             </div>
                                             <div>
                                                <div className="text-[10px] font-black tracking-tight">{trade.id}</div>
                                                <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{trade.timestamp}</div>
                                             </div>
                                          </div>
                                          <div className="text-right">
                                             <div className="text-xs font-black tabular-nums">{trade.quantity.toLocaleString()} SYN</div>
                                             <div className="text-[10px] font-mono text-white/40">${trade.price.toFixed(4)}</div>
                                          </div>
                                       </motion.div>
                                    ))
                                 )}
                              </div>
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
                                    <SessionStat label="Est. Session Cost" value={`~${(transactions.length * 0.000005 + 0.002).toFixed(6)} SOL`} />
                                 </div>
                              </div>
                           ) : (
                              <div className="flex flex-col items-center justify-center h-72 space-y-6 opacity-20">
                                 <div className="w-20 h-20 rounded-full border-2 border-white/5 flex items-center justify-center relative">
                                    <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                                 </div>
                                 <div className="text-[10px] font-bold uppercase tracking-widest text-center">
                                    {isConnected ? "Awaiting Peer Signal..." : "Scanning P2P Layer..."}
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
                              {transactions.length === 0 ? (
                                 <div className="py-10 flex flex-col items-center justify-center opacity-20 border border-dashed border-white/10 rounded-3xl">
                                    <RefreshCw className="w-8 h-8 mb-4 animate-spin" />
                                    <div className="text-[10px] font-black uppercase tracking-widest">Scanning P2P Network</div>
                                 </div>
                              ) : (
                                 transactions.map((tx, i) => (
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
                                 ))
                              )}
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

const TypewriterText = React.memo(({ text, speed = 20 }: { text: string, speed?: number }) => {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isFinished) return;
    
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      setIsFinished(true);
    }
  }, [index, text, speed, isFinished]);

  if (isFinished) return <span>{text}</span>;
  return <span>{displayed}</span>;
});

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
            <div className="text-5xl font-black tracking-tighter tabular-nums mb-2">${(message.price || 0).toFixed(4)}</div>
         </motion.div>
      );
   }

   if (message.type === "execution") {
      return (
         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-8 rounded-[2rem] bg-emerald-500 text-black shadow-[0_20px_60px_rgba(16,185,129,0.3)]">
            <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Execution Agreement</div>
            <div className="text-4xl font-black tracking-tighter leading-none mb-4">Confirmed @ ${message.price || "N/A"}</div>
         </motion.div>
      );
   }

   return (
      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 opacity-30 text-[10px] font-mono">
         {JSON.stringify(message, null, 2)}
      </div>
   );
}
