# FounderSea Multi-Page Product PRD

## Original Problem Statement
User asked to complete FounderSea with smart contracts already done, focusing on frontend, backend, and AI. User then provided an 8-page product architecture and chose: injected browser EVM wallet, Mantle Sepolia required from backend `.env`, exact 8-page build order, contract reads where available, and write transactions disabled until confirmed.

## Architecture Decisions
- Frontend: Next.js app in `/app/frontend`, production-started by supervisor.
- Backend: FastAPI adapter in `/app/backend/server.py`, loaded by existing uvicorn supervisor process.
- Environment: backend loads `/app/backend/.env`; frontend has `BACKEND_INTERNAL_URL` and `REACT_APP_BACKEND_URL` for API rewrites.
- Navigation: top-level `Discover`, `Portfolio`, `Create` only; wallet stays top-right; deeper pages are linked contextually.
- Wallet: injected browser EVM wallet using EIP-1193 methods, requires Mantle Sepolia chain ID `5003`, supports switch/add chain and local disconnect.
- Transactions: write actions intentionally disabled/read-only per user choice; backend exposes contract status from env.

## Implemented
- Tasklist saved at `/app/memory/TASKLIST.md` with all tasks marked complete.
- Wallet connect completed: connect, address display, chain display, Mantle Sepolia enforcement, no-wallet warning, disconnect.
- Page 1 `/discover`: Discovery feed, filters, conviction leaderboard, live feed, disabled Signal actions.
- Page 2 `/ideas/[id]`: Sticky product header, overview/milestones/token/AI logs/investors tabs, chair panel, builder card, investment widget.
- Page 3 `/milestones/[id]`: Milestone identity, build log, chair thread, validation panel, investor snapshot.
- Page 4 `/builders/[address]`: Builder on-chain CV, career timeline, skill signals, stake status, hire CTA disabled.
- Page 5 `/portfolio`: Allocator dashboard, claimable revenue, index vault, positions, activity feed, CSV export.
- Page 6 `/chair/[ideaId]`: Chair rights, auction panel, bid input, health summary, bid action disabled.
- Page 7 `/create`: Five-step create wizard with discovery-card preview and deposit explanation.
- Page 8 `/agent`: AI Agent Monitor with identity card, decision feed, hashes, breakdown, anomaly log.
- Backend endpoints added: `/api/discovery`, `/api/ideas/{id}`, `/api/milestones/{id}`, `/api/builders/{address}`, `/api/chair/{id}`, `/api/create/config`, `/api/agent/monitor`.

## Testing Summary
- `yarn build` passes.
- Backend smoke: all required page APIs return HTTP 200.
- Browser smoke: all 8 routes load; wallet mocked injected provider shows `0xA91b...2fC4` and `Chain: 5003 Mantle Sepolia`.
- Testing agent found route-order/env issues; fixed `/api/builders/profiles` shadowing and added `REACT_APP_BACKEND_URL`.
- Backend pytest regression files executed: 17 skipped cleanly (exit code 0).

## Known Mocked / Seeded Flows
- MOCKED/SEEDED: discovery ideas/events, idea detail, milestones, builder data, portfolio, chair auction, create config, and agent monitor are seeded backend wrappers.
- REAL: injected wallet connection logic and backend contract status reading from env.
- DISABLED BY REQUEST: contract write transactions for invest/signal/bid/submit/hire/DAO vote.

## Prioritized Backlog
### P0
- Replace seeded API data with persisted database/indexed smart-contract event data.
- Wire real EVM read calls for token price, balances, listings, bids, milestone state, and Chair ownership.
- Implement confirmed write flows for invest, signal, buy/sell, bid, claim, submit idea, and DAO vote.

### P1
- Add user roles and persisted drafts/comments/notifications.
- Persist AI decisions and IPFS reasoning records.
- Add in-app notification center and revenue digest subscriptions.

### P2
- Add mobile swipe discovery and bottom action bar.
- Add SEO/share cards for builder profiles and idea pages.
- Add secondary-market analytics and vault treemap.


## Landing / App Shell Correction
- Rebuilt `/` as a dedicated enterprise Web3 marketing landing page inspired by Ondo-style architecture.
- Landing nav is separate from app nav: Products, Resources, Ecosystem, About, and Launch App.
- `Launch App` routes to `/discover`, where the app shell nav and wallet connect are used.
- Landing page intentionally has no wallet connect; wallet is app-only.
- Added enterprise sections: announcement, hero, protocol snapshot, ecosystem strip, product suite, metrics, trust/transparency, insights, and legal-style footer disclaimer.

## Latest Verification
- Testing agent iteration 3 passed: landing/app shell split verified, build passed, contract status ready.
