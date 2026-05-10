import { WebSocketServer, WebSocket } from "ws";

export class UIBridge {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  private messageHandlers: ((msg: any) => void)[] = [];

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      console.log(`[UI Bridge] Dashboard connected on port ${port}`);
      
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

      ws.on("close", () => this.clients.delete(ws));
    });
    console.log(`[UI Bridge] Listening on port ${port}`);
  }

  onMessage(handler: (msg: any) => void) {
    this.messageHandlers.push(handler);
  }

  notify(event: string, data: any) {
    const payload = JSON.stringify({ event, ...data, timestamp: Date.now() });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}
