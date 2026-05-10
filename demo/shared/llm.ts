import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
if (!TOGETHER_API_KEY) {
  throw new Error("TOGETHER_API_KEY is not set in the environment.");
}

export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  role: Role;
  content: string;
}

export async function generateAgentResponse(
  systemPrompt: string,
  history: ChatMessage[],
  portfolio: any
): Promise<{ reasoning: string; message: any }> {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `Current Portfolio State: ${JSON.stringify(portfolio)}` },
    { role: "system", content: `CRITICAL OPERATIONAL PARAMETERS:
1. You are a high-stakes autonomous trading bot. You ONLY communicate via the provided JSON schema.
2. NEVER output a JSON message with type: "reasoning". Reasoning is internal only.
3. Your response MUST start with "REASONING: [1-2 sentences of strategy]".
4. Immediately following the reasoning, output the JSON message. 
5. Example:
REASONING: Counterparty quote of $0.48 is above our limit. Countering at $0.46 to test their spread.
{ "type": "counter", "asset": "SYN", "quantity": 500000, "price": 0.46 }` },
    ...history
  ];

  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOGETHER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "LiquidAI/LFM2-24B-A2B",
      messages,
      temperature: 0.1, // Even lower for more deterministic strategy
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Together AI API failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from LLM");
  }

  // Extract reasoning: everything before the first '{'
  const jsonStartIndex = content.indexOf("{");
  let reasoning = "Analyzing counterparty request and optimizing trade strategy...";
  let jsonString = content;

  if (jsonStartIndex !== -1) {
    const rawReasoning = content.substring(0, jsonStartIndex).trim();
    if (rawReasoning.length > 5) {
      reasoning = rawReasoning.replace(/^REASONING:\s*/i, "").replace(/^My reasoning is:\s*/i, "").trim();
    }
    jsonString = content.substring(jsonStartIndex);
  }

  // Attempt to parse JSON from the response. 
  try {
    let cleaned = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Very aggressive extraction of the FIRST valid JSON object
    const match = cleaned.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error("No JSON object found");
    
    let parsed = JSON.parse(match[0]);

    // Emergency fix: if the model STILL sends a 'reasoning' type message, 
    // we extract the text for the UI but do NOT send it over the wire as a trading message.
    if (parsed.type === "reasoning") {
       reasoning = parsed.message || reasoning;
       throw new Error("Model hallucinated a reasoning-type message");
    }
    
    return { reasoning, message: parsed };
  } catch (err) {
    console.error("[LLM] Failed to parse JSON:", content);
    throw new Error("LLM did not return valid JSON");
  }
}
