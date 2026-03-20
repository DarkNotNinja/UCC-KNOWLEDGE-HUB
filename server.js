require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { Pool } = require('pg');
const { OpenAI } = require('openai');
const path = require('path');

const app    = express();
const http   = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// JWT MIDDLEWARE (WORKING)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
}

// DB SETUP (WORKING)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// AUTO-CREATE TABLES IF THEY DON'T EXIST
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        school_id VARCHAR(50) UNIQUE NOT NULL,
        fullname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS threads (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        message TEXT NOT NULL,
        author TEXT DEFAULT 'Anonymous',
        user_id TEXT,
        type TEXT DEFAULT 'discussion',
        book_ref TEXT,
        likes INT DEFAULT 0,
        is_lecturer BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS replies (
        id SERIAL PRIMARY KEY,
        thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
        user_id TEXT,
        author TEXT DEFAULT 'Anonymous',
        message TEXT NOT NULL,
        is_lecturer BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id        SERIAL PRIMARY KEY,
        thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
        user_id   TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(thread_id, user_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS study_rooms (
        id             SERIAL PRIMARY KEY,
        name           TEXT NOT NULL,
        topic          TEXT,
        book_ref       TEXT,
        category       TEXT DEFAULT 'General',
        created_by     TEXT NOT NULL,
        created_by_name TEXT,
        is_active      BOOLEAN DEFAULT TRUE,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_messages (
        id         SERIAL PRIMARY KEY,
        room_id    INTEGER NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
        user_id    TEXT NOT NULL,
        author     TEXT NOT NULL,
        message    TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database tables checked/created successfully!");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
})();

// SIGNUP (WORKING)
app.post('/signup', async (req, res) => {
  const { fullname, email, schoolId, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO users (school_id, fullname, email, password_hash) VALUES ($1,$2,$3,$4)',
      [schoolId, fullname, email, hashedPassword]
    );
    res.json({ message: 'Account created successfully!' });
  } catch (err) {
    console.error(err);
    res.json({ message: 'Error creating account. ID or email may already exist.' });
  }
});

// LOGIN (WORKING)
app.post('/login', async (req, res) => {
  const { schoolId, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE school_id=$1', [schoolId]);
    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'User not found.' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.json({ success: false, message: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { userId: user.id, fullname: user.fullname },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Login error.' });
  }
});

// GET LOGGED-IN USER INFO (WORKING)
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, fullname, email, school_id FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error loading user" });
  }
});

// UPDATE PASSWORD (WORKING)
app.post('/setpassword', authenticateToken, async (req, res) => {
  const { current, newPass } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    const user = result.rows[0];

    if (!user) return res.status(404).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(current, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    const newHashed = await bcrypt.hash(newPass, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHashed, user.id]);

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating password" });
  }
});

