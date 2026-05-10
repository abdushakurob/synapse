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
    { role: "system", content: `CRITICAL: You must first write your reasoning (max 2 sentences). Then, output ONLY a valid JSON object matching the schema. Do not output an array. Do not output markdown or backticks. Your response should look like: \nMy reasoning is...\n{ "type": "..." }` },
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
      temperature: 0.2, // Low temp for more logical trading decisions
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

  // Extract reasoning: everything before the first '{' or '['
  const jsonStartIndex = content.search(/[\{\[]/);
  let reasoning = "No reasoning provided.";
  let jsonString = content;

  if (jsonStartIndex > 0) {
    reasoning = content.substring(0, jsonStartIndex).trim();
    // Remove boilerplate reasoning if it's too short or generic
    if (reasoning.length < 5) reasoning = "Analyzing counterparty request and optimizing trade strategy...";
    jsonString = content.substring(jsonStartIndex);
  } else if (jsonStartIndex === -1) {
    // If no JSON, maybe the whole thing is reasoning? 
    // Or maybe it's just JSON without reasoning.
    if (content.trim().startsWith("{")) {
       reasoning = "Executing trade logic based on autonomous firm strategy.";
       jsonString = content;
    } else {
       throw new Error("No JSON found in LLM response.");
    }
  }

  // Attempt to parse JSON from the response. We'll strip markdown blocks just in case.
  try {
    // Try to strip any trailing non-json garbage if it fails initially
    let cleaned = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Model occasionally concatenates multiple arrays together without commas
    if (cleaned.includes("][")) {
      cleaned = cleaned.split("][")[0] + "]";
    }

    // Sometimes the model outputs a stray '}]' or '}' at the end of its generation
    if (cleaned.endsWith("}]") && !cleaned.startsWith("[")) cleaned = cleaned.slice(0, -2);
    if (cleaned.endsWith("}}") && !cleaned.endsWith("}}}")) cleaned = cleaned.slice(0, -1);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (innerErr) {
      // Very aggressive fallback to extract just the first {...} block
      const match = cleaned.match(/\{[\s\S]*?\}/); // Non-greedy match for the first object
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw innerErr;
      }
    }
    
    // Handle cases where the model returns an array instead of raw JSON
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && parsed[0].arguments) {
        parsed = parsed[0].arguments;
      } else if (parsed.length > 0) {
        parsed = parsed[0];
      }
    }
    
    return { reasoning, message: parsed };
  } catch (err) {
    console.error("[LLM] Failed to parse JSON:", content);
    throw new Error("LLM did not return valid JSON");
  }
}
