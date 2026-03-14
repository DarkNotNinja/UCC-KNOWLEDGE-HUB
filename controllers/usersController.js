const pool = require('../db');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).send('User not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const { username, email, password_hash, first_name, last_name, phone_number, user_type, major_id, department_id } = req.body;
    const result = await pool.query(
      `INSERT INTO users (user_id, username, email, password_hash, first_name, last_name, phone_number, membership_date, user_type, major_id, department_id)
       VALUES ('UCC_' || NEXTVAL('users_seq'), $1,$2,$3,$4,$5,$6,CURRENT_DATE,$7,$8,$9) RETURNING *`,
      [username, email, password_hash, first_name, last_name, phone_number, user_type, major_id, department_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, first_name, last_name, phone_number, user_type, major_id, department_id } = req.body;
    const result = await pool.query(
      `UPDATE users SET username=$1, email=$2, first_name=$3, last_name=$4, phone_number=$5, user_type=$6, major_id=$7, department_id=$8, updated_at=NOW()
       WHERE user_id=$9 RETURNING *`,
      [username, email, first_name, last_name, phone_number, user_type, major_id, department_id, id]
    );
    if (result.rows.length === 0) return res.status(404).send('User not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE user_id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).send('User not found');
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};