const pool = require('../db');

exports.getAllStats = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stats ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getStatById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM stats WHERE stat_id=$1', [id]);
    if (!result.rows.length) return res.status(404).send('Stat not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};