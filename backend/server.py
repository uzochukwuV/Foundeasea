from __future__ import annotations

import csv
import io
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except Exception:
    pass


app = FastAPI(title="FounderSea Product API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def env_value(name: str) -> str:
    return os.environ.get(name, "")


IDEAS: List[Dict[str, Any]] = [
    {
        "id": "idea-104",
        "title": "Revenue Radar for vertical SaaS",
        "oneLiner": "AI monitors B2B SaaS usage and flags expansion revenue before churn risk appears.",
        "category": "AI SaaS",
        "stage": "funding",
        "gateType": "Open",
        "targetRaise": 850000,
        "funded": 612500,
        "aiConfidence": 91,
        "trending24hRaise": 128000,
        "fundingVelocity": [22, 31, 28, 44, 62, 91, 128],
        "investorCount": 342,
        "averageTicket": 1791,
        "revenuePotential": "High",
        "builderReputation": 94,
        "socialProof": "38 investors backed this in the last 2 hours",
        "topBuilderMVPs": ["Usage sync", "Stripe revenue hook", "Churn alert dashboard"],
        "riskLevel": "Medium",
    },
    {
        "id": "idea-088",
        "title": "On-chain milestone escrow for agencies",
        "oneLiner": "Milestone-based funding and AI validation for software agencies shipping client work.",
        "category": "Web3 Infra",
        "stage": "active",
        "gateType": "Builder reputation",
        "targetRaise": 1200000,
        "funded": 930000,
        "aiConfidence": 87,
        "trending24hRaise": 74000,
        "fundingVelocity": [18, 24, 39, 47, 50, 64, 74],
        "investorCount": 511,
        "averageTicket": 1820,
        "revenuePotential": "Medium-high",
        "builderReputation": 89,
        "socialProof": "12 builders submitted proofs this week",
        "topBuilderMVPs": ["Escrow UX", "GitHub proof bot", "DAO escalation panel"],
        "riskLevel": "Low",
    },
    {
        "id": "idea-097",
        "title": "Creator deposit marketplace",
        "oneLiner": "A sliding-scale launchpad for founders to test investor appetite with lower upfront risk.",
        "category": "Marketplace",
        "stage": "funding",
        "gateType": "AI score > 80",
        "targetRaise": 500000,
        "funded": 178000,
        "aiConfidence": 79,
        "trending24hRaise": 42000,
        "fundingVelocity": [7, 12, 16, 18, 24, 35, 42],
        "investorCount": 164,
        "averageTicket": 1085,
        "revenuePotential": "Medium",
        "builderReputation": 82,
        "socialProof": "4 investor questions answered today",
        "topBuilderMVPs": ["Creator intake", "AI feedback JSON", "Resubmission loop"],
        "riskLevel": "Medium",
    },
    {
        "id": "idea-073",
        "title": "Validator jury incentives",
        "oneLiner": "Conviction voting and validator rewards for milestone disputes and DAO arbitration.",
        "category": "Governance",
        "stage": "active",
        "gateType": "Token holder",
        "targetRaise": 650000,
        "funded": 536000,
        "aiConfidence": 83,
        "trending24hRaise": 31000,
        "fundingVelocity": [11, 17, 19, 24, 27, 29, 31],
        "investorCount": 287,
        "averageTicket": 1867,
        "revenuePotential": "Medium",
        "builderReputation": 91,
        "socialProof": "DAO voters resolved 6 checks this month",
        "topBuilderMVPs": ["Vote lock", "Validator leaderboard", "Reasoning trail"],
        "riskLevel": "Low-medium",
    },
]

LIVE_EVENTS = [
    {"id": "evt-1", "type": "milestone", "message": "Milestone 2 validated at 91% confidence", "ideaId": "idea-104", "time": "2m ago"},
    {"id": "evt-2", "type": "chair", "message": "Chair bid placed for 8,400 USDY", "ideaId": "idea-088", "time": "9m ago"},
    {"id": "evt-3", "type": "builder", "message": "Maya Chen completed 5th consecutive delivery", "ideaId": "idea-104", "time": "18m ago"},
    {"id": "evt-4", "type": "signal", "message": "27 new signal stakes joined Creator Deposit Marketplace", "ideaId": "idea-097", "time": "31m ago"},
]

AI_LOGS = [
    {"id": "log-104-1", "ideaId": "idea-104", "decisionType": "IDEA_RANK", "confidence": 91, "inputHash": "ipfs://bafy104input", "outputHash": "ipfs://bafy104output", "summary": "Strong revenue-hook clarity and credible builder proof."},
    {"id": "log-104-2", "ideaId": "idea-104", "decisionType": "MILESTONE_VALIDATE", "confidence": 88, "inputHash": "ipfs://bafy104m2in", "outputHash": "ipfs://bafy104m2out", "summary": "Stripe webhook shipped with documented revenue events."},
    {"id": "log-088-1", "ideaId": "idea-088", "decisionType": "DAO_RECOMMEND", "confidence": 76, "inputHash": "ipfs://bafy088dao", "outputHash": "ipfs://bafy088vote", "summary": "Recommend extension over slash due to partial deliverable proof."},
]

INVESTORS = [
    {"wallet": "0xA91b...2fC4", "held": 18420, "supplyPercent": 2.18, "entryPrice": 1.12, "unrealizedPnl": 8200, "signalOnly": False},
    {"wallet": "0x44e2...B93a", "held": 12100, "supplyPercent": 1.31, "entryPrice": 1.48, "unrealizedPnl": 3100, "signalOnly": False},
    {"wallet": "0xfE18...6aC0", "held": 0, "supplyPercent": 0, "entryPrice": 0, "unrealizedPnl": 0, "signalOnly": True},
]

BUILDERS: List[Dict[str, Any]] = [
    {
        "address": "0xA91b...2fC4",
        "name": "Maya Chen",
        "role": "Full-stack protocol builder",
        "github": "https://github.com/mayac",
        "twitter": "https://x.com/mayac",
        "portfolio": "https://maya.dev",
        "milestonesDelivered": 18,
        "averageAiConfidence": 92,
        "revenueGenerated": 420000,
        "disputesResolved": 0,
        "badges": ["Shipped 15+ milestones", "No disputes", "Revenue leader"],
    },
    {
        "address": "0x5d80...a771",
        "name": "Jon Bell",
        "role": "Smart-contract engineer",
        "github": "https://github.com/jonbell",
        "twitter": "https://x.com/jonbell",
        "portfolio": "https://jonbuilds.xyz",
        "milestonesDelivered": 11,
        "averageAiConfidence": 88,
        "revenueGenerated": 255000,
        "disputesResolved": 1,
        "badges": ["Security reviewer", "Fast shipper", "DAO trusted"],
    },
    {
        "address": "0x3E24...91b0",
        "name": "Ari Sol",
        "role": "AI product engineer",
        "github": "https://github.com/arisol",
        "twitter": "https://x.com/arisol",
        "portfolio": "https://ari.so",
        "milestonesDelivered": 7,
        "averageAiConfidence": 85,
        "revenueGenerated": 138000,
        "disputesResolved": 0,
        "badges": ["AI validator", "Clean handoffs", "New revenue"],
    },
]

MILESTONES: List[Dict[str, Any]] = [
    {"id": "milestone-104-1", "ideaId": "idea-104", "label": "MVP analytics shipped", "status": "released", "amount": 85000, "confidence": 92, "deadline": "2026-07-08", "note": "Dashboard, revenue hook, and usage events deployed.", "ipfs": "ipfs://bafy104m1"},
    {"id": "milestone-104-2", "ideaId": "idea-104", "label": "Stripe webhook verified", "status": "validated", "amount": 125000, "confidence": 88, "deadline": "2026-08-12", "note": "Webhook test suite passed against live sandbox revenue.", "ipfs": "ipfs://bafy104m2"},
    {"id": "milestone-088-1", "ideaId": "idea-088", "label": "GitHub proof bot", "status": "in_review", "amount": 90000, "confidence": 71, "deadline": "2026-07-24", "note": "Commit linking and proof parser submitted for AI review.", "ipfs": "ipfs://bafy088m1"},
    {"id": "milestone-073-1", "ideaId": "idea-073", "label": "Conviction voting prototype", "status": "submitted", "amount": 70000, "confidence": 64, "deadline": "2026-07-30", "note": "Vote lock UI and reward accounting are ready for review.", "ipfs": "ipfs://bafy073m1"},
]

REVENUE_SERIES = [
    {"month": "Jan", "revenue": 12000, "earned": 180},
    {"month": "Feb", "revenue": 18000, "earned": 265},
    {"month": "Mar", "revenue": 24000, "earned": 348},
    {"month": "Apr", "revenue": 39000, "earned": 512},
    {"month": "May", "revenue": 52000, "earned": 760},
    {"month": "Jun", "revenue": 67500, "earned": 945},
]


class RecommendationRequest(BaseModel):
    wallet: Optional[str] = Field(default=None)
    riskProfile: str = Field(default="balanced")
    focus: str = Field(default="revenue visibility")
    ideaId: Optional[str] = Field(default=None)


def tokenrouter_strategy(payload: RecommendationRequest, ranked: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    api_key = env_value("TOKENROUTER_API_KEY")
    if not api_key:
        return None

    base_url = env_value("TOKENROUTER_BASE_URL") or "https://api.tokenrouter.io/v1"
    preferred_model = env_value("TOKENROUTER_MODEL") or env_value("TOKENROUTER_BASE_MODEL")
    model_candidates = [model for model in [preferred_model, "openai/gpt-4o-mini"] if model]
    idea_context = json.dumps(ranked, separators=(",", ":"))
    prompt = (
        "You are FounderSea's investment strategy AI. Return only compact JSON with keys: "
        "confidence (0-100 number), headline (string), summary (string), actions (array of 3 strings). "
        f"Risk profile: {payload.riskProfile}. Focus: {payload.focus}. Candidate ideas: {idea_context}. "
        "Do not give financial advice disclaimers; focus on protocol-specific allocation strategy, milestone risk, revenue visibility, and partial-entry sizing."
    )

    try:
        for model in model_candidates:
            response = httpx.post(
                f"{base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You return valid JSON only."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.25,
                    "max_tokens": 500,
                },
                timeout=8,
            )
            if response.status_code >= 400:
                continue
            content = response.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content.strip().removeprefix("```json").removesuffix("```").strip())
            if isinstance(parsed.get("actions"), list) and parsed.get("headline") and parsed.get("summary"):
                return parsed
    except Exception:
        return None
    return None


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "foundersea-product-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "aiConfigured": bool(env_value("TOKENROUTER_API_KEY") or env_value("EMERGENT_LLM_KEY")),
        "contractsConfigured": bool(env_value("IDEA_FACTORY_MANTLE") and env_value("AGENT_IDENTITY_MANTLE")),
    }


