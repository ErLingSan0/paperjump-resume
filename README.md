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
