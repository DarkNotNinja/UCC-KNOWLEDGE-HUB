const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,        // localhost or your DB host
  user: process.env.DB_USER,        // postgres
  password: process.env.DB_PASSWORD,// UCCKNOWS
  database: process.env.DB_DATABASE,// ucc_knowledge_hub
  port: process.env.DB_PORT,        // 5432
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('PostgreSQL connected successfully');
  release();
});

module.exports = pool;