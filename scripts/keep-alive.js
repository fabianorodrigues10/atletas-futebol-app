#!/usr/bin/env node

/**
 * Keep-Alive Script
 * 
 * This script prevents the backend from hibernating by making periodic requests
 * to the API every 10 minutes. This ensures the app is always responsive.
 * 
 * Usage: node scripts/keep-alive.js
 */

const http = require('http');
const https = require('https');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const HEALTH_CHECK_ENDPOINT = '/api/health';

console.log(`🔄 Keep-Alive Script Started`);
console.log(`📍 Backend URL: ${BACKEND_URL}`);
console.log(`⏱️  Check interval: ${INTERVAL_MS / 1000 / 60} minutes`);
console.log(`📡 Endpoint: ${HEALTH_CHECK_ENDPOINT}`);
console.log('');

/**
 * Make a health check request to keep the app alive
 */
function keepAlive() {
  const url = `${BACKEND_URL}${HEALTH_CHECK_ENDPOINT}`;
  const client = url.startsWith('https') ? https : http;

  client
    .get(url, (res) => {
      const timestamp = new Date().toISOString();
      console.log(`✅ [${timestamp}] Keep-alive ping successful (Status: ${res.statusCode})`);
    })
    .on('error', (error) => {
      const timestamp = new Date().toISOString();
      console.error(`❌ [${timestamp}] Keep-alive ping failed:`, error.message);
    });
}

// Make first request immediately
keepAlive();

// Schedule periodic requests
setInterval(keepAlive, INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Keep-Alive Script Stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Keep-Alive Script Stopped');
  process.exit(0);
});
