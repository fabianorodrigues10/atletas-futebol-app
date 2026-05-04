export default async function handler(req, res) {
  const dbUrl = "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi";
  
  try {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection(dbUrl);
    const [rows] = await connection.execute('SELECT * FROM athletes LIMIT 100');
    await connection.end();
    
    res.status(200).json({ data: rows, total: rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
