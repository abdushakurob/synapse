import { useEffect, useState, useRef, useCallback } from "react";

export interface LogEntry {
  id: string;
  type: "info" | "reasoning" | "send" | "receive" | "status";
  message: any;
  timestamp: string;
  ms: number;
}

export interface SessionData {
  remoteFirm: string;
  sessionPDA: string;
  latency: string;
  cost: string;
}

export interface Portfolio {
  USDC: number;
  SYN: number;
}

export interface BlockchainTx {
  signature: string;
  description: string;
  timestamp: string;
}

export function useAgentSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [transactions, setTransactions] = useState<BlockchainTx[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio>({ USDC: 0, SYN: 0 });
  const [portfolioHistory, setPortfolioHistory] = useState<{name: number, value: number, syn: number}[]>([]);
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [negotiationHistory, setNegotiationHistory] = useState<{name: number, price: number}[]>([]);
  const [tradeLedger, setTradeLedger] = useState<{id: string, side: 'BUY' | 'SELL', quantity: number, price: number, timestamp: string}[]>([]);
  
  // Live Metrics
  const [latency, setLatency] = useState(38);
  const [messageCount, setMessageCount] = useState(0);
  const [bytesTransferred, setBytesTransferred] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const priceRef = useRef<number>(0.46);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const now = new Date();
        const timestamp = now.toLocaleTimeString();
        const ms = now.getMilliseconds();
        
        // Track Bytes
        setBytesTransferred(prev => prev + event.data.length);

        switch (data.event) {
          case "message_sent":
          case "message_received":
          case "reasoning":
          case "status":
          case "internal_analysis":
            setLogs(prev => {
              // De-duplicate by ID
              if (data.id && prev.some(l => l.id === data.id && (l.type !== "reasoning" || l.message === (data.message || data.text)))) {
                return prev;
              }

              // Update existing reasoning block
              if (data.event === "reasoning") {
                const lastLog = prev[prev.length - 1];
                if (lastLog && lastLog.type === "reasoning" && lastLog.id === data.id) {
                  return [
                    ...prev.slice(0, -1),
                    { ...lastLog, message: data.text }
                  ];
                }
              }

              if (data.event === "message_sent" || data.event === "message_received") {
                setMessageCount(c => c + 1);
                if (data.message?.price) {
                  priceRef.current = data.message.price;
                  setNegotiationHistory(h => [...h, { name: h.length, price: data.message.price }].slice(-30));
                }
              }

              const logType = data.event === "message_sent" ? "send" : 
                             data.event === "message_received" ? "receive" : 
                             data.event === "reasoning" ? "reasoning" : 
                             data.event === "internal_analysis" ? "reasoning" : "status";

              return [...prev, {
                id: data.id || Math.random().toString(36).substring(7),
                type: logType as any,
                message: data.message || data.text,
                timestamp,
                ms
              }].slice(-100);
            });
            break;

          case "reasoning_chunk":
            setLogs(prev => {
              const lastLog = prev[prev.length - 1];
              if (lastLog && lastLog.type === "reasoning" && lastLog.id === data.id) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastLog, message: lastLog.message + data.chunk }
                ];
              }
              // Fallback
              return [...prev, {
                id: data.id,
                type: "reasoning",
                message: data.chunk,
                timestamp,
                ms
              }];
            });
            break;

          case "price_update":
            priceRef.current = data.price;
            setNegotiationHistory(prev => [...prev, { name: prev.length, price: data.price }].slice(-30));
            break;
            
          case "final_report":
            setFinalReport(data.report);
            break;

          case "session_opened":
            setSessionStartTime(Date.now());
            setActiveSession({
              remoteFirm: data.remoteFirm,
              sessionPDA: data.sessionPDA,
              latency: "38ms",
              cost: "$0.001"
            });
            break;

          case "portfolio_updated":
            const currentTotal = data.portfolio.USDC + (data.portfolio.SYN * priceRef.current);
            setPortfolio(data.portfolio);
            setPortfolioHistory(prev => {
              const newEntry = { 
                name: prev.length, 
                value: currentTotal, 
                syn: data.portfolio.SYN 
              };
              return [...prev, newEntry].slice(-50);
            });
            break;

          case "blockchain_tx":
            setTransactions(prev => {
              if (prev.some(tx => tx.signature === data.signature)) return prev;
              return [{
                signature: data.signature,
                description: data.description,
                timestamp
              }, ...prev].slice(0, 50);
            });
            break;

          case "trade_executed":
            setTradeLedger(prev => [{
              id: Math.random().toString(36).substring(7).toUpperCase(),
              side: data.trade.side,
              quantity: data.trade.quantity,
              price: data.trade.price,
              timestamp: new Date().toLocaleTimeString()
            }, ...prev].slice(0, 20));
            break;

          case "execution_complete":
            setIsComplete(true);
            break;
        }
      } catch (err) {
        console.error(`[Socket] Failed to process message:`, err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => connect(), 2000);
    };

    ws.onerror = () => ws.close();
  }, [url]);

  useEffect(() => {
    connect();
    const interval = setInterval(() => {
      setLatency(36 + Math.floor(Math.random() * 8));
    }, 1500);
    return () => {
      clearInterval(interval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
    };
  }, [connect]);

  const startNegotiation = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "start" }));
      setHasStarted(true);
    }
  };

  const resetDemo = () => {
    setLogs([]);
    setTransactions([]);
    setPortfolioHistory([]);
    setNegotiationHistory([]);
    setTradeLedger([]);
    setFinalReport(null);
    setActiveSession(null);
    setHasStarted(false);
    setIsComplete(false);
    setMessageCount(0);
    setBytesTransferred(0);
    setSessionStartTime(null);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "reset" }));
    }
  };

  return {
    isConnected,
    logs,
    portfolio,
    portfolioHistory,
    negotiationHistory,
    tradeLedger,
    finalReport,
    activeSession,
    transactions,
    hasStarted,
    isComplete,
    latency,
    messageCount,
    bytesTransferred,
    sessionStartTime,
    startNegotiation,
    resetDemo,
    dismissComplete: () => setIsComplete(false)
  };
}
