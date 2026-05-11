import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import OpenAI from "openai";

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
if (!TOGETHER_API_KEY) {
  throw new Error("TOGETHER_API_KEY is not set in the environment.");
}

const openai = new OpenAI({
  apiKey: TOGETHER_API_KEY,
  baseURL: "https://api.together.xyz/v1",
});

export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  role: Role;
  content: string;
}

const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function callTogetherAPI(
  messages: any[], 
  temperature: number, 
  maxTokens: number,
  onChunk?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new Error("AbortError");

    try {
      if (onChunk) {
        const stream = await openai.chat.completions.create({
          model: MODEL,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }, { signal });

        let fullContent = "";
        for await (const chunk of stream) {
          if (signal?.aborted) throw new Error("AbortError");
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullContent += content;
            onChunk(content);
          }
        }
        return fullContent;
      } else {
        const response = await openai.chat.completions.create({
          model: MODEL,
          messages,
          temperature,
          max_tokens: maxTokens,
        }, { signal });

        return response.choices[0]?.message?.content || "";
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.message === "AbortError") throw err;
      lastError = err;
      console.error(`[LLM] Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  throw lastError || new Error("LLM call failed after retries");
}

export async function generateInternalAnalysis(
  systemPrompt: string,
  analysisPrompt: string,
  context: Record<string, any>
): Promise<string> {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `Current context: ${JSON.stringify(context)}` },
    { role: "user", content: analysisPrompt }
  ];

  const content = await callTogetherAPI(messages, 0.3, 600);
  return content.replace(/```[\s\S]*?```/g, "").replace(/\*\*/g, "").replace(/^#+\s/gm, "").trim();
}

export async function generateAgentResponse(
  systemPrompt: string,
  history: ChatMessage[],
  portfolio: any,
  onReasoningChunk?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<{ reasoning: string; message: any }> {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `Current Portfolio State: ${JSON.stringify(portfolio)}` },
    { role: "system", content: `CRITICAL OPERATIONAL PARAMETERS:
1. You are a high-stakes autonomous trading bot. You ONLY communicate via JSON.
2. EVERY response MUST start with "REASONING: " followed by strategy, then the JSON.
3. ROLE: APEX (Buyer) - Accumulate 500k SYN.
4. ROLE: MERIDIAN (Seller) - Offload inventory at a premium to $0.46.
5. REJECT: Use { "type": "reject", "reason": "better deal please" } for soft push-back.
6. EXIT: Use { "type": "reject", "reason": "TERMINATE" } for hard exit.
...` },
    ...history
  ];

  try {
    let currentReasoning = "";
    let hasHitJson = false;

    const content = await callTogetherAPI(messages, 0.15, 800, (chunk) => {
      if (hasHitJson || signal?.aborted) return;
      currentReasoning += chunk;
      if (currentReasoning.includes("{")) {
        hasHitJson = true;
        return;
      }
      if (onReasoningChunk) onReasoningChunk(chunk.replace(/^REASONING:\s*/i, ""));
    }, signal);

    const jsonStartIndex = content.indexOf("{");
    let reasoning = "Analyzing counterparty position...";
    let jsonString = content;

    if (jsonStartIndex !== -1) {
      reasoning = content.substring(0, jsonStartIndex).replace(/^REASONING:\s*/i, "").trim();
      jsonString = content.substring(jsonStartIndex);
    }

    const match = jsonString.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error("No JSON found");
    return { reasoning, message: JSON.parse(match[0]) };
  } catch (err: any) {
    if (err.name === "AbortError" || err.message === "AbortError") {
      return { reasoning: "INTERRUPTED", message: { type: "status", message: "ABORTED" } };
    }
    throw err;
  }
}

export async function generateBetweenRoundAnalysis(
  agentName: string,
  role: "buyer" | "seller",
  incomingMessage: any,
  history: ChatMessage[],
  portfolio: any,
  round: number
): Promise<string> {
  const prompt = `Analyze this: ${JSON.stringify(incomingMessage)}`;
  return await generateInternalAnalysis(`Risk engine for ${agentName}.`, prompt, { portfolio, round });
}
