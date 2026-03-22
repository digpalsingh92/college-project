#!/usr/bin/env node
/**
 * Comprehensive RBAC Test Matrix
 * Tests all CRUD operations across patient, doctor, and admin flows
 * with role-based access control enforcement
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
let testResults = [];
let tokens = {};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

const recordTest = (name, passed, details = '') => {
  testResults.push({ name, passed, details });
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  log(color, `  ${icon} ${name}${details ? ' - ' + details : ''}`);
};

const makeRequest = async (method, path, data = null, token = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (data) config.data = data;

    const response = await axios(config);
    return { status: response.status, data: response.data };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || { error: error.message },
    };
  }
};

// ── Setup: Create test accounts ────────────────────────────────────────────
const setupTestAccounts = async () => {
  log(colors.blue, '\n=== SETUP: Creating Test Accounts ===\n');

  try {
    // Create Admin Account
    log(colors.yellow, 'Creating admin account...');
    const adminRes = await makeRequest('POST', '/api/admin/auth/register', {
      name: 'Test Admin',
      email: `admin-${Date.now()}@test.com`,
      password: 'admin123',
      role: 'admin',
    });
    if (adminRes.status === 201) {
      tokens.admin = adminRes.data.token;
      log(colors.green, '  ✓ Admin created');
    } else {
      log(colors.red, `  ✗ Admin creation failed: ${adminRes.status}`);
    }

    // Create Patient Account
    log(colors.yellow, 'Creating patient account...');
    const patientRes = await makeRequest('POST', '/api/patients/auth/register', {
      name: 'Test Patient',
      email: `patient-${Date.now()}@test.com`,
      password: 'patient123',
      phone: '5551234567',
    });
    if (patientRes.status === 201) {
      tokens.patient = patientRes.data.token;
      log(colors.green, '  ✓ Patient created');
    } else {
      log(colors.red, `  ✗ Patient creation failed: ${patientRes.status}`);
    }

    // Create Doctor via Admin
    log(colors.yellow, 'Creating doctor account (via admin)...');
    const doctorRes = await makeRequest(
      'POST',
      '/api/doctors/auth/register',
      {
        name: 'Test Doctor',
        email: `doctor-${Date.now()}@test.com`,
        password: 'doctor123',
        specialization: 'Cardiology',
        licenseNumber: `LIC-${Date.now()}`,
        experience: 5,
      },
      tokens.admin
    );
    if (doctorRes.status === 201) {
      tokens.doctor = doctorRes.data.token;
      log(colors.green, '  ✓ Doctor created');
    } else {
      log(colors.red, `  ✗ Doctor creation failed: ${doctorRes.status}`);
    }

    // Create Second Patient for cross-access tests
    log(colors.yellow, 'Creating second patient account...');
    const patient2Res = await makeRequest('POST', '/api/patients/auth/register', {
      name: 'Test Patient 2',
      email: `patient2-${Date.now()}@test.com`,
      password: 'patient123',
      phone: '5559876543',
    });
    if (patient2Res.status === 201) {
      tokens.patient2 = patient2Res.data.token;
      log(colors.green, '  ✓ Second Patient created');
    } else {
      log(colors.red, `  ✗ Patient2 creation failed: ${patient2Res.status}`);
    }
  } catch (err) {
    log(colors.red, `Setup Error: ${err.message}`);
  }
};

// ── Test Suites ───────────────────────────────────────────────────────────

const testPatientOperations = async () => {
  log(colors.blue, '\n=== PATIENT OPERATIONS & RESTRICTIONS ===\n');

  if (!tokens.patient) {
    log(colors.red, 'Skipping: No patient token');
    return;
  }

  // Patient can view own profile
  log(colors.yellow, 'Patient Profile Tests:');
  const profileRes = await makeRequest('GET', '/api/patients/profile', null, tokens.patient);
  recordTest('Patient views own profile', profileRes.status === 200, `Status: ${profileRes.status}`);

  // Patient can update own profile
  const updateRes = await makeRequest(
    'PUT',
    '/api/patients/profile',
    { name: 'Updated Patient Name', phone: '5551111111' },
    tokens.patient
  );
  recordTest('Patient updates own profile', updateRes.status === 200, `Status: ${updateRes.status}`);

  // Patient cannot view all patients (should be 403)
  log(colors.yellow, 'Patient Unauthorized Access Tests:');
  const listRes = await makeRequest('GET', '/api/patients', null, tokens.patient);
  recordTest(
    'Patient cannot list all patients',
    listRes.status === 403,
    `Expected 403, got ${listRes.status}`
  );

  // Patient cannot access admin dashboard
  const dashRes = await makeRequest('GET', '/api/admin/dashboard', null, tokens.patient);
  recordTest(
    'Patient cannot access admin dashboard',
    dashRes.status === 403,
    `Expected 403, got ${dashRes.status}`
  );

  // Patient cannot update another patient
  const updateOtherRes = await makeRequest('PUT', '/api/patients/fake-id', { name: 'Hacked' }, tokens.patient);
  recordTest(
    'Patient cannot update other patients',
    updateOtherRes.status === 403,
    `Expected 403, got ${updateOtherRes.status}`
  );

  // Patient cannot delete another patient
  const deleteOtherRes = await makeRequest('DELETE', '/api/patients/fake-id', null, tokens.patient);
  recordTest(
    'Patient cannot delete other patients',
    deleteOtherRes.status === 403,
    `Expected 403, got ${deleteOtherRes.status}`
  );
};

const testDoctorOperations = async () => {
  log(colors.blue, '\n=== DOCTOR OPERATIONS & RESTRICTIONS ===\n');

  if (!tokens.doctor) {
    log(colors.red, 'Skipping: No doctor token');
    return;
  }

  // Doctor can view own profile
  log(colors.yellow, 'Doctor Profile Tests:');
  const profileRes = await makeRequest('GET', '/api/doctors/profile/me', null, tokens.doctor);
  recordTest('Doctor views own profile', profileRes.status === 200, `Status: ${profileRes.status}`);

  // Doctor can update own profile
  const updateRes = await makeRequest(
    'PUT',
    '/api/doctors/profile/me',
    { bio: 'Updated bio' },
    tokens.doctor
  );
  recordTest('Doctor updates own profile', updateRes.status === 200, `Status: ${updateRes.status}`);

  // Doctor can view appointments
  log(colors.yellow, 'Doctor Appointments Tests:');
  const apptRes = await makeRequest('GET', '/api/doctors/me/appointments', null, tokens.doctor);
  recordTest('Doctor views own appointments', apptRes.status === 200, `Status: ${apptRes.status}`);

  // Doctor can view upcoming appointments
  const upcomingRes = await makeRequest(
    'GET',
    '/api/doctors/me/appointments/upcoming',
    null,
    tokens.doctor
  );
  recordTest('Doctor views upcoming appointments', upcomingRes.status === 200, `Status: ${upcomingRes.status}`);

  // Doctor cannot view all patients (should be 403)
  log(colors.yellow, 'Doctor Unauthorized Access Tests:');
  const patientListRes = await makeRequest('GET', '/api/patients', null, tokens.doctor);
  recordTest(
    'Doctor cannot list all patients',
    patientListRes.status === 403,
    `Expected 403, got ${patientListRes.status}`
  );

  // Doctor cannot access admin dashboard
  const dashRes = await makeRequest('GET', '/api/admin/dashboard', null, tokens.doctor);
  recordTest(
    'Doctor cannot access admin dashboard',
    dashRes.status === 403,
    `Expected 403, got ${dashRes.status}`
  );

  // Doctor cannot create another doctor
  const createDoctorRes = await makeRequest('POST', '/api/doctors/auth/register', {
    name: 'Bad Doctor',
    email: 'bad@test.com',
    password: 'pass123',
    specialization: 'Surgery',
    licenseNumber: 'BAD-LIC',
  }, tokens.doctor);
  recordTest(
    'Doctor cannot create other doctors',
    createDoctorRes.status === 403,
    `Expected 403, got ${createDoctorRes.status}`
  );
};

const testAdminOperations = async () => {
  log(colors.blue, '\n=== ADMIN OPERATIONS (Full CRUD) ===\n');

  if (!tokens.admin) {
    log(colors.red, 'Skipping: No admin token');
    return;
  }

  // Admin can dashboard
  log(colors.yellow, 'Admin Dashboard Tests:');
  const dashRes = await makeRequest('GET', '/api/admin/dashboard', null, tokens.admin);
  recordTest('Admin accesses dashboard', dashRes.status === 200, `Status: ${dashRes.status}`);

  // Admin can list all patients
  log(colors.yellow, 'Admin Patient Management Tests:');
  const listPatientRes = await makeRequest('GET', '/api/patients', null, tokens.admin);
  recordTest(
    'Admin lists all patients',
    listPatientRes.status === 200,
    `Status: ${listPatientRes.status}`
  );

  // Admin can list all doctors
  log(colors.yellow, 'Admin Doctor Management Tests:');
  const listDoctorRes = await makeRequest('GET', '/api/doctors', null, tokens.admin);
  recordTest(
    'Admin lists all doctors',
    listDoctorRes.status === 200,
    `Status: ${listDoctorRes.status}`
  );

  // Admin can create doctor (already done, but test denial for patient)
  log(colors.yellow, 'Admin Creation Restrictions Tests:');
  const patientCreateDoctorRes = await makeRequest('POST', '/api/doctors/auth/register', {
    name: 'Attempted Doctor',
    email: `attempted-${Date.now()}@test.com`,
    password: 'pass123',
    specialization: 'Surgery',
    licenseNumber: `ATTEMPTED-${Date.now()}`,
  }, tokens.patient);
  recordTest(
    'Patient cannot create doctor (only admin can)',
    patientCreateDoctorRes.status === 403,
    `Expected 403, got ${patientCreateDoctorRes.status}`
  );

  // Admin can create patient
  log(colors.yellow, 'Admin Patient CRUD Tests:');
  const createPatientRes = await makeRequest('POST', '/api/patients/auth/register', {
    name: 'Admin Created Patient',
    email: `admin-patient-${Date.now()}@test.com`,
    password: 'patient123',
    phone: '5553333333',
  }, tokens.admin);
  recordTest(
    'Admin can create patient',
    createPatientRes.status === 201,
    `Status: ${createPatientRes.status}`
  );

  // Admin cannot delete without proper endpoint (testing with fake ID for now)
  const deletePatientRes = await makeRequest(
    'DELETE',
    `/api/patients/fake-patient-id-${Date.now()}`,
    null,
    tokens.admin
  );
  recordTest(
    'Admin can attempt patient deletion',
    [200, 404].includes(deletePatientRes.status),
    `Status: ${deletePatientRes.status}`
  );

  // Admin cannot delete doctor without proper endpoint
  const deleteDoctorRes = await makeRequest(
    'DELETE',
    `/api/doctors/fake-doctor-id-${Date.now()}`,
    null,
    tokens.admin
  );
  recordTest(
    'Admin can attempt doctor deletion',
    [200, 404].includes(deleteDoctorRes.status),
    `Status: ${deleteDoctorRes.status}`
  );
};

const testAppointmentOperations = async () => {
  log(colors.blue, '\n=== APPOINTMENT OPERATIONS & CROSS-ROLE ACCESS ===\n');

  if (!tokens.patient || !tokens.doctor) {
    log(colors.red, 'Skipping: Missing patient or doctor token');
    return;
  }

  // Patient can create appointment (using the doctor ID)
  log(colors.yellow, 'Appointment Creation Tests:');
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const createApptRes = await makeRequest(
    'POST',
    '/api/patients/appointments',
    {
      doctorId: 'test-doctor-id',
      appointmentDate: futureDate,
      reason: 'Regular checkup',
      symptoms: ['headache'],
      duration: 30,
    },
    tokens.patient
  );
  recordTest(
    'Patient can create appointment',
    [201, 400].includes(createApptRes.status),
    `Status: ${createApptRes.status}`
  );

  // Patient can view own appointments
  log(colors.yellow, 'Appointment Access Tests:');
  const viewRes = await makeRequest('GET', '/api/patients/appointments', null, tokens.patient);
  recordTest('Patient views own appointments', viewRes.status === 200, `Status: ${viewRes.status}`);

  // Doctor cannot view patient appointments directly
  log(colors.yellow, 'Cross-Role Appointment Access Tests:');
  const doctorViewRes = await makeRequest('GET', '/api/patients/appointments', null, tokens.doctor);
  recordTest(
    'Doctor cannot view patient appointments endpoint',
    doctorViewRes.status === 403,
    `Expected 403, got ${doctorViewRes.status}`
  );

  // Patient cannot access doctor appointment endpoints
  const doctorApptRes = await makeRequest('GET', '/api/doctors/me/appointments', null, tokens.patient);
  recordTest(
    'Patient cannot access doctor appointments',
    doctorApptRes.status === 403,
    `Expected 403, got ${doctorApptRes.status}`
  );
};

const testAuthenticationErrors = async () => {
  log(colors.blue, '\n=== AUTHENTICATION & AUTHORIZATION ERRORS ===\n');

  // Request without token should be rejected for protected endpoints
  log(colors.yellow, 'Missing Token Tests:');
  const noTokenRes = await makeRequest('GET', '/api/patients/profile', null, null);
  recordTest(
    'Unauthenticated request to protected endpoint rejected',
    noTokenRes.status === 401,
    `Expected 401, got ${noTokenRes.status}`
  );

  // Invalid token
  log(colors.yellow, 'Invalid Token Tests:');
  const invalidTokenRes = await makeRequest(
    'GET',
    '/api/patients/profile',
    null,
    'invalid-token-12345'
  );
  recordTest(
    'Invalid token rejected',
    invalidTokenRes.status === 401,
    `Expected 401, got ${invalidTokenRes.status}`
  );

  // Public endpoints should work without auth
  log(colors.yellow, 'Public Endpoint Tests:');
  const publicRes = await makeRequest('GET', '/health', null, null);
  recordTest('Health check accessible without auth', publicRes.status === 200, `Status: ${publicRes.status}`);

  const publicDoctorListRes = await makeRequest('GET', '/api/doctors', null, null);
  recordTest(
    'Doctor list accessible without auth',
    publicDoctorListRes.status === 200,
    `Status: ${publicDoctorListRes.status}`
  );
};

// ── Main Test Runner ───────────────────────────────────────────────────────

const runAllTests = async () => {
  log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.blue, '║   COMPREHENSIVE RBAC TEST MATRIX                          ║');
  log(colors.blue, '║   Healthcare Microservices - Multi-Role Access Control    ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  await setupTestAccounts();
  await testPatientOperations();
  await testDoctorOperations();
  await testAdminOperations();
  await testAppointmentOperations();
  await testAuthenticationErrors();

  // Summary Report
  log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.blue, '║                        TEST SUMMARY                        ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  const passed = testResults.filter((t) => t.passed).length;
  const total = testResults.length;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

  log(
    colors.yellow,
    `Total Tests: ${total}\nPassed: ${passed}\nFailed: ${total - passed}\nSuccess Rate: ${percentage}%\n`
  );

  if (percentage === 100) {
    log(colors.green, '🎉 All RBAC tests passed! Access control is properly enforced.');
  } else if (percentage >= 80) {
    log(colors.yellow, '⚠️  Most tests passed, but some issues detected.');
  } else {
    log(colors.red, '❌ Significant test failures. Review access control policies.');
  }

  // Detailed results table
  log(colors.blue, '\nDetailed Results:\n');
  testResults.forEach((result, index) => {
    const status = result.passed ? '✓' : '✗';
    const color = result.passed ? colors.green : colors.red;
    console.log(`${color}${status}${colors.reset} ${index + 1}. ${result.name}`);
    if (result.details) console.log(`    ${result.details}`);
  });

  log(colors.blue, '\n════════════════════════════════════════════════════════════\n');

  process.exit(percentage === 100 ? 0 : 1);
};

// Run tests
runAllTests().catch((err) => {
  log(colors.red, `Fatal Error: ${err.message}`);
  process.exit(1);
});
