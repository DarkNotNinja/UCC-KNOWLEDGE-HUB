const pool = require('../db');

exports.getAllNotifications = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM notifications WHERE notification_id=$1', [id]);
    if (!result.rows.length) return res.status(404).send('Notification not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createNotification = async (req, res) => {
  try {
    const { user_id, message, read_status=false } = req.body;
    const result = await pool.query(
      `INSERT INTO notifications (user_id, message, read_status, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [user_id, message, read_status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { read_status } = req.body;
    const result = await pool.query(
      `UPDATE notifications SET read_status=$1, updated_at=NOW() WHERE notification_id=$2 RETURNING *`,
      [read_status, id]
    );
    if (!result.rows.length) return res.status(404).send('Notification not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM notifications WHERE notification_id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).send('Notification not found');
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};