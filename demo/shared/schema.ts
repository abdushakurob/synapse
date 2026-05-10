export type Message =
  | { type: "rfq"; asset: string; quantity: number; side: "buy" | "sell" }
  | { type: "quote"; asset: string; quantity: number; price: number; expiresIn: number }
  | { type: "counter"; asset: string; quantity: number; price: number }
  | { type: "execution"; asset: string; quantity: number; price: number; agreed: true }
  | { type: "reject"; reason: string }
  | { type: "status"; message: string };

export interface AgentPortfolio {
  USDC: number;
  SYN: number;
}
