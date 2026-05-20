const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

// All routes here require login
router.use(authMiddleware);

// ── CREATE SESSION ────────────────────────────────────────
// POST /api/sessions
// Creates a new review session in DB
router.post('/', async (req, res) => {
  const { language = 'javascript' } = req.body;
  const submitterId = req.user.userId;

  try {
    const result = await pool.query(
      `INSERT INTO review_sessions (submitter_id, code, language, status)
       VALUES ($1, $2, $3, 'open')
       RETURNING *`,
      [submitterId, '// Start typing your code here...', language]
    );

    res.status(201).json({ session: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create session' });
  }
});

// ── GET ALL OPEN SESSIONS ─────────────────────────────────
// GET /api/sessions
// Returns all open sessions for the lobby page
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        rs.id,
        rs.language,
        rs.status,
        rs.created_at,
        u.username AS owner
       FROM review_sessions rs
       JOIN users u ON rs.submitter_id = u.id
       WHERE rs.status = 'open'
       ORDER BY rs.created_at DESC
       LIMIT 20`
    );

    res.json({ sessions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch sessions' });
  }
});

// ── GET ONE SESSION ───────────────────────────────────────
// GET /api/sessions/:id
// Returns session data + all its comments
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get session
    const sessionResult = await pool.query(
      `SELECT rs.*, u.username AS owner
       FROM review_sessions rs
       JOIN users u ON rs.submitter_id = u.id
       WHERE rs.id = $1`,
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get all comments for this session
    const commentsResult = await pool.query(
      `SELECT 
        c.id,
        c.line_number AS "lineNumber",
        c.body,
        c.created_at,
        u.username AS author
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.session_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.json({
      session: sessionResult.rows[0],
      comments: commentsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch session' });
  }
});

module.exports = router;