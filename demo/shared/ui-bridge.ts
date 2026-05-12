import { WebSocketServer, WebSocket } from "ws";

export class UIBridge {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private messageHandlers: ((msg: any) => void)[] = [];
  
  // Persistence state
  private state: Record<string, any> = {};
  private logBuffer: any[] = [];

  private static sharedServers: Map<number, WebSocketServer> = new Map();
  private agentId: string;

  constructor(port: number, agentId: string = "apex") {
    this.agentId = agentId;
    
    // Reuse server if already created for this port (Render/Single-port support)
    if (!UIBridge.sharedServers.has(port)) {
      UIBridge.sharedServers.set(port, new WebSocketServer({ port }));
      
      const server = UIBridge.sharedServers.get(port)!;
      
      // Handle plain HTTP GET for health checks
      (server as any)._server.on("request", (req: any, res: any) => {
        if (req.method === "GET" && req.url?.startsWith("/")) {
          if (!res.headersSent) {
            res.writeHead(200);
            res.end("OK");
          }
        }
      });
    }

    this.wss = UIBridge.sharedServers.get(port)!;

    this.wss.on("connection", (ws, req) => {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);
      const wsAgentId = url.searchParams.get("agent") || "apex";
      
      // Only add to clients if it matches this bridge's agentId
      if (wsAgentId === this.agentId) {
        this.clients.add(ws);
        console.log(`[UI Bridge] Agent ${wsAgentId} dashboard connected`);
        
        // Send buffered state and logs to new client
        for (const [event, data] of Object.entries(this.state)) {
          ws.send(JSON.stringify({ event, ...data, timestamp: Date.now() }));
        }
        for (const log of this.logBuffer) {
          ws.send(JSON.stringify(log));
        }

        ws.on("message", (data) => {
          try {
            const msg = JSON.parse(data.toString());
            for (const handler of this.messageHandlers) {
              handler(msg);
            }
          } catch (err) {
            console.error(`[UI Bridge] Failed to parse incoming message`, err);
          }
        });

        ws.on("close", () => {
          this.clients.delete(ws);
          console.log(`[UI Bridge] Agent ${wsAgentId} dashboard disconnected`);
        });
      }
    });

    console.log(`[UI Bridge] Agent ${agentId} listening on shared port ${port}`);
  }

  onMessage(handler: (msg: any) => void) {
    this.messageHandlers.push(handler);
  }

  notify(event: string, data: any) {
    const payloadObj = { event, ...data, timestamp: Date.now() };
    const payload = JSON.stringify(payloadObj);

    // Persist critical state
    if (["session_opened", "portfolio_updated", "active_sessions", "phase_change", "deal_update"].includes(event)) {
      this.state[event] = data;
    }
    
    // Buffer logs, analysis, crypto events, and transactions
    if ([
      "message_sent", "message_received", "reasoning", "blockchain_tx",
      "status", "internal_analysis", "crypto_event", "phase_change",
      "trade_executed", "price_update"
    ].includes(event)) {
      this.logBuffer.push(payloadObj);
      if (this.logBuffer.length > 200) this.logBuffer.shift();
    }

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}
