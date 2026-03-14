const pool = require('../db');

exports.getAllLists = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reading_lists ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getListById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM reading_lists WHERE list_id=$1', [id]);
    if (!result.rows.length) return res.status(404).send('List not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createList = async (req, res) => {
  try {
    const { user_id, title, description } = req.body;
    const result = await pool.query(
      `INSERT INTO reading_lists (user_id, title, description, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [user_id, title, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const result = await pool.query(
      `UPDATE reading_lists SET title=$1, description=$2, updated_at=NOW() WHERE list_id=$3 RETURNING *`,
      [title, description, id]
    );
    if (!result.rows.length) return res.status(404).send('List not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deleteList = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM reading_lists WHERE list_id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).send('List not found');
    res.json({ message: 'List deleted successfully' });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};