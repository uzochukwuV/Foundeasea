# FounderSea Product Completion PRD

## Original Problem Statement
User asked to complete the product with the smart contract already done, focusing on frontend, backend, and AI. User specified EVM wallet flow, AI investment/strategy recommendations, backend analysis, frontend/backend wiring, and later provided the DESIGN (2).md warm Family-style UI reference.

## Architecture Decisions
- Frontend: Next.js app in `/app/frontend`, production-started by supervisor for reliable hydration.
- Backend: FastAPI adapter in `/app/backend/server.py`, loaded by existing supervisor `uvicorn server:app` flow.
- Environment: Backend loads `/app/backend/.env`; frontend API rewrite uses `/app/frontend/.env` via `BACKEND_INTERNAL_URL`.
- AI: `/api/ai/recommendations` uses TokenRouter when available, with automatic fallback from configured model to `openai/gpt-4o-mini`, and heuristic fallback if provider fails.
- Smart contract status: `/api/contracts/status` reads configured EVM/Mantle addresses from backend env.

## Implemented
- Warm cream Family-style UI with blob illustrations, pill CTAs, inset-border cards, dark phone mockup, and no photography.
- Investor discovery feed with stage filters, AI confidence, funding progress, velocity visualization, and social proof.
- Portfolio/revenue dashboard with claimable USDY, monthly revenue visualization, live events, and CSV export.
- Builder reputation profiles with badges, shipped milestones, AI confidence, revenue generated, and external links.
- AI public review queue and structured rejection feedback.
- EVM wallet connect UI toggle and backend contract readiness endpoint.
- Backend APIs for health, contracts, ideas, portfolio, builders, review queue, AI recommendations, and tax CSV.

## Testing Summary
- `yarn build` passes for frontend.
- Backend health, contract status, feed, portfolio, builder, review queue, AI recommendation, and CSV endpoints verified.
- Browser test verified metrics load, TokenRouter AI headline appears, active filter works, and wallet connect toggles.
- Testing agent completed backend + frontend pass; post-test config fixes applied and self-tested.

## Known Mocked / Seeded Flows
- Ideas feed, portfolio revenue, builder profiles, AI queue, tax CSV, and contract status are seeded/demo API wrappers around env/config and product data.
- AI recommendations call real TokenRouter when possible and fall back safely if the model/provider is unavailable.

## Prioritized Backlog
### P0
- Replace seeded data wrappers with live contract event indexing and persisted database records.
- Wire real wallet transaction flows for funding, claiming USDY, and milestone interactions.
- Rotate any exposed secrets and keep `.env` out of source control.

### P1
- Persist investor portfolios, builder profiles, comments, milestone submissions, and AI decisions.
- Add authenticated creator/builder/investor roles.
- Add real-time revenue webhooks and notification digests.

### P2
- Secondary market UI and liquidity analytics.
- DAO conviction voting, validator incentives, and delegation screens.
- Advanced investor tax reporting and scenario modeling.

## Next Tasks
1. Connect the feed to indexed smart contract events and persisted metadata.
2. Add wallet-provider integration for real EVM reads/writes.
3. Persist AI recommendations and review queue decisions.
