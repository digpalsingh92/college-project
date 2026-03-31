# Server Microservices

This folder contains TypeScript microservices running on Node.js for:

- `admin`
- `patient`
- `doctor`
- `gateway`

## Setup

From this `server` folder:

```bash
npm install
```

## Run a service in development

```bash
npm run dev:gateway
npm run dev:admin
npm run dev:patient
npm run dev:doctor
```

## Run all services together in development

```bash
npm run dev:all
```

## Run a service in production mode

```bash
npm run start:gateway
npm run start:admin
npm run start:patient
npm run start:doctor
```

## Run all services together in production mode

```bash
npm run start:all
```

## API Gateway Routes

- Gateway health: `/health`
- Admin via gateway: `/api/v1/admin`
- Patient via gateway: `/api/v1/patient`
- Doctor via gateway: `/api/v1/doctor`

Each service includes:

- Express server
- Health route at `/health`
- Base route at `/api/v1/<service-name>`
