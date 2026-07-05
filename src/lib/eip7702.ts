"use client";

import type { Sign7702AuthorizationResponse } from "@magic-sdk/types";
import { getMagic } from "./magic";

/**
 * Signs an EIP-7702 authorization using Magic's embedded wallet.
 */
export async function signAuthorization(authorization: {
  chainId: number;
  contractAddress: string;
  nonce?: number;
}) {
  const magic = getMagic();
  return magic.wallet.sign7702Authorization(authorization);
}

/**
 * Sends an EIP-7702 transaction via Magic.
 */
export async function send7702Transaction(params: {
  to: string;
  value?: string;
  data?: string;
  authorizationList: Sign7702AuthorizationResponse[];
}) {
  const magic = getMagic();
  return magic.wallet.send7702Transaction(params);
}

/**
 * Gets the Magic RPC provider for standard transaction signing.
 */
export function getMagicProvider() {
  const magic = getMagic();
  return magic.rpcProvider;
}
