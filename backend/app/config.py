"""Configuration for the Remote Patient Monitoring PoC."""

# Simulation interval in seconds
SIMULATION_INTERVAL = 5

# Number of recovery readings for gradual return to normal
RECOVERY_READINGS = 4

# Escalation threshold (consecutive breach readings before escalation)
ESCALATION_READINGS = 3

# Normal vital sign ranges
NORMAL_RANGES = {
    "heart_rate": {"min": 62, "max": 95, "unit": "bpm"},
    "blood_pressure_systolic": {"min": 95, "max": 135, "unit": "mmHg"},
    "blood_pressure_diastolic": {"min": 62, "max": 85, "unit": "mmHg"},
    "spo2": {"min": 95, "max": 100, "unit": "%"},
    "temperature": {"min": 97.0, "max": 99.0, "unit": "°F"},
    "respiratory_rate": {"min": 12, "max": 20, "unit": "breaths/min"},
    "blood_glucose": {"min": 75, "max": 135, "unit": "mg/dL"},
}

# Threshold configuration for alerting
THRESHOLDS = {
    "heart_rate": {
        "high_warning": 100,
        "high_critical": 130,
        "low_warning": 60,
        "low_critical": None,
    },
    "blood_pressure_systolic": {
        "high_warning": 140,
        "high_critical": 180,
        "low_warning": 90,
        "low_critical": 70,
    },
    "blood_pressure_diastolic": {
        "high_warning": 90,
        "high_critical": 120,
        "low_warning": 50,
        "low_critical": None,
    },
    "spo2": {
        "high_warning": None,
        "high_critical": None,
        "low_warning": 90,
        "low_critical": 85,
    },
    "temperature": {
        "high_warning": 100.4,
        "high_critical": 103,
        "low_warning": 96,
        "low_critical": 95,
    },
    "respiratory_rate": {
        "high_warning": 24,
        "high_critical": 30,
        "low_warning": 10,
        "low_critical": 8,
    },
    "blood_glucose": {
        "high_warning": 180,
        "high_critical": 250,
        "low_warning": 70,
        "low_critical": 54,
    },
}

# Condition simulation value ranges
CONDITION_VALUES = {
    "tachycardia": {
        "vital_sign": "heart_rate",
        "spike_min": 130,
        "spike_max": 150,
        "sustained_min": 105,
        "sustained_max": 140,
    },
    "bradycardia": {
        "vital_sign": "heart_rate",
        "spike_min": 40,
        "spike_max": 45,
        "sustained_min": 42,
        "sustained_max": 58,
    },
    "hypoxia": {
        "vital_sign": "spo2",
        "spike_min": 78,
        "spike_max": 82,
        "sustained_min": 80,
        "sustained_max": 88,
    },
    "hyperthermia": {
        "vital_sign": "temperature",
        "spike_min": 103,
        "spike_max": 104,
        "sustained_min": 101.5,
        "sustained_max": 103.5,
    },
    "hypotension": {
        "vital_sign": "blood_pressure_systolic",
        "spike_min": 70,
        "spike_max": 75,
        "sustained_min": 72,
        "sustained_max": 88,
    },
    "hyperglycemia": {
        "vital_sign": "blood_glucose",
        "spike_min": 250,
        "spike_max": 300,
        "sustained_min": 185,
        "sustained_max": 280,
    },
}

# Seed patient data (10 patients)
SEED_PATIENTS = [
    {"name": "John Smith", "age": 67, "room": "Room 201-A"},
    {"name": "Maria Garcia", "age": 54, "room": "Room 201-B"},
    {"name": "Robert Johnson", "age": 72, "room": "Room 202-A"},
    {"name": "Sarah Williams", "age": 45, "room": "Room 202-B"},
    {"name": "James Brown", "age": 81, "room": "Room 203-A"},
    {"name": "Patricia Davis", "age": 63, "room": "Room 203-B"},
    {"name": "Michael Wilson", "age": 58, "room": "Room 204-A"},
    {"name": "Jennifer Martinez", "age": 49, "room": "Room 204-B"},
    {"name": "David Anderson", "age": 76, "room": "Room 205-A"},
    {"name": "Linda Thomas", "age": 69, "room": "Room 205-B"},
]


# --- Care Team Escalation Configuration ---

# Default escalation timeouts per level (seconds)
# Level N timeout = time before escalating from Level N to Level N+1
ESCALATION_LEVEL_TIMEOUTS = {
    1: 300,  # 5 minutes at Level 1 before escalating to Level 2
    2: 300,  # 5 minutes at Level 2 before escalating to Level 3
    3: 300,  # 5 minutes at Level 3 before escalating to Level 4
}

# Maximum escalation level per alert severity
SEVERITY_MAX_LEVELS = {
    "Warning": 3,   # WARNING alerts stop at Level 3 (Physician)
    "Critical": 4,  # CRITICAL alerts reach Level 4 (RRT)
}

# Demo mode time scale (30x = 300 seconds becomes 10 seconds)
DEMO_TIME_SCALE = 30.0

# Handoff summary time window (seconds) — last 1 hour
HANDOFF_SUMMARY_WINDOW = 3600
