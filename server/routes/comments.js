const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const { commentLimiter } = require('../middleware/rateLimit');
const { validateComment } = require('../utils/validateComment');

router.use(authMiddleware);

// ── POST COMMENT ──────────────────────────────────────────
// POST /api/comments
// Saves a comment to DB
router.post('/', commentLimiter, async (req, res) => {
  const { sessionId, lineNumber, body } = req.body;
  const authorId = req.user.userId;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const validated = validateComment({ lineNumber, body });
  if (validated.error) {
    return res.status(400).json({ error: validated.error });
  }

  try {
    const result = await pool.query(
      `INSERT INTO comments (session_id, author_id, line_number, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, line_number AS "lineNumber", body, created_at`,
      [sessionId, authorId, validated.lineNumber, validated.body]
    );

    res.status(201).json({ comment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save comment' });
  }
});

module.exports = router;