# syntax=docker/dockerfile:1

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat git
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then \
    echo "Installing dependencies..." && \
    npm install --legacy-peer-deps; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Get git information and set environment variables
RUN \
  if [ -d .git ]; then \
    echo "Git repository found, getting information..." && \
    BRANCH=$(git rev-parse --abbrev-ref HEAD); \
    COMMIT=$(git rev-parse --short HEAD); \
    BUILD_TIME=$(date +%Y-%m-%d_%H-%M-%S); \
    echo "NEXT_PUBLIC_GIT_BRANCH=$BRANCH" >> .env; \
    echo "NEXT_PUBLIC_GIT_COMMIT=$COMMIT" >> .env; \
    echo "NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME" >> .env; \
    echo "Building from branch: $BRANCH, commit: $COMMIT, time: $BUILD_TIME"; \
  else \
    echo "No git repository found, setting defaults..." && \
    echo "NEXT_PUBLIC_GIT_BRANCH=unknown" >> .env; \
    echo "NEXT_PUBLIC_GIT_COMMIT=unknown" >> .env; \
    echo "NEXT_PUBLIC_BUILD_TIME=$(date +%Y-%m-%d_%H-%M-%S)" >> .env; \
  fi

# Add environment variables at build time
ENV NEXT_PUBLIC_TRACEGRID_API_URL=https://api.dev.tracegrid.com
ENV NEXT_PUBLIC_APP_URL=http://tracegrid.vcoolify.dev.tracegrid.com
ENV NEXT_PUBLIC_SITE_URL=http://tracegrid.vcoolify.dev.tracegrid.com

# Next.js collects anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED=1

# Debug: List files to verify content
RUN echo "Listing directory contents:" && ls -la

# Debug: Check next.config.js content
RUN echo "Checking next.config.js:" && if [ -f next.config.js ]; then cat next.config.js; fi

# Debug: Check .env content
RUN echo "Checking .env content:" && if [ -f .env ]; then cat .env; fi

# Try to build with more verbose output
RUN \
  echo "Starting build process..." && \
  if [ -f package-lock.json ]; then \
    echo "Running npm build..." && \
    npm run build || (echo "Build failed, retrying with verbose output..." && npm run build --verbose); \
  else \
    echo "Lockfile not found." && exit 1; \
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
CMD sh -c "pm2 ping && pm2-runtime start pm2.config.js"