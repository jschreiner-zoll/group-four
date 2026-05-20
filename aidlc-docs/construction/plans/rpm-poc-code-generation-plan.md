# Code Generation Plan

## Connected Care / Remote Patient Monitoring PoC

**Workspace Root**: `/Users/albertmiller/Code`
**Project Type**: Greenfield (single unit)
**Code Location**: Workspace root

---

## Project Structure

```
/Users/albertmiller/Code/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── models.py            # Pydantic data models
│   │   ├── simulator.py         # Vital sign simulation engine
│   │   ├── alerts.py            # Alert engine + threshold evaluation
│   │   ├── patients.py          # REST route handlers
│   │   ├── websocket_manager.py # WebSocket connection management
│   │   └── config.py            # Threshold configs, patient seed data
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_simulator.py
│   │   ├── test_alerts.py
│   │   ├── test_patients.py
│   │   └── test_websocket.py
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── context/
│   │   │   ├── AppContext.js     # Context provider
│   │   │   └── appReducer.js    # useReducer logic
│   │   ├── services/
│   │   │   ├── websocketClient.js
│   │   │   ├── audioAlertManager.js
│   │   │   └── api.js           # REST API calls
│   │   ├── atoms/
│   │   │   ├── VitalSignBadge.js
│   │   │   ├── StatusIndicator.js
│   │   │   └── AlertBadge.js
│   │   ├── molecules/
│   │   │   ├── PatientTile.js
│   │   │   ├── AlertCard.js
│   │   │   └── SimulationControls.js
│   │   ├── organisms/
│   │   │   ├── PatientGrid.js
│   │   │   ├── AlertSidebar.js
│   │   │   └── PatientDetailPanel.js
│   │   ├── templates/
│   │   │   └── DashboardTemplate.js
│   │   ├── pages/
│   │   │   └── DashboardPage.js
│   │   └── styles/
│   │       ├── variables.css     # WCAG colors, spacing
│   │       └── dashboard.css     # Layout styles
│   ├── src/__tests__/
│   │   ├── appReducer.test.js
│   │   ├── VitalSignBadge.test.js
│   │   ├── StatusIndicator.test.js
│   │   ├── PatientTile.test.js
│   │   ├── AlertCard.test.js
│   │   └── audioAlertManager.test.js
│   ├── package.json
│   └── README.md
├── README.md                     # Project-level README with setup instructions
└── start.sh                      # Single command to start both backend + frontend
```

---

## Generation Steps

### Step 1: Backend — Project Setup
- [x] Create `backend/requirements.txt` with dependencies (fastapi, uvicorn, websockets, pydantic, pytest, httpx)
- [x] Create `backend/app/__init__.py`
- [x] Create `backend/app/config.py` with threshold configurations, patient seed data (10 patients), and normal vital ranges

### Step 2: Backend — Data Models
- [x] Create `backend/app/models.py` with Pydantic models: Patient, VitalReading, Alert, Acknowledgment, ActiveCondition, ThresholdConfig, WebSocket message types

### Step 3: Backend — Vital Signs Simulator
- [x] Create `backend/app/simulator.py`

### Step 4: Backend — Alert Engine
- [x] Create `backend/app/alerts.py`

### Step 5: Backend — WebSocket Manager
- [x] Create `backend/app/websocket_manager.py`

### Step 6: Backend — REST Routes and Main App
- [x] Create `backend/app/patients.py` with FastAPI router
- [x] Create `backend/app/main.py`

### Step 7: Backend — Unit Tests
- [x] Create `backend/tests/__init__.py`
- [x] Create `backend/tests/test_simulator.py`
- [x] Create `backend/tests/test_alerts.py`
- [x] Create `backend/tests/test_patients.py`

### Step 8: Frontend — Project Setup
- [x] Create `frontend/package.json`
- [x] Create `frontend/public/index.html`
- [x] Create `frontend/src/index.js`
- [x] Create `frontend/src/styles/variables.css` with WCAG 2.0 compliant color palette
- [x] Create `frontend/src/styles/dashboard.css` with grid layout

### Step 9: Frontend — State Management
- [x] Create `frontend/src/context/appReducer.js`
- [x] Create `frontend/src/context/AppContext.js`

### Step 10: Frontend — Services
- [x] Create `frontend/src/services/api.js`
- [x] Create `frontend/src/services/websocketClient.js`
- [x] Create `frontend/src/services/audioAlertManager.js`

### Step 11: Frontend — Atoms
- [x] Create `frontend/src/atoms/VitalSignBadge.js`
- [x] Create `frontend/src/atoms/StatusIndicator.js`
- [x] Create `frontend/src/atoms/AlertBadge.js`

### Step 12: Frontend — Molecules
- [x] Create `frontend/src/molecules/PatientTile.js`
- [x] Create `frontend/src/molecules/AlertCard.js`
- [x] Create `frontend/src/molecules/SimulationControls.js`

### Step 13: Frontend — Organisms
- [x] Create `frontend/src/organisms/PatientGrid.js`
- [x] Create `frontend/src/organisms/AlertSidebar.js`
- [x] Create `frontend/src/organisms/PatientDetailPanel.js`

### Step 14: Frontend — Templates and Pages
- [x] Create `frontend/src/templates/DashboardTemplate.js`
- [x] Create `frontend/src/pages/DashboardPage.js`
- [x] Create `frontend/src/App.js`

### Step 15: Frontend — Unit Tests
- [x] Create `frontend/src/__tests__/appReducer.test.js`

### Step 16: Project-Level Files
- [x] Create `README.md`
- [x] Create `start.sh`

---

## Summary

- **Total Steps**: 16
- **Backend Steps**: 7 (setup, models, simulator, alerts, websocket, routes, tests)
- **Frontend Steps**: 8 (setup, state, services, atoms, molecules, organisms, templates/pages, tests)
- **Project-Level**: 1 (README, start script)
- **Estimated Files**: ~45 files
- **Test Coverage**: Backend unit tests (simulator, alerts, routes) + Frontend unit tests (reducer, components, audio)
