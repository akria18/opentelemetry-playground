# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# OpenTelemetry Collector download stage
FROM alpine:3.19 AS otelcol-downloader

# Install curl and ca-certificates for downloading
RUN apk add --no-cache curl ca-certificates

# Download otelcol binary (contrib version for more components)
# Using otelcol-contrib which includes all standard receivers, processors, exporters
ARG OTELCOL_VERSION=0.142.0
ARG TARGETARCH=amd64

RUN curl -fsSL "https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v${OTELCOL_VERSION}/otelcol-contrib_${OTELCOL_VERSION}_linux_${TARGETARCH}.tar.gz" \
    | tar -xzf - -C /tmp \
    && chmod +x /tmp/otelcol-contrib \
    && mv /tmp/otelcol-contrib /usr/local/bin/otelcol

# Verify the binary works
RUN /usr/local/bin/otelcol --version

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install required runtime dependencies for otelcol
RUN apk add --no-cache \
    ca-certificates \
    libc6-compat \
    libgcc \
    libstdc++

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Install pnpm for production
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy otelcol binary from downloader stage
COPY --from=otelcol-downloader /usr/local/bin/otelcol /usr/local/bin/otelcol

# Verify otelcol is accessible
RUN /usr/local/bin/otelcol --version

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/dist ./dist

# Create temp directory for validation files
RUN mkdir -p /tmp/otel-validator && chown appuser:nodejs /tmp/otel-validator

# Set ownership
RUN chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV OTELCOL_PATH=/usr/local/bin/otelcol

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "dist/index.js"]
