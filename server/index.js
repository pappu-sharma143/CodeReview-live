const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('./models/db');
const createTables = require('./models/init');
const { assertJwtSecret } = require('./utils/jwt');
const app = express();
const server = http.createServer(app);

// ── Middleware ─────────────────────────────────────────────
// Must come BEFORE routes — middleware runs in order
// If routes are registered first, these never run for those routes
app.set('trust proxy', 1);
const corsOptions = {
  origin: true,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ─────────────────────────────────────────────────
// Registered AFTER middleware so they benefit from cors + json
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const commentRoutes = require('./routes/comments');
const ratingRoutes = require('./routes/ratings');
const profileRoutes = require('./routes/profile');

const executeRoutes = require('./routes/execute');

app.use('/api/profile', profileRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/execute', executeRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'CodeReview.live server running ✅' });
});

// ── Socket.io ──────────────────────────────────────────────
const io = new Server(server, { cors: corsOptions });
const { setIo } = require('./utils/sessionPresence');
setIo(io);
const registerRoomHandlers = require('./socket/roomHandlers');

// ── Socket auth middleware ─────────────────────────────────
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error('Not authenticated'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      'SELECT id, username FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return next(new Error('User no longer exists'));
    }

    socket.user = result.rows[0]; // { id, username }
    next();

  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// ── Socket connection ──────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`${socket.user.username} connected`);
  registerRoomHandlers(io, socket);
});

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

createTables()
  .then(() => {
    assertJwtSecret();
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });