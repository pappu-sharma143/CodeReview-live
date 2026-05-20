const pool = require('./db');

const createTables = async () => {

  // USERS table
  // Every person who signs up gets a row here
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      username  VARCHAR(50)  UNIQUE NOT NULL,
      email     VARCHAR(100) UNIQUE NOT NULL,
      password  TEXT         NOT NULL,
      reputation INT         DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // SERIAL = auto-incrementing number (1, 2, 3...)
  // UNIQUE = no two users can have the same username/email
  // NOT NULL = this field is required
  // DEFAULT = value used when you don't provide one

  // REVIEW SESSIONS table
  // One row = one code review request
  await pool.query(`
    CREATE TABLE IF NOT EXISTS review_sessions (
      id           SERIAL PRIMARY KEY,
      submitter_id INT  REFERENCES users(id),
      reviewer_id  INT  REFERENCES users(id),
      code         TEXT NOT NULL,
      language     VARCHAR(30) DEFAULT 'javascript',
      status       VARCHAR(20) DEFAULT 'open',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // REFERENCES users(id) = foreign key
  // status: 'open' → someone submitted, waiting for reviewer
  //         'active' → reviewer joined, session live
  //         'done' → review completed

  // COMMENTS table
  // Inline comments on specific lines of code
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id         SERIAL PRIMARY KEY,
      session_id INT  REFERENCES review_sessions(id),
      author_id  INT  REFERENCES users(id),
      line_number INT NOT NULL,
      body       TEXT,
      audio_url  TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // audio_url = path to voice note file (Phase 5)
  // line_number = which line of code this comment is on

  console.log('✅ Tables created');
};

createTables().catch(console.error);