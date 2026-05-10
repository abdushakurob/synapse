import { useState, useEffect, useCallback } from "react";

export interface LogEntry {
  type: "send" | "receive" | "status" | "info" | "reasoning";
  timestamp: string;
  message: any;
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
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
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
            setLogs(prev => [...prev, { type: "reasoning", timestamp: new Date(data.timestamp).toLocaleTimeString(), message: data.text }]);
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

  const sendMessage = useCallback((msg: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(msg));
    }
  }, [socket, isConnected]);

  return { isConnected, logs, portfolio, activeSession, sendMessage };
}
