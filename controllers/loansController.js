const pool = require('../db');

exports.getAllLoans = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM loans ORDER BY loan_date DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM loans WHERE loan_id=$1', [id]);
    if (!result.rows.length) return res.status(404).send('Loan not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createLoan = async (req, res) => {
  try {
    const { user_id, book_id, due_date } = req.body;
    const result = await pool.query(
      `INSERT INTO loans (user_id, book_id, loan_date, due_date, status)
       VALUES ($1, $2, CURRENT_DATE, $3, 'ongoing') RETURNING *`,
      [user_id, book_id, due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { return_date, status } = req.body;
    const result = await pool.query(
      `UPDATE loans SET return_date=$1, status=$2, updated_at=NOW() WHERE loan_id=$3 RETURNING *`,
      [return_date, status, id]
    );
    if (!result.rows.length) return res.status(404).send('Loan not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM loans WHERE loan_id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).send('Loan not found');
    res.json({ message: 'Loan deleted successfully' });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};