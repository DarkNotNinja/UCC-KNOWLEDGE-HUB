const pool = require('../db');

exports.getAllReviews = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM reviews WHERE review_id=$1', [id]);
    if (!result.rows.length) return res.status(404).send('Review not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createReview = async (req, res) => {
  try {
    const { user_id, resource_id, rating, comment } = req.body;
    const result = await pool.query(
      `INSERT INTO reviews (user_id, resource_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [user_id, resource_id, rating, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const result = await pool.query(
      `UPDATE reviews SET rating=$1, comment=$2, updated_at=NOW() WHERE review_id=$3 RETURNING *`,
      [rating, comment, id]
    );
    if (!result.rows.length) return res.status(404).send('Review not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM reviews WHERE review_id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).send('Review not found');
    res.json({ message: 'Review deleted successfully' });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};