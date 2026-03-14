const pool = require('../db');

exports.getAllBooks = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE book_id = $1', [id]);
    if (!result.rows.length) return res.status(404).send('Book not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createBook = async (req, res) => {
  try {
    const { book_id, title, author, isbn, subject_of_resource, format_of_resource, genre_of_resource, publication_date, total_copies, available_copies, access_type, digital_access_url, pdf_available, department_recommendations } = req.body;
    const result = await pool.query(
      `INSERT INTO books (book_id, title, author, isbn, subject_of_resource, format_of_resource, genre_of_resource, publication_date, total_copies, available_copies, access_type, digital_access_url, pdf_available, department_recommendations, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW()) RETURNING *`,
      [book_id, title, author, isbn, subject_of_resource, format_of_resource, genre_of_resource, publication_date, total_copies, available_copies, access_type, digital_access_url, pdf_available, department_recommendations]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setQuery = keys.map((key, i) => `${key}=$${i+1}`).join(', ');

    const result = await pool.query(`UPDATE books SET ${setQuery}, updated_at=NOW() WHERE book_id=$${keys.length+1} RETURNING *`, [...values, id]);
    if (!result.rows.length) return res.status(404).send('Book not found');
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM books WHERE book_id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).send('Book not found');
    res.json({ message: 'Book deleted successfully' });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};