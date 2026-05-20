# Requirements Document: Connected Care / Remote Patient Monitoring PoC

## Intent Analysis

- **User Request**: Build a small connected care/remote patient monitoring platform as a Proof of Concept
- **Request Type**: New Project (Greenfield)
- **Scope Estimate**: Multiple Components (frontend, backend, simulated IoT, real-time communication)
- **Complexity Estimate**: Moderate (real-time data, threshold alerting, clinical UI patterns)

---

## 1. Functional Requirements

### FR-1: Simulated IoT Devices (Virtual Sensors)

| ID | Requirement |
|---|---|
| FR-1.1 | The system shall simulate 10 virtual patient sensors generating vital sign data |
| FR-1.2 | Each simulated device shall generate: heart rate (bpm), blood pressure (systolic/diastolic mmHg), SpO2 (%), body temperature (°F/°C), respiratory rate (breaths/min), ECG waveform data, and blood glucose (mg/dL) |
| FR-1.3 | Vital sign data shall be generated every 5 seconds per patient |
| FR-1.4 | Simulated data shall fall within physiologically realistic ranges under normal conditions |
| FR-1.5 | Each simulated patient shall have a unique identifier, name, age, and assigned room/bed |

### FR-2: Real-Time Dashboard (Landing Page)

| ID | Requirement |
|---|---|
| FR-2.1 | The landing page shall display a multi-patient grid/tile view showing all 10 patients simultaneously |
| FR-2.2 | Each patient tile shall display current vital sign values (latest reading only, no historical charts) |
| FR-2.3 | Patient tiles shall include visual status indicators (normal, warning, critical) |
| FR-2.4 | Vital sign values shall update in real-time via WebSocket connection |
| FR-2.5 | An alert sidebar shall display active alerts with severity and timestamp |

### FR-3: Medical Condition Simulation

| ID | Requirement |
|---|---|
| FR-3.1 | Each patient tile shall provide multiple condition simulation buttons |
| FR-3.2 | Available simulation conditions shall include at minimum: Tachycardia (HR >100), Bradycardia (HR <60), Hypoxia (SpO2 <90%), Hyperthermia (Temp >101°F), Hypotension (BP systolic <90), Hyperglycemia (glucose >180 mg/dL) |
| FR-3.3 | When a simulation button is pressed, the corresponding patient's vital data shall shift to values representing that condition |
| FR-3.4 | Simulated conditions shall persist until manually reset or a "Return to Normal" button is pressed |

### FR-4: Threshold-Based Alerting

| ID | Requirement |
|---|---|
| FR-4.1 | The system shall monitor all vital signs against configurable thresholds |
| FR-4.2 | Default thresholds shall include: Heart rate >100 bpm (tachycardia), Heart rate <60 bpm (bradycardia), SpO2 <90% (hypoxia), Temperature >101°F (fever), Systolic BP <90 mmHg (hypotension), Systolic BP >180 mmHg (hypertension), Blood glucose >180 mg/dL (hyperglycemia), Blood glucose <70 mg/dL (hypoglycemia) |
| FR-4.3 | When a threshold is breached, the system shall generate an alert with severity level, affected vital sign, patient ID, and timestamp |
| FR-4.4 | Alerts shall be delivered visually (color changes, badges, alert panel) and with audio alerts (alarm sounds) |
| FR-4.5 | Audio alerts shall be distinguishable by severity (warning vs. critical) |

### FR-5: Clinician Interface

| ID | Requirement |
|---|---|
| FR-5.1 | The clinician interface shall be accessible without authentication (open access for PoC) |
| FR-5.2 | Clinicians shall be able to view all patient statuses from the grid/tile dashboard |
| FR-5.3 | Clinicians shall be able to view individual patient detail by selecting a patient tile |
| FR-5.4 | The patient detail view shall show all current vital signs and any active alerts for that patient |

### FR-6: Alert Acknowledgment

