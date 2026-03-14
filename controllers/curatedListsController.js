const pool = require('../db');

exports.getAllCuratedLists = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM curated_lists ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getCuratedListById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM curated_lists WHERE curated_list_id=$1', [id]);
    if (!result.rows.length) return res.status(404).send('Curated list not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createCuratedList = async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await pool.query(
      `INSERT INTO curated_lists (title, description, created_at)
       VALUES ($1, $2, NOW()) RETURNING *`,
      [title, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateCuratedList = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const result = await pool.query(
      `UPDATE curated_lists SET title=$1, description=$2, updated_at=NOW() WHERE curated_list_id=$3 RETURNING *`,
      [title, description, id]
    );
    if (!result.rows.length) return res.status(404).send('Curated list not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deleteCuratedList = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM curated_lists WHERE curated_list_id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).send('Curated list not found');
    res.json({ message: 'Curated list deleted successfully' });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};