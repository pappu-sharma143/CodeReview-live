const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../models/db');
const { authLimiter } = require('../middleware/rateLimit');
const { validateRegister } = require('../utils/validateRegister');
const { TOKEN_EXPIRY, signUserToken } = require('../utils/jwt');

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
});

const authSuccessPayload = (user) => {
  const token = signUserToken(user);
  return {
    token,
    user: toPublicUser(user),
    expiresIn: TOKEN_EXPIRY,
  };
};

const handleAuthError = (res, err) => {
  console.error(err);
  if (err.message === 'JWT_SECRET is not configured') {
    return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET is missing' });
  }
  return res.status(500).json({ error: 'Server error' });
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
    res.status(201).json(authSuccessPayload(user));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username or email already taken' });
    }
    return handleAuthError(res, err);
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

    res.status(200).json(authSuccessPayload(user));
  } catch (err) {
    return handleAuthError(res, err);
  }
});

// ─── LOGOUT ──────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

const authMiddleware = require('../middleware/auth');

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
