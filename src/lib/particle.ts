"use client";

import {
  UniversalAccount,
  type IUniversalAccountConfig,
} from "@particle-network/universal-account-sdk";

let uaInstance: UniversalAccount | null = null;
let currentOwner: string | null = null;

export function getUA(ownerAddress: string): UniversalAccount {
  // Re-create if owner changed (new login)
  if (uaInstance && currentOwner === ownerAddress) return uaInstance;

  const projectId = process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID;
  const clientKey = process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY;
  const appUuid = process.env.NEXT_PUBLIC_PARTICLE_APP_UUID;

  if (!projectId || !clientKey || !appUuid) {
    throw new Error(
      "Missing Particle Network credentials. Set NEXT_PUBLIC_PARTICLE_PROJECT_ID, NEXT_PUBLIC_PARTICLE_CLIENT_KEY, and NEXT_PUBLIC_PARTICLE_APP_UUID."
    );
  }

  const config: IUniversalAccountConfig = {
    projectId,
    projectClientKey: clientKey,
    projectAppUuid: appUuid,
    ownerAddress,
    smartAccountOptions: {
      name: "SIMPLE",
      version: "2.0.0",
      ownerAddress,
      useEIP7702: true,
    },
    tradeConfig: {
      universalGas: true,
    },
  };

  uaInstance = new UniversalAccount(config);
  currentOwner = ownerAddress;
  return uaInstance;
}

export function resetUA() {
  uaInstance = null;
  currentOwner = null;
}
