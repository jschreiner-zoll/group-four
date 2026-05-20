# Application Design Plan

## Connected Care / Remote Patient Monitoring PoC

This plan outlines the application design steps and includes questions that need your input before generating the design artifacts.

---

## Design Steps

- [x] Identify and define main components
- [x] Define component responsibilities and boundaries
- [x] Define component method signatures and interfaces
- [x] Design service layer and orchestration patterns
- [x] Map component dependencies and communication patterns
- [x] Validate design completeness and consistency

---

## Design Questions

Please answer the following questions by filling in the letter choice after each [Answer]: tag.

### Component Organization

## Question 1
How should the backend be organized?

A) Single FastAPI application with all routes in one file (simplest for PoC)
B) FastAPI application with modular route files (e.g., patients.py, alerts.py, simulator.py)
C) FastAPI application with layered architecture (routes → services → models)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 2
How should the React frontend be organized?

A) Flat component structure — all components in a single /components folder
B) Feature-based structure — folders per feature (e.g., /dashboard, /alerts, /patients)
C) Atomic design — atoms, molecules, organisms, templates, pages
X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Communication Patterns

## Question 3
How should the frontend communicate with the backend?

A) WebSocket only — all data (vitals, alerts, commands) flows through a single WebSocket connection
B) REST for commands (acknowledge alert, trigger simulation) + WebSocket for real-time data (vitals, alerts)
C) REST for initial data load + WebSocket for real-time updates + REST for commands
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 4
How should the simulated IoT devices be implemented?

A) Background async tasks within the FastAPI server (simplest, single process)
B) Separate Python process that publishes to the FastAPI server via internal messaging
C) Built into the FastAPI server but as a dedicated module with its own lifecycle management
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### State Management

## Question 5
How should the frontend manage application state (patients, vitals, alerts)?

A) React Context API with useReducer (lightweight, no external dependencies)
B) Redux Toolkit (structured, scalable, but heavier for a PoC)
C) Zustand (minimal boilerplate, modern approach)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Alert Engine Design

## Question 6
Where should the threshold evaluation logic run?

A) Backend only — server evaluates thresholds and pushes alerts to frontend via WebSocket
B) Frontend only — client receives raw vitals and evaluates thresholds locally
C) Both — backend generates authoritative alerts, frontend also evaluates for immediate UI feedback
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Audio Alert Design

## Question 7
How should audio alerts be managed?

A) Simple browser Audio API — play a sound file when alert appears, stop when acknowledged
B) Web Audio API with priority queue — different sounds for warning vs critical, queue management
C) Simple audio with a global mute/unmute toggle for clinician control
X) Other (please describe after [Answer]: tag below)

[Answer]: B

