const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const { hasSessionAccess } = require('../utils/sessionAccess');

router.use(authMiddleware);

// ── RATE SESSION CREATOR'S CODE ───────────────────────────
// POST /api/ratings/session/:id
// Body: { rating: 1-5 }
// Only a reviewer (not the session creator) can rate
router.post('/session/:id', async (req, res) => {
  const { id: sessionId } = req.params;
  const { rating } = req.body;
  const reviewerId = req.user.userId;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const sessionCheck = await pool.query(
      'SELECT id, submitter_id, status FROM review_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionCheck.rows[0];

    if (session.submitter_id === reviewerId) {
      return res.status(403).json({ error: 'Only reviewers can rate the session creator' });
    }

    const allowed = await hasSessionAccess(reviewerId, sessionId);
    if (!allowed) {
      return res.status(403).json({ error: 'You must have joined this session to rate' });
    }

    if (session.status === 'done') {
      return res.status(400).json({ error: 'Session already rated' });
    }

    await pool.query('BEGIN');

    await pool.query(
      `UPDATE review_sessions
       SET status = 'done', rating = $1, reviewer_id = $2, ended_at = NOW()
       WHERE id = $3`,
      [rating, reviewerId, sessionId]
    );

    const creatorId = session.submitter_id;

    await pool.query(
      `UPDATE users
       SET reputation = (
         SELECT COALESCE(ROUND(AVG(rating) * 20), 0)
         FROM review_sessions
         WHERE submitter_id = $1
           AND status = 'done'
           AND rating IS NOT NULL
       )
       WHERE id = $1`,
      [creatorId]
    );

    await pool.query(
      `UPDATE users
       SET review_count = review_count + 1
       WHERE id = $1`,
      [reviewerId]
    );

    await pool.query('COMMIT');

    const creatorResult = await pool.query(
      'SELECT username, reputation FROM users WHERE id = $1',
      [creatorId]
    );

    res.json({
      message: 'Rating submitted successfully',
      creator: creatorResult.rows[0],
      rating,
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
        creator.username AS creator_name,
        creator.reputation AS creator_reputation,
        reviewer.username AS reviewer_name
       FROM review_sessions rs
       LEFT JOIN users creator ON rs.submitter_id = creator.id
       LEFT JOIN users reviewer ON rs.reviewer_id = reviewer.id
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
