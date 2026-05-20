import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    min-height: 100vh;
    background: #0d0d0f;
    display: flex;
    font-family: 'Syne', sans-serif;
    overflow: hidden;
  }

  /* Left panel — branding */
  .auth-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 64px;
    position: relative;
    border-right: 1px solid #1e1e24;
  }

  .auth-left::before {
    content: '';
    position: absolute;
    top: -200px; left: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  .brand-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 3px;
    color: #6366f1;
    text-transform: uppercase;
    margin-bottom: 24px;
  }

  .brand-name {
    font-size: 52px;
    font-weight: 800;
    color: #f0f0f5;
    line-height: 1.05;
    margin-bottom: 16px;
  }

  .brand-name span {
    color: #6366f1;
  }

  .brand-desc {
    font-size: 16px;
    color: #5a5a6e;
    line-height: 1.7;
    max-width: 380px;
    margin-bottom: 48px;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #3e3e52;
  }

  .feature-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #6366f1;
    flex-shrink: 0;
  }

  /* Right panel — form */
  .auth-right {
    width: 480px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 56px;
  }

  .auth-card {
    width: 100%;
  }

  .tab-row {
    display: flex;
    gap: 0;
    margin-bottom: 36px;
    border-bottom: 1px solid #1e1e24;
  }

  .tab-btn {
    flex: 1;
    padding: 14px 0;
    background: none;
    border: none;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #3e3e52;
    cursor: pointer;
    letter-spacing: 0.5px;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.2s;
  }

  .tab-btn.active {
    color: #f0f0f5;
    border-bottom-color: #6366f1;
  }

  .form-title {
    font-size: 26px;
    font-weight: 800;
    color: #f0f0f5;
    margin-bottom: 8px;
  }

  .form-subtitle {
    font-size: 13px;
    color: #5a5a6e;
    margin-bottom: 32px;
    font-family: 'JetBrains Mono', monospace;
  }

  .field {
    margin-bottom: 18px;
  }

  .field label {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    color: #5a5a6e;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .field input {
    width: 100%;
    padding: 13px 16px;
    background: #111115;
    border: 1px solid #1e1e24;
    border-radius: 8px;
    color: #f0f0f5;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .field input:focus {
    border-color: #6366f1;
  }

  .field input::placeholder {
    color: #2e2e3e;
  }

  .error-box {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px;
    padding: 12px 16px;
    color: #f87171;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    margin-bottom: 18px;
  }

  .submit-btn {
    width: 100%;
    padding: 15px;
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.5px;
    margin-top: 8px;
    transition: background 0.2s, transform 0.1s;
  }

  .submit-btn:hover { background: #4f52d4; }
  .submit-btn:active { transform: scale(0.99); }
  .submit-btn:disabled { background: #2e2e3e; color: #5a5a6e; cursor: not-allowed; }

  @media (max-width: 768px) {
    .auth-left { display: none; }
    .auth-right { width: 100%; padding: 32px 24px; }
  }
`;

// ── Component ───────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState('login');       // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.username.trim()) return setError('Username is required');
        await register(form.username, form.email, form.password);
      }
      // After login/register → go to a session
      // For now navigate to session 1. In Phase 4 you'll build a proper lobby.
      navigate('/lobby');
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="auth-root">

        {/* ── Left: branding ── */}
        <div className="auth-left">
          <p className="brand-tag">// collaborative code review</p>
          <h1 className="brand-name">Code<span>Review</span><br />.live</h1>
          <p className="brand-desc">
            Real-time code review sessions with live cursors,
            inline comments, and voice notes. Built for engineers
            who care about craft.
          </p>
          <div className="feature-list">
            {[
              'Monaco Editor — same engine as VS Code',
              'Live cursor sync via Socket.io',
              'Inline comments per line',
              'Voice notes up to 30s',
              'JWT auth with httpOnly cookies',
            ].map(f => (
              <div className="feature-item" key={f}>
                <div className="feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="auth-right">
          <div className="auth-card">

            <div className="tab-row">
              <button
                className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
                onClick={() => { setTab('login'); setError(''); }}
              >
                Login
              </button>
              <button
                className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
                onClick={() => { setTab('register'); setError(''); }}
              >
                Register
              </button>
            </div>

            <h2 className="form-title">
              {tab === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="form-subtitle">
              {tab === 'login'
                ? '// enter your credentials'
                : '// join the platform'}
            </p>

            {tab === 'register' && (
              <div className="field">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="pappu"
                  value={form.username}
                  onChange={set('username')}
                  onKeyDown={handleKey}
                  autoFocus
                />
              </div>
            )}

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                onKeyDown={handleKey}
                autoFocus={tab === 'login'}
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                onKeyDown={handleKey}
              />
            </div>

            {error && <div className="error-box">⚠ {error}</div>}

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : tab === 'login' ? 'Sign in →' : 'Create account →'}
            </button>

          </div>
        </div>

      </div>
    </>
  );
}