// AI CITE
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/citation', async (req, res) => {
  const { title, author } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: 'Missing title or author' });
  }

  try {
    const prompt = `Generate an APA 7th edition citation for the following book:\n\nTitle: ${title}\nAuthor(s): ${author}\nFormat it exactly as it should appear in a reference list.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    const citation = completion.choices[0].message.content;
    res.json({ citation: citation.trim() });

  } catch (err) {
    console.error('Citation error:', err);
    res.status(500).json({ error: "Failed to generate citation." });
  }
});

// GET ALL THREADS (WORKING)
app.get('/api/threads', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, category, message, author, user_id, type, book_ref, likes, is_lecturer, created_at FROM threads ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error loading threads:', err);
    res.status(500).json({ error: "Failed to load threads" });
  }
});

// CREATE FORUM THREAD (WORKING)
app.post('/api/threads', authenticateToken, async (req, res) => {
  const { title, category, message, type, book_ref } = req.body;

  if (!title || !category || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await pool.query(
      `INSERT INTO threads (title, category, message, author, user_id, type, book_ref, likes, is_lecturer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, false)`,
      [title, category, message, req.user.fullname, String(req.user.userId), type || 'discussion', book_ref || null]
    );
    res.json({ message: "Thread posted successfully!" });
  } catch (err) {
    console.error('Error inserting thread:', err);
    res.status(500).json({ error: "Server error posting thread" });
  }
});

// DELETE THREAD — only owner can delete
app.delete('/api/threads/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id FROM threads WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Thread not found' });

    const owner = String(result.rows[0].user_id);
    const userId = String(req.user.userId);

    if (owner !== userId) return res.status(403).json({ error: 'Not your post' });

    await pool.query('DELETE FROM threads WHERE id = $1', [req.params.id]);
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting thread' });
  }
});

// EDIT THREAD — only owner can edit
app.put('/api/threads/:id', authenticateToken, async (req, res) => {
  const { title, category, message, book_ref, type } = req.body;

  try {
    const result = await pool.query('SELECT user_id FROM threads WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Thread not found' });

    const owner = String(result.rows[0].user_id);
    const userId = String(req.user.userId);

    if (owner !== userId) return res.status(403).json({ error: 'Not your post' });

    await pool.query(
      'UPDATE threads SET title=$1, category=$2, message=$3, book_ref=$4, type=$5 WHERE id=$6',
      [title, category, message, book_ref || null, type || 'discussion', req.params.id]
    );
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating thread' });
  }
});

// GET REPLIES FOR A THREAD
app.get('/api/replies/:threadId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM replies WHERE thread_id = $1 ORDER BY created_at ASC',
      [req.params.threadId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load replies' });
  }
});

// POST A REPLY
app.post('/api/replies', authenticateToken, async (req, res) => {
  const { thread_id, message } = req.body;

  if (!thread_id || !message) {
    return res.status(400).json({ error: 'Missing thread_id or message' });
  }

  try {
    await pool.query(
      'INSERT INTO replies (thread_id, user_id, author, message) VALUES ($1, $2, $3, $4)',
      [thread_id, String(req.user.userId), req.user.fullname, message]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error posting reply' });
  }
});

// DELETE REPLY — only owner can delete
app.delete('/api/replies/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id FROM replies WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Reply not found' });

    const owner = String(result.rows[0].user_id);
    const userId = String(req.user.userId);

    if (owner !== userId) return res.status(403).json({ error: 'Not your reply' });

    await pool.query('DELETE FROM replies WHERE id = $1', [req.params.id]);
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting reply' });
  }
});

// EDIT REPLY — only owner can edit
app.put('/api/replies/:id', authenticateToken, async (req, res) => {
  const { message } = req.body;

  try {
    const result = await pool.query('SELECT user_id FROM replies WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Reply not found' });

    const owner = String(result.rows[0].user_id);
    const userId = String(req.user.userId);

    if (owner !== userId) return res.status(403).json({ error: 'Not your reply' });

    await pool.query('UPDATE replies SET message = $1 WHERE id = $2', [message, req.params.id]);
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating reply' });
  }
});


// LIKE A THREAD
app.post('/api/threads/:id/like', authenticateToken, async (req, res) => {
  const userId = String(req.user.userId);
  const threadId = req.params.id;

  try {
    // Insert like — UNIQUE constraint prevents duplicates
    await pool.query(
      'INSERT INTO likes (thread_id, user_id) VALUES ($1, $2)',
      [threadId, userId]
    );

    // Increment likes count on thread
    await pool.query(
      'UPDATE threads SET likes = likes + 1 WHERE id = $1',
      [threadId]
    );

    // Return new like count
    const result = await pool.query('SELECT likes FROM threads WHERE id = $1', [threadId]);
    res.json({ success: true, likes: result.rows[0].likes });

  } catch (err) {
    if (err.code === '23505') {
      // Unique violation — already liked
      return res.status(409).json({ error: 'Already liked' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error liking thread' });
  }
});

// GET LIKES FOR CURRENT USER (to restore liked state on load)
app.get('/api/likes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT thread_id FROM likes WHERE user_id = $1',
      [String(req.user.userId)]
    );
    res.json(result.rows.map(r => r.thread_id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error loading likes' });
  }
});



// GET USER LOANS
app.get('/api/loans/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM loans WHERE user_id = $1 ORDER BY borrowed_at DESC',
      [String(req.user.userId)]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load loans' });
  }
});

// ADD A LOAN (from digital library search)
app.post('/api/loans', authenticateToken, async (req, res) => {
  const { book_title, book_author, format, status, source_url, pdf_url, due_date } = req.body;
  if (!book_title) return res.status(400).json({ error: 'book_title required' });
  try {
    // Check if already saved
    const exists = await pool.query(
      'SELECT id FROM loans WHERE user_id=$1 AND book_title=$2 AND status=$3',
      [String(req.user.userId), book_title, 'active']
    );
    if (exists.rows.length) return res.json({ message: 'Already in library', exists: true });

    await pool.query(
      `INSERT INTO loans (user_id, book_title, book_author, format, status, source_url, pdf_url, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [String(req.user.userId), book_title, book_author||null, format||'E-Book / PDF',
       status||'active', source_url||null, pdf_url||null, due_date||null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save loan' });
  }
});

