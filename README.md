# SagePay

A mobile-first cross-chain payment app powered by natural language. Chat to send, swap, request, and consolidate crypto across chains — no wallet extensions needed.

Built for the UXmaxx Hackathon (Encode Club) using [Particle Network Universal Accounts](https://particle.network/) and [Magic.link](https://magic.link/).

## What It Does

SagePay turns a chat interface into a cross-chain banking app. Users type natural language commands and the AI parses them into blockchain transactions that settle across Arbitrum, Ethereum, and Base via Particle's Universal Account abstraction.

**5 chat commands:**

| Command | Example | What Happens |
|---------|---------|-------------|
| Balance | "What's my balance?" | Shows unified balance across all chains |
| Send | "Send 100 USDC to 0x742d..." | Direct cross-chain transfer |
| Swap | "Swap 50 USDC to ETH" | Token swap via Particle UA |
| Request | "Request $25 for dinner" | Creates a shareable payment link |
| Move | "Move funds to lowest-fee chain" | Consolidates assets to cheapest L2 |

**1 public page:** `/pay/[id]` — Anyone can open a payment link, log in via Magic, and pay from any chain.

## Quick Start

```bash
# Install dependencies
npm install

# Copy env and add your keys
cp .env.local.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` with:

```env
# Required — Magic.link (https://dashboard.magic.link)
NEXT_PUBLIC_MAGIC_API_KEY=pk_live_...

# Required — Particle Network (https://dashboard.particle.network)
NEXT_PUBLIC_PARTICLE_PROJECT_ID=...
NEXT_PUBLIC_PARTICLE_CLIENT_KEY=...
NEXT_PUBLIC_PARTICLE_APP_UUID=...

# Optional — OpenAI for smarter intent parsing (falls back to local regex)
OPENAI_API_KEY=sk-...
```

## Tech Stack

- **Next.js 16** — App Router, Server Components, API Routes
- **React 19** — Client components with hooks
- **Particle Network UA SDK** — Cross-chain account abstraction (EIP-7702)
- **Magic.link** — Email + Google OAuth authentication, wallet creation
- **OpenAI GPT-4o-mini** — Natural language intent parsing
- **Tailwind CSS 4** — Styling
- **Framer Motion** — Animations
- **nanoid** — Payment link ID generation

## Supported Chains (Testnet)

- Arbitrum Sepolia (421614) — Default, lowest-fee target
- Ethereum Sepolia (11155111)
- Base Sepolia (84532)

## Supported Tokens

- USDC — On all three testnets
- ETH — Native token on all chains

## User Flows

### Chat Commands
```
User: "What's my balance?"
Bot:  "Your unified balance is $3,937.47
       ETH on Arbitrum Sepolia: 0.542 ($1,987.14)
       USDC on Arbitrum Sepolia: 1,247.83 ($1,247.83)"

User: "Send 100 USDC to 0x742d..."
Bot:  "Send 100 USDC to 0x742d...? Confirm to proceed."
      [Confirm] -> Particle UA executes cross-chain transfer

User: "Request $25 for dinner"
Bot:  "Payment link created!
       $25 USDC - 'dinner'
       Share: localhost:3000/pay/abc123"
```

### Payment Link Flow
1. Creator types "Request $25 for dinner" in chat
2. Bot creates a shareable link: `/pay/abc123`
3. Anyone opens the link in their browser
4. They log in via Magic (email or Google)
5. They see the request amount, their balance, and a "Pay" button
6. Particle UA routes payment from whichever chain has funds
7. Success screen with transaction hash

## Project Structure

```
src/
  app/
    api/
      chat/route.ts          # Intent parsing API (OpenAI + fallback)
      links/route.ts          # POST: create link, GET: list user links
      links/[id]/route.ts     # GET: link details, PATCH: mark as paid
    dashboard/page.tsx        # Main dashboard (Home, Chat, Links tabs)
    pay/[id]/page.tsx         # Public payment page
    callback/page.tsx         # OAuth callback
    page.tsx                  # Landing page
  components/
    chat/                     # ChatContainer, ChatInput, ChatMessage, etc.
    dashboard/                # BalanceCard, AssetList, QuickActions, LinkList
    pay/                      # PaymentPage, PaymentSuccess
    shared/                   # Navbar, ChainBadge, ShareButton, LoadingSpinner
    landing/                  # HeroSection, FeatureGrid
    ui/                       # shadcn primitives (button, card, badge, etc.)
  hooks/
    useChat.ts                # Chat engine: parse -> execute -> confirm
    useUniversalAccount.ts    # Balance, send, swap, moveToLowestFee
  lib/
    intent-parser.ts          # System prompt + local regex fallback
    particle.ts               # Particle UA SDK init
    magic.ts                  # Magic SDK init
    eip7702.ts                # Authorization signing
    db.ts                     # In-memory payment link store
    chains.ts                 # Chain configs
    tokens.ts                 # Token address mappings
  context/
    AuthContext.tsx            # Auth state (Magic login/logout)
  types/
    index.ts                  # TypeScript interfaces
    particle.d.ts             # Particle SDK type declarations
```

## Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT
