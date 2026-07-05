"use client";

import { Magic } from "magic-sdk";
import { OAuthExtension } from "@magic-ext/oauth2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let magicInstance: any = null;

export function getMagic(): Magic & { oauth2: OAuthExtension } {
  if (typeof window === "undefined") {
    throw new Error("Magic SDK can only be used in the browser");
  }

  if (!magicInstance) {
    const key = process.env.NEXT_PUBLIC_MAGIC_API_KEY;
    if (!key) throw new Error("NEXT_PUBLIC_MAGIC_API_KEY is not set");

    magicInstance = new Magic(key, {
      network: {
        rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
        chainId: 421614,
      },
      extensions: [new OAuthExtension()],
    });
  }

  return magicInstance;
}
