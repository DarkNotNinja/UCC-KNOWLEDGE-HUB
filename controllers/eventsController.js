const pool = require('../db');

exports.getAllEvents = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY event_date DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM events WHERE event_id=$1', [id]);
    if (!result.rows.length) return res.status(404).send('Event not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, event_date } = req.body;
    const result = await pool.query(
      `INSERT INTO events (title, description, event_date, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [title, description, event_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date } = req.body;
    const result = await pool.query(
      `UPDATE events SET title=$1, description=$2, event_date=$3, updated_at=NOW() WHERE event_id=$4 RETURNING *`,
      [title, description, event_date, id]
    );
    if (!result.rows.length) return res.status(404).send('Event not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM events WHERE event_id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).send('Event not found');
    res.json({ message: 'Event deleted successfully' });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};