@app.get("/api/contracts/status")
def contract_status() -> Dict[str, Any]:
    contracts = {
        "ideaFactory": env_value("IDEA_FACTORY_MANTLE"),
        "agentIdentity": env_value("AGENT_IDENTITY_MANTLE"),
        "daoVoting": env_value("DAO_VOTING_MANTLE"),
        "ideaMarketplace": env_value("IDEA_MARKETPLACE_MANTLE"),
        "builderAgreement": env_value("BUILDER_AGREEMENT_MANTLE"),
        "usdy": env_value("USDY_MANTLE"),
    }
    return {
        "chainId": 5003,
        "chainName": "Mantle Sepolia",
        "ready": all(contracts.values()),
        "contracts": contracts,
        "missing": [key for key, value in contracts.items() if not value],
    }


@app.get("/api/ideas/feed")
def idea_feed(
    stage: str = Query(default="all"),
    minConfidence: int = Query(default=0, ge=0, le=100),
    sort: str = Query(default="ai"),
) -> Dict[str, Any]:
    ideas = [idea for idea in IDEAS if (stage == "all" or idea["stage"] == stage) and idea["aiConfidence"] >= minConfidence]
    if sort == "velocity":
        ideas.sort(key=lambda item: item["trending24hRaise"], reverse=True)
    elif sort == "reputation":
        ideas.sort(key=lambda item: item["builderReputation"], reverse=True)
    else:
        ideas.sort(key=lambda item: (item["aiConfidence"], item["trending24hRaise"]), reverse=True)
    return {"count": len(ideas), "data": ideas}


