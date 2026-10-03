FROM oven/bun:1.4.2 AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build:frontend

FROM oven/bun:1.4.2 AS runtime
WORKDIR /app/frontend
COPY --from=build /app/frontend/dist ./dist
COPY frontend/server.ts ./server.ts
ENV NODE_ENV=production
EXPOSE 8080
USER bun
CMD ["bun", "server.ts"]
