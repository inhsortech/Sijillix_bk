# DocuTrack Saudi Backend

## Run with Docker (recommended)

Requirements: Docker Desktop (or Docker Engine) with the Compose plugin.

1. Copy `.env.example` to `.env`.
   - PowerShell: `Copy-Item .env.example .env`
   - macOS/Linux: `cp .env.example .env`
2. Edit `.env`. Set a unique URL-safe `MONGO_ROOT_PASSWORD` (letters, numbers, and hyphens), a `JWT_SECRET` with at least 32 characters, and the correct `FRONTEND_URL`. The example values are for local development only.
3. Start the API and MongoDB: `docker compose up --build -d`
4. Check the API at `http://localhost:5000/api/health` and view logs with `docker compose logs -f app`.

Compose starts MongoDB before the API, waits for MongoDB's health check, and persists database data and private uploads in named volumes.

Useful commands:
- Stop the services: `docker compose down`
- Stop and delete database/upload data: `docker compose down -v` (destructive)
- Rebuild after code or dependency changes: `docker compose up --build -d`

The optional admin seeder runs inside the app container using the `SUPER_ADMIN_*` values in `.env`: `docker compose exec app npm run seed:admin`. Set a strong admin password before running it. For users belonging to an organization, provision them through a trusted workflow and use a valid organization ObjectId.

## Run locally without Docker

Requirements: Node.js 18+ and a reachable MongoDB instance.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure `MONGO_URI`, `JWT_SECRET` (32+ characters), and `FRONTEND_URL`.
3. Start the API: `npm run dev`

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
