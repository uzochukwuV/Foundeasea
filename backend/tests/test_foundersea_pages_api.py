"""Regression tests for FounderSea's eight page-backed public API modules."""

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


# Discovery module
def test_discovery_endpoint(api_client: requests.Session, api_base_url: str) -> None:
    response = api_client.get(f"{api_base_url}/api/discovery", timeout=15)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["ideas"], list)
    assert isinstance(data["leaderboard"], list)
    assert isinstance(data["liveEvents"], list)


# Idea details module
def test_idea_details_endpoint(api_client: requests.Session, api_base_url: str) -> None:
    response = api_client.get(f"{api_base_url}/api/ideas/idea-104", timeout=15)
    assert response.status_code == 200
    data = response.json()
    assert data["idea"]["id"] == "idea-104"
    assert isinstance(data["milestones"], list)
    assert isinstance(data["aiLogs"], list)
    assert isinstance(data["investors"], list)


# Milestone module
def test_milestone_details_endpoint(api_client: requests.Session, api_base_url: str) -> None:
    response = api_client.get(f"{api_base_url}/api/milestones/milestone-104-1", timeout=15)
    assert response.status_code == 200
    data = response.json()
    assert data["milestone"]["id"] == "milestone-104-1"
    assert isinstance(data["buildLog"], list)
    assert isinstance(data["chairThread"], list)
    assert "validation" in data


# Builder module
def test_builder_details_endpoint(api_client: requests.Session, api_base_url: str) -> None:
    response = api_client.get(f"{api_base_url}/api/builders/0xA91b...2fC4", timeout=15)
    assert response.status_code == 200
    data = response.json()
    assert data["builder"]["address"] == "0xA91b...2fC4"
    assert "tier" in data
    assert isinstance(data["skills"], list)
    assert "stakeStatus" in data


# Portfolio module
def test_portfolio_endpoint(api_client: requests.Session, api_base_url: str) -> None:
    response = api_client.get(f"{api_base_url}/api/investors/portfolio", timeout=15)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["holdings"], list)
    assert isinstance(data["liveEvents"], list)
    assert isinstance(data["claimableUsdy"], float)


# Chair module
def test_chair_endpoint(api_client: requests.Session, api_base_url: str) -> None:
    response = api_client.get(f"{api_base_url}/api/chair/idea-104", timeout=15)
    assert response.status_code == 200
    data = response.json()
    assert data["idea"]["id"] == "idea-104"
    assert isinstance(data["rights"], list)
    assert "auction" in data
    assert "health" in data


# Create module
def test_create_config_endpoint(api_client: requests.Session, api_base_url: str) -> None:
    response = api_client.get(f"{api_base_url}/api/create/config", timeout=15)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["categories"], list)
    assert isinstance(data["gateTypes"], list)
    assert data["deposit"]["amount"] == 500


# Agent monitor module
def test_agent_monitor_endpoint(api_client: requests.Session, api_base_url: str) -> None:
    response = api_client.get(f"{api_base_url}/api/agent/monitor", timeout=15)
    assert response.status_code == 200
    data = response.json()
    assert "agent" in data
    assert isinstance(data["decisions"], list)
    assert isinstance(data["breakdown"], dict)
    assert isinstance(data["anomalies"], list)


# Contracts read-status module
def test_contracts_status_endpoint(api_client: requests.Session, api_base_url: str) -> None:
    response = api_client.get(f"{api_base_url}/api/contracts/status", timeout=15)
    assert response.status_code == 200
    data = response.json()
    assert data["chainId"] == 5003
    assert data["chainName"] == "Mantle Sepolia"
    assert isinstance(data["contracts"], dict)
    assert isinstance(data["missing"], list)
