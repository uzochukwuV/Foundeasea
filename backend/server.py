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
    {"ideaId": "idea-104", "label": "MVP analytics shipped", "status": "released", "amount": 85000, "confidence": 92},
    {"ideaId": "idea-104", "label": "Stripe webhook verified", "status": "validated", "amount": 125000, "confidence": 88},
    {"ideaId": "idea-088", "label": "GitHub proof bot", "status": "in_review", "amount": 90000, "confidence": 71},
    {"ideaId": "idea-073", "label": "Conviction voting prototype", "status": "submitted", "amount": 70000, "confidence": 64},
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
    model = env_value("TOKENROUTER_MODEL") or "openai/gpt-4o-mini"
    idea_context = json.dumps(ranked, separators=(",", ":"))
    prompt = (
        "You are FounderSea's investment strategy AI. Return only compact JSON with keys: "
        "confidence (0-100 number), headline (string), summary (string), actions (array of 3 strings). "
        f"Risk profile: {payload.riskProfile}. Focus: {payload.focus}. Candidate ideas: {idea_context}. "
        "Do not give financial advice disclaimers; focus on protocol-specific allocation strategy, milestone risk, revenue visibility, and partial-entry sizing."
    )

    try:
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
        response.raise_for_status()
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


@app.get("/api/builders/profiles")
def builder_profiles() -> Dict[str, Any]:
    leaderboard = sorted(BUILDERS, key=lambda item: item["revenueGenerated"], reverse=True)
    return {"count": len(leaderboard), "data": leaderboard}


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