| ID | Requirement |
|---|---|
| FR-6.1 | Clinicians shall be able to acknowledge an active alert |
| FR-6.2 | Acknowledgment shall require a brief text note (free-form, minimum 1 character) |
| FR-6.3 | Acknowledged alerts shall move to an "Acknowledged" state and remain visible in alert history |
| FR-6.4 | The alert history shall display: original alert details, acknowledgment timestamp, clinician note |
| FR-6.5 | Active (unacknowledged) alerts shall be visually distinct from acknowledged alerts |

---

## 2. Non-Functional Requirements

### NFR-1: Technology Stack

| ID | Requirement |
|---|---|
| NFR-1.1 | Frontend: React with WCAG 2.0 compatible color palette |
| NFR-1.2 | Backend: Python with FastAPI framework |
| NFR-1.3 | Real-time communication: WebSocket protocol |
| NFR-1.4 | Data storage: In-memory only (no database persistence) |
| NFR-1.5 | Data update frequency: Every 5 seconds per patient |

### NFR-2: Accessibility

| ID | Requirement |
|---|---|
| NFR-2.1 | All UI colors shall meet WCAG 2.0 AA contrast ratio requirements (4.5:1 for normal text, 3:1 for large text) |
| NFR-2.2 | Status indicators shall not rely solely on color (use icons, text labels, or patterns in addition to color) |
| NFR-2.3 | Alert audio shall have a visual equivalent for hearing-impaired users |
| NFR-2.4 | All interactive elements shall be keyboard accessible |

### NFR-3: Performance

| ID | Requirement |
|---|---|
| NFR-3.1 | The dashboard shall handle 10 simultaneous patient data streams at 5-second intervals |
| NFR-3.2 | Alert generation shall occur within 1 second of threshold breach detection |
| NFR-3.3 | WebSocket messages shall be delivered to connected clients within 500ms |

### NFR-4: Healthcare UI Standards

| ID | Requirement |
|---|---|
| NFR-4.1 | Dashboard layout shall follow standard remote patient monitoring conventions (multi-patient grid with alert sidebar) |
| NFR-4.2 | Vital sign display shall use standard medical abbreviations (HR, BP, SpO2, RR, Temp, BG) |
| NFR-4.3 | Color coding shall follow healthcare conventions: green (normal), yellow/amber (warning), red (critical) while maintaining WCAG 2.0 compliance |
| NFR-4.4 | Patient tiles shall follow a consistent layout pattern similar to bedside monitoring systems |

### NFR-5: Deployment

| ID | Requirement |
|---|---|
| NFR-5.1 | The application shall run locally with minimal setup (single command start) |
| NFR-5.2 | No external service dependencies required (fully self-contained PoC) |

---

## 3. Data Model (Conceptual)

### Patient
- ID, Name, Age, Room/Bed, Status (Normal/Warning/Critical)

### Vital Signs Reading
- Patient ID, Timestamp, Heart Rate, Blood Pressure (Sys/Dia), SpO2, Temperature, Respiratory Rate, ECG Data, Blood Glucose

### Alert
- ID, Patient ID, Vital Sign, Threshold Breached, Severity (Warning/Critical), Timestamp, Status (Active/Acknowledged), Acknowledgment Note, Acknowledgment Timestamp

---

## 4. System Boundaries

### In Scope
- Simulated IoT device data generation
- Real-time dashboard with WebSocket updates
- Threshold-based alert engine
- Clinician viewing and alert acknowledgment
- WCAG 2.0 accessible UI
- Medical condition simulation controls

### Out of Scope (Future Considerations)
- Real IoT device integration
- Data persistence beyond application runtime
- User authentication and authorization
- Mobile application
- Historical data trending/charting
- Integration with EHR/EMR systems
- HIPAA compliance (PoC only)
- Multi-tenancy
- Deployment to cloud infrastructure
- FHIR-compliant data model (planned for future iteration — current model uses simplified custom schema for PoC speed; future versions should align with FHIR Patient, Observation, and Flag resources with LOINC coding)

---

## 5. Extension Configuration

| Extension | Enabled | Decided At |
|---|---|---|
| Property-Based Testing | No | Requirements Analysis |
| Security Baseline | No | Requirements Analysis |
