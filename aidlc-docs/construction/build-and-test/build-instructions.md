# Build Instructions

## Prerequisites
- **Python**: 3.11+ (with pip/venv)
- **Node.js**: 18+ (with npm)
- **OS**: macOS, Linux, or Windows (WSL)
- **Disk Space**: ~500MB (for node_modules and Python venv)

## Build Steps

### 1. Backend — Install Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Frontend — Install Dependencies
```bash
cd frontend
npm install
```

### 3. Verify Backend Build
```bash
cd backend
source venv/bin/activate
python -c "from app.main import app; print('Backend OK')"
```

### 4. Verify Frontend Build
```bash
cd frontend
npm run build
```

### 5. Single Command Start (Both Services)
```bash
chmod +x start.sh
./start.sh
```

## Build Artifacts
- **Backend**: No compiled artifacts (Python interpreted). Virtual environment in `backend/venv/`
- **Frontend**: Production build in `frontend/build/` (after `npm run build`)
- **Runtime**: Backend on port 8000, Frontend on port 3000

## Environment Variables
No environment variables required. All configuration is in `backend/app/config.py`.

## Troubleshooting

### pip install fails with "externally-managed-environment"
- **Cause**: System Python is protected (PEP 668)
- **Solution**: Use virtual environment: `python3 -m venv venv && source venv/bin/activate`

### npm install fails
- **Cause**: Node.js version too old
- **Solution**: Upgrade to Node.js 18+: `node --version`

### Port already in use
- **Cause**: Another process on port 8000 or 3000
- **Solution**: Kill existing process: `lsof -ti:8000 | xargs kill`
