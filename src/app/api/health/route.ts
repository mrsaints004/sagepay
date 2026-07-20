import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

interface HealthCheck {
  status: "ok" | "degraded";
  checks: {
    database: "ok" | "error";
    particle: "ok" | "missing";
    magic: "ok" | "missing";
  };
  timestamp: string;
}

export async function GET() {
  const checks: HealthCheck["checks"] = {
    database: "error",
    particle: "missing",
    magic: "missing",
  };

  // DB connectivity
  try {
    await sql`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  // Particle config
  if (
    process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY &&
    process.env.NEXT_PUBLIC_PARTICLE_APP_UUID
  ) {
    checks.particle = "ok";
  }

  // Magic config
  if (process.env.NEXT_PUBLIC_MAGIC_API_KEY) {
    checks.magic = "ok";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");
  const health: HealthCheck = {
    status: allOk ? "ok" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(health, { status: allOk ? 200 : 503 });
}
