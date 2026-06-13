"""Core FounderSea public API regression tests for dashboard and AI flows."""

import os

import pytest
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")


@pytest.fixture(scope="session")
def api_base_url() -> str:
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL is not set; skipping API tests")
    return BASE_URL.rstrip("/")


@pytest.fixture(scope="session")
def api_client() -> requests.Session:
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def test_health(api_client: requests.Session, api_base_url: str) -> None:
    """Health endpoint returns status and config flags."""
    response = api_client.get(f"{api_base_url}/api/health", timeout=12)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "foundersea-product-api"
    assert isinstance(data["contractsConfigured"], bool)
    assert isinstance(data["aiConfigured"], bool)


def test_contract_status(api_client: requests.Session, api_base_url: str) -> None:
    """Contract status endpoint returns readiness and addresses map."""
    response = api_client.get(f"{api_base_url}/api/contracts/status", timeout=12)
    assert response.status_code == 200
    data = response.json()
    assert data["chainName"] == "Mantle Sepolia"
    assert isinstance(data["ready"], bool)
    assert isinstance(data["contracts"], dict)
    assert "ideaFactory" in data["contracts"]
    assert "missing" in data


def test_ideas_feed_filters(api_client: requests.Session, api_base_url: str) -> None:
    """Ideas feed supports stage filtering and returns structured idea data."""
    response = api_client.get(
        f"{api_base_url}/api/ideas/feed",
        params={"stage": "active", "sort": "ai", "minConfidence": 0},
        timeout=12,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["count"], int)
    assert isinstance(data["data"], list)
    if data["data"]:
        first = data["data"][0]
        assert first["stage"] == "active"
        assert isinstance(first["aiConfidence"], int)
        assert "title" in first


def test_investor_portfolio_metrics(api_client: requests.Session, api_base_url: str) -> None:
    """Portfolio endpoint returns expected revenue and queue-facing metrics."""
    response = api_client.get(f"{api_base_url}/api/investors/portfolio", timeout=12)
    assert response.status_code == 200
    data = response.json()
    assert data["earnedThisMonth"] == pytest.approx(1388.46)
    assert isinstance(data["claimableUsdy"], float)
    assert isinstance(data["holdings"], list)
    assert isinstance(data["revenueSeries"], list)
    assert isinstance(data["liveEvents"], list)


def test_builder_profiles(api_client: requests.Session, api_base_url: str) -> None:
    """Builder profiles endpoint returns leaderboard style data."""
    response = api_client.get(f"{api_base_url}/api/builders/profiles", timeout=12)
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    assert isinstance(data["data"], list)
    first = data["data"][0]
    assert "name" in first
    assert "badges" in first
    assert isinstance(first["badges"], list)


def test_ai_review_queue(api_client: requests.Session, api_base_url: str) -> None:
    """AI queue endpoint returns expected queue shape and SLA metrics."""
    response = api_client.get(f"{api_base_url}/api/ai/review-queue", timeout=12)
    assert response.status_code == 200
    data = response.json()
    assert data["pending"] == 42
    assert data["averageTurnaroundHours"] == 31
    assert isinstance(data["items"], list)
    assert isinstance(data["feedbackSchema"], dict)


def test_ai_recommendation_response(api_client: requests.Session, api_base_url: str) -> None:
    """AI recommendation endpoint returns ranked ideas and action list."""
    payload = {"riskProfile": "balanced", "focus": "revenue visibility", "ideaId": "idea-104"}
    response = api_client.post(f"{api_base_url}/api/ai/recommendations", json=payload, timeout=15)
    assert response.status_code == 200
    data = response.json()
    assert data["source"] in ["tokenrouter_ai", "heuristic_ai_fallback"]
    assert isinstance(data["confidence"], int)
    assert isinstance(data["headline"], str)
    assert isinstance(data["summary"], str)
    assert isinstance(data["actions"], list)
    assert len(data["actions"]) >= 1
    assert isinstance(data["rankedIdeas"], list)


def test_tax_csv_export(api_client: requests.Session, api_base_url: str) -> None:
    """Tax CSV export endpoint responds with downloadable CSV payload."""
    response = api_client.get(f"{api_base_url}/api/investors/tax-report.csv", timeout=12)
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "date,idea,event,usdy_amount" in response.text