@app.get("/api/discovery")
def discovery(stage: str = Query(default="all"), sort: str = Query(default="ai")) -> Dict[str, Any]:
    feed = idea_feed(stage=stage, minConfidence=0, sort=sort)["data"]
    leaderboard = sorted(IDEAS, key=lambda item: item["aiConfidence"] + min(item["trending24hRaise"] / 10000, 15), reverse=True)[:5]
    return {
        "filters": ["All", "Trending", "Newly Approved", "Milestone Hit", "Chair Available"],
        "leaderboard": leaderboard,
        "ideas": feed,
        "liveEvents": LIVE_EVENTS,
    }


@app.get("/api/ideas/{idea_id}")
def idea_detail(idea_id: str) -> Dict[str, Any]:
    idea = next((item for item in IDEAS if item["id"] == idea_id), IDEAS[0])
    idea_milestones = [item for item in MILESTONES if item["ideaId"] == idea["id"]]
    idea_logs = [item for item in AI_LOGS if item["ideaId"] == idea["id"]]
    return {
        "idea": {**idea, "currentPrice": 1.84, "convictionTrend": "+12%", "creator": "0xCreator...19aB"},
        "overview": {
            "approvalSummary": "AI approved this idea for clear revenue hooks, credible builder execution path, and strong early signal velocity.",
            "targetMarket": "Vertical SaaS teams with expansion revenue and usage-based pricing.",
            "roadmap": ["Revenue hook", "Investor dashboard", "Expansion alert engine", "Self-serve onboarding"],
            "comments": [
                {"author": "0x7a4f...e921", "text": "How fast can the Stripe sync support multi-tenant usage?"},
                {"author": "0x91be...13c0", "text": "Backed this because revenue visibility is already in the MVP."},
            ],
        },
        "milestones": idea_milestones,
        "token": {
            "prices": [1.05, 1.12, 1.21, 1.38, 1.62, 1.74, 1.84],
            "orderBook": [{"side": "ask", "price": 1.91, "amount": 3400}, {"side": "bid", "price": 1.77, "amount": 2800}],
            "trades": [{"wallet": "0x44e2...B93a", "amount": 1200, "price": 1.82}, {"wallet": "0x77f0...AA12", "amount": 800, "price": 1.79}],
            "distribution": {"investors": 52, "builder": 20, "creator": 15, "chair": 5, "reserve": 8},
        },
        "aiLogs": idea_logs,
        "investors": INVESTORS,
        "chair": {"holder": "0xChair...88A1", "paid": 8400, "listed": True, "acquiredAt": "2026-06-02"},
        "builder": BUILDERS[0],
    }


