import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import api from '../api/axios';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lobby-root {
    min-height: 100vh;
    background: #080810;
    color: #e8e8f0;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Nav ── */
  .lobby-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    height: 56px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: #080810;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .lobby-brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    color: #7c6af7;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lobby-brand-tag { color: rgba(255,255,255,0.3); }

  .lobby-nav-right { display: flex; align-items: center; gap: 6px; }

  .lobby-user-chip {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(124,106,247,0.1);
    border: 1px solid rgba(124,106,247,0.2);
    border-radius: 20px;
    padding: 5px 12px 5px 6px;
    font-size: 12px;
    font-weight: 600;
    color: #a89af8;
    margin-right: 4px;
  }
  .lobby-user-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #7c6af7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
  }

  .nav-action-btn {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.5);
    padding: 6px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .nav-action-btn:hover { border-color: #7c6af7; color: #a89af8; background: rgba(124,106,247,0.08); }

  /* ── Body ── */
  .lobby-body {
    max-width: 960px;
    margin: 0 auto;
    padding: 40px 24px;
  }

  /* ── Header ── */
  .lobby-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
  }

  .lobby-title-wrap {}
  .lobby-title {
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.5px;
    line-height: 1.1;
  }
  .lobby-title span { color: #7c6af7; }
  .lobby-title-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.22);
    margin-top: 6px;
  }

  .lobby-controls { display: flex; align-items: center; gap: 8px; }

  .lang-select-wrap { position: relative; }
  .lang-select-wrap::after {
    content: '⌄';
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-52%);
    font-size: 12px;
    color: rgba(255,255,255,0.3);
    pointer-events: none;
  }

  .lang-select {
    background: #12121c;
    border: 1px solid rgba(255,255,255,0.1);
    color: #e8e8f0;
    padding: 9px 32px 9px 12px;
    border-radius: 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    outline: none;
    cursor: pointer;
    appearance: none;
    transition: border-color 0.2s;
  }
  .lang-select:hover { border-color: rgba(124,106,247,0.4); }
  .lang-select:focus { border-color: #7c6af7; }

  .new-session-btn {
    background: #7c6af7;
    color: #fff;
    border: none;
    padding: 9px 18px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .new-session-btn:hover { background: #6557e0; }
  .new-session-btn:active { transform: scale(0.97); }
  .new-session-btn:disabled { background: #2a2a3e; cursor: not-allowed; color: rgba(255,255,255,0.3); }

  /* ── Divider ── */
  .lobby-divider {
    height: 1px;
    background: rgba(255,255,255,0.05);
    margin-bottom: 24px;
  }

  /* ── Grid ── */
  .sessions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 14px;
  }

  /* ── Card ── */
  .session-card {
    background: #0f0f18;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 20px;
    cursor: pointer;
    transition: border-color 0.2s, transform 0.2s;
    position: relative;
    overflow: hidden;
  }
  .session-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: transparent;
    transition: background 0.2s;
  }
  .session-card:hover { border-color: rgba(124,106,247,0.45); transform: translateY(-2px); }
  .session-card:hover::before { background: linear-gradient(90deg, #7c6af7, transparent); }
  .session-card.is-mine { border-color: rgba(124,106,247,0.22); }
  .session-card.is-mine::before { background: linear-gradient(90deg, #7c6af7, transparent); }
  .session-card.deleting { opacity: 0.4; pointer-events: none; transform: scale(0.97); }

  .session-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .session-lang {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 6px;
  }
  .lang-javascript { background: rgba(234,179,8,0.1); color: #c8960c; }
  .lang-typescript { background: rgba(96,165,250,0.1); color: #4d90c8; }
  .lang-react      { background: rgba(96,165,250,0.1); color: #4d90c8; }
  .lang-html       { background: rgba(249,115,22,0.1); color: #d9621b; }

  .session-status {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #34c97a;
    font-weight: 500;
  }
  .session-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34c97a;
  }

  .session-owner {
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .my-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 5px;
    background: rgba(124,106,247,0.12);
    color: #9d8cf5;
    border: 1px solid rgba(124,106,247,0.2);
  }

  .session-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.22);
    margin-bottom: 18px;
  }

  .btn-row { display: flex; gap: 8px; }

  .join-btn {
    flex: 1;
    padding: 10px 14px;
    background: rgba(124,106,247,0.07);
    border: 1px solid rgba(124,106,247,0.25);
    color: #9d8cf5;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .join-btn:hover { background: rgba(124,106,247,0.18); border-color: rgba(124,106,247,0.5); color: #c4b8ff; }

  .delete-btn {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.07);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.25);
    font-size: 15px;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .delete-btn:hover { border-color: rgba(239,68,68,0.35); color: #f87171; background: rgba(239,68,68,0.06); }

  /* ── States ── */
  .lobby-empty {
    text-align: center;
    padding: 80px 0;
    color: rgba(255,255,255,0.2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 2;
  }

  .lobby-loading {
    text-align: center;
    padding: 80px 0;
    color: rgba(255,255,255,0.2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .lobby-loading::before {
    content: '';
    width: 14px;
    height: 14px;
    border: 2px solid rgba(124,106,247,0.3);
    border-top-color: #7c6af7;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const LANG_LABELS = {
  javascript: { cls: 'lang-javascript', label: 'javascript' },
  typescript: { cls: 'lang-typescript', label: 'typescript' },
  react:      { cls: 'lang-react',      label: 'react' },
  html:       { cls: 'lang-html',       label: 'html' },
};

const Lobby = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { socketRef } = useSocket();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [deletingIds, setDeletingIds] = useState(new Set());

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/sessions');
      setSessions(data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/sessions', { language });
      navigate(`/session/${data.session.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this session? All code and comments will be permanently removed.')) return;

    setDeletingIds(prev => new Set([...prev, sessionId]));
    try {
      await api.delete(`/sessions/${sessionId}`);
      socketRef.current?.emit('delete-session', { sessionId });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(sessionId); return n; });
      alert(err.response?.data?.error || 'Failed to delete session');
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isMySession = (session) => session.owner === user?.username;

  const initials = (name) => (name || 'U')[0].toUpperCase();

  const langMeta = (lang) => LANG_LABELS[lang] || { cls: 'lang-javascript', label: lang };

  return (
    <>
      <style>{styles}</style>
      <div className="lobby-root">

        {/* Nav */}
        <nav className="lobby-nav">
          <div className="lobby-brand">
            <span className="lobby-brand-tag">&lt;/&gt;</span>
            CodeReview.live
          </div>
          <div className="lobby-nav-right">
            <div className="lobby-user-chip">
              <div className="lobby-user-avatar">{initials(user?.username)}</div>
              {user?.username}
            </div>
            <button className="nav-action-btn" onClick={() => navigate('/profile')}>Profile</button>
            <button className="nav-action-btn" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        {/* Body */}
        <div className="lobby-body">

          {/* Header */}
          <div className="lobby-header">
            <div className="lobby-title-wrap">
              <h1 className="lobby-title">Open <span>Sessions</span></h1>
              <p className="lobby-title-sub">
                // {sessions.length} active session{sessions.length !== 1 ? 's' : ''} · click to join
              </p>
            </div>
            <div className="lobby-controls">
              <div className="lang-select-wrap">
                <select
                  className="lang-select"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="react">React</option>
                  <option value="html">HTML</option>
                </select>
              </div>
              <button
                className="new-session-btn"
                onClick={handleCreateSession}
                disabled={creating}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
                {creating ? 'Creating…' : 'New Session'}
              </button>
            </div>
          </div>

          <div className="lobby-divider" />

          {/* Sessions */}
          {loading ? (
            <div className="lobby-loading">// loading sessions…</div>
          ) : sessions.length === 0 ? (
            <div className="lobby-empty">
              <p>// no open sessions</p>
              <p>create one to get started</p>
            </div>
          ) : (
            <div className="sessions-grid">
              {sessions.map(session => {
                const { cls, label } = langMeta(session.language);
                const mine = isMySession(session);
                return (
                  <div
                    key={session.id}
                    className={`session-card${mine ? ' is-mine' : ''}${deletingIds.has(session.id) ? ' deleting' : ''}`}
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <div className="session-card-top">
                      <span className={`session-lang ${cls}`}>{label}</span>
                      <span className="session-status">
                        <span className="session-status-dot" />
                        open
                      </span>
                    </div>

                    <p className="session-owner">
                      {session.owner}'s session
                      {mine && <span className="my-badge">mine</span>}
                    </p>

                    <p className="session-time">// created at {formatTime(session.created_at)}</p>

                    <div className="btn-row">
                      <button
                        className="join-btn"
                        onClick={e => { e.stopPropagation(); navigate(`/session/${session.id}`); }}
                      >
                        Join Session →
                      </button>

                      {mine && (
                        <button
                          className="delete-btn"
                          onClick={e => handleDeleteSession(e, session.id)}
                          title="Delete session"
                          aria-label="Delete session"
                        >
                          {deletingIds.has(session.id) ? '…' : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Lobby;