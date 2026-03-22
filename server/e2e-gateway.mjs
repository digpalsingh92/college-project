const base = 'http://localhost:3000';
const ts = Date.now().toString();
const doctorEmail = `doctor${ts}@example.com`;
const patientEmail = `patient${ts}@example.com`;

async function req(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  return { status: res.status, data };
}

function logStep(title, payload) {
  console.log(`\n== ${title} ==`);
  console.log(JSON.stringify(payload, null, 2));
}

const health = await req('GET', '/health');
logStep('Health', health);
if (health.status !== 200) throw new Error('Health check failed');

const docs = await req('GET', '/api-docs.json');
logStep('Swagger Spec', {
  status: docs.status,
  openapi: docs.data?.openapi,
  title: docs.data?.info?.title,
});
if (docs.status !== 200) throw new Error('Swagger spec failed');

const doctorReg = await req('POST', '/api/doctors/auth/register', {
  name: 'Dr Sync',
  email: doctorEmail,
  password: 'Password123',
  specialization: 'Cardiology',
  licenseNumber: `LIC-${ts}`,
});
logStep('Register Doctor', doctorReg);
if (![200, 201].includes(doctorReg.status)) throw new Error('Doctor register failed');

const doctorLogin = await req('POST', '/api/doctors/auth/login', {
  email: doctorEmail,
  password: 'Password123',
});
logStep('Login Doctor', doctorLogin);
if (doctorLogin.status !== 200) throw new Error('Doctor login failed');
const doctorToken = doctorLogin.data.token;
const doctorId = doctorLogin.data.doctor.id;

const patientReg = await req('POST', '/api/patients/auth/register', {
  name: 'Pat Sync',
  email: patientEmail,
  password: 'Password123',
  phone: '1234567890',
  age: 30,
  gender: 'male',
});
logStep('Register Patient', patientReg);
if (![200, 201].includes(patientReg.status)) throw new Error('Patient register failed');

const patientLogin = await req('POST', '/api/patients/auth/login', {
  email: patientEmail,
  password: 'Password123',
});
logStep('Login Patient', patientLogin);
if (patientLogin.status !== 200) throw new Error('Patient login failed');
const patientToken = patientLogin.data.token;

const apptCreate = await req(
  'POST',
  '/api/patients/appointments',
  {
    doctorId,
    appointmentDate: '2026-04-01T10:00:00.000Z',
    reason: 'Routine check',
    symptoms: ['fatigue'],
  },
  patientToken
);
logStep('Create Appointment', apptCreate);
if (![200, 201].includes(apptCreate.status)) throw new Error('Create appointment failed');
const appointmentId = apptCreate.data.appointment.id;

const doctorAppts = await req('GET', '/api/doctors/me/appointments', undefined, doctorToken);
logStep('Doctor Appointments', doctorAppts);
if (doctorAppts.status !== 200) throw new Error('Doctor appointments failed');
if (!doctorAppts.data.appointments?.some((a) => a.id === appointmentId)) {
  throw new Error('Mirrored appointment missing on doctor side');
}

const addNotes = await req(
  'PUT',
  `/api/doctors/appointments/${appointmentId}/notes`,
  {
    doctorNotes: 'Patient stable. Hydration advised.',
    prescriptions: ['Electrolytes'],
  },
  doctorToken
);
logStep('Doctor Adds Notes', addNotes);
if (addNotes.status !== 200) throw new Error('Doctor notes update failed');

const patientAppts = await req('GET', '/api/patients/appointments', undefined, patientToken);
logStep('Patient Appointments', patientAppts);
if (patientAppts.status !== 200) throw new Error('Patient appointments failed');
const matched = patientAppts.data.appointments?.find((a) => a.id === appointmentId);
if (!matched) throw new Error('Mirrored appointment missing on patient side');
if (matched.doctorNotes !== 'Patient stable. Hydration advised.') {
  throw new Error('Doctor notes were not mirrored back to patient service');
}

console.log('\nE2E_RESULT: PASS');
console.log(`APPOINTMENT_ID: ${appointmentId}`);
console.log(`DOCTOR_EMAIL: ${doctorEmail}`);
console.log(`PATIENT_EMAIL: ${patientEmail}`);
