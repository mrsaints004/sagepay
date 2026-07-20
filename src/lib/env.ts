import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_PARTICLE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_PARTICLE_CLIENT_KEY: z.string().min(1),
  NEXT_PUBLIC_PARTICLE_APP_UUID: z.string().min(1),
  NEXT_PUBLIC_MAGIC_API_KEY: z.string().min(1),
  NEXT_PUBLIC_CHAIN_ENV: z.enum(["testnet", "mainnet"]).default("testnet"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

let _serverEnv: ServerEnv | null = null;
let _clientEnv: ClientEnv | null = null;

/** Server-side env — validated on first access (lazy to avoid build-time failures) */
export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Missing server environment variables:\n${formatted}`);
  }
  _serverEnv = parsed.data;
  return _serverEnv;
}

/** Client-side env — validated on first access */
export const clientEnv: ClientEnv = new Proxy({} as ClientEnv, {
  get(_target, prop: string) {
    if (!_clientEnv) {
      const parsed = clientSchema.safeParse({
        NEXT_PUBLIC_PARTICLE_PROJECT_ID: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
        NEXT_PUBLIC_PARTICLE_CLIENT_KEY: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
        NEXT_PUBLIC_PARTICLE_APP_UUID: process.env.NEXT_PUBLIC_PARTICLE_APP_UUID,
        NEXT_PUBLIC_MAGIC_API_KEY: process.env.NEXT_PUBLIC_MAGIC_API_KEY,
        NEXT_PUBLIC_CHAIN_ENV: process.env.NEXT_PUBLIC_CHAIN_ENV,
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      });
      if (!parsed.success) {
        // During build/SSG, return empty strings instead of throwing
        if (typeof window === "undefined") {
          return "" as unknown;
        }
        const formatted = parsed.error.issues
          .map((i) => `  ${i.path.join(".")}: ${i.message}`)
          .join("\n");
        throw new Error(`Missing client environment variables:\n${formatted}`);
      }
      _clientEnv = parsed.data;
    }
    return _clientEnv[prop as keyof ClientEnv];
  },
});
