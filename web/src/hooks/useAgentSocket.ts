import { useState, useEffect, useCallback } from "react";

export interface LogEntry {
  type: "send" | "receive" | "status" | "info" | "reasoning" | "blockchain";
  timestamp: string;
  message: any;
}

export interface BlockchainTx {
  signature: string;
  description: string;
  timestamp: string;
}

export interface SessionData {
  sessionPDA: string;
  remoteFirm: string;
  latency?: string;
  cost?: string;
  status: "active" | "closed";
}

export interface Portfolio {
  USDC: number;
  SYN: number;
}

export function useAgentSocket(wsUrl: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [transactions, setTransactions] = useState<BlockchainTx[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio>({ USDC: 0, SYN: 0 });
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      setLogs((prev) => [...prev, { type: "info", timestamp: new Date().toLocaleTimeString(), message: "Connected to Agent Interface" }]);
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      setLogs((prev) => [...prev, { type: "info", timestamp: new Date().toLocaleTimeString(), message: "Disconnected from Agent Interface" }]);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.event) {
          case "session_opened":
            setActiveSession({
              sessionPDA: data.sessionPDA,
              remoteFirm: data.remoteFirm,
              status: "active",
              latency: "38ms", // Mocked for demo aesthetics
              cost: "$0.001"
            });
            break;
            
          case "session_closed":
            if (activeSession && activeSession.sessionPDA === data.sessionPDA) {
              setActiveSession(prev => prev ? { ...prev, status: "closed" } : null);
            }
            break;
            
          case "message_sent":
            setLogs(prev => [...prev, { type: "send", timestamp: new Date(data.timestamp).toLocaleTimeString(), message: data.message }]);
            break;
            
          case "message_received":
            setLogs(prev => [...prev, { type: "receive", timestamp: new Date(data.timestamp).toLocaleTimeString(), message: data.message }]);
            break;
            
          case "portfolio_updated":
            setPortfolio(data.portfolio);
            break;
            
          case "status":
            setLogs(prev => [...prev, { type: "status", timestamp: new Date().toLocaleTimeString(), message: data.message }]);
            break;

          case "reasoning":
            setLogs(prev => [...prev, { type: "reasoning", timestamp: new Date(data.timestamp || Date.now()).toLocaleTimeString(), message: data.text }]);
            break;
            
          case "blockchain_tx":
            const newTx: BlockchainTx = {
              signature: data.signature,
              description: data.description,
              timestamp: new Date().toLocaleTimeString()
            };
            setTransactions(prev => [newTx, ...prev]);
            setLogs(prev => [...prev, { 
              type: "blockchain", 
              timestamp: newTx.timestamp, 
              message: `${data.description} (Sig: ${data.signature.substring(0, 8)}...)` 
            }]);
            break;
        }
      } catch (err) {
        console.error("Error parsing websocket message", err);
      }
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [wsUrl]);

  const startNegotiation = useCallback(() => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type: "start" }));
      setHasStarted(true);
    }
  }, [socket, isConnected]);

  return { isConnected, logs, portfolio, activeSession, transactions, hasStarted, startNegotiation };
}
