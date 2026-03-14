const pool = require('../db');

exports.getAllPayments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY payment_date DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM payments WHERE payment_id=$1', [id]);
    if (!result.rows.length) return res.status(404).send('Payment not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createPayment = async (req, res) => {
  try {
    const { user_id, amount, method } = req.body;
    const result = await pool.query(
      `INSERT INTO payments (user_id, amount, method, payment_date)
       VALUES ($1, $2, $3, CURRENT_DATE) RETURNING *`,
      [user_id, amount, method]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, status } = req.body;
    const result = await pool.query(
      `UPDATE payments SET amount=$1, status=$2, updated_at=NOW() WHERE payment_id=$3 RETURNING *`,
      [amount, status, id]
    );
    if (!result.rows.length) return res.status(404).send('Payment not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM payments WHERE payment_id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).send('Payment not found');
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};