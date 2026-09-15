# =========================
# Build stage
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# 1️⃣ Install dependencies separately (better caching)
COPY package.json package-lock.json ./

# Use npm cache mount (BuildKit optimization)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --progress=false

# 2️⃣ Copy source only after deps installed
COPY . .

# 3️⃣ Build production bundle
RUN npm run build


# =========================
# Runtime stage
# =========================
FROM nginx:stable-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build output
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
