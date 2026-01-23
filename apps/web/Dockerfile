# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY apps/web/package.json apps/web/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/web/ .

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1000 baara && \
    adduser -u 1000 -G baara -s /bin/sh -D baara

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Change ownership
RUN chown -R baara:baara /app

USER baara

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npm", "start"]
