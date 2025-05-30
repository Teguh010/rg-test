# syntax=docker/dockerfile:1

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm install --legacy-peer-deps; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY .env .env

# Get git information and set environment variables
ARG GIT_BRANCH=unknown
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown

ENV NEXT_PUBLIC_GIT_BRANCH=$GIT_BRANCH
ENV NEXT_PUBLIC_GIT_COMMIT=$GIT_COMMIT
ENV NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME

RUN echo "NEXT_PUBLIC_GIT_BRANCH=$GIT_BRANCH" >> .env && \
    echo "NEXT_PUBLIC_GIT_COMMIT=$GIT_COMMIT" >> .env && \
    echo "NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME" >> .env

# Next.js collects anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED=1

# Debug: List files to verify content
RUN ls -la

# Debug: Check next.config.js content
RUN if [ -f next.config.js ]; then cat next.config.js; fi

# Try to build with more verbose output
RUN \
  if [ -f package-lock.json ]; then npm run build || (echo "Build failed" && npm run build --verbose); \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# For Coolify health checks
RUN apk add --no-cache curl

# Setup PM2
RUN npm install -g pm2
RUN pm2 install pm2-logrotate
RUN pm2 update

# Copy necessary files for running the application
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy the built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/pm2.config.js ./pm2.config.js

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the server
#CMD ["npm", "start"]
CMD sh -c "pm2 ping && pm2-runtime start pm2.config.js"
