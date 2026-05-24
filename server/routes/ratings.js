const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ── END SESSION + RATE REVIEWER ───────────────────────────
// POST /api/ratings/session/:id
// Body: { rating: 1-5, reviewerId }
// Only the session submitter can rate
router.post('/session/:id', async (req, res) => {
  const { id: sessionId } = req.params;
  const { rating, reviewerId } = req.body;
  const submitterId = req.user.userId;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  if (!reviewerId) {
    return res.status(400).json({ error: 'reviewerId is required' });
  }

  try {
    // Verify this user owns the session
    const sessionCheck = await pool.query(
      'SELECT id, submitter_id, status FROM review_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionCheck.rows[0];

    if (session.submitter_id !== submitterId) {
      return res.status(403).json({ error: 'Only the session owner can rate' });
    }

    if (session.status === 'done') {
      return res.status(400).json({ error: 'Session already rated' });
    }

    // Can't rate yourself
    if (reviewerId === submitterId) {
      return res.status(400).json({ error: 'Cannot rate yourself' });
    }

    // Start a transaction — both updates must succeed or neither does
    // If reputation update fails, we don't want session marked done
    await pool.query('BEGIN');

    // 1. Mark session as done + save rating + reviewer
    await pool.query(
      `UPDATE review_sessions
       SET status = 'done', rating = $1, reviewer_id = $2, ended_at = NOW()
       WHERE id = $3`,
      [rating, reviewerId, sessionId]
    );

    // 2. Update reviewer's reputation
    // reputation = average of all their ratings * 20 (scale to 0-100)
    // review_count = total sessions reviewed
    await pool.query(
      `UPDATE users
       SET review_count = review_count + 1,
           reputation = (
             SELECT ROUND(AVG(rating) * 20)
             FROM review_sessions
             WHERE reviewer_id = $1
             AND status = 'done'
             AND rating IS NOT NULL
           )
       WHERE id = $1`,
      [reviewerId]
    );

    await pool.query('COMMIT');

    // Get updated reviewer info to send back
    const reviewerResult = await pool.query(
      'SELECT username, reputation, review_count FROM users WHERE id = $1',
      [reviewerId]
    );

    res.json({
      message: 'Session rated successfully',
      reviewer: reviewerResult.rows[0],
      rating
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Rating error:', err.message);
    res.status(500).json({ error: 'Failed to save rating' });
  }
});

// ── GET SESSION RATING STATUS ─────────────────────────────
// GET /api/ratings/session/:id
router.get('/session/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        rs.status,
        rs.rating,
        rs.ended_at,
        u.username  AS reviewer_name,
        u.reputation AS reviewer_reputation
       FROM review_sessions rs
       LEFT JOIN users u ON rs.reviewer_id = u.id
       WHERE rs.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

module.exports = router;