#!/bin/bash
# Start both backend and frontend for the Connected Care RPM PoC

echo "🏥 Starting Connected Care - Remote Patient Monitoring PoC"
echo "============================================================"

# Start backend
echo ""
echo "📡 Starting backend (FastAPI) on http://localhost:8000..."
cd backend
pip install -r requirements.txt -q
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo ""
echo "🖥️  Starting frontend (React) on http://localhost:3000..."
cd frontend
npm install --silent
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================================"
echo "✅ Both services starting!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services."
echo "============================================================"

# Wait for Ctrl+C
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
