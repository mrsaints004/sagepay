"use client";

import { Magic } from "magic-sdk";
import { OAuthExtension } from "@magic-ext/oauth2";
import { clientEnv } from "./env";
import { getDefaultChain } from "./chains";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let magicInstance: any = null;

export function getMagic(): Magic & { oauth2: OAuthExtension } {
  if (typeof window === "undefined") {
    throw new Error("Magic SDK can only be used in the browser");
  }

  if (!magicInstance) {
    const defaultChain = getDefaultChain();
    magicInstance = new Magic(clientEnv.NEXT_PUBLIC_MAGIC_API_KEY, {
      network: {
        rpcUrl: defaultChain.rpcUrl,
        chainId: defaultChain.id,
      },
      extensions: [new OAuthExtension()],
    });
  }

  return magicInstance;
}
