#!/bin/bash

# Keep-Alive Loop Script
# Pings backend every 3 minutes to prevent hibernation
# This is a simple bash script that is more reliable than Node.js

BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
INTERVAL=180  # 3 minutes in seconds
LOG_FILE="/tmp/keep-alive.log"

echo "🔄 Keep-Alive Loop Started" >> $LOG_FILE
echo "📍 Backend URL: $BACKEND_URL" >> $LOG_FILE
echo "⏱️  Interval: $INTERVAL seconds (3 minutes)" >> $LOG_FILE
echo "⏰ Started at: $(date)" >> $LOG_FILE
echo "" >> $LOG_FILE

# Counter for requests
REQUEST_COUNT=0

# Function to make a request
make_request() {
  local endpoint=$1
  local label=$2
  
  RESPONSE=$(curl -s -m 10 -w "\n%{http_code}" "$BACKEND_URL$endpoint" 2>&1)
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  SIZE=${#BODY}
  
  REQUEST_COUNT=$((REQUEST_COUNT + 1))
  TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%S.000Z')
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ [$TIMESTAMP] $label #$REQUEST_COUNT (Status: $HTTP_CODE, Size: $SIZE bytes)" >> $LOG_FILE
  else
    echo "⚠️  [$TIMESTAMP] $label #$REQUEST_COUNT (Status: $HTTP_CODE)" >> $LOG_FILE
  fi
}

# Main loop
while true; do
  # Health check
  make_request "/api/health" "Health check"
  
  # Wait 30 seconds
  sleep 30
  
  # Data query
  make_request "/api/trpc/atletas.list" "Data query"
  
  # Wait for next cycle (3 minutes - 30 seconds we already waited)
  sleep $((INTERVAL - 30))
done
