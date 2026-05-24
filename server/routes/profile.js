const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ── GET MY PROFILE ────────────────────────────────────────
// GET /api/profile/me
router.get('/me', async (req, res) => {
  const userId = req.user.userId;

  try {
    // User info
    const userResult = await pool.query(
      `SELECT id, username, email, reputation, review_count, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Sessions I submitted
    const submittedResult = await pool.query(
      `SELECT
        rs.id, rs.language, rs.status, rs.rating,
        rs.created_at, rs.ended_at,
        reviewer.username AS reviewer_name
       FROM review_sessions rs
       LEFT JOIN users reviewer ON rs.reviewer_id = reviewer.id
       WHERE rs.submitter_id = $1
       ORDER BY rs.created_at DESC
       LIMIT 20`,
      [userId]
    );

    // Sessions I reviewed
    const reviewedResult = await pool.query(
      `SELECT
        rs.id, rs.language, rs.status, rs.rating,
        rs.created_at, rs.ended_at,
        submitter.username AS submitter_name
       FROM review_sessions rs
       JOIN users submitter ON rs.submitter_id = submitter.id
       WHERE rs.reviewer_id = $1
       ORDER BY rs.created_at DESC
       LIMIT 20`,
      [userId]
    );

    // My comments count
    const commentCount = await pool.query(
      'SELECT COUNT(*) FROM comments WHERE author_id = $1',
      [userId]
    );

    res.json({
      user: userResult.rows[0],
      submitted:    submittedResult.rows,
      reviewed:     reviewedResult.rows,
      commentCount: parseInt(commentCount.rows[0].count)
    });

  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// ── GET ANY USER PROFILE ──────────────────────────────────
// GET /api/profile/:username
router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const userResult = await pool.query(
      `SELECT id, username, reputation, review_count, created_at
       FROM users WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Public stats only
    const stats = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE submitter_id = $1) AS sessions_created,
        COUNT(*) FILTER (WHERE reviewer_id  = $1) AS sessions_reviewed,
        ROUND(AVG(rating) FILTER (WHERE reviewer_id = $1 AND rating IS NOT NULL), 1)
          AS avg_rating
       FROM review_sessions`,
      [user.id]
    );

    res.json({
      user,
      stats: stats.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

module.exports = router;