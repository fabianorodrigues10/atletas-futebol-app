#!/bin/bash

# Watchdog Script
# Monitors the keep-alive-loop.sh script and restarts it if it dies
# This ensures the backend never hibernates

KEEP_ALIVE_SCRIPT="/home/ubuntu/atletas_futebol_app/scripts/keep-alive-loop.sh"
LOG_FILE="/tmp/watchdog.log"
CHECK_INTERVAL=30  # Check every 30 seconds

echo "🐕 Watchdog Started" >> $LOG_FILE
echo "📍 Monitoring: $KEEP_ALIVE_SCRIPT" >> $LOG_FILE
echo "⏱️  Check interval: $CHECK_INTERVAL seconds" >> $LOG_FILE
echo "⏰ Started at: $(date)" >> $LOG_FILE
echo "" >> $LOG_FILE

while true; do
  # Check if keep-alive-loop.sh is running
  if ! pgrep -f "bash.*keep-alive-loop.sh" > /dev/null; then
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "❌ [$TIMESTAMP] Keep-alive process died! Restarting..." >> $LOG_FILE
    
    # Kill any orphaned processes
    pkill -f "keep-alive-loop.sh" 2>/dev/null
    sleep 2
    
    # Restart keep-alive
    cd /home/ubuntu/atletas_futebol_app
    nohup bash scripts/keep-alive-loop.sh >> /tmp/keep-alive.log 2>&1 &
    
    echo "✅ [$TIMESTAMP] Keep-alive restarted (PID: $!)" >> $LOG_FILE
  fi
  
  # Sleep before next check
  sleep $CHECK_INTERVAL
done
