require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { Pool } = require('pg');
const { OpenAI } = require('openai');
const path = require('path');

const app = express();

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
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

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

// AI CITE (NOT WORKING)
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

// CREATE FORUM THREAD (WORKING)
app.post('/api/threads', authenticateToken, async (req, res) => {
  const { title, category, message, author } = req.body;

  if (!title || !category || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await pool.query(
      'INSERT INTO threads (title, category, message, author) VALUES ($1, $2, $3, $4)',
      [title, category, message, author || "Anonymous"]
    );
    res.json({ message: "Thread posted successfully!" });
  } catch (err) {
    console.error('Error inserting thread:', err);
    res.status(500).json({ error: "Server error posting thread" });
  }
});

// GET ALL THREADS (WORKING)
app.get('/api/threads', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, category, message, author, created_at FROM threads ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error loading threads:', err);
    res.status(500).json({ error: "Failed to load threads" });
  }
});



// SERVER START (WORKING)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} — ${process.env.NODE_ENV || 'development'}`);
