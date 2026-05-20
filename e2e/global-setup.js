/**
 * Global setup: Triggers a condition for each patient before tests run.
 * This ensures the system is in an active state with alerts generated.
 */
const { request } = require('@playwright/test');

const API_BASE = 'http://localhost:8001/api';

const CONDITIONS = [
  'tachycardia',
  'bradycardia',
  'hypoxia',
  'hyperthermia',
  'hypotension',
  'hyperglycemia',
  'tachycardia',
  'bradycardia',
  'hypoxia',
  'hyperthermia',
];

async function globalSetup() {
  const context = await request.newContext({ baseURL: API_BASE });

  // Wait for backend to be ready
  let retries = 15;
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

  console.log(`\n  Found ${patients.length} patients. Triggering conditions...\n`);

  // Trigger a condition for each patient
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const condition = CONDITIONS[i];

    const simResponse = await context.post(`/patients/${patient.id}/simulate`, {
      data: { condition },
    });

    if (simResponse.ok()) {
      console.log(`  ✓ ${patient.name} → ${condition}`);
    } else {
      console.warn(`  ✗ Failed: ${patient.name} → ${condition} (${simResponse.status()})`);
    }
  }

  // Wait for two vitals cycles so alerts are generated
  console.log('\n  Waiting for vitals cycles to generate alerts...');
  await new Promise((r) => setTimeout(r, 11000));
  console.log('  ✓ Setup complete. Running tests.\n');

  await context.dispose();
}

module.exports = globalSetup;
