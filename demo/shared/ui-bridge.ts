import { WebSocketServer, WebSocket } from "ws";

export class UIBridge {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      console.log(`[UI Bridge] Dashboard connected on port ${port}`);
      ws.on("close", () => this.clients.delete(ws));
    });
    console.log(`[UI Bridge] Listening on port ${port}`);
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
