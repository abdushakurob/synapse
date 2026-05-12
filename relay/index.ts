import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      throw new Error("TOGETHER_API_KEY is not set in the relay environment.");
    }
    _openai = new OpenAI({
      apiKey,
      baseURL: "https://api.together.xyz/v1",
    });
  }
  return _openai;
}

app.use(cors());
app.use(express.json());

// Rate limiting: 50 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many requests. Please try again later." },
});
app.use(limiter);

app.post("/v1/chat/completions", async (req: express.Request, res: express.Response) => {
  try {
    const { messages, model, temperature, max_tokens, stream } = req.body;

    if (stream) {
      const completion = await getOpenAI().chat.completions.create({
        messages,
        model: model || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1024,
        stream: true,
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of completion as any) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      const response = await getOpenAI().chat.completions.create({
        messages,
        model: model || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1024,
        stream: false,
      });
      res.json(response);
    }
  } catch (err: any) {
    console.error("[Relay Error]:", err.message);
    res.status(500).json({ error: "Relay failed to process LLM request" });
  }
});

app.get("/health", (req: express.Request, res: express.Response) => res.send("Synapse AI Relay is LIVE."));

app.listen(port, () => {
  console.log(`Synapse AI Relay listening at http://localhost:${port}`);
});
