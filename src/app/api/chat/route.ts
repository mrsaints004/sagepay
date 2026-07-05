import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildUserPrompt, parseIntentLocally } from "@/lib/intent-parser";

function getOpenAI() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const OpenAI = require("openai").default;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Simple per-IP rate limiter: 20 requests per 60-second window
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: Request) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
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

    // If no API key, use local parser
    if (!process.env.OPENAI_API_KEY) {
      const intent = parseIntentLocally(message);
      return NextResponse.json(intent);
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      return NextResponse.json(parsed);
    } catch {
      const intent = parseIntentLocally(message);
      return NextResponse.json(intent);
    }
  } catch (error) {
    console.error("Chat API error:", error);
    try {
      const { message } = await request.clone().json();
      const intent = parseIntentLocally(message);
      return NextResponse.json(intent);
    } catch {
      return NextResponse.json(
        { type: "UNKNOWN", raw: "", message: "Something went wrong" },
        { status: 500 }
      );
    }
  }
}
