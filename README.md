# DocuTrack Saudi Backend

## Requirements
- Node.js 18+
- MongoDB running locally or a MongoDB connection string

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and set `MONGO_URI`, `JWT_SECRET` (32+ characters), and `CLIENT_URL`.
3. Provision a user in MongoDB using a one-off script or trusted admin workflow. Store the password as a bcrypt hash and set `organizationId` to a valid MongoDB ObjectId.
4. `npm run dev`

Health check: `GET http://localhost:5000/api/health`

## API
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST /api/organizations`
- `PUT /api/organizations/:id` (update organization details)
- `PATCH /api/organizations/:id/status`
- `GET/POST /api/employees`
- `GET/POST /api/documents`
- `PATCH /api/documents/:id/status`
- `GET/POST /api/tasks`
- `PATCH /api/tasks/:id`
- `GET /api/dashboard`

All routes other than health and login require `Authorization: Bearer <token>`.

## Security notes
Starter project only. Before production, add schema validation, file signature inspection and malware scanning, protected download endpoints, MFA, tested tenant isolation, backup/retention controls, and a secure user-provisioning flow. Do not expose `private_uploads` publicly. Review applicable Saudi PDPL requirements before storing personal data.
