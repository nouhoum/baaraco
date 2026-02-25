# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Copy go mod files first for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/worker ./apps/worker/cmd/worker

# Runtime stage
FROM alpine:3.19

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user
RUN addgroup -g 1000 baara && \
    adduser -u 1000 -G baara -s /bin/sh -D baara

# Copy binary from builder
COPY --from=builder /app/bin/worker /app/worker

# Change ownership
RUN chown -R baara:baara /app

USER baara

ENTRYPOINT ["/app/worker"]
