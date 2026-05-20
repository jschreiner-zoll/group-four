# Requirements Verification Questions

## Connected Care / Remote Patient Monitoring PoC

Please answer the following questions to help clarify the requirements. Fill in the letter choice after each [Answer]: tag. If none of the options match your needs, choose "Other" and describe your preference.

---

## Question 1
What technology stack would you prefer for this PoC?

A) React (frontend) + Node.js/Express (backend) + WebSocket for real-time
B) Next.js (full-stack) + WebSocket for real-time
C) React (frontend) + Python/FastAPI (backend) + WebSocket for real-time
D) Vue.js (frontend) + Node.js/Express (backend) + WebSocket for real-time
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 2
What vital signs should the simulated IoT devices generate?

A) Heart rate, blood pressure, SpO2 (oxygen saturation), and temperature only
B) Heart rate, blood pressure, SpO2, temperature, and respiratory rate
C) Heart rate, blood pressure, SpO2, temperature, respiratory rate, and ECG waveform
D) All of the above plus blood glucose
X) Other (please describe after [Answer]: tag below)

[Answer]: D

## Question 3
How many simulated patients should the system support for the PoC?

A) 5 patients
B) 10 patients
C) 20 patients
D) 50 patients
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 4
What database would you prefer for storing patient data and alerts?

A) In-memory only (no persistence, simplest for PoC)
B) SQLite (lightweight, file-based persistence)
C) PostgreSQL (production-grade relational database)
D) MongoDB (document-based, flexible schema)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
Should the clinician interface require authentication/login?

A) Yes — simple username/password login (no registration, pre-seeded accounts)
B) Yes — full authentication with registration and role-based access
C) No — open access for PoC simplicity
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 6
For the "simulate medical conditions" button (requirement c), what behavior do you expect?

A) A single button per patient that triggers a random critical condition (e.g., tachycardia, hypoxia)
B) Multiple buttons per patient, each simulating a specific condition (e.g., "Simulate Tachycardia", "Simulate Hypoxia")
C) A dropdown menu to select which condition to simulate, then a "Trigger" button
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 7
How should alerts be delivered to clinicians?

A) Visual alerts on the dashboard only (color changes, badges, alert panel)
B) Visual alerts + browser push notifications
C) Visual alerts + audio alerts (alarm sounds)
D) Visual alerts + audio alerts + browser push notifications
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 8
When a clinician acknowledges an alert, what should happen?

A) Alert moves to "Acknowledged" state with the note, remains visible in history
B) Alert is dismissed from the active view, stored in a separate history/log
C) Alert changes color/status on dashboard, note is visible to all clinicians
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 9
What "standard remote patient monitoring platform design" elements are most important to you (requirement g)?

A) Patient list with status indicators + individual patient detail view + alert management panel
B) Multi-patient grid/tile view with real-time vitals + alert sidebar
C) Clinical dashboard with patient census, trending charts, and alert queue (similar to Philips/GE monitoring systems)
D) All of the above combined into a comprehensive layout
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 10
Should the dashboard display historical vital sign trends (charts/graphs)?

A) Yes — real-time line charts showing last 30 minutes of data per vital sign
B) Yes — real-time charts showing last 1 hour of data
C) No — only show current/latest vital sign values (simplest for PoC)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 11
What is the desired data update frequency for the simulated vitals?

A) Every 1 second (high frequency, most realistic)
B) Every 3 seconds
C) Every 5 seconds
D) Every 10 seconds (lower frequency, less resource intensive)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 12: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 13: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: B
