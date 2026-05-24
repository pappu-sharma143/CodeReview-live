const pool = require('../models/db');
const redis = require('../redis');

const CACHE_TTL = 60 * 30;
const saveTimeouts = {};

const cacheGet = async (key) => {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.warn('Redis get failed:', err.message);
    return null;
  }
};

const cacheSet = async (key, data, ttl = CACHE_TTL) => {
  try {
    const str = JSON.stringify(data);
    if (str.length < 500 * 1024) {
      await redis.setex(key, ttl, str);
    }
  } catch (err) {
    console.warn('Redis set failed:', err.message);
  }
};

const cacheDel = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    console.warn('Redis del failed:', err.message);
  }
};

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
      const cacheKey = `session:${sessionId}:init`;
      let sessionData = await cacheGet(cacheKey);

      if (sessionData) {
        console.log(`⚡ Cache hit for session ${sessionId}`);
      } else {
        console.log(`🗄️  Cache miss for session ${sessionId}`);

        const sessionResult = await pool.query(
          'SELECT code, language, files FROM review_sessions WHERE id = $1',
          [sessionId]
        );

        const commentsResult = await pool.query(
          `SELECT
            c.line_number  AS "lineNumber",
            c.body,
            c.audio_url    AS "audioUrl",
            c.created_at,
            u.username     AS author
           FROM comments c
           JOIN users u ON c.author_id = u.id
           WHERE c.session_id = $1
           ORDER BY c.created_at ASC`,
          [sessionId]
        );

        if (sessionResult.rows.length > 0) {
          const session = sessionResult.rows[0];
          const comments = commentsResult.rows.map(c => ({
            ...c,
            isVoiceNote: !!c.audioUrl,
            duration: c.body?.startsWith('🎙️') ? 30 : 0
          }));

          sessionData = {
            files:    session.files && Object.keys(session.files).length > 0
                      ? session.files : null,
            code:     session.code,
            language: session.language,
            comments
          };

          await cacheSet(cacheKey, sessionData);
          console.log(`💾 Cached session ${sessionId}`);
        }
      }

      if (sessionData) {
        socket.emit('session-init', sessionData);
      }

    } catch (err) {
      console.error('Failed to load session data:', err.message);
    }

    socket.to(room).emit('user-joined', {
      username,
      userId: socket.user.id
    });
  });

  // ── FILE CHANGE ─────────────────────────────────────────
  socket.on('file-change', ({ sessionId, path, content }) => {
    socket.to(`session:${sessionId}`).emit('file-change', { path, content });

    const timerKey = `${sessionId}-${path}`;
    if (saveTimeouts[timerKey]) clearTimeout(saveTimeouts[timerKey]);

    saveTimeouts[timerKey] = setTimeout(async () => {
      try {
        await pool.query(
          `UPDATE review_sessions
           SET files = COALESCE(files, '{}'::jsonb) || $1::jsonb
           WHERE id = $2`,
          [JSON.stringify({ [path]: content }), sessionId]
        );
        await cacheDel(`session:${sessionId}:init`);
        console.log(`💾 Saved ${path} + cache cleared for session ${sessionId}`);
      } catch (err) {
        console.error('Failed to save file:', err.message);
      }
    }, 1000);
  });

  // ── FILE CREATED ─────────────────────────────────────────
  socket.on('file-created', ({ sessionId, path, content }) => {
    socket.to(`session:${sessionId}`).emit('file-created', { path, content });

    pool.query(
      `UPDATE review_sessions
       SET files = COALESCE(files, '{}'::jsonb) || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify({ [path]: content || '' }), sessionId]
    ).then(async () => {
      await cacheDel(`session:${sessionId}:init`);
      console.log(`📄 Created ${path} in session ${sessionId}`);
    }).catch(err => {
      console.error('Failed to save new file:', err.message);
    });
  });

  // ── FILE DELETED ─────────────────────────────────────────
  socket.on('file-deleted', ({ sessionId, path }) => {
    socket.to(`session:${sessionId}`).emit('file-deleted', { path });

    pool.query(
      `UPDATE review_sessions SET files = files - $1 WHERE id = $2`,
      [path, sessionId]
    ).then(async () => {
      await cacheDel(`session:${sessionId}:init`);
      console.log(`🗑️  Deleted ${path} from session ${sessionId}`);
    }).catch(err => {
      console.error('Failed to delete file:', err.message);
    });
  });

  // ── CODE CHANGE (legacy) ─────────────────────────────────
  socket.on('code-change', ({ sessionId, code }) => {
    socket.to(`session:${sessionId}`).emit('code-change', { code });

    const timerKey = `${sessionId}-legacy`;
    if (saveTimeouts[timerKey]) clearTimeout(saveTimeouts[timerKey]);

    saveTimeouts[timerKey] = setTimeout(async () => {
      try {
        await pool.query(
          'UPDATE review_sessions SET code = $1 WHERE id = $2',
          [code, sessionId]
        );
        await cacheDel(`session:${sessionId}:init`);
        console.log(`💾 Saved code for session ${sessionId}`);
      } catch (err) {
        console.error('Failed to save code:', err.message);
      }
    }, 1000);
  });

  // ── CURSOR MOVE ─────────────────────────────────────────
  socket.on('cursor-move', ({ sessionId, position }) => {
    socket.to(`session:${sessionId}`).emit('cursor-move', {
      username: socket.user.username,
      position
    });
  });

  // ── NEW COMMENT ─────────────────────────────────────────
  socket.on('new-comment', async ({ sessionId, comment }) => {
    try {
      const result = await pool.query(
        `INSERT INTO comments (session_id, author_id, line_number, body)
         VALUES ($1, $2, $3, $4)
         RETURNING id, line_number AS "lineNumber", body, created_at`,
        [sessionId, socket.user.id, comment.lineNumber, comment.body]
      );

      const savedComment = {
        ...result.rows[0],
        author:      socket.user.username,
        file:        comment.file || null,
        isVoiceNote: false
      };

      await cacheDel(`session:${sessionId}:init`);
      io.to(`session:${sessionId}`).emit('new-comment', { comment: savedComment });

    } catch (err) {
      console.error('Failed to save comment:', err.message);
      io.to(`session:${sessionId}`).emit('new-comment', {
        comment: { ...comment, author: socket.user.username, isVoiceNote: false }
      });
    }
  });

  // ── VOICE NOTE ──────────────────────────────────────────
  socket.on('voice-note', async ({ sessionId, lineNumber, base64, duration, mimeType, file }) => {
    if (!base64 || !lineNumber) {
      console.error('Voice note missing required fields');
      return;
    }

    const sizeBytes = Buffer.byteLength(base64, 'utf8');
    if (sizeBytes > 2 * 1024 * 1024) {
      socket.emit('voice-note-error', { error: 'Voice note too large (max 2MB)' });
      return;
    }

    console.log(`🎙️  Voice note from ${socket.user.username} — ${Math.round(sizeBytes / 1024)}KB`);

    try {
      const result = await pool.query(
        `INSERT INTO comments (session_id, author_id, line_number, body, audio_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, line_number AS "lineNumber", body, audio_url AS "audioUrl", created_at`,
        [sessionId, socket.user.id, lineNumber, '🎙️ Voice note', base64]
      );

      const savedComment = {
        ...result.rows[0],
        author:      socket.user.username,
        file:        file || null,
        isVoiceNote: true,
        duration,
        mimeType
      };

      await cacheDel(`session:${sessionId}:init`);
      io.to(`session:${sessionId}`).emit('new-comment', { comment: savedComment });
      console.log(`✅ Voice note saved for session ${sessionId}`);

    } catch (err) {
      console.error('Failed to save voice note:', err.message);
      io.to(`session:${sessionId}`).emit('new-comment', {
        comment: {
          lineNumber, body: '🎙️ Voice note',
          audioUrl: base64, author: socket.user.username,
          file: file || null, isVoiceNote: true, duration, mimeType
        }
      });
    }
  });

  // ── END SESSION ─────────────────────────────────────────
  socket.on('end-session', ({ sessionId }) => {
    io.to(`session:${sessionId}`).emit('session-ended', {
      endedBy:   socket.user.username,
      endedById: socket.user.id
    });
    console.log(`🔚 Session ${sessionId} ended by ${socket.user.username}`);
  });

  // ── DELETE SESSION ───────────────────────────────────────
  // Fired AFTER REST DELETE succeeds — notifies everyone in room
  socket.on('delete-session', ({ sessionId }) => {
    // Broadcast to everyone including sender — kicks all out
    io.to(`session:${sessionId}`).emit('session-deleted', {
      deletedBy: socket.user.username
    });
    // Clear Redis cache for this session
    cacheDel(`session:${sessionId}:init`);
    console.log(`🗑️  Session ${sessionId} deleted by ${socket.user.username}`);
  });

  // ── DISCONNECT ──────────────────────────────────────────
  socket.on('disconnect', () => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('user-left', {
        username: socket.user.username
      });
      console.log(`${socket.user.username} left ${socket.currentRoom}`);
    }

    if (socket.currentSessionId) {
      const prefix = `${socket.currentSessionId}-`;
      Object.keys(saveTimeouts).forEach(key => {
        if (key.startsWith(prefix)) {
          clearTimeout(saveTimeouts[key]);
          delete saveTimeouts[key];
        }
      });
    }
  });

};

module.exports = registerRoomHandlers;