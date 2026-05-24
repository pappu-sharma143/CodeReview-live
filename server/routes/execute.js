const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ── Judge0 language IDs ────────────────────────────────────
// Judge0 uses numeric IDs for languages
// Full list: https://ce.judge0.com/languages
const JUDGE0_LANG_IDS = {
  javascript: 63,   // Node.js 12.14.0
  typescript: 74,   // TypeScript 3.7.4
  python:     71,   // Python 3.8.1
  java:       62,   // Java 13.0.1
  cpp:        54,   // C++ (GCC 9.2.0)
  go:         60,   // Go 1.13.5
};

// ── POST /api/execute ──────────────────────────────────────
router.post('/', async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required' });
  }

  if (['react', 'html'].includes(language)) {
    return res.status(400).json({
      error: 'React and HTML run in the browser'
    });
  }

  const languageId = JUDGE0_LANG_IDS[language];
  if (!languageId) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  console.log(`▶ Running ${language} (Judge0 ID: ${languageId})`);

  try {
    // ── Step 1: Submit code to Judge0 ─────────────────────
    // Judge0 works in 2 steps:
    // 1. Submit → get a token
    // 2. Poll token → get result
    // OR use ?wait=true to do it in one request (simpler, slower)
    const submitRes = await fetch(
      'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key':  process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin:       '',         // no user input for now
          cpu_time_limit:    10,   // 10 seconds max
          memory_limit:      128000, // 128MB max
        })
      }
    );

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      console.error(`Judge0 ${submitRes.status}:`, errorText);

      if (submitRes.status === 429) {
        return res.status(429).json({
          error: '⚠️ Daily limit reached (50 runs/day on free tier). Try again tomorrow or upgrade.'
        });
      }
      if (submitRes.status === 401 || submitRes.status === 403) {
        return res.status(503).json({
          error: 'Invalid API key. Check your JUDGE0_API_KEY in .env'
        });
      }

      throw new Error(`Judge0 ${submitRes.status}: ${errorText}`);
    }

    const data = await submitRes.json();

    // ── Judge0 response shape ──────────────────────────────
    // data.stdout      — normal output
    // data.stderr      — runtime errors
    // data.compile_output — compile errors (Java, C++, Go)
    // data.status.id   — 3 = Accepted, 4 = Wrong Answer, 5 = TLE, 6 = CE etc
    // data.status.description — human readable status
    // data.exit_code   — process exit code

    console.log(`✅ Judge0 result: ${data.status?.description} | exit: ${data.exit_code}`);

    res.json({
      stdout:     data.stdout          || '',
      stderr:     data.stderr          || '',
      exitCode:   data.exit_code       ?? 0,
      compileErr: data.compile_output  || null,
      status:     data.status?.description || 'Unknown',
      statusId:   data.status?.id,
      language,
    });

  } catch (err) {
    console.error('Judge0 execution error:', err.message);
    res.status(500).json({
      error: 'Code execution failed. Please try again.'
    });
  }
});

module.exports = router;