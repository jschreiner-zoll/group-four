/**
 * WebSocket client for real-time vitals and alert streaming.
 */

const WS_URL = 'ws://localhost:8000/ws';
const RECONNECT_DELAY = 3000;

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.handlers = {
      vitals_update: [],
      new_alert: [],
      alert_escalated: [],
      alert_acknowledged: [],
      escalation_event: [],
      care_team_updated: [],
      clinician_status_changed: [],
      handoff_complete: [],
    };
    this.onConnectChange = null;
    this.shouldReconnect = true;
  }

  connect() {
    this.shouldReconnect = true;
    this._createConnection();
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  _createConnection() {
    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        if (this.onConnectChange) {
          this.onConnectChange(true);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;
          if (this.handlers[type]) {
            this.handlers[type].forEach((handler) => handler(data));
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        if (this.onConnectChange) {
          this.onConnectChange(false);
        }
        if (this.shouldReconnect) {
          setTimeout(() => this._createConnection(), RECONNECT_DELAY);
        }
      };

      this.ws.onerror = () => {
        // Error will trigger onclose, which handles reconnection
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      if (this.shouldReconnect) {
        setTimeout(() => this._createConnection(), RECONNECT_DELAY);
      }
    }
  }

  onVitalsUpdate(callback) {
    this.handlers.vitals_update = [callback];
  }

  onNewAlert(callback) {
    this.handlers.new_alert = [callback];
  }

  onAlertEscalated(callback) {
    this.handlers.alert_escalated = [callback];
  }

  onAlertAcknowledged(callback) {
    this.handlers.alert_acknowledged = [callback];
  }

  onEscalationEvent(callback) {
    this.handlers.escalation_event = [callback];
  }

  onCareTeamUpdated(callback) {
    this.handlers.care_team_updated = [callback];
  }

  onClinicianStatusChanged(callback) {
    this.handlers.clinician_status_changed = [callback];
  }

  onHandoffComplete(callback) {
    this.handlers.handoff_complete = [callback];
  }

  setConnectionChangeHandler(callback) {
    this.onConnectChange = callback;
  }
}

// Singleton instance
const wsClient = new WebSocketClient();
export default wsClient;