@app.get("/api/milestones/{milestone_id}")
def milestone_detail(milestone_id: str) -> Dict[str, Any]:
    milestone = next((item for item in MILESTONES if item["id"] == milestone_id), MILESTONES[0])
    idea = next((item for item in IDEAS if item["id"] == milestone["ideaId"]), IDEAS[0])
    return {
        "milestone": milestone,
        "idea": idea,
        "buildLog": [
            {"type": "submission", "author": "Builder", "text": milestone["note"], "link": milestone["ipfs"]},
            {"type": "commit", "author": "GitHub", "text": "32 commits linked as proof of work", "link": "https://github.com/foundersea/proof"},
        ],
        "chairThread": [{"author": "Chair", "text": "Prioritize onboarding analytics before advanced alerts."}],
        "validation": {"summary": "The builder submitted a working API with documented endpoints. Test coverage is 67%, below the 80% target, resulting in moderate confidence.", "releaseStatus": milestone["status"]},
        "investorSnapshot": {"holdersAtSubmission": 342, "priceAtSubmission": 1.62, "currentPrice": 1.84, "newCohort": INVESTORS[:2]},
    }


@app.get("/api/builders/profiles")
def builder_profiles() -> Dict[str, Any]:
    leaderboard = sorted(BUILDERS, key=lambda item: item["revenueGenerated"], reverse=True)
    return {"count": len(leaderboard), "data": leaderboard}


