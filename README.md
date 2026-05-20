# Connected Care — Remote Patient Monitoring PoC

A proof-of-concept remote patient monitoring platform with simulated IoT devices, real-time vital sign streaming, threshold-based alerting, and a clinician dashboard.

## Features

- **10 Simulated Patients** with real-time vital sign generation (HR, BP, SpO2, Temp, RR, ECG, Blood Glucose)
- **Real-Time Dashboard** with multi-patient grid/tile view and WebSocket updates every 5 seconds
- **Threshold-Based Alerting** with configurable thresholds and escalation logic
- **Medical Condition Simulation** buttons (Tachycardia, Bradycardia, Hypoxia, Hyperthermia, Hypotension, Hyperglycemia)
- **Clinician Alert Management** with acknowledgment workflow and notes
- **Audio Alerts** with priority queue (different sounds for warning vs critical)
- **WCAG 2.0 AA Compliant** color palette and accessible UI

## Architecture

```
Backend (Python/FastAPI)          Frontend (React)
├── Vital Signs Simulator         ├── Atomic Design Components
├── Alert Engine                  ├── Context + useReducer State
├── WebSocket Manager             ├── WebSocket Client
├── REST API                      ├── Audio Alert Manager
└── In-Memory Data Store          └── WCAG 2.0 Compliant UI
         │                                    │
         └──── WebSocket + REST API ──────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### Option 1: Single Command
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual Start

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend (in a separate terminal):**
```bash
cd frontend
npm install
npm start
```

### Access
- **Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **API Base**: http://localhost:8000/api

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/patients | List all patients |
| GET | /api/patients/{id} | Get patient detail |
| POST | /api/patients/{id}/simulate | Trigger condition simulation |
| POST | /api/patients/{id}/reset | Reset patient to normal |
| GET | /api/alerts | Get active alerts |
| GET | /api/alerts/history | Get alert history |
| POST | /api/alerts/{id}/acknowledge | Acknowledge alert with note |
| GET | /api/thresholds | Get threshold configuration |
| WS | /ws | WebSocket for real-time data |

## Testing

**Backend:**
```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

**Frontend:**
```bash
cd frontend
npm test
```

## Technology Stack

- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic, WebSockets
- **Frontend**: React 18, Lucide React (icons), Web Audio API
- **State Management**: React Context + useReducer
- **Communication**: REST API + WebSocket
- **Data Storage**: In-memory (no persistence)
- **Testing**: pytest (backend), Jest + React Testing Library (frontend)

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── models.py            # Pydantic data models
│   │   ├── simulator.py         # Vital sign simulation
│   │   ├── alerts.py            # Alert engine
│   │   ├── patients.py          # REST routes
│   │   ├── websocket_manager.py # WebSocket management
│   │   └── config.py            # Configuration
│   ├── tests/                   # Backend tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── atoms/               # Smallest UI components
│   │   ├── molecules/           # Composite components
│   │   ├── organisms/           # Complex UI sections
│   │   ├── templates/           # Page layouts
│   │   ├── pages/               # Full pages
│   │   ├── context/             # State management
│   │   ├── services/            # API, WebSocket, Audio
│   │   └── styles/              # CSS with WCAG colors
│   └── package.json
├── start.sh                     # Single command startup
└── README.md
```

## Design Decisions

- **In-memory storage**: No database for PoC simplicity. Data resets on server restart.
- **No authentication**: Open access for PoC demonstration purposes.
- **Backend-only threshold evaluation**: Single source of truth for alerting.
- **Escalating alerts**: Warnings escalate to Critical after 3 consecutive breach readings (15 seconds).
- **Gradual recovery**: Vitals return to normal over 4 readings (20 seconds) after reset.
- **FHIR compliance**: Planned for future iteration (current model uses simplified custom schema).
