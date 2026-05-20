# Build Instructions — Care Team Escalation Routing

## Prerequisites
- **Python**: 3.11+
- **Node.js**: 18+
- **pip**: Latest
- **npm**: 9+

## Build Steps

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

**New dependency added**: `hypothesis==6.92.2` (property-based testing framework)

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

**Note**: `fast-check` should be added for frontend PBT:
```bash
npm install --save-dev fast-check
```

### 3. Verify Backend Imports
```bash
cd backend
python -c "from app.fhir_models import *; from app.virtual_clock import *; from app.escalation_tracker import *; from app.care_team import *; from app.escalation import *; print('All imports OK')"
```

### 4. Start Backend Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Expected output**: Server starts on http://localhost:8000 with:
- Existing endpoints: /api/patients, /api/alerts, /ws
- New endpoints: /api/care-team/*, /api/escalation/*

### 5. Start Frontend Development Server
```bash
cd frontend
npm start
```

**Expected output**: React app starts on http://localhost:3000

### 6. Verify New Endpoints
```bash
# Care team clinicians
curl http://localhost:8000/api/care-team/clinicians

# Care team assignments
curl http://localhost:8000/api/care-team/assignments

# Active escalations
curl http://localhost:8000/api/escalation/active

# Escalation config
curl http://localhost:8000/api/escalation/config/current
```

## Build Artifacts
- Backend: Python modules in `backend/app/` (no compilation needed)
- Frontend: React development build served by webpack-dev-server

## Troubleshooting

### Import Error: "No module named 'app.fhir_models'"
- **Cause**: Running from wrong directory
- **Solution**: Ensure you're in the `backend/` directory or PYTHONPATH includes it

### FastAPI startup error: "EscalationEngine not initialized"
- **Cause**: Module initialization order issue
- **Solution**: Ensure `main.py` lifespan initializes modules in correct order (virtual_clock → care_team_manager → escalation_tracker → escalation_engine → register hooks)

### Frontend: "Cannot find module '../services/escalationApi'"
- **Cause**: New file not created
- **Solution**: Verify `frontend/src/services/escalationApi.js` exists
