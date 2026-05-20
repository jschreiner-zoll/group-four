/**
 * Global setup: Triggers a condition for each patient before tests run.
 * This ensures alerts are generated and the system is in an active state.
 */
const { request } = require('@playwright/test');

const API_BASE = 'http://localhost:8000/api';

// Assign one condition per patient (round-robin through 6 conditions for 10 patients)
const CONDITIONS = [
  'tachycardia',
  'bradycardia',
  'hypoxia',
  'hyperthermia',
  'hypotension',
  'hyperglycemia',
];

async function globalSetup() {
  const context = await request.newContext({ baseURL: API_BASE });

  // Wait for backend to be ready
  let retries = 10;
  while (retries > 0) {
    try {
      const response = await context.get('/patients');
      if (response.ok()) break;
    } catch (e) {
      // Backend not ready yet
    }
    retries--;
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (retries === 0) {
    throw new Error('Backend did not become ready in time');
  }

  // Fetch all patients
  const response = await context.get('/patients');
  const patients = await response.json();

  // Trigger a condition for each patient
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const condition = CONDITIONS[i % CONDITIONS.length];

    const simResponse = await context.post(`/patients/${patient.id}/simulate`, {
      data: { condition },
    });

    if (simResponse.ok()) {
      console.log(`  ✓ Triggered ${condition} for ${patient.name} (${patient.id})`);
    } else {
      console.warn(`  ✗ Failed to trigger ${condition} for ${patient.name}: ${simResponse.status()}`);
    }
  }

  // Wait one simulation cycle (5s) so alerts are generated before tests start
  console.log('  Waiting for first vitals cycle to generate alerts...');
  await new Promise((r) => setTimeout(r, 6000));

  await context.dispose();
}

module.exports = globalSetup;
