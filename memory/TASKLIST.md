# FounderSea Frontend Flow Tasklist

## Build Order
1. Wallet connect: injected EVM wallet, Mantle Sepolia enforcement, address/chain/disconnect UI.
2. Page 1 — Discovery Feed: card grid, filters, conviction leaderboard, live protocol feed.
3. Page 2 — Idea/Product Page: sticky header, role-aware actions, overview/milestones/token/AI logs/investors tabs, chair/sidebar widgets.
4. Page 3 — Milestone Page: build log, validation panel, investor snapshot.
5. Page 4 — Builder Profile Page: career timeline, skill signals, stake status.
6. Page 5 — Investor/Allocator Dashboard: portfolio value, claimable revenue, positions, activity CSV.
7. Page 6 — Chair Auction Page: rights, auction panel, idea health summary.
8. Page 7 — Create Idea Page: 5-step wizard with live discovery-card preview.
9. Page 8 — AI Agent Monitor: agent identity, decision feed, breakdown, anomaly log.

## Testing Rule
After each task, validate the related backend API endpoint(s) and browser UI behavior before moving to the next task.

## Current Status
- Task 1: Complete — wallet connects to injected EVM wallets, enforces Mantle Sepolia, supports disconnect, and was browser-tested.
- Task 2: Complete — Discovery Feed route `/discover` built and tested against `/api/discovery`.
- Task 3: Complete — Idea/Product route `/ideas/[id]` built and tested against `/api/ideas/{id}`.
- Task 4: Complete — Milestone route `/milestones/[id]` built and tested against `/api/milestones/{id}`.
- Task 5: Complete — Builder Profile route `/builders/[address]` built and tested against `/api/builders/{address}`.
- Task 6: Complete — Portfolio route `/portfolio` built and tested against `/api/investors/portfolio`.
- Task 7: Complete — Chair Auction route `/chair/[ideaId]` built and tested against `/api/chair/{ideaId}`.
- Task 8: Complete — Create Idea route `/create` built and tested against `/api/create/config`.
- Task 9: Complete — AI Agent Monitor route `/agent` built and tested against `/api/agent/monitor`.