const pool = require('../db');

// Threads
exports.getAllThreads = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM forum_threads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getThreadById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM forum_threads WHERE thread_id=$1', [id]);
  if (!result.rows.length) return res.status(404).send('Thread not found');
  res.json(result.rows[0]);
};

exports.createThread = async (req, res) => {
  const { user_id, title, content } = req.body;
  const result = await pool.query(
    'INSERT INTO forum_threads (user_id, title, content, created_at) VALUES ($1,$2,$3,NOW()) RETURNING *',
    [user_id, title, content]
  );
  res.status(201).json(result.rows[0]);
};

exports.updateThread = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const result = await pool.query(
    'UPDATE forum_threads SET title=$1, content=$2, updated_at=NOW() WHERE thread_id=$3 RETURNING *',
    [title, content, id]
  );
  if (!result.rows.length) return res.status(404).send('Thread not found');
  res.json(result.rows[0]);
};

exports.deleteThread = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM forum_threads WHERE thread_id=$1 RETURNING *', [id]);
  if (!result.rows.length) return res.status(404).send('Thread not found');
  res.json({ message: 'Thread deleted successfully' });
};

// Replies
exports.getAllReplies = async (req, res) => {
  const result = await pool.query('SELECT * FROM forum_replies ORDER BY created_at ASC');
  res.json(result.rows);
};

exports.getReplyById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM forum_replies WHERE reply_id=$1', [id]);
  if (!result.rows.length) return res.status(404).send('Reply not found');
  res.json(result.rows[0]);
};

exports.createReply = async (req, res) => {
  const { thread_id, user_id, content } = req.body;
  const result = await pool.query(
    'INSERT INTO forum_replies (thread_id, user_id, content, created_at) VALUES ($1,$2,$3,NOW()) RETURNING *',
    [thread_id, user_id, content]
  );
  res.status(201).json(result.rows[0]);
};

exports.updateReply = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const result = await pool.query(
    'UPDATE forum_replies SET content=$1, updated_at=NOW() WHERE reply_id=$2 RETURNING *',
    [content, id]
  );
  if (!result.rows.length) return res.status(404).send('Reply not found');
  res.json(result.rows[0]);
};

exports.deleteReply = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM forum_replies WHERE reply_id=$1 RETURNING *', [id]);
  if (!result.rows.length) return res.status(404).send('Reply not found');
  res.json({ message: 'Reply deleted successfully' });
};