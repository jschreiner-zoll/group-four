"""FastAPI application entry point for the Remote Patient Monitoring PoC."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.alerts import AlertEngine
from app.models import AlertSeverity, VitalReading
from app.patients import router as patients_router
from app.patients import set_dependencies
from app.simulator import VitalSignsSimulator
from app.websocket_manager import WebSocketManager

# Global instances
simulator = VitalSignsSimulator()
alert_engine = AlertEngine()
ws_manager = WebSocketManager()


async def on_vitals_generated(patient_id: str, vitals: VitalReading):
    """Callback when simulator generates new vitals. Evaluates and broadcasts."""
    # Update patient status
    patient = simulator.get_patient(patient_id)

    # Get vitals that are currently in recovery (skip threshold eval for these)
    recovering_vitals = set()
    conditions = simulator.active_conditions.get(patient_id, {})
    for cond_name, record in conditions.items():
        if record.recovering:
            from app.config import CONDITION_VALUES
            config = CONDITION_VALUES.get(cond_name)
            if config:
                recovering_vitals.add(config["vital_sign"])

    # Evaluate thresholds (skip recovering vitals)
    previous_alerts = {
        a.id: a.severity
        for a in alert_engine.get_active_alerts()
        if a.patient_id == patient_id
    }
    new_alerts = alert_engine.evaluate_vitals(patient_id, vitals, skip_vitals=recovering_vitals)

    # Update patient status after evaluation
    new_status = alert_engine.derive_patient_status(patient_id)
    if patient:
        patient.status = new_status

    # Broadcast vitals update
    vitals_data = {
        "patient_id": patient_id,
        "timestamp": vitals.timestamp.isoformat(),
        "vitals": {
            "heart_rate": vitals.heart_rate,
            "blood_pressure_systolic": vitals.blood_pressure_systolic,
            "blood_pressure_diastolic": vitals.blood_pressure_diastolic,
            "spo2": vitals.spo2,
            "temperature": vitals.temperature,
            "respiratory_rate": vitals.respiratory_rate,
            "blood_glucose": vitals.blood_glucose,
            "ecg_waveform": vitals.ecg_waveform,
        },
        "patient_status": new_status.value,
    }
    await ws_manager.broadcast_vitals(patient_id, vitals_data)

    # Broadcast new alerts
    for alert in new_alerts:
        await ws_manager.broadcast_alert({
            "id": alert.id,
            "patient_id": alert.patient_id,
            "patient_name": alert.patient_name,
            "vital_sign": alert.vital_sign,
            "value": alert.value,
            "threshold_value": alert.threshold_value,
            "severity": alert.severity.value,
            "created_at": alert.created_at.isoformat(),
        })

    # Check for escalations
    current_alerts = {
        a.id: a.severity
        for a in alert_engine.get_active_alerts()
        if a.patient_id == patient_id
    }
    for alert_id, new_severity in current_alerts.items():
        if alert_id in previous_alerts and previous_alerts[alert_id] != new_severity:
            alert = next(
                (a for a in alert_engine.get_active_alerts() if a.id == alert_id),
                None,
            )
            if alert and alert.escalated:
                await ws_manager.broadcast_alert_escalated({
                    "id": alert.id,
                    "patient_id": alert.patient_id,
                    "vital_sign": alert.vital_sign,
                    "new_severity": alert.severity.value,
                    "breach_count": alert.breach_count,
                })


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: start/stop simulation."""
    # Startup
    patient_names = {p.id: p.name for p in simulator.get_patients()}
    alert_engine.set_patient_names(patient_names)
    simulator.set_vitals_callback(on_vitals_generated)
    set_dependencies(simulator, alert_engine, ws_manager)
    simulator.start_simulation()
    yield
    # Shutdown
    simulator.stop_simulation()


app = FastAPI(
    title="Connected Care - Remote Patient Monitoring PoC",
    description="Real-time patient monitoring with simulated IoT devices",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST routes
app.include_router(patients_router)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time vitals and alert streaming."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for client messages (if any)
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
