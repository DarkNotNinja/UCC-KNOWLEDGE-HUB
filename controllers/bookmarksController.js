const pool = require('../db');

exports.getAllBookmarks = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookmarks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getBookmarkById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM bookmarks WHERE bookmark_id=$1', [id]);
    if (!result.rows.length) return res.status(404).send('Bookmark not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createBookmark = async (req, res) => {
  try {
    const { user_id, resource_id } = req.body;
    const result = await pool.query(
      `INSERT INTO bookmarks (user_id, resource_id, created_at)
       VALUES ($1, $2, NOW()) RETURNING *`,
      [user_id, resource_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const result = await pool.query(
      `UPDATE bookmarks SET notes=$1, updated_at=NOW() WHERE bookmark_id=$2 RETURNING *`,
      [notes, id]
    );
    if (!result.rows.length) return res.status(404).send('Bookmark not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deleteBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM bookmarks WHERE bookmark_id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).send('Bookmark not found');
    res.json({ message: 'Bookmark deleted successfully' });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};