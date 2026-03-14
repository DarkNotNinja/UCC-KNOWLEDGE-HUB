const pool = require('../db');

exports.getAllReservations = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reservations ORDER BY reservation_date DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM reservations WHERE reservation_id=$1', [id]);
    if (!result.rows.length) return res.status(404).send('Reservation not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createReservation = async (req, res) => {
  try {
    const { user_id, book_id } = req.body;
    const result = await pool.query(
      `INSERT INTO reservations (user_id, book_id, reservation_date, status)
       VALUES ($1, $2, CURRENT_DATE, 'active') RETURNING *`,
      [user_id, book_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      `UPDATE reservations SET status=$1, updated_at=NOW() WHERE reservation_id=$2 RETURNING *`,
      [status, id]
    );
    if (!result.rows.length) return res.status(404).send('Reservation not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM reservations WHERE reservation_id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).send('Reservation not found');
    res.json({ message: 'Reservation deleted successfully' });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};