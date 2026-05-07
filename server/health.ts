import type { Express } from 'express';

/**
 * Health Check Endpoint
 * 
 * Simple endpoint that returns 200 OK to indicate the server is alive.
 * Used by keep-alive scripts to prevent hibernation.
 */
export function setupHealthCheck(app: Express) {
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}
