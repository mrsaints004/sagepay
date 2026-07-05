declare module "@particle-network/universal-account-sdk" {
  // Re-export everything — the actual types exist in dist/index.d.ts
  // but the package.json "exports" field doesn't include "types"

  export enum CHAIN_ID {
    SOLANA_MAINNET = 101,
    ETHEREUM_MAINNET = 1,
    BSC_MAINNET = 56,
    BASE_MAINNET = 8453,
    ARBITRUM_MAINNET_ONE = 42161,
    OPTIMISM_MAINNET = 10,
    POLYGON_MAINNET = 137,
  }

  export enum SUPPORTED_TOKEN_TYPE {
    ETH = "eth",
    USDT = "usdt",
    USDC = "usdc",
    BTC = "btc",
    BNB = "bnb",
    SOL = "sol",
  }

  export interface IBasicToken {
    chainId: number;
    address: string;
  }

  export interface IBuyTransaction {
    token: IBasicToken;
    amountInUSD: string;
  }

  export interface ITransferTransaction {
    token: IBasicToken;
    amount: string;
    receiver: string;
  }

  export interface IToken {
    assetId?: string;
    type?: SUPPORTED_TOKEN_TYPE;
    chainId: number;
    address: string;
    decimals: number;
    realDecimals: number;
    name?: string;
    symbol?: string;
    image?: string;
    price?: number;
  }

  export interface IChainAggregation {
    token: IToken;
    amount: number;
    amountInUSD: number;
    rawAmount: number;
  }

  export interface IAsset {
    tokenType: SUPPORTED_TOKEN_TYPE;
    price: number;
    amount: number;
    amountInUSD: number;
    chainAggregation: IChainAggregation[];
  }

  export interface IAssetsResponse {
    assets: IAsset[];
    totalAmountInUSD: number;
  }

  export interface ISmartAccountOptions {
    name: string;
    version: string;
    ownerAddress: string;
    smartAccountAddress?: string;
    useEIP7702?: boolean;
    options?: any;
  }

  export interface ITradeConfig {
    slippageBps?: number;
    universalGas?: boolean;
    usePrimaryTokens?: SUPPORTED_TOKEN_TYPE[];
  }

  export interface IUniversalAccountConfig {
    projectId: string;
    projectClientKey: string;
    projectAppUuid: string;
    smartAccountOptions?: ISmartAccountOptions;
    tradeConfig?: ITradeConfig;
    ownerAddress?: string;
  }

  export interface ITokenWithUSD {
    token: IToken;
    amount: string;
    amountInUSD: string;
    senderAddress: string;
  }

  export interface IUserOpEVM {
    sender: string;
    nonce: string;
    callData: string;
    signature: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    eip7702Auth?: {
      chainId: number;
      nonce: number;
      address: string;
    };
  }

  export interface IUserOpWithChain {
    chainId: number;
    userOp: IUserOpEVM;
    userOpHash: string;
    expiredAt: number;
    eip7702Auth?: {
      chainId: number;
      nonce: number;
      address: string;
    };
    eip7702Delegated?: boolean;
  }

  export interface ITransaction {
    type: string;
    mode: string;
    sender: string;
    receiver: string;
    transactionId: string;
    userOps: IUserOpWithChain[];
    rootHash: string;
    totalDepositTokenAmountInUSD: string;
    tokenChanges: any;
    feeQuotes: any[];
    data: any[];
  }

  export interface EIP7702Authorization {
    userOpHash: string;
    signature: string;
  }

  export class UniversalAccount {
    constructor(config: IUniversalAccountConfig);
    getPrimaryAssets(): Promise<IAssetsResponse>;
    createBuyTransaction(payload: IBuyTransaction, tradeConfig?: ITradeConfig): Promise<ITransaction>;
    createTransferTransaction(payload: ITransferTransaction): Promise<ITransaction>;
    sendTransaction(transaction: ITransaction, signature: string, authorizations?: EIP7702Authorization[]): Promise<any>;
    getTransaction(transactionId: string): Promise<any>;
    getTransactions(page?: number, limit?: number, tag?: string): Promise<any>;
    getSmartAccountOptions(): Promise<ISmartAccountOptions>;
    getEIP7702Auth(chainIds: number[]): Promise<any>;
  }
}
