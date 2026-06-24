const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');
const { authLimiter } = require('../middleware/rateLimit');
const { validateRegister } = require('../utils/validateRegister');

// ─── Cookie helper ────────────────────────────────────────
// One place to define cookie settings — used in both register and login
const sendTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,   // ← JS can NEVER read this. Zero access.
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // cookie only sent to your own domain
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  });
};

// ─── REGISTER ────────────────────────────────────────────
router.post('/register', authLimiter, async (req, res) => {
  const validated = validateRegister(req.body);
  if (validated.error) {
    return res.status(400).json({ error: validated.error });
  }

  const { username, email, password } = validated;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username, email, hashedPassword]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Set cookie — NOT in response body anymore
    sendTokenCookie(res, token);

    // Only send user info — token stays in cookie, invisible to JS
    res.status(201).json({ user });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username or email already taken' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── LOGIN ───────────────────────────────────────────────
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Same — cookie not body
    sendTokenCookie(res, token);

    res.json({
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── LOGOUT ──────────────────────────────────────────────
router.post('/logout', (req, res) => {
  // Clear the cookie — browser deletes it immediately
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

const authMiddleware = require('../middleware/auth');

// GET /api/auth/me — returns current user from cookie
// Protected — requires valid cookie
router.get('/me', authMiddleware, (req, res) => {
  // req.user comes from authMiddleware (decoded token)
  res.json({ user: req.user });
});

module.exports = router;