const pool = require('../models/db');
const redis = require('../redis');
const { hasSessionAccess } = require('../utils/sessionAccess');
const { isCreatorOnline } = require('../utils/sessionPresence');
const { validateComment } = require('../utils/validateComment');
const { saveVoiceNote } = require('../utils/voiceNoteStorage');
const {
  grantEditAccess,
  revokeEditAccess,
  hasEditAccess,
  addPendingEditRequest,
  getPendingEditRequests,
  clearSessionPermissions,
} = require('../utils/sessionPermissions');

const CACHE_TTL = 60 * 30;
const saveTimeouts = {};

const clearSaveTimeoutsForSession = (sessionId) => {
  const prefix = `${sessionId}-`;
  Object.keys(saveTimeouts).forEach((key) => {
    if (key.startsWith(prefix)) {
      clearTimeout(saveTimeouts[key]);
      delete saveTimeouts[key];
    }
  });
};

const scheduleDebouncedSave = (timerKey, saveFn) => {
  if (saveTimeouts[timerKey]) clearTimeout(saveTimeouts[timerKey]);

  saveTimeouts[timerKey] = setTimeout(async () => {
    delete saveTimeouts[timerKey];
    try {
      await saveFn();
    } catch (err) {
      console.error('Debounced save failed:', err.message);
    }
  }, 1000);
};

const getSubmitterId = async (sessionId) => {
  const result = await pool.query(
    'SELECT submitter_id FROM review_sessions WHERE id = $1',
    [sessionId]
  );
  return result.rows[0]?.submitter_id ?? null;
};

const canEditCode = async (socket, sessionId) => {
  const submitterId = await getSubmitterId(sessionId);
  if (!submitterId) return false;
  if (socket.user.id === submitterId) return true;
  return hasEditAccess(sessionId, socket.user.id);
};

const notifyUserInRoom = async (io, sessionId, userId, event, payload) => {
  const sockets = await io.in(`session:${sessionId}`).fetchSockets();
  sockets.forEach((s) => {
    if (s.user?.id === userId) s.emit(event, payload);
  });
};

