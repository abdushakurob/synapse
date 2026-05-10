import { useEffect, useState, useRef, useCallback } from "react";

export interface LogEntry {
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
            setMessageCount(prev => prev + 1);
            if (data.message.price) {
              priceRef.current = data.message.price;
            }
            setLogs(prev => [...prev, { 
              type: data.event === "message_sent" ? "send" : "receive", 
              message: data.message, 
              timestamp,
              ms
            }]);
            break;
          case "status":
            setLogs(prev => [...prev, { type: "status", message: data.message, timestamp, ms }]);
            break;
          case "reasoning":
            setLogs(prev => [...prev, { type: "reasoning", message: data.text, timestamp, ms }]);
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
            setTransactions(prev => [{
              signature: data.signature,
              description: data.description,
              timestamp
            }, ...prev]);
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
    // Latency Jitter simulation
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
  };
}
