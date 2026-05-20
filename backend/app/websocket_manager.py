"""WebSocket connection management and message broadcasting."""

import json
from datetime import datetime, timezone

from fastapi import WebSocket


class WebSocketManager:
    """Manages WebSocket connections and broadcasts messages to all clients."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_vitals(self, patient_id: str, vitals_data: dict):
        """Broadcast vital signs update to all connected clients."""
        message = {
            "type": "vitals_update",
            "data": vitals_data,
        }
        await self._broadcast(message)

    async def broadcast_alert(self, alert_data: dict):
        """Broadcast new alert to all connected clients."""
        message = {
            "type": "new_alert",
            "data": alert_data,
        }
        await self._broadcast(message)

    async def broadcast_alert_escalated(self, alert_data: dict):
        """Broadcast alert escalation to all connected clients."""
        message = {
            "type": "alert_escalated",
            "data": alert_data,
        }
        await self._broadcast(message)

    async def broadcast_alert_acknowledged(self, alert_data: dict):
        """Broadcast alert acknowledgment to all connected clients."""
        message = {
            "type": "alert_acknowledged",
            "data": alert_data,
        }
        await self._broadcast(message)

    async def _broadcast(self, message: dict):
        """Send a message to all connected clients. Remove disconnected clients."""
        disconnected = []
        serialized = json.dumps(message, default=self._json_serializer)

        for connection in self.active_connections:
            try:
                await connection.send_text(serialized)
            except Exception:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection)

    @staticmethod
    def _json_serializer(obj):
        """Custom JSON serializer for datetime objects."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    @property
    def connection_count(self) -> int:
        """Return number of active connections."""
        return len(self.active_connections)