const notifyCreatorInRoom = async (io, sessionId, creatorId, event, payload) => {
  await notifyUserInRoom(io, sessionId, creatorId, event, payload);
};

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

    const allowed = await hasSessionAccess(socket.user.id, sessionId);
    if (!allowed) {
      socket.emit('join-denied', { message: 'You do not have access to this session' });
      return;
    }

    const submitterId = await getSubmitterId(sessionId);
    if (!submitterId) {
      socket.emit('join-denied', { message: 'Session not found' });
      return;
    }

    const isOwner = submitterId === socket.user.id;

    if (!isOwner) {
      const creatorPresent = await isCreatorOnline(sessionId, submitterId);
      if (!creatorPresent) {
        socket.emit('join-denied', {
          message: 'The session creator has not opened this session yet. Please wait until they join.',
          reason: 'creator-offline',
        });
        return;
      }
    }

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
            c.id,
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

    try {
      const socketsInRoom = await io.in(room).fetchSockets();
      const seen = new Set();
      for (const s of socketsInRoom) {
        if (!s.user || s.user.id === socket.user.id) continue;
        if (seen.has(s.user.id)) continue;
        seen.add(s.user.id);
        socket.emit('user-joined', {
          username: s.user.username,
          userId: s.user.id,
          isCreator: s.user.id === submitterId,
        });
      }
    } catch (err) {
      console.error('Failed to sync room users:', err.message);
    }

    socket.to(room).emit('user-joined', {
      username,
      userId: socket.user.id,
      isCreator: isOwner,
    });

    const canEdit = isOwner || hasEditAccess(sessionId, socket.user.id);
    socket.emit('session-role', {
      isOwner,
      canEdit,
      role: isOwner ? 'creator' : 'reviewer',
    });

    if (isOwner) {
      socket.emit('edit-requests-sync', {
        requests: getPendingEditRequests(sessionId),
      });
    }
  });

  // ── EDIT ACCESS REQUEST ───────────────────────────────────
  socket.on('request-edit-access', async ({ sessionId }) => {
    const submitterId = await getSubmitterId(sessionId);
    if (!submitterId || socket.user.id === submitterId) return;

    if (hasEditAccess(sessionId, socket.user.id)) {
      socket.emit('edit-access-granted');
      return;
    }

    addPendingEditRequest(sessionId, socket.user.id, socket.user.username);
    socket.emit('edit-access-pending');

    await notifyCreatorInRoom(io, sessionId, submitterId, 'edit-access-request', {
      userId: socket.user.id,
      username: socket.user.username,
    });
  });

  socket.on('respond-edit-access', async ({ sessionId, userId, approved }) => {
    const submitterId = await getSubmitterId(sessionId);
    if (socket.user.id !== submitterId) {
      socket.emit('edit-access-denied', { message: 'Only the session creator can respond' });
      return;
    }

    if (approved) {
      grantEditAccess(sessionId, userId);
      await notifyUserInRoom(io, sessionId, userId, 'edit-access-granted');
    } else {
      revokeEditAccess(sessionId, userId);
      await notifyUserInRoom(io, sessionId, userId, 'edit-access-denied', {
        message: 'Your edit request was declined',
      });
    }

    socket.emit('edit-requests-sync', {
      requests: getPendingEditRequests(sessionId),
    });
  });

  // ── FILE CHANGE ─────────────────────────────────────────
  socket.on('file-change', async ({ sessionId, path, content }) => {
    if (!(await canEditCode(socket, sessionId))) {
      socket.emit('edit-denied', { message: 'You do not have permission to edit code' });
      return;
    }

    socket.to(`session:${sessionId}`).emit('file-change', { path, content });

    const timerKey = `${sessionId}-${path}`;
    scheduleDebouncedSave(timerKey, async () => {
      await pool.query(
        `UPDATE review_sessions
         SET files = COALESCE(files, '{}'::jsonb) || $1::jsonb
         WHERE id = $2`,
        [JSON.stringify({ [path]: content }), sessionId]
      );
      await cacheDel(`session:${sessionId}:init`);
      console.log(`💾 Saved ${path} + cache cleared for session ${sessionId}`);
    });
  });

  // ── FILE CREATED ─────────────────────────────────────────
  socket.on('file-created', async ({ sessionId, path, content }) => {
    if (!(await canEditCode(socket, sessionId))) {
      socket.emit('edit-denied', { message: 'You do not have permission to edit code' });
      return;
    }

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
  socket.on('file-deleted', async ({ sessionId, path }) => {
    if (!(await canEditCode(socket, sessionId))) {
      socket.emit('edit-denied', { message: 'You do not have permission to edit code' });
      return;
    }

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
  socket.on('code-change', async ({ sessionId, code }) => {
    if (!(await canEditCode(socket, sessionId))) {
      socket.emit('edit-denied', { message: 'You do not have permission to edit code' });
      return;
    }

    socket.to(`session:${sessionId}`).emit('code-change', { code });

    const timerKey = `${sessionId}-legacy`;
    scheduleDebouncedSave(timerKey, async () => {
      await pool.query(
        'UPDATE review_sessions SET code = $1 WHERE id = $2',
        [code, sessionId]
      );
      await cacheDel(`session:${sessionId}:init`);
      console.log(`💾 Saved code for session ${sessionId}`);
    });
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
    const validated = validateComment({
      lineNumber: comment?.lineNumber,
      body: comment?.body,
    });
    if (validated.error) {
      socket.emit('comment-error', { error: validated.error });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO comments (session_id, author_id, line_number, body)
         VALUES ($1, $2, $3, $4)
         RETURNING id, line_number AS "lineNumber", body, created_at`,
        [sessionId, socket.user.id, validated.lineNumber, validated.body]
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
      const audioPath = await saveVoiceNote(sessionId, base64, mimeType);

      const result = await pool.query(
        `INSERT INTO comments (session_id, author_id, line_number, body, audio_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, line_number AS "lineNumber", body, audio_url AS "audioUrl", created_at`,
        [sessionId, socket.user.id, lineNumber, '🎙️ Voice note', audioPath]
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
      console.log(`✅ Voice note saved to ${audioPath}`);

    } catch (err) {
      console.error('Failed to save voice note:', err.message);
      socket.emit('voice-note-error', { error: 'Failed to save voice note' });
    }
  });

  // ── END SESSION ─────────────────────────────────────────
  socket.on('end-session', async ({ sessionId }) => {
    try {
      const result = await pool.query(
        'SELECT submitter_id FROM review_sessions WHERE id = $1',
        [sessionId]
      );

      if (result.rows.length === 0) return;

      if (result.rows[0].submitter_id !== socket.user.id) {
        socket.emit('end-session-denied', {
          message: 'Only the session creator can end the session',
        });
        return;
      }

      io.to(`session:${sessionId}`).emit('session-ended', {
        endedBy:   socket.user.username,
        endedById: socket.user.id,
      });
      clearSessionPermissions(sessionId);
      clearSaveTimeoutsForSession(sessionId);
      console.log(`🔚 Session ${sessionId} ended by ${socket.user.username}`);
    } catch (err) {
      console.error('Failed to end session:', err.message);
    }
  });

  // ── DELETE SESSION ───────────────────────────────────────
  // Fired AFTER REST DELETE succeeds — notifies everyone in room
  socket.on('delete-session', ({ sessionId }) => {
    io.to(`session:${sessionId}`).emit('session-deleted', {
      deletedBy: socket.user.username
    });
    cacheDel(`session:${sessionId}:init`);
    clearSessionPermissions(sessionId);
    clearSaveTimeoutsForSession(sessionId);
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
      revokeEditAccess(socket.currentSessionId, socket.user.id);
      clearSaveTimeoutsForSession(socket.currentSessionId);
    }
  });

};

module.exports = registerRoomHandlers;