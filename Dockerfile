FROM node:22-bookworm-slim AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    WP_PORT=3001 \
    SERVE_FRONTEND=true \
    BOT_DATA_DIR=/app/data

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server ./server
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data /app/auth_info_baileys \
    && chown -R node:node /app/data /app/auth_info_baileys

USER node
VOLUME ["/app/data", "/app/auth_info_baileys"]
EXPOSE 3000

CMD ["node", "server/wp-server.js"]
