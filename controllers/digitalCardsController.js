const pool = require('../db');

exports.getAllCards = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM digital_cards ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getCardById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM digital_cards WHERE card_id=$1', [id]);
    if (!result.rows.length) return res.status(404).send('Card not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createCard = async (req, res) => {
  try {
    const { user_id, card_number, expiry_date } = req.body;
    const result = await pool.query(
      `INSERT INTO digital_cards (user_id, card_number, expiry_date, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [user_id, card_number, expiry_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { expiry_date, status } = req.body;
    const result = await pool.query(
      `UPDATE digital_cards SET expiry_date=$1, status=$2, updated_at=NOW() WHERE card_id=$3 RETURNING *`,
      [expiry_date, status, id]
    );
    if (!result.rows.length) return res.status(404).send('Card not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM digital_cards WHERE card_id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).send('Card not found');
    res.json({ message: 'Card deleted successfully' });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};