// ── STUDY ROOMS ──────────────────────────────────────

// GET ALL ACTIVE ROOMS
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM study_rooms WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load rooms' });
  }
});

// CREATE ROOM
app.post('/api/rooms', authenticateToken, async (req, res) => {
  const { name, topic, book_ref, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Room name required' });
  try {
    const result = await pool.query(
      `INSERT INTO study_rooms (name, topic, book_ref, category, created_by, created_by_name)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, topic||null, book_ref||null, category||'General',
       String(req.user.userId), req.user.fullname]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET MESSAGES FOR A ROOM (history)
app.get('/api/rooms/:id/messages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM room_messages WHERE room_id = $1 ORDER BY created_at ASC LIMIT 100',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// DELETE ROOM — creator only
app.delete('/api/rooms/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT created_by FROM study_rooms WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Room not found' });

    if (String(result.rows[0].created_by) !== String(req.user.userId)) {
      return res.status(403).json({ error: 'Only the creator can end this room' });
    }

    await pool.query('DELETE FROM study_rooms WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error ending room' });
  }
});

// ── SOCKET.IO ─────────────────────────────────────────
const roomUsers = {}; // { roomId: Set of { userId, fullname, socketId } }

io.on('connection', (socket) => {

  socket.on('join_room', async ({ roomId, userId, fullname }) => {
    socket.join(String(roomId));
    socket.roomId   = roomId;
    socket.userId   = userId;
    socket.fullname = fullname;

    if (!roomUsers[roomId]) roomUsers[roomId] = new Map();
    roomUsers[roomId].set(socket.id, { userId, fullname });

    const count = roomUsers[roomId].size;
    io.to(String(roomId)).emit('user_joined', { fullname, count });
  });

  socket.on('send_message', async ({ roomId, userId, author, message }) => {
    const created_at = new Date().toISOString();
    // Save to DB
    try {
      await pool.query(
        'INSERT INTO room_messages (room_id, user_id, author, message) VALUES ($1,$2,$3,$4)',
        [roomId, userId, author, message]
      );
    } catch (err) { console.error('Error saving message:', err); }

    // Broadcast to room
    io.to(String(roomId)).emit('new_message', { roomId, userId, author, message, created_at });
  });

  socket.on('typing', ({ roomId, fullname }) => {
    socket.to(String(roomId)).emit('typing', { fullname });
  });

  socket.on('stop_typing', ({ roomId }) => {
    socket.to(String(roomId)).emit('stop_typing');
  });

  socket.on('leave_room', ({ roomId, fullname }) => {
    socket.leave(String(roomId));
    if (roomUsers[roomId]) {
      roomUsers[roomId].delete(socket.id);
      const count = roomUsers[roomId].size;
      io.to(String(roomId)).emit('user_left', { fullname, count });
    }
  });

  socket.on('room_ended', ({ roomId }) => {
    io.to(String(roomId)).emit('room_ended');
  });

  socket.on('disconnect', () => {
    if (socket.roomId && roomUsers[socket.roomId]) {
      roomUsers[socket.roomId].delete(socket.id);
      const count = roomUsers[socket.roomId].size;
      io.to(String(socket.roomId)).emit('user_left', {
        fullname: socket.fullname || 'Someone',
        count
      });
    }
  });
});

// SERVER START
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT} - ${process.env.NODE_ENV || 'development'}`)
);