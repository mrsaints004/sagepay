"use client";

import {
  UniversalAccount,
  UNIVERSAL_ACCOUNT_VERSION,
  type IUniversalAccountConfig,
} from "@particle-network/universal-account-sdk";
import { clientEnv } from "./env";

let uaInstance: UniversalAccount | null = null;
let currentOwner: string | null = null;

export function getUA(ownerAddress: string): UniversalAccount {
  if (uaInstance && currentOwner === ownerAddress) return uaInstance;

  const config: IUniversalAccountConfig = {
    projectId: clientEnv.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
    projectClientKey: clientEnv.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
    projectAppUuid: clientEnv.NEXT_PUBLIC_PARTICLE_APP_UUID,
    ownerAddress,
    smartAccountOptions: {
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
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
