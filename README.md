# CodeReview.live

Real-time collaborative code review platform. Create a session, share the room, and review code line-by-line with live cursors, inline comments, voice notes, and Sandpack previews.

## Features

- **Live review rooms** — Multi-user sessions synced over Socket.io with presence, cursors, and file updates
- **Monaco editor** — Full IDE-style editing with syntax highlighting
- **Multi-file projects** — Create, edit, and delete files per session (JavaScript, TypeScript, React, HTML, and more)
- **Sandpack preview** — Run and preview code in the browser during a review
- **Inline comments** — Attach text feedback to specific lines of code
- **Voice notes** — Record up to 30-second audio comments on a line
- **Session lobby** — Browse open sessions and join as a reviewer
- **Ratings & reputation** — Session owners rate reviewers; reputation scores update automatically
- **User profiles** — Track submitted sessions, reviews given, and comment activity
- **JWT auth** — HttpOnly cookie-based authentication (register, login, logout)

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite, React Router, Tailwind CSS 4, Monaco Editor, Sandpack, Socket.io Client |
| **Backend** | Node.js, Express 5, Socket.io, PostgreSQL, Redis (optional cache) |
| **Auth** | bcrypt, JSON Web Tokens (httpOnly cookies) |

## Project Structure

```
codereview-live/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── api/            # Axios client
│   │   ├── components/     # UI, editor, landing page
│   │   ├── context/        # Auth context
│   │   ├── hooks/          # useSocket, parallax, etc.
│   │   ├── pages/          # Landing, Auth, Lobby, Session, Profile
│   │   └── utils/          # Language templates for Sandpack
│   └── vite.config.js      # Dev proxy for /api and /socket.io
└── server/                 # Express + Socket.io backend
    ├── routes/             # REST API (auth, sessions, comments, ratings, profile)
    ├── socket/             # Real-time room handlers
    ├── models/             # DB pool + schema init
    ├── middleware/         # JWT auth middleware
    └── redis.js            # Optional Redis cache wrapper
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) 14+
- [Redis](https://redis.io/) (optional — improves session join performance)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd codereview-live
```

### 2. Set up the database

Create a PostgreSQL database, then run the schema initializer:

```bash
cd server
npm install
node models/init.js
```

The initializer creates base tables. For full app functionality, also apply these migrations if the columns do not already exist:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

ALTER TABLE review_sessions ADD COLUMN IF NOT EXISTS files JSONB;
ALTER TABLE review_sessions ADD COLUMN IF NOT EXISTS rating INT;
ALTER TABLE review_sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
```

### 3. Configure environment variables

Create `server/.env` (see `server/.env.example` for all options):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/codereview
JWT_SECRET=your-long-random-secret
PORT=5000

# Optional
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Redis (optional — app works without it)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=

# Judge0 via RapidAPI (optional — enables POST /api/execute)
# JUDGE0_API_KEY=your-rapidapi-key
```

For production builds of the client, you can set:

```env
# client/.env (optional)
VITE_API_URL=https://your-api-domain.com/api
```

In development, Vite proxies `/api` and `/socket.io` to `http://localhost:5000`, so no client env file is required.

### 4. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 5. Run the app

Start the backend and frontend in separate terminals:

```bash
# Terminal 1 — API + WebSocket server (port 5000)
cd server
npm run dev

# Terminal 2 — Vite dev server (port 5173)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production build

```bash
cd client
npm run build
npm run preview
```

Serve the built client behind a reverse proxy that forwards `/api` and `/socket.io` to the backend. Set `CLIENT_URL` and `NODE_ENV=production` on the server.

## How It Works

1. **Sign up / log in** — Credentials are validated; a JWT is stored in an httpOnly cookie.
2. **Create a session** — From the lobby, start a new review room and pick a language template.
3. **Join a session** — Other users browse open sessions in the lobby and enter the room.
4. **Review together** — Code, files, cursors, and comments sync in real time via Socket.io.
5. **End & rate** — The session owner ends the review and rates the reviewer (1–5 stars).

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/logout` | Sign out |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/sessions` | List open sessions |
| `POST` | `/api/sessions` | Create session |
| `GET` | `/api/sessions/:id` | Session + comments |
| `DELETE` | `/api/sessions/:id` | Delete session (owner only) |
| `POST` | `/api/ratings/session/:id` | Rate reviewer |
| `POST` | `/api/comments` | Save text comment |
| `POST` | `/api/execute` | Run code via Judge0 (requires `JUDGE0_API_KEY`) |
| `GET` | `/api/profile/me` | Your profile & history |
| `GET` | `/api/profile/:username` | Public user stats |

## Real-Time Events (Socket.io)

Clients join a room with `join-room` and receive `session-init` (files, comments, language). Key events:

| Event | Direction | Purpose |
|-------|-----------|---------|
| `file-change` | bidirectional | Sync file edits |
| `file-created` / `file-deleted` | bidirectional | Multi-file management |
| `cursor-move` | bidirectional | Live cursor positions |
| `new-comment` | server broadcast | Text comments |
| `voice-note` | client → server | Audio comments (base64, max 2MB) |
| `end-session` | client → server | Notify room that review ended |
| `user-joined` / `user-left` | server broadcast | Presence |

Socket connections require a valid auth cookie; unauthenticated connections are rejected.

## Scripts

**Server**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |

**Client**

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## License

ISC
