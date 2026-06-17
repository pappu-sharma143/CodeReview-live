const pool = require('../models/db');

const hasSessionAccess = async (userId, sessionId) => {
  const result = await pool.query(
    `SELECT 1 FROM review_sessions rs
     WHERE rs.id = $1 AND (
       rs.submitter_id = $2 OR
       EXISTS (
         SELECT 1 FROM session_access sa
         WHERE sa.session_id = rs.id AND sa.user_id = $2
       )
     )`,
    [sessionId, userId]
  );
  return result.rows.length > 0;
};

const grantSessionAccess = async (userId, sessionId) => {
  await pool.query(
    `INSERT INTO session_access (session_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [sessionId, userId]
  );
};

const buildJoinUrl = (token) => {
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${base}/join/${token}`;
};

module.exports = { hasSessionAccess, grantSessionAccess, buildJoinUrl };
