FROM node:20-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile --filter ./apps/web...

COPY apps/web apps/web

RUN pnpm --dir apps/web build

FROM nginx:1.27-alpine

COPY apps/web/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