@app.get("/api/builders/{address}")
def builder_detail(address: str) -> Dict[str, Any]:
    builder = next((item for item in BUILDERS if item["address"].lower() == address.lower()), BUILDERS[0])
    return {
        "builder": builder,
        "tier": "Elite" if builder["milestonesDelivered"] >= 15 else "Verified",
        "careerTimeline": [
            {"idea": "Revenue Radar", "role": "sole builder", "completed": 2, "total": 4, "aiAverage": 90, "earned": 156000, "outcome": "active"},
            {"idea": "Milestone Escrow", "role": "co-builder", "completed": 3, "total": 3, "aiAverage": 86, "earned": 98000, "outcome": "completed"},
        ],
        "skills": ["SaaS", "DeFi", "TypeScript", "Solidity", "Revenue analytics"],
        "testimonials": [{"from": "Chair 0x88A1", "text": "Ships calmly under uncertainty and explains tradeoffs clearly."}],
        "stakeStatus": {"stakedAllocation": 128000, "activeEngagements": 2},
    }


@app.get("/api/chair/{idea_id}")
def chair_auction(idea_id: str) -> Dict[str, Any]:
    idea = next((item for item in IDEAS if item["id"] == idea_id), IDEAS[0])
    return {
        "idea": idea,
        "rights": ["3× DAO vote weight", "Milestone scope veto", "Builder performance review trigger", "Acquisition rights", "Strategic lead credit"],
        "currentHolder": "0xChair...88A1",
        "history": [{"buyer": "0xChair...88A1", "price": 8400, "date": "2026-06-02"}, {"buyer": "0xSeed...4410", "price": 5200, "date": "2026-05-20"}],
        "auction": {"highestBid": 9100, "endsIn": "18h 24m", "minimumBid": 9400},
        "health": {"milestoneProgress": "2/4", "builderReputation": idea["builderReputation"], "convictionTrend": "+12%"},
    }


@app.get("/api/create/config")
def create_config() -> Dict[str, Any]:
    return {
        "categories": ["SaaS", "DeFi", "Consumer", "Infrastructure", "Governance"],
        "gateTypes": ["Open", "Whitelist", "Min Hold", "DAO Curated"],
        "deposit": {"amount": 500, "asset": "USDY", "approvedCredit": "Credited toward the pool", "rejectedRefund": "90% returned"},
        "aiReviewEtaMinutes": 10,
    }


@app.get("/api/agent/monitor")
def agent_monitor() -> Dict[str, Any]:
    return {
        "agent": {"name": "FounderSea Strategy Agent", "modelId": env_value("TOKENROUTER_MODEL") or "openai/gpt-4o-mini", "createdAt": "2026-05-01", "totalDecisions": 1284, "averageConfidence": 84, "uptime": "99.7%"},
        "decisions": AI_LOGS + [
            {"id": "log-global-1", "ideaId": "idea-097", "decisionType": "REJECTION_FEEDBACK", "confidence": 69, "inputHash": "ipfs://bafy097in", "outputHash": "ipfs://bafy097out", "summary": "Requested clearer creator credibility proof before funding."},
        ],
        "breakdown": {"IDEA_RANK": 42, "MILESTONE_VALIDATE": 36, "DAO_RECOMMEND": 14, "REJECTION_FEEDBACK": 8},
        "anomalies": [{"id": "anom-1", "summary": "DAO overrode one milestone extension after new GitHub proof arrived.", "severity": "low"}],
    }


@app.get("/api/investors/portfolio")
def investor_portfolio(wallet: str = Query(default="")) -> Dict[str, Any]:
    holdings = [
        {"ideaId": "idea-104", "title": "Revenue Radar", "tokens": 18420, "ownershipBps": 218, "claimableUsdy": 945.12},
        {"ideaId": "idea-088", "title": "Milestone Escrow", "tokens": 9800, "ownershipBps": 104, "claimableUsdy": 318.44},
        {"ideaId": "idea-073", "title": "Validator Jury", "tokens": 6200, "ownershipBps": 76, "claimableUsdy": 124.9},
    ]
    return {
        "wallet": wallet,
        "totalHoldingsUsd": 48250,
        "claimableUsdy": round(sum(item["claimableUsdy"] for item in holdings), 2),
        "earnedToday": 42.18,
        "earnedThisMonth": 1388.46,
        "holdings": holdings,
        "revenueSeries": REVENUE_SERIES,
        "milestones": MILESTONES,
        "liveEvents": [
            "Builder shipped Stripe revenue hook → +$52K tracked revenue",
            "AI validated Revenue Radar milestone at 88% confidence",
            "12 investors claimed USDY from active ideas today",
        ],
    }


