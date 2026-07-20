import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildUserPrompt, parseIntentLocally } from "@/lib/intent-parser";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

function getGroqClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const OpenAI = require("openai").default;
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

const limiter = createRateLimiter({ limit: 20, windowMs: 60_000 });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { limited } = limiter.check(ip);

  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message too long (max 500 characters)" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      const intent = parseIntentLocally(message);
      return NextResponse.json(intent);
    }

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(message) },
      ],
      temperature: 0,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content ?? "";

    try {
      const parsed = JSON.parse(content);
      // Validate the LLM response has a valid intent type
      const validTypes = ["BALANCE", "SEND", "SWAP", "REQUEST", "MOVE", "PAY", "UNKNOWN"];
      if (!parsed.type || !validTypes.includes(parsed.type)) {
        const intent = parseIntentLocally(message);
        return NextResponse.json(intent);
      }
      // Ensure amount is a number if present
      if (parsed.amount !== undefined && parsed.amount !== null) {
        parsed.amount = Number(parsed.amount);
        if (!Number.isFinite(parsed.amount)) {
          parsed.amount = undefined;
        }
      }
      return NextResponse.json(parsed);
    } catch {
      const intent = parseIntentLocally(message);
      return NextResponse.json(intent);
    }
  } catch (error) {
    Sentry.captureException(error);
    logger.error("Chat API error", { error: String(error) });
    return NextResponse.json(
      { type: "UNKNOWN", raw: "", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
