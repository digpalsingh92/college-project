import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Healthcare Microservices API Gateway',
      version: '1.0.0',
      description: 'Gateway documentation for patient, doctor, admin and appointment APIs with role-based access control',
      contact: { name: 'API Support' },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local API Gateway',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token containing id, email, name, and role claims',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          security: [],
          summary: 'Gateway health check',
          responses: {
            '200': { description: 'Healthy' },
          },
        },
      },
      '/api-docs.json': {
        get: {
          tags: ['System'],
          security: [],
          summary: 'OpenAPI/Swagger specification JSON',
          responses: { '200': { description: 'OpenAPI spec' } },
        },
      },
      '/api/patients/auth/register': {
        post: {
          tags: ['Patient Auth'],
          security: [],
          summary: 'Register as patient',
          description: 'No authentication required. Public endpoint.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    phone: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Registered successfully' },
            '409': { description: 'Email already registered' },
          },
        },
      },
      '/api/patients/auth/login': {
        post: {
          tags: ['Patient Auth'],
          security: [],
          summary: 'Patient login',
          description: 'No authentication required. Public endpoint.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Authenticated successfully' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/api/patients': {
        get: {
          tags: ['Patient Management'],
          summary: 'List all patients (Admin only)',
          description: 'Required role: admin, superadmin. Retrieve paginated list of all patients.',
          responses: {
            '200': { description: 'List of patients' },
            '403': { description: 'Forbidden - insufficient permissions' },
          },
        },
      },
      '/api/patients/{id}': {
        get: {
          tags: ['Patient Management'],
          summary: 'Get patient by ID (Admin only)',
          description: 'Required role: admin, superadmin. Retrieve specific patient details.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Patient details' },
            '403': { description: 'Forbidden - insufficient permissions' },
            '404': { description: 'Patient not found' },
          },
        },
        put: {
          tags: ['Patient Management'],
          summary: 'Update patient (Admin only)',
          description: 'Required role: admin, superadmin. Update patient information.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Updated successfully' },
            '403': { description: 'Forbidden - insufficient permissions' },
          },
        },
        delete: {
          tags: ['Patient Management'],
          summary: 'Delete patient (Admin only)',
          description: 'Required role: admin, superadmin. Soft-deactivate patient account.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted successfully' },
            '403': { description: 'Forbidden - insufficient permissions' },
          },
        },
      },
      '/api/patients/profile': {
        get: {
          tags: ['Patient Profile'],
          summary: 'Get own profile',
          description: 'Required role: patient, admin, superadmin. Returns authenticated user profile.',
          responses: { '200': { description: 'Profile data' } },
        },
        put: {
          tags: ['Patient Profile'],
          summary: 'Update own profile',
          description: 'Required role: patient, admin, superadmin. Update your own profile.',
          responses: { '200': { description: 'Updated successfully' } },
        },
      },
      '/api/patients/appointments': {
        post: {
          tags: ['Appointments'],
          summary: 'Create appointment',
          description: 'Required role: patient. Book an appointment with a doctor.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['doctorId', 'appointmentDate'],
                  properties: {
                    doctorId: { type: 'string' },
                    appointmentDate: { type: 'string', format: 'date-time' },
                    reason: { type: 'string' },
                    symptoms: { type: 'array', items: { type: 'string' } },
                    duration: { type: 'integer', default: 30 },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Appointment created' }, '403': { description: 'Forbidden' } },
        },
        get: {
          tags: ['Appointments'],
          summary: 'List patient appointments',
          description: 'Required role: patient, admin, superadmin. Get all appointments for the patient.',
          responses: { '200': { description: 'List of appointments' }, '403': { description: 'Forbidden' } },
        },
      },
      '/api/patients/appointments/{appointmentId}': {
        get: {
          tags: ['Appointments'],
          summary: 'Get appointment details',
          description: 'Required role: patient, admin, superadmin. Retrieve specific appointment.',
          parameters: [{ name: 'appointmentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Appointment details' }, '403': { description: 'Forbidden' } },
        },
        put: {
          tags: ['Appointments'],
          summary: 'Update appointment status',
          description: 'Required role: patient, admin, superadmin. Modify appointment status.',
          parameters: [{ name: 'appointmentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Updated' }, '403': { description: 'Forbidden' } },
        },
        delete: {
          tags: ['Appointments'],
          summary: 'Cancel appointment',
          description: 'Required role: patient, admin, superadmin. Cancel the appointment.',
          parameters: [{ name: 'appointmentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Cancelled' }, '403': { description: 'Forbidden' } },
        },
      },
      '/api/doctors/auth/register': {
        post: {
          tags: ['Doctor Auth'],
          summary: 'Register doctor (Admin only)',
          description: 'Required role: admin, superadmin. Create a new doctor account. Patients cannot register as doctors directly.',
          security: [{ bearerAuth: [] }],
          responses: { '201': { description: 'Registered' }, '403': { description: 'Only admins can create doctors' } },
        },
      },
      '/api/doctors/auth/login': {
        post: {
          tags: ['Doctor Auth'],
          security: [],
          summary: 'Doctor login',
          description: 'No authentication required. Public endpoint.',
          responses: { '200': { description: 'Authenticated' } },
        },
      },
      '/api/doctors': {
        get: {
          tags: ['Doctor Directory'],
          security: [],
          summary: 'List all doctors (Public)',
          description: 'No authentication required. Browse available doctors.',
          responses: { '200': { description: 'List of doctors' } },
        },
      },
      '/api/doctors/{id}': {
        get: {
          tags: ['Doctor Management'],
          summary: 'Get doctor by ID (Admin only)',
          description: 'Required role: admin, superadmin. Retrieve specific doctor details.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Doctor details' },
            '403': { description: 'Forbidden' },
          },
        },
        put: {
          tags: ['Doctor Management'],
          summary: 'Update doctor (Admin only)',
          description: 'Required role: admin, superadmin. Modify doctor information.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Updated' },
            '403': { description: 'Forbidden' },
          },
        },
        delete: {
          tags: ['Doctor Management'],
          summary: 'Delete doctor (Admin only)',
          description: 'Required role: admin, superadmin. Deactivate doctor account.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/api/doctors/profile/me': {
        get: {
          tags: ['Doctor Profile'],
          summary: 'Get own profile',
          description: 'Required role: doctor, admin, superadmin. Get your doctor profile.',
          responses: { '200': { description: 'Profile data' } },
        },
        put: {
          tags: ['Doctor Profile'],
          summary: 'Update own profile',
          description: 'Required role: doctor, admin, superadmin. Update your profile.',
          responses: { '200': { description: 'Updated' } },
        },
      },
      '/api/doctors/me/appointments': {
        get: {
          tags: ['Doctor Appointments'],
          summary: 'List my appointments',
          description: 'Required role: doctor. Get all your appointments.',
          responses: { '200': { description: 'Appointments list' } },
        },
      },
      '/api/doctors/me/appointments/upcoming': {
        get: {
          tags: ['Doctor Appointments'],
          summary: 'List upcoming appointments',
          description: 'Required role: doctor. Get upcoming appointments only.',
          responses: { '200': { description: 'Upcoming appointments' } },
        },
      },
      '/api/doctors/appointments/{appointmentId}/notes': {
        put: {
          tags: ['Doctor Appointments'],
          summary: 'Add doctor notes',
          description: 'Required role: doctor. Add clinical notes and prescriptions to appointment.',
          parameters: [{ name: 'appointmentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Updated' }, '403': { description: 'Forbidden' } },
        },
      },
      '/api/admin/auth/login': {
        post: {
          tags: ['Admin Auth'],
          security: [],
          summary: 'Admin login',
          description: 'No authentication required. Public endpoint for admin login.',
          responses: { '200': { description: 'Authenticated' } },
        },
      },
      '/api/admin/dashboard': {
        get: {
          tags: ['Admin Dashboard'],
          summary: 'Dashboard statistics',
          description: 'Required role: admin, superadmin. Get system statistics.',
          responses: { '200': { description: 'Dashboard data' }, '403': { description: 'Forbidden' } },
        },
      },
      '/api/admin/doctors': {
        get: {
          tags: ['Admin - Doctor Management'],
          summary: 'List all doctors',
          description: 'Required role: admin, superadmin. Retrieve all doctors from admin service.',
          responses: { '200': { description: 'Doctors list' }, '403': { description: 'Forbidden' } },
        },
        post: {
          tags: ['Admin - Doctor Management'],
          summary: 'Create doctor',
          description: 'Required role: admin, superadmin. Create new doctor account via admin-service.',
          responses: { '201': { description: 'Created' }, '403': { description: 'Forbidden' } },
        },
      },
      '/api/admin/doctors/{id}': {
        get: {
          tags: ['Admin - Doctor Management'],
          summary: 'Get doctor details',
          description: 'Required role: admin, superadmin.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Doctor details' }, '403': { description: 'Forbidden' } },
        },
        put: {
          tags: ['Admin - Doctor Management'],
          summary: 'Update doctor',
          description: 'Required role: admin, superadmin.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Updated' }, '403': { description: 'Forbidden' } },
        },
        delete: {
          tags: ['Admin - Doctor Management'],
          summary: 'Delete doctor',
          description: 'Required role: admin, superadmin.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' }, '403': { description: 'Forbidden' } },
        },
      },
      '/api/admin/patients': {
        get: {
          tags: ['Admin - Patient Management'],
          summary: 'List all patients',
          description: 'Required role: admin, superadmin. Retrieve all patients from admin service.',
          responses: { '200': { description: 'Patients list' }, '403': { description: 'Forbidden' } },
        },
        post: {
          tags: ['Admin - Patient Management'],
          summary: 'Create patient',
          description: 'Required role: admin, superadmin. Create new patient account via admin-service.',
          responses: { '201': { description: 'Created' }, '403': { description: 'Forbidden' } },
        },
      },
      '/api/admin/patients/{id}': {
        get: {
          tags: ['Admin - Patient Management'],
          summary: 'Get patient details',
          description: 'Required role: admin, superadmin.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Patient details' }, '403': { description: 'Forbidden' } },
        },
        put: {
          tags: ['Admin - Patient Management'],
          summary: 'Update patient',
          description: 'Required role: admin, superadmin.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Updated' }, '403': { description: 'Forbidden' } },
        },
        delete: {
          tags: ['Admin - Patient Management'],
          summary: 'Delete patient',
          description: 'Required role: admin, superadmin.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' }, '403': { description: 'Forbidden' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