@app.get("/api/investors/tax-report.csv")
def tax_report() -> StreamingResponse:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["date", "idea", "event", "usdy_amount"])
    writer.writerow(["2026-06-01", "Revenue Radar", "Revenue share", "945.12"])
    writer.writerow(["2026-06-04", "Milestone Escrow", "Revenue share", "318.44"])
    writer.writerow(["2026-06-08", "Validator Jury", "Revenue share", "124.90"])
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=foundersea-tax-report.csv"},
    )


@app.get("/api/ai/review-queue")
def review_queue() -> Dict[str, Any]:
    return {
        "pending": 42,
        "averageTurnaroundHours": 31,
        "viewerPosition": 15,
        "items": [
            {"ideaId": "idea-121", "title": "AI analyst for indie funds", "confidencePreview": 65, "status": "needs_market_size"},
            {"ideaId": "idea-122", "title": "Proof-of-revenue oracle", "confidencePreview": 82, "status": "reviewing"},
            {"ideaId": "idea-123", "title": "DAO mediator marketplace", "confidencePreview": 74, "status": "reviewing"},
        ],
        "feedbackSchema": {
            "marketSize": "Clarify TAM/SAM and bottom-up acquisition channel.",
            "founderCredibility": "Add proof of prior shipping or linked case studies.",
            "revenueModel": "Show first revenue hook and expected take-rate.",
        },
    }


@app.post("/api/ai/recommendations")
def recommendations(payload: RecommendationRequest) -> Dict[str, Any]:
    target_ideas = IDEAS
    if payload.ideaId:
        target_ideas = [idea for idea in IDEAS if idea["id"] == payload.ideaId] or IDEAS

    def score(idea: Dict[str, Any]) -> float:
        funding_percent = idea["funded"] / max(idea["targetRaise"], 1)
        risk_adjustment = 8 if payload.riskProfile == "conservative" and "Low" in idea["riskLevel"] else 0
        growth_adjustment = 8 if payload.riskProfile == "growth" and idea["trending24hRaise"] > 60000 else 0
        return idea["aiConfidence"] * 0.45 + idea["builderReputation"] * 0.25 + funding_percent * 20 + risk_adjustment + growth_adjustment

    ranked = sorted(target_ideas, key=score, reverse=True)[:3]
    top = ranked[0]
    ai_result = tokenrouter_strategy(payload, ranked)
    confidence = min(96, int(score(top)))
    return {
        "source": "tokenrouter_ai" if ai_result else "heuristic_ai_fallback",
        "confidence": ai_result.get("confidence", confidence) if ai_result else confidence,
        "headline": ai_result.get("headline") if ai_result else f"Prioritize {top['title']} for {payload.focus} exposure",
        "summary": ai_result.get("summary") if ai_result else (
            f"{top['title']} leads the current feed with {top['aiConfidence']}% AI confidence, "
            f"${top['trending24hRaise']:,} raised in 24h, and builder reputation of {top['builderReputation']}/100. "
            "Use partial entries and monitor milestone validation before increasing allocation."
        ),
        "actions": ai_result.get("actions") if ai_result else [
            "Enter with a small first ticket while funding velocity remains above the 7-day trend.",
            "Favor ideas with visible revenue hooks and validated milestones before sizing up.",
            "Set an alert for missed milestone deadlines or confidence drops below 75%.",
        ],
        "rankedIdeas": [
            {"ideaId": idea["id"], "title": idea["title"], "strategyScore": round(score(idea), 1), "riskLevel": idea["riskLevel"]}
            for idea in ranked
        ],
    }