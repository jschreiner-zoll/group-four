"""Unit tests for REST API endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app, simulator, alert_engine, ws_manager
from app.patients import set_dependencies


@pytest.fixture(autouse=True)
def setup_dependencies():
    """Ensure dependencies are set for route handlers."""
    patient_names = {p.id: p.name for p in simulator.get_patients()}
    alert_engine.set_patient_names(patient_names)
    set_dependencies(simulator, alert_engine, ws_manager)


@pytest.fixture
async def client():
    """Create async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


pytestmark = pytest.mark.asyncio(loop_scope="function")


@pytest.mark.asyncio
async def test_get_patients(client):
    """Test GET /api/patients returns all 10 patients."""
    response = await client.get("/api/patients")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10
    assert "id" in data[0]
    assert "name" in data[0]
    assert "age" in data[0]
    assert "room" in data[0]
    assert "status" in data[0]


@pytest.mark.asyncio
async def test_get_patient_by_id(client):
    """Test GET /api/patients/{id} returns specific patient."""
    # First get all patients to get a valid ID
    response = await client.get("/api/patients")
    patients = response.json()
    patient_id = patients[0]["id"]

    response = await client.get(f"/api/patients/{patient_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == patient_id


@pytest.mark.asyncio
async def test_get_patient_not_found(client):
    """Test GET /api/patients/{id} with invalid ID."""
    response = await client.get("/api/patients/invalid-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_simulate_condition(client):
    """Test POST /api/patients/{id}/simulate triggers condition."""
    response = await client.get("/api/patients")
    patients = response.json()
    patient_id = patients[0]["id"]

    response = await client.post(
        f"/api/patients/{patient_id}/simulate",
        json={"condition": "tachycardia"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["condition"] == "tachycardia"


@pytest.mark.asyncio
async def test_simulate_invalid_patient(client):
    """Test POST /api/patients/{id}/simulate with invalid patient."""
    response = await client.post(
        "/api/patients/invalid-id/simulate",
        json={"condition": "tachycardia"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_simulate_invalid_condition(client):
    """Test POST /api/patients/{id}/simulate with invalid condition."""
    response = await client.get("/api/patients")
    patients = response.json()
    patient_id = patients[0]["id"]

    response = await client.post(
        f"/api/patients/{patient_id}/simulate",
        json={"condition": "invalid_condition"},
    )
    assert response.status_code == 422  # Pydantic validation error


@pytest.mark.asyncio
async def test_reset_patient(client):
    """Test POST /api/patients/{id}/reset."""
    response = await client.get("/api/patients")
    patients = response.json()
    patient_id = patients[0]["id"]

    response = await client.post(f"/api/patients/{patient_id}/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


@pytest.mark.asyncio
async def test_get_alerts_empty(client):
    """Test GET /api/alerts returns empty list initially."""
    response = await client.get("/api/alerts")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_alert_history(client):
    """Test GET /api/alerts/history returns empty list initially."""
    response = await client.get("/api/alerts/history")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_acknowledge_alert_not_found(client):
    """Test POST /api/alerts/{id}/acknowledge with invalid alert."""
    response = await client.post(
        "/api/alerts/invalid-id/acknowledge",
        json={"note": "Test note"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_acknowledge_empty_note(client):
    """Test POST /api/alerts/{id}/acknowledge with empty note."""
    response = await client.post(
        "/api/alerts/some-id/acknowledge",
        json={"note": ""},
    )
    assert response.status_code == 422  # Pydantic validation (min_length=1)


@pytest.mark.asyncio
async def test_get_thresholds(client):
    """Test GET /api/thresholds returns configuration."""
    response = await client.get("/api/thresholds")
    assert response.status_code == 200
    data = response.json()
    assert "heart_rate" in data
    assert "spo2" in data
    assert "temperature" in data
