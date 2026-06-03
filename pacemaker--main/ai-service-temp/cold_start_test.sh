#!/usr/bin/env bash
# cold_start_test.sh — Day 17: Test Docker cold start time
# Measures time from container start to first successful /health response
# Usage: bash cold_start_test.sh

set -euo pipefail

SERVICE_URL="http://localhost:8000/health"
TIMEOUT_SECS=120
POLL_INTERVAL=2

echo ""
echo "══════════════════════════════════════════════════════"
echo "  Cold Start Test — Groq AI Service (Day 17)"
echo "══════════════════════════════════════════════════════"
echo ""

# Step 1: Remove existing container if any
echo "[1/4] Stopping and removing existing containers..."
docker compose down --remove-orphans 2>/dev/null || true

# Step 2: Record start time and bring up services
echo "[2/4] Starting services (docker compose up --build)..."
START_TIME=$(date +%s%3N)  # milliseconds
docker compose up -d --build

# Step 3: Poll /health until ready
echo "[3/4] Waiting for service to become healthy..."
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT_SECS ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL" 2>/dev/null || echo "000")
    NOW=$(date +%s%3N)
    COLD_START_MS=$((NOW - START_TIME))

    if [ "$HTTP_CODE" = "200" ]; then
        COLD_START_S=$(echo "scale=1; $COLD_START_MS / 1000" | bc)
        echo ""
        echo "══════════════════════════════════════════════════════"
        echo "  ✅ Service READY!"
        echo "  Cold start time: ${COLD_START_S}s (${COLD_START_MS}ms)"
        if [ $COLD_START_MS -le 30000 ]; then
            echo "  🎉 TARGET MET: < 30s cold start"
        else
            echo "  ⚠️  TARGET MISSED: > 30s (target is <30s)"
        fi
        echo "══════════════════════════════════════════════════════"
        break
    fi

    echo "  ... waiting (${ELAPSED}s elapsed, HTTP status: $HTTP_CODE)"
    sleep $POLL_INTERVAL
    ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

if [ $ELAPSED -ge $TIMEOUT_SECS ]; then
    echo "❌ TIMEOUT: Service did not become healthy within ${TIMEOUT_SECS}s"
    echo "   Check logs with: docker compose logs ai-service"
    exit 1
fi

# Step 4: Show health response
echo ""
echo "[4/4] Health check response:"
curl -s "$SERVICE_URL" | python3 -m json.tool
echo ""
