# Resume Studio

Local-first full-stack scaffold for building a resume platform inspired by products like LaoYu JianLi, but using a modern stack:

- Frontend: Umi 4 (`@umijs/max`) + Ant Design 5 + TypeScript
- Backend: Spring Boot 3.5 + Java 17 + Maven
- Local infra: MySQL 8 + Redis 7 via Docker Compose

## Repository Structure

```text
.
├── apps
│   ├── api     # Spring Boot backend
│   └── web     # Umi 4 frontend
├── infra       # Local development infrastructure
└── docs        # Project notes and planning
```

## First-Time Setup

1. Install frontend dependencies:

   ```bash
   pnpm web:install
   ```

2. Start local infrastructure:

   ```bash
   pnpm infra:up
   ```

3. Start the backend:

   ```bash
   pnpm api:dev
   ```

4. Start the frontend in another terminal:

   ```bash
   pnpm web:dev
   ```

## Default Local URLs

- Frontend: `http://localhost:8000`
- Backend: `http://localhost:8080`
- Backend system info: `http://localhost:8080/api/system/info`
- Actuator health: `http://localhost:8080/actuator/health`

## Local Credentials

The Docker Compose file exposes these defaults:

- MySQL database: `resume_platform`
- MySQL user: `resume`
- MySQL password: `resume123`
- Redis: no password in local development

You can override them with shell env vars based on [`.env.example`](/Users/zhufeng/Desktop/wh/.env.example).

## Suggested Next Steps

1. Add authentication and session strategy.
2. Model resume, template, and user domain modules in the backend.
3. Build the resume editor, template marketplace, and publish/share flows.
4. Add file/object storage integration for avatar uploads and exported assets.

## Production Deployment

The repository now includes a production-oriented Docker setup:

- [`apps/web/Dockerfile`](/Users/zhufeng/Desktop/wh/apps/web/Dockerfile): builds the frontend and serves it with Nginx
- [`apps/web/nginx/default.conf`](/Users/zhufeng/Desktop/wh/apps/web/nginx/default.conf): serves the SPA and proxies `/api` to the backend
- [`apps/api/Dockerfile`](/Users/zhufeng/Desktop/wh/apps/api/Dockerfile): packages the Spring Boot API into a runnable image
- [`infra/docker-compose.prod.yml`](/Users/zhufeng/Desktop/wh/infra/docker-compose.prod.yml): starts MySQL, Redis, API, and Web for production-like deployment

### Example server workflow

1. Copy the example environment file:

   ```bash
   cp infra/.env.prod.example infra/.env.prod
   ```

2. Adjust database passwords and allowed origins in `infra/.env.prod`.

3. Start the production stack:

   ```bash
   docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --build
   ```

4. Check running services:

   ```bash
   docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml ps
   docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml logs -f
   ```

## Automatic Deployment

The repository includes a production deploy script and a GitHub Actions workflow:

- [`infra/scripts/deploy-prod.sh`](/Users/zhufeng/Desktop/wh/infra/scripts/deploy-prod.sh): updates the server checkout, rebuilds the production stack, and waits for the site health check to pass
- [`.github/workflows/deploy-prod.yml`](/Users/zhufeng/Desktop/wh/.github/workflows/deploy-prod.yml): triggers the production deploy on every push to `main` or by manual workflow dispatch

### One-time server preparation

1. Clone the repository onto the server and make sure `main` is the branch used for production.
2. Create `infra/.env.prod` from [`.env.prod.example`](/Users/zhufeng/Desktop/wh/infra/.env.prod.example) and fill in the production passwords and origin.
3. Verify the server can run `docker compose`.
4. Verify the server checkout can pull from GitHub with SSH:

   ```bash
   ssh -T git@github.com
   ```

### GitHub repository settings

Add these **Actions secrets** in the GitHub repository:

- `PROD_HOST`: production server IP or hostname
- `PROD_PORT`: optional SSH port, default is `22`
- `PROD_USER`: SSH login user, for example `root`
- `PROD_SSH_KEY`: the private key that GitHub Actions should use to SSH into the production server

Add this **Actions variable** if your project directory on the server is not the default:

- `PROD_PROJECT_DIR`: defaults to `/root/paperjump-resume`

### How deployment runs

1. Push code to `main`
2. GitHub Actions opens an SSH session to the server
3. The workflow resets the server checkout to `origin/main`
4. The server runs [`deploy-prod.sh`](/Users/zhufeng/Desktop/wh/infra/scripts/deploy-prod.sh)
5. The script rebuilds the containers and checks `http://127.0.0.1/api/system/info`

### Manual production deploy

You can still trigger a deploy manually on the server:

```bash
cd /root/paperjump-resume
chmod +x infra/scripts/deploy-prod.sh
./infra/scripts/deploy-prod.sh
```
