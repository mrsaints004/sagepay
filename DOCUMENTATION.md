# SagePay — Full Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication](#authentication)
4. [Chat Engine](#chat-engine)
5. [Blockchain Operations](#blockchain-operations)
6. [Payment Links](#payment-links)
7. [API Reference](#api-reference)
8. [Data Models](#data-models)
9. [Components](#components)
10. [Configuration](#configuration)
11. [Deployment](#deployment)

---

## Overview

SagePay is a cross-chain payment platform that uses natural language processing to execute blockchain transactions. Users interact through a chat interface, typing commands like "Send 100 USDC to 0x..." or "Request $25 for dinner," and the app handles the rest — parsing intent, building transactions, routing across chains, and settling on the cheapest network.

The core innovation is combining two ideas:
- **AI chat as the transaction interface** — no forms, no dropdowns, just type what you want
- **Shareable payment links** — the chat can create persistent financial instruments that anyone can pay

### Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 + React 19 | Server/client rendering, routing |
| Auth | Magic.link SDK | Email OTP + Google OAuth, wallet creation |
| Blockchain | Particle Network UA SDK | Cross-chain account abstraction |
| AI | OpenAI GPT-4o-mini | Natural language intent parsing |
| Styling | Tailwind CSS 4 + Framer Motion | UI + animations |
| Storage | In-memory Map | Payment link persistence (demo) |

### Supported Chains

| Chain | Chain ID | Network | Role |
|-------|----------|---------|------|
| Arbitrum Sepolia | 421614 | Testnet | Default, lowest-fee target |
| Ethereum Sepolia | 11155111 | Testnet | Secondary |
| Base Sepolia | 84532 | Testnet | Secondary |

### Supported Tokens

| Token | Arbitrum Sepolia | Ethereum Sepolia | Base Sepolia |
|-------|-----------------|-----------------|-------------|
| USDC | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| ETH | Native (0x0) | Native (0x0) | Native (0x0) |

---

## Architecture

### High-Level Flow

```
User Input (chat)
    |
    v
Intent Parser (OpenAI or local regex)
    |
    v
Intent Router (useChat.ts)
    |
    +---> BALANCE --> Particle SDK getPrimaryAssets()
    +---> SEND    --> Particle SDK createTransferTransaction()
    +---> SWAP    --> Particle SDK createBuyTransaction()
    +---> REQUEST --> POST /api/links --> return shareable URL
    +---> MOVE    --> Particle SDK createBuyTransaction() (consolidate)
    |
    v
User Confirmation (Confirm/Cancel buttons)
    |
    v
Transaction Signing (Magic EIP-7702 provider)
    |
    v
Particle SDK sendTransaction()
    |
    v
Settlement (cross-chain via Universal Account)
```

### Directory Structure

```
src/
  app/                    # Next.js App Router pages and API routes
    api/chat/             # POST: intent parsing
    api/links/            # POST/GET: payment link CRUD
    api/links/[id]/       # GET/PATCH: single link operations
    dashboard/            # Main authenticated dashboard
    pay/[id]/             # Public payment page (SSR)
    callback/             # OAuth callback handler
  components/
    chat/                 # Chat UI components
    dashboard/            # Dashboard cards, lists, actions
    pay/                  # Payment page + success screen
    shared/               # Reusable components (Navbar, ChainBadge, etc.)
    landing/              # Landing page sections
    ui/                   # shadcn base components
  hooks/
    useChat.ts            # Chat state machine + intent execution
    useUniversalAccount.ts # Blockchain operations wrapper
    useMagicAuth.ts       # Auth hook (thin wrapper)
  lib/
    intent-parser.ts      # AI system prompt + regex fallback
    particle.ts           # Particle UA singleton
    magic.ts              # Magic SDK singleton
    eip7702.ts            # EIP-7702 signing helpers
    db.ts                 # In-memory payment link store
    chains.ts             # Chain configuration
    tokens.ts             # Token address registry
    utils.ts              # Formatting utilities
  context/
    AuthContext.tsx        # Global auth state provider
  types/
    index.ts              # TypeScript interfaces
    particle.d.ts         # Particle SDK type augmentation
```

---

## Authentication

### Provider: Magic.link

Magic creates non-custodial wallets tied to email addresses or social logins. No browser extension required — the wallet lives in Magic's Delegated Key Management infrastructure.

### Configuration

```typescript
// src/lib/magic.ts
const magic = new Magic(NEXT_PUBLIC_MAGIC_API_KEY, {
  network: {
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    chainId: 421614,
  },
  extensions: [new OAuthExtension()],
});
```

### Login Methods

| Method | Flow |
|--------|------|
| Email OTP | User enters email -> Magic sends code -> user enters code -> wallet created |
| Google OAuth | Redirect to Google -> callback to `/callback` -> wallet created |

### Auth State

Managed by `AuthContext.tsx`:

```typescript
interface UserState {
  address: string | null;   // Ethereum address from Magic wallet
  isLoggedIn: boolean;
  isLoading: boolean;
  email?: string;           // From Magic metadata
}
```

### Session Recovery

On app load, `checkSession()` attempts to recover an existing Magic session:
1. Checks `magic.user.isLoggedIn()` with 5-second timeout
2. If logged in, fetches user metadata and eth_accounts
3. If wallet not initialized (stale session), forces logout
4. Falls back to logged-out state on any error

### Dev Bypass

Set `DEV_BYPASS = true` in `AuthContext.tsx` to skip login with a hardcoded address. Must be `false` for production.

---

## Chat Engine

### Intent Types

The chat processes 7 intent types:

| Type | Trigger Examples | Action |
|------|-----------------|--------|
| `BALANCE` | "What's my balance?", "How much do I have?" | Fetch + display unified balance |
| `SEND` | "Send 100 USDC to 0x742d..." | Create transfer, await confirmation |
| `SWAP` | "Swap 50 USDC to ETH" | Create buy transaction, await confirmation |
| `PAY` | "Pay Netflix $15.99" | Create transfer to service, await confirmation |
| `REQUEST` | "Request $25 for dinner from Alice" | Create payment link, return URL |
| `MOVE` | "Move funds to lowest-fee chain" | Consolidate to Arbitrum Sepolia, await confirmation |
| `UNKNOWN` | Conversational input | Show help message |

### Parsing Pipeline

```
User message
    |
    v
1. Try /api/chat (OpenAI GPT-4o-mini)
    |
    +-- Success: return structured JSON
    |
    +-- Failure (no API key, network error, invalid JSON):
            |
            v
2. Fall back to parseIntentLocally() (regex)
```

### OpenAI System Prompt

The AI is instructed to return only valid JSON. Temperature is 0 for deterministic output. Max tokens is 200.

```json
// Example outputs:
{"type":"BALANCE"}
{"type":"SEND","amount":100,"token":"USDC","toAddress":"0x742d..."}
{"type":"SWAP","amount":50,"token":"USDC","toToken":"ETH"}
{"type":"REQUEST","amount":25,"token":"USDC","recipientName":"Alice","memo":"dinner"}
{"type":"MOVE"}
{"type":"UNKNOWN","message":"I can help with payments and transfers!"}
```

### Local Regex Fallback

When OpenAI is unavailable, `parseIntentLocally()` uses pattern matching:

- **BALANCE**: Contains "balance", "how much", "what do i have", "my assets"
- **MOVE**: Contains "move funds", "lowest fee", "optimize gas", "consolidate", "cheapest chain"
- **REQUEST**: Matches `request $amount [token] [from name] [for memo]`
- **SEND**: Matches `send $amount [token] to 0x[40 hex chars]`
- **SWAP**: Matches `swap $amount [token] to/for/into [token]`
- **PAY**: Matches `pay [service name] [$amount]`

### Confirmation Flow

For SEND, SWAP, PAY, and MOVE intents:
1. Bot shows confirmation message with transaction details
2. User sees Confirm/Cancel buttons
3. On Confirm: transaction is signed via Magic and broadcast via Particle
4. On Cancel: pending intent is cleared

REQUEST does not require confirmation — the link is created immediately.

---

## Blockchain Operations

### Particle Network Universal Account

The Universal Account (UA) SDK abstracts multi-chain operations into a single interface. A user has one unified balance across all supported chains, and transactions are routed automatically.

#### Initialization

```typescript
// src/lib/particle.ts
const config = {
  projectId: NEXT_PUBLIC_PARTICLE_PROJECT_ID,
  projectClientKey: NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
  projectAppUuid: NEXT_PUBLIC_PARTICLE_APP_UUID,
  ownerAddress: userAddress,
  smartAccountOptions: {
    name: "SIMPLE",
    version: "2.0.0",
    ownerAddress: userAddress,
  },
  tradeConfig: {
    universalGas: true,  // Pay gas in any token
  },
};
```

The UA instance is a singleton per owner address, recreated on login change.

### Operations

#### fetchBalance()

```typescript
const response = await ua.getPrimaryAssets();
// Returns: { assets: IAsset[], totalAmountInUSD: number }
```

Maps SDK assets to UI format, filtering out dust amounts (< $0.01), sorted by USD value.

#### sendTransaction(to, amount, tokenSymbol)

```typescript
const tx = await ua.createTransferTransaction({
  token: { chainId, address: tokenAddress },
  amount: amount.toString(),
  receiver: toAddress,
});
const { signature, authorizations } = await signUserOps(tx.userOps);
const result = await ua.sendTransaction(tx, signature, authorizations);
```

The SDK automatically finds the best source chain for the user's funds.

#### swapTokens(amountUSD, fromToken, toToken)

```typescript
const tx = await ua.createBuyTransaction({
  token: { chainId: targetChainId, address: targetTokenAddress },
  amountInUSD: amountUSD.toString(),
});
```

Uses Particle's buy transaction to acquire the target token using any available balance.

#### moveToLowestFee()

Consolidation flow:
1. Fetch current asset distribution via `getPrimaryAssets()`
2. Calculate total USD value on each chain
3. Pick the preferred L2 (Arbitrum Sepolia > Base Sepolia)
4. Sum value on other chains
5. Create a buy transaction for USDC on the target chain using cross-chain funds
6. Sign and broadcast

### Transaction Signing

Uses Magic's RPC provider for EIP-7702 personal_sign:

```typescript
async function signUserOps(userOps) {
  const provider = getMagicProvider();
  // Sign root hash
  const signature = await provider.request({
    method: "personal_sign",
    params: [rootHash, sender],
  });
  // Sign EIP-7702 authorizations if needed
  for (const op of userOps) {
    if (op.eip7702Auth && !op.eip7702Delegated) {
      // Sign each authorization
    }
  }
  return { signature, authorizations };
}
```

---

## Payment Links

### How They Work

Payment links are shareable URLs that encode a payment request. Anyone with the link can open it, log in, and pay from any chain.

### Lifecycle

```
1. Creator types "Request $25 for dinner"
2. Chat creates link via POST /api/links
3. Link stored in memory: { id, amount, token, memo, status: "pending" }
4. Creator gets URL: /pay/abc123
5. Creator shares URL (copy/paste, Web Share API)
6. Payer opens /pay/abc123
7. Payer sees amount, memo, creator info
8. Payer logs in via Magic
9. Payer sees their balance, clicks "Pay"
10. sendTransaction() to creator's address
11. PATCH /api/links/abc123 -> status: "paid", txHash, paidBy
12. Success screen shown
```

### Storage

In-memory `Map<string, PaymentLink>` in `src/lib/db.ts`. Data is lost on server restart. Sufficient for hackathon demonstration.

Functions:
- `createLink(data)` — Generates 10-char nanoid, stores with "pending" status
- `getLink(id)` — Retrieves by ID
- `getUserLinks(address)` — All links for a creator, sorted newest first
- `updateLink(id, data)` — Partial update (status, paidBy, txHash, etc.)

### Public Payment Page

`/pay/[id]` is a server-rendered page that:
- Fetches link data on load
- Shows 404 if link not found
- Shows success state if already paid
- Unauthenticated users see login options (Google, email)
- Authenticated users see their balance and a Pay button
- Insufficient balance disables the Pay button
- On successful payment: updates link status, shows confirmation with tx hash

---

## API Reference

### POST /api/chat

Parses a natural language message into a structured financial intent.

**Request:**
```json
{ "message": "Send 100 USDC to 0x742d..." }
```

**Response:**
```json
{
  "type": "SEND",
  "amount": 100,
  "token": "USDC",
  "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
}
```

Falls back to local regex parser if OpenAI API key is not set or request fails.

---

### POST /api/links

Creates a new payment link.

**Request:**
```json
{
  "creatorAddress": "0x742d...",
  "creatorEmail": "user@example.com",
  "amount": 25,
  "token": "USDC",
  "memo": "dinner"
}
```

**Response (201):**
```json
{
  "id": "a1b2c3d4e5",
  "creatorAddress": "0x742d...",
  "creatorEmail": "user@example.com",
  "amount": 25,
  "token": "USDC",
  "memo": "dinner",
  "status": "pending",
  "createdAt": "2025-06-25T12:00:00.000Z"
}
```

---

### GET /api/links?address=0x...

Returns all payment links created by the given address.

**Response (200):**
```json
[
  {
    "id": "a1b2c3d4e5",
    "creatorAddress": "0x742d...",
    "amount": 25,
    "token": "USDC",
    "memo": "dinner",
    "status": "pending",
    "createdAt": "2025-06-25T12:00:00.000Z"
  }
]
```

---

### GET /api/links/[id]

Returns a single payment link. Public endpoint (no auth required).

**Response (200):**
```json
{
  "id": "a1b2c3d4e5",
  "creatorAddress": "0x742d...",
  "amount": 25,
  "token": "USDC",
  "memo": "dinner",
  "status": "pending",
  "createdAt": "2025-06-25T12:00:00.000Z"
}
```

**Response (404):**
```json
{ "error": "Link not found" }
```

---

### PATCH /api/links/[id]

Updates a payment link (marks as paid).

**Request:**
```json
{
  "status": "paid",
  "paidBy": "0xabc...",
  "paidFromChain": "Arbitrum Sepolia",
  "txHash": "0xdef..."
}
```

**Response (200):** Updated PaymentLink object.

---

## Data Models

### ChatMessage

```typescript
interface ChatMessage {
  id: string;                    // Generated via generateId()
  role: "user" | "assistant" | "system";
  content: string;               // Message text
  timestamp: Date;
  intent?: ParsedIntent;         // Parsed intent (if applicable)
  txStatus?: TransactionStatus;  // Transaction state (if applicable)
}
```

### ParsedIntent

```typescript
interface ParsedIntent {
  type: "BALANCE" | "SEND" | "SWAP" | "PAY" | "REQUEST" | "MOVE" | "UNKNOWN";
  amount?: number;
  token?: string;          // Default: "USDC"
  toAddress?: string;      // Ethereum address for SEND
  toToken?: string;        // Target token for SWAP
  serviceName?: string;    // Service name for PAY
  memo?: string;           // Note for REQUEST
  recipientName?: string;  // Recipient for REQUEST
  raw: string;             // Original user message
}
```

### TransactionStatus

```typescript
interface TransactionStatus {
  state: "pending" | "confirming" | "confirmed" | "failed";
  txHash?: string;
  chain?: string;
  error?: string;
}
```

### Asset

```typescript
interface Asset {
  symbol: string;      // e.g., "USDC"
  name: string;        // e.g., "USD Coin"
  balance: number;     // Token amount
  balanceUSD: number;  // USD value
  chain: string;       // e.g., "Arbitrum Sepolia"
  chainId: number;     // e.g., 421614
  address: string;     // Token contract address
  logo?: string;       // Token icon URL
}
```

### PaymentLink

```typescript
interface PaymentLink {
  id: string;               // nanoid(10)
  creatorAddress: string;   // Creator's wallet address
  creatorEmail?: string;    // Creator's email (if available)
  amount: number;           // Requested amount
  token: string;            // Token symbol (default: "USDC")
  memo?: string;            // Payment reason
  status: "pending" | "paid" | "expired";
  createdAt: string;        // ISO timestamp
  paidBy?: string;          // Payer's address
  paidFromChain?: string;   // Settlement chain
  txHash?: string;          // Transaction hash
}
```

---

## Components

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage` | Login page (Google + email), redirects to dashboard if logged in |
| `/dashboard` | `DashboardPage` | Three-tab dashboard: Home, Chat, Links |
| `/pay/[id]` | `PayPage` -> `PaymentPage` | Public payment page for payment links |
| `/callback` | `CallbackPage` | OAuth redirect handler |

### Dashboard Tabs

| Tab | Icon | Contents |
|-----|------|----------|
| Home | LayoutDashboard | BalanceCard, QuickActions, AssetList, TransactionList |
| Chat | MessageSquare | ChatContainer (messages, input, confirmations) |
| Links | Link2 | LinkList (created payment links with status) |

### Quick Actions

Four buttons on the Home tab that prefill chat commands:

| Button | Prefill |
|--------|---------|
| Send | "Send " |
| Receive | "What's my balance?" |
| Swap | "Swap " |
| Request | "Request " |

### Chat Components

- **ChatContainer** — Wrapper with scroll, loading indicator, confirm/cancel buttons
- **ChatInput** — Text input with send button, supports prefill from QuickActions
- **ChatMessage** — Single message bubble (user right-aligned, assistant left-aligned)
- **SuggestedPrompts** — Shown when chat is empty, clickable prompt suggestions
- **TransactionStatus** — Shows pending/confirmed/failed state with tx hash link

### Payment Components

- **PaymentPage** — Full payment flow: fetch link data, show request, login gate, pay button
- **PaymentSuccess** — Confirmation screen with checkmark animation, tx hash, chain badge

### Shared Components

- **Navbar** — Top bar with logo, wallet address (copyable), logout button
- **ChainBadge** — Colored badge showing chain name (blue for Arbitrum, sky for Base, etc.)
- **ShareButton** — Copy link / Web Share API button
- **LoadingSpinner** — Animated spinner

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_MAGIC_API_KEY` | Yes | Magic.link publishable key |
| `NEXT_PUBLIC_PARTICLE_PROJECT_ID` | Yes | Particle Network project ID |
| `NEXT_PUBLIC_PARTICLE_CLIENT_KEY` | Yes | Particle Network client key |
| `NEXT_PUBLIC_PARTICLE_APP_UUID` | Yes | Particle Network app UUID |
| `OPENAI_API_KEY` | No | OpenAI API key (falls back to regex parser) |

### Feature Flags

| Flag | Location | Default | Description |
|------|----------|---------|-------------|
| `DEV_BYPASS` | `src/context/AuthContext.tsx` | `false` | Skip login with hardcoded address |

### Adding a New Chain

1. Add chain config to `src/lib/chains.ts`
2. Add token addresses to `src/lib/tokens.ts`
3. Add chain name to `CHAIN_NAMES` in `src/hooks/useUniversalAccount.ts`
4. Add chain color to `CHAIN_COLORS` in `src/components/shared/ChainBadge.tsx`
5. Update L2 preference list in `moveToLowestFee()` if applicable

### Adding a New Token

1. Add address mappings to `src/lib/tokens.ts`
2. Add to swap `tokenMap` in `useUniversalAccount.ts` if swap-eligible
3. Add aliases to `resolveToken()` in `src/lib/tokens.ts`

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_MAGIC_API_KEY
vercel env add NEXT_PUBLIC_PARTICLE_PROJECT_ID
vercel env add NEXT_PUBLIC_PARTICLE_CLIENT_KEY
vercel env add NEXT_PUBLIC_PARTICLE_APP_UUID
vercel env add OPENAI_API_KEY
```

### Production Checklist

- [ ] Set `DEV_BYPASS = false` in `AuthContext.tsx`
- [ ] All environment variables set in deployment platform
- [ ] Magic dashboard: add production domain to allowed origins
- [ ] Magic dashboard: enable Google OAuth with redirect URI
- [ ] Particle dashboard: verify app UUID matches
- [ ] Test login flow end-to-end
- [ ] Test payment link creation and payment
- [ ] Verify cross-chain transactions settle correctly

### Limitations (Hackathon Scope)

- **In-memory storage**: Payment links are lost on server restart. Production would need a database (Postgres, Redis, etc.)
- **Testnet only**: Configured for Arbitrum/Ethereum/Base Sepolia. Switch chain configs and token addresses for mainnet.
- **Two tokens**: Only USDC and ETH. Add more to `tokens.ts`.
- **No rate limiting**: API routes have no auth or rate limiting.
- **No webhooks**: Payment status is updated client-side. Production would use Particle webhooks for reliable status tracking.
