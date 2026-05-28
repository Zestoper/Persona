# ── Build stage ──────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# 빌드 시 환경변수 주입 (vite는 빌드 타임에 VITE_ 변수를 번들에 포함)
ARG VITE_API_URL=http://localhost:8000/api/v1
ARG VITE_WS_URL=ws://localhost:8000/api/v1
ARG VITE_BACKEND_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

COPY package*.json .
RUN npm ci

COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# React Router를 위한 nginx 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
