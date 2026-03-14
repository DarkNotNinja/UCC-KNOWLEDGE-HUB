const pool = require('../db');

const getAllUsers = async () => {
  const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  return result.rows;
};

module.exports = {
  getAllUsers,
};