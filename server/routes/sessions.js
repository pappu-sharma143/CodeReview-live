const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ── CREATE SESSION ────────────────────────────────────────
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
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
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

// ── DELETE SESSION ────────────────────────────────────────
// DELETE /api/sessions/:id
// Only the session creator can delete it
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Check session exists and user owns it
    const check = await pool.query(
      'SELECT id, submitter_id FROM review_sessions WHERE id = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (check.rows[0].submitter_id !== userId) {
      return res.status(403).json({
        error: 'Only the session creator can delete it'
      });
    }

    // Delete comments first — foreign key constraint
    await pool.query('DELETE FROM comments WHERE session_id = $1', [id]);

    // Delete the session
    await pool.query('DELETE FROM review_sessions WHERE id = $1', [id]);

    console.log(`🗑️  Session ${id} deleted by user ${userId}`);

    res.json({ message: 'Session deleted successfully', id });

  } catch (err) {
    console.error('Delete session error:', err.message);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;