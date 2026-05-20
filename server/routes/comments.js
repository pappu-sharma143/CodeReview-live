const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ── POST COMMENT ──────────────────────────────────────────
// POST /api/comments
// Saves a comment to DB
router.post('/', async (req, res) => {
  const { sessionId, lineNumber, body } = req.body;
  const authorId = req.user.userId;

  if (!sessionId || !lineNumber || !body) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO comments (session_id, author_id, line_number, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, line_number AS "lineNumber", body, created_at`,
      [sessionId, authorId, lineNumber, body]
    );

    res.status(201).json({ comment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save comment' });
  }
});

module.exports = router;