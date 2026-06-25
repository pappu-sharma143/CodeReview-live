const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');
const { authLimiter } = require('../middleware/rateLimit');
const { validateRegister } = require('../utils/validateRegister');

const TOKEN_EXPIRY = '7d';

const signUserToken = (user) =>
  jwt.sign(
    { userId: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
});

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
    const token = signUserToken(user);

    res.status(201).json({ user: toPublicUser(user), token });
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

    const token = signUserToken(user);

    res.json({
      user: toPublicUser(user),
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── LOGOUT ──────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

const authMiddleware = require('../middleware/auth');

// GET /api/auth/me — returns current user from JWT
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user.userId,
      username: req.user.username,
      email: req.user.email,
    },
  });
});

module.exports = router;
