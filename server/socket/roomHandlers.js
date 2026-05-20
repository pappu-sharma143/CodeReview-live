const pool = require('../models/db');

// Debounce timers — one per session
// Prevents hammering DB on every single keystroke
// Only saves after user pauses typing for 1 second
const saveTimeouts = {};

const registerRoomHandlers = (io, socket) => {

  // ── JOIN ROOM ───────────────────────────────────────────
  socket.on('join-room', async ({ sessionId }) => {
    const username = socket.user.username;
    const room = `session:${sessionId}`;

    socket.join(room);
    socket.username = username;
    socket.currentRoom = room;
    socket.currentSessionId = sessionId;

    console.log(`${username} joined room ${room}`);

    try {
      // Load existing session data from DB
      // This is what a late-joining user sees — existing code + comments
      const sessionResult = await pool.query(
        'SELECT code, language FROM review_sessions WHERE id = $1',
        [sessionId]
      );

      const commentsResult = await pool.query(
        `SELECT
          c.line_number AS "lineNumber",
          c.body,
          u.username   AS author
         FROM comments c
         JOIN users u ON c.author_id = u.id
         WHERE c.session_id = $1
         ORDER BY c.created_at ASC`,
        [sessionId]
      );

      if (sessionResult.rows.length > 0) {
        // Send ONLY to the socket that just joined
        // socket.emit = just this user
        // socket.to(room).emit = everyone else
        // io.to(room).emit = everyone including this user
        socket.emit('session-init', {
          code: sessionResult.rows[0].code,
          language: sessionResult.rows[0].language,
          comments: commentsResult.rows
        });
      }

    } catch (err) {
      console.error('Failed to load session data:', err);
    }

    // Tell everyone else in room that this user joined
    socket.to(room).emit('user-joined', { username });
  });

  // ── CODE CHANGE ─────────────────────────────────────────
  socket.on('code-change', ({ sessionId, code }) => {

    // 1. Broadcast instantly to room for real-time feel
    socket.to(`session:${sessionId}`).emit('code-change', { code });

    // 2. Debounced DB save
    // Why debounce? User types 10 chars/sec = 10 DB writes/sec without this
    // With 1s debounce = 1 write per pause = efficient
    if (saveTimeouts[sessionId]) {
      clearTimeout(saveTimeouts[sessionId]);
    }

    saveTimeouts[sessionId] = setTimeout(async () => {
      try {
        await pool.query(
          'UPDATE review_sessions SET code = $1 WHERE id = $2',
          [code, sessionId]
        );
        console.log(`💾 Saved code for session ${sessionId}`);
      } catch (err) {
        console.error('Failed to save code to DB:', err);
      }
    }, 1000);
  });

  // ── CURSOR MOVE ─────────────────────────────────────────
  socket.on('cursor-move', ({ sessionId, position }) => {
    // Broadcast cursor position to everyone else in room
    // No DB save needed — cursor positions are ephemeral
    socket.to(`session:${sessionId}`).emit('cursor-move', {
      username: socket.user.username, // always from verified token
      position
    });
  });

  // ── NEW COMMENT ─────────────────────────────────────────
  socket.on('new-comment', async ({ sessionId, comment }) => {
    try {
      // 1. Save to DB first so it gets a real ID and timestamp
      const result = await pool.query(
        `INSERT INTO comments (session_id, author_id, line_number, body)
         VALUES ($1, $2, $3, $4)
         RETURNING
           id,
           line_number AS "lineNumber",
           body,
           created_at`,
        [
          sessionId,
          socket.user.id,       // from verified token — cannot be faked
          comment.lineNumber,
          comment.body
        ]
      );

      // 2. Build the full comment object to broadcast
      const savedComment = {
        ...result.rows[0],
        author: socket.user.username // attach username from token
      };

      // 3. Broadcast to EVERYONE in room including sender
      // io.to() = all sockets in room
      // We use io.to() not socket.to() so sender also sees it appear
      io.to(`session:${sessionId}`).emit('new-comment', {
        comment: savedComment
      });

    } catch (err) {
      console.error('Failed to save comment:', err);

      // DB failed but still broadcast so real-time doesn't break
      // Comment won't persist but users can still see it live
      io.to(`session:${sessionId}`).emit('new-comment', {
        comment: {
          ...comment,
          author: socket.user.username
        }
      });
    }
  });

  // ── DISCONNECT ──────────────────────────────────────────
  socket.on('disconnect', () => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('user-left', {
        username: socket.user.username
      });
      console.log(`${socket.user.username} left ${socket.currentRoom}`);
    }
  });
};

module.exports = registerRoomHandlers;