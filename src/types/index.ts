export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  intent?: ParsedIntent;
  txStatus?: TransactionStatus;
}

export interface ParsedIntent {
  type: "BALANCE" | "SEND" | "SWAP" | "PAY" | "REQUEST" | "MOVE" | "UNKNOWN";
  amount?: number;
  token?: string;
  toAddress?: string;
  toToken?: string;
  serviceName?: string;
  memo?: string;
  recipientName?: string;
  raw: string;
}

export interface TransactionStatus {
  state: "pending" | "confirming" | "confirmed" | "failed";
  txHash?: string;
  chain?: string;
  sourceChains?: string[];
  settlementChain?: string;
  error?: string;
}

export interface DelegationStatus {
  isDelegated: boolean;
  chains: Record<number, boolean>;
}

export interface Asset {
  symbol: string;
  name: string;
  balance: number;
  balanceUSD: number;
  chain: string;
  chainId: number;
  address: string;
  logo?: string;
}

export interface UnifiedBalance {
  totalUSD: number;
  assets: Asset[];
}

export interface UserState {
  address: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  email?: string;
}

export interface PaymentLink {
  id: string;
  creatorAddress: string;
  creatorEmail?: string;
  amount: number;
  token: string;
  memo?: string;
  status: "pending" | "paid" | "expired";
  createdAt: string;
  paidBy?: string;
  paidFromChain?: string;
  txHash?: string;
}
