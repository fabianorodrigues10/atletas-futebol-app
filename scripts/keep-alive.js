#!/usr/bin/env node

/**
 * Keep-Alive Script - Reliable Version
 * 
 * This script prevents the backend from hibernating by making periodic requests
 * to the API every 3 minutes. It includes:
 * - Better error handling
 * - Process restart on failure
 * - Detailed logging
 * - Graceful shutdown
 * 
 * Usage: node scripts/keep-alive.js
 * Background: nohup node scripts/keep-alive.js > /tmp/keep-alive.log 2>&1 &
 */

const http = require('http');
const https = require('https');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const HEALTH_CHECK_ENDPOINT = '/api/health';
const DATA_QUERY_ENDPOINT = '/api/trpc/atletas.list';

let requestCount = 0;
let lastSuccessTime = new Date();
let intervalId = null;

console.log(`🔄 Keep-Alive Script Started`);
console.log(`📍 Backend URL: ${BACKEND_URL}`);
console.log(`⏱️  Check interval: ${INTERVAL_MS / 1000 / 60} minutes`);
console.log(`📡 Endpoints: ${HEALTH_CHECK_ENDPOINT} + ${DATA_QUERY_ENDPOINT}`);
console.log(`⏰ Started at: ${new Date().toISOString()}`);
console.log('');

/**
 * Make a request with timeout
 */
function makeRequest(endpoint, label) {
  return new Promise((resolve) => {
    const url = `${BACKEND_URL}${endpoint}`;
    const client = url.startsWith('https') ? https : http;
    const timeout = 10000; // 10 second timeout

    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const timestamp = new Date().toISOString();
        requestCount++;
        lastSuccessTime = new Date();
        
        if (res.statusCode === 200) {
          console.log(`✅ [${timestamp}] ${label} #${requestCount} (Status: ${res.statusCode}, Size: ${data.length} bytes)`);
        } else {
          console.warn(`⚠️  [${timestamp}] ${label} #${requestCount} (Status: ${res.statusCode})`);
        }
        
        resolve(true);
      });
    });

    req.on('error', (error) => {
      const timestamp = new Date().toISOString();
      console.error(`❌ [${timestamp}] ${label} failed: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      const timestamp = new Date().toISOString();
      console.error(`⏱️  [${timestamp}] ${label} timeout (10s)`);
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Main keep-alive routine
 */
async function keepAlive() {
  try {
    // Make health check
    await makeRequest(HEALTH_CHECK_ENDPOINT, 'Health check');
    
    // Wait 30 seconds before data query
    await new Promise(resolve => setTimeout(resolve, 30 * 1000));
    
    // Make data query
    await makeRequest(DATA_QUERY_ENDPOINT, 'Data query');
  } catch (error) {
    console.error(`❌ Keep-alive error: ${error.message}`);
  }
}

/**
 * Start the keep-alive loop
 */
function startKeepAlive() {
  // Make first request immediately
  keepAlive();
  
  // Schedule periodic requests
  intervalId = setInterval(() => {
    keepAlive();
  }, INTERVAL_MS);
  
  console.log(`✅ Keep-alive loop started (interval: ${INTERVAL_MS / 1000 / 60} minutes)`);
}

/**
 * Graceful shutdown
 */
function shutdown(signal) {
  console.log(`\n🛑 Keep-Alive Script Stopped (Signal: ${signal})`);
  console.log(`📊 Total requests: ${requestCount}`);
  console.log(`⏰ Last success: ${lastSuccessTime.toISOString()}`);
  
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  process.exit(0);
}

// Handle signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`❌ Uncaught exception: ${error.message}`);
  console.error(error.stack);
  // Continue running instead of crashing
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(`❌ Unhandled rejection: ${reason}`);
  // Continue running instead of crashing
});

// Start the keep-alive loop
startKeepAlive();

// Log status every hour
setInterval(() => {
  const uptime = Math.floor((new Date() - lastSuccessTime) / 1000 / 60);
  console.log(`📈 Status: ${requestCount} requests, last success ${uptime}m ago`);
}, 60 * 60 * 1000);
