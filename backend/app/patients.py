"""REST API route handlers for patient and alert management."""

from fastapi import APIRouter, HTTPException

from app.models import AcknowledgeRequest, SimulateRequest

router = APIRouter(prefix="/api")

# These will be set by main.py after initialization
simulator = None
alert_engine = None
ws_manager = None


def set_dependencies(sim, alerts, ws):
    """Set module-level dependencies (called from main.py)."""
    global simulator, alert_engine, ws_manager
    simulator = sim
    alert_engine = alerts
    ws_manager = ws


@router.get("/patients")
async def get_patients():
    """Get all patients with current status."""
    patients = simulator.get_patients()
    result = []
    for patient in patients:
        patient.status = alert_engine.derive_patient_status(patient.id)
        result.append(patient.model_dump())
    return result


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    """Get a single patient by ID."""
    patient = simulator.get_patient(patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient.status = alert_engine.derive_patient_status(patient.id)
    return patient.model_dump()


@router.post("/patients/{patient_id}/simulate")
async def simulate_condition(patient_id: str, request: SimulateRequest):
    """Trigger a condition simulation for a patient."""
    patient = simulator.get_patient(patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    success = simulator.trigger_condition(patient_id, request.condition.value)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to trigger condition")

    return {"success": True, "patient_id": patient_id, "condition": request.condition.value}


@router.post("/patients/{patient_id}/reset")
async def reset_patient(patient_id: str):
    """Reset a patient to normal (gradual recovery)."""
    patient = simulator.get_patient(patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    success = simulator.reset_patient(patient_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reset patient")

    return {"success": True, "patient_id": patient_id}


@router.get("/alerts")
async def get_alerts():
    """Get all active (unacknowledged) alerts."""
    alerts = alert_engine.get_active_alerts()
    return [alert.model_dump() for alert in alerts]


@router.get("/alerts/history")
async def get_alert_history():
    """Get all alerts (active + acknowledged)."""
    alerts = alert_engine.get_alert_history()
    return [alert.model_dump() for alert in alerts]


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, request: AcknowledgeRequest):
    """Acknowledge an alert with a clinician note."""
    alert = alert_engine.acknowledge_alert(alert_id, request.note)
    if alert is None:
        raise HTTPException(
            status_code=404,
            detail="Alert not found or already acknowledged"
        )

    # Broadcast acknowledgment to all clients
    await ws_manager.broadcast_alert_acknowledged({
        "id": alert.id,
        "patient_id": alert.patient_id,
        "note": request.note,
        "acknowledged_at": alert.acknowledgment.acknowledged_at.isoformat(),
    })

    return alert.model_dump()


@router.get("/thresholds")
async def get_thresholds():
    """Get current threshold configuration."""
    return alert_engine.get_thresholds()
