const { Pool } = require('pg');
require('dotenv').config();

// H6 - Gate debug logs behind NODE_ENV check
const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  console.log('📦 Database Config:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
  });
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

pool.on('connect', () => {
  if (isDev) {
    console.log('✅ New connection to database');
  }
});

// Test connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection test failed:', err);
  } else if (isDev) {
    console.log('✅ Database connection successful');
  }
});

module.exports = pool;
