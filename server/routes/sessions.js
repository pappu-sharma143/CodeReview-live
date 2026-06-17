const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');
const { hasSessionAccess, grantSessionAccess, buildJoinUrl } = require('../utils/sessionAccess');

router.use(authMiddleware);

// ── REDEEM INVITE LINK ────────────────────────────────────
router.post('/join/:token', async (req, res) => {
  const { token } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT rs.id, rs.language, rs.status, rs.created_at, u.username AS owner
       FROM review_sessions rs
       JOIN users u ON rs.submitter_id = u.id
       WHERE rs.join_token = $1 AND rs.status = 'open'`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired invite link' });
    }

    const session = result.rows[0];
    await grantSessionAccess(userId, session.id);

    res.json({ sessionId: session.id, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not join session' });
  }
});

// ── CREATE SESSION ────────────────────────────────────────
router.post('/', async (req, res) => {
  const { language = 'javascript' } = req.body;
  const submitterId = req.user.userId;
  const joinToken = crypto.randomBytes(32).toString('hex');

  try {
    const result = await pool.query(
      `INSERT INTO review_sessions (submitter_id, code, language, status, join_token)
       VALUES ($1, $2, $3, 'open', $4)
       RETURNING *`,
      [submitterId, '// Start typing your code here...', language, joinToken]
    );

    const session = result.rows[0];
    res.status(201).json({
      session: {
        ...session,
        joinUrl: buildJoinUrl(session.join_token),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create session' });
  }
});

// ── GET ACCESSIBLE OPEN SESSIONS ──────────────────────────
router.get('/', async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT
        rs.id,
        rs.language,
        rs.status,
        rs.created_at,
        u.username AS owner,
        (rs.submitter_id = $1) AS "isOwner"
       FROM review_sessions rs
       JOIN users u ON rs.submitter_id = u.id
       WHERE rs.status = 'open'
         AND (
           rs.submitter_id = $1
           OR EXISTS (
             SELECT 1 FROM session_access sa
             WHERE sa.session_id = rs.id AND sa.user_id = $1
           )
         )
       ORDER BY rs.created_at DESC
       LIMIT 20`,
      [userId]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch sessions' });
  }
});

// ── GET INVITE LINK (owner only) ──────────────────────────
router.get('/:id/invite', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'SELECT id, submitter_id, join_token FROM review_sessions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];
    if (session.submitter_id !== userId) {
      return res.status(403).json({ error: 'Only the session creator can share the invite link' });
    }

    res.json({ joinUrl: buildJoinUrl(session.join_token) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch invite link' });
  }
});

// ── GET ONE SESSION ───────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const allowed = await hasSessionAccess(userId, id);
    if (!allowed) {
      return res.status(403).json({ error: 'You do not have access to this session' });
    }

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

    const session = sessionResult.rows[0];
    const isOwner = session.submitter_id === userId;

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
      session: {
        ...session,
        isOwner,
        joinUrl: isOwner ? buildJoinUrl(session.join_token) : undefined,
      },
      comments: commentsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch session' });
  }
});

// ── DELETE SESSION ────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const check = await pool.query(
      'SELECT id, submitter_id FROM review_sessions WHERE id = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (check.rows[0].submitter_id !== userId) {
      return res.status(403).json({
        error: 'Only the session creator can delete it',
      });
    }

    await pool.query('DELETE FROM comments WHERE session_id = $1', [id]);
    await pool.query('DELETE FROM review_sessions WHERE id = $1', [id]);

    console.log(`🗑️  Session ${id} deleted by user ${userId}`);

    res.json({ message: 'Session deleted successfully', id });
  } catch (err) {
    console.error('Delete session error:', err.message);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;
