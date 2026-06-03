# syntax=docker/dockerfile:1
# ════════════════════════════════════════════════════════════════════
#  Groq Medical AI Service – Production Dockerfile (Day 17)
#  Multi-stage build for minimal image size and fast cold starts.
#  Stage 1: builder  – installs all Python dependencies
#  Stage 2: runtime  – lean image with only what's needed to run
# ════════════════════════════════════════════════════════════════════

# ── Stage 1: Build dependencies ─────────────────────────────────────
FROM python:3.11-slim AS builder

# System deps needed to build some packages (chromadb, numpy, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy requirements first (Docker layer caching — only reinstall on change)
COPY requirements.txt .

# Install all Python packages into a dedicated prefix for easy copying
RUN pip install --upgrade pip && \
    pip install --prefix=/install --no-cache-dir -r requirements.txt


# ── Stage 2: Runtime image ───────────────────────────────────────────
FROM python:3.11-slim AS runtime

# Environment hardening
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PATH="/install/bin:$PATH"

# Only curl needed at runtime (for HEALTHCHECK)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1001 appgroup && \
    useradd  --uid 1001 --gid appgroup --shell /bin/bash --create-home appuser

WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /install /usr/local

# Copy application source code
COPY --chown=appuser:appgroup app/ ./app/

# Create persistent volume directories with correct ownership
RUN mkdir -p /app/chroma_data /app/logs && \
    chown -R appuser:appgroup /app/chroma_data /app/logs

# Switch to non-root user
USER appuser

# Expose service port
EXPOSE 8000

# ── Health Check ─────────────────────────────────────────────────────
# Wait 20s on first start (model loading), probe every 30s thereafter
HEALTHCHECK \
    --interval=30s \
    --timeout=15s \
    --start-period=60s \
    --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# ── Startup command ──────────────────────────────────────────────────
# Production: no --reload, multiple workers via uvicorn[standard]
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--log-level", "info", \
     "--access-log"]
