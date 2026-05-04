import { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

// Database connection pool
let pool: mysql.Pool | null = null;

async function getPool(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool({
      connectionLimit: 5,
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const pool = await getPool();
    const connection = await pool.getConnection();

    if (req.method === 'GET') {
      // Get all athletes
      const [rows] = await connection.query(
        'SELECT * FROM atletas WHERE userId = ? ORDER BY nome ASC',
        [1]
      );

      connection.release();

      const atletas = (rows as any[]).map((atleta: any) => ({
        ...atleta,
        fotoUrl: atleta.fotoUrl || null,
      }));

      res.status(200).json({
        data: atletas,
        total: atletas.length,
      });
    } else {
      connection.release();
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('[API] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
