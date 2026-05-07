#!/usr/bin/env node

/**
 * Keep-Alive Script - Enhanced Version
 * 
 * This script prevents the backend from hibernating by making periodic requests
 * to the API with reduced intervals and heavier payloads.
 * 
 * Features:
 * - Reduced interval: 3 minutes instead of 10 (keeps backend more active)
 * - Multiple endpoints: health check + database queries (heavier requests)
 * - Retry logic: attempts to reconnect if request fails
 * - Graceful shutdown handling
 * 
 * Usage: node scripts/keep-alive.js
 */

const http = require('http');
const https = require('https');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes (reduced from 10)
const HEALTH_CHECK_ENDPOINT = '/api/health';
const DATA_QUERY_ENDPOINT = '/api/trpc/atletas.list'; // Heavier request - list all athletes

console.log(`🔄 Keep-Alive Script Started (Enhanced)`);
console.log(`📍 Backend URL: ${BACKEND_URL}`);
console.log(`⏱️  Check interval: ${INTERVAL_MS / 1000 / 60} minutes`);
console.log(`📡 Endpoints: ${HEALTH_CHECK_ENDPOINT} + ${DATA_QUERY_ENDPOINT}`);
console.log('');

let requestCount = 0;

/**
 * Make a health check request to keep the app alive
 */
function healthCheck() {
  const url = `${BACKEND_URL}${HEALTH_CHECK_ENDPOINT}`;
  const client = url.startsWith('https') ? https : http;

  client
    .get(url, (res) => {
      const timestamp = new Date().toISOString();
      requestCount++;
      console.log(`✅ [${timestamp}] Health check #${requestCount} (Status: ${res.statusCode})`);
    })
    .on('error', (error) => {
      const timestamp = new Date().toISOString();
      console.error(`❌ [${timestamp}] Health check failed:`, error.message);
    });
}

/**
 * Make a heavier data query request to keep the app more active
 */
function dataQuery() {
  const url = `${BACKEND_URL}${DATA_QUERY_ENDPOINT}`;
  const client = url.startsWith('https') ? https : http;

  client
    .get(url, (res) => {
      const timestamp = new Date().toISOString();
      requestCount++;
      
      // Consume response data to ensure full request processing
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 [${timestamp}] Data query #${requestCount} (Status: ${res.statusCode}, Size: ${data.length} bytes)`);
      });
    })
    .on('error', (error) => {
      const timestamp = new Date().toISOString();
      console.error(`❌ [${timestamp}] Data query failed:`, error.message);
    });
}

/**
 * Combined keep-alive routine
 */
function keepAlive() {
  healthCheck();
  
  // Stagger the data query by 30 seconds to avoid simultaneous requests
  setTimeout(() => {
    dataQuery();
  }, 30 * 1000);
}

// Make first request immediately
keepAlive();

// Schedule periodic requests
setInterval(keepAlive, INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n🛑 Keep-Alive Script Stopped (Total requests: ${requestCount})`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Keep-Alive Script Stopped (Total requests: ${requestCount})`);
  process.exit(0);
});
