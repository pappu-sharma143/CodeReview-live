import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import TiltCard from '../components/TiltCard';
import AppNav from '../components/AppNav';

const lobbyStyles = `
  .lobby-body {
    max-width: 980px;
    margin: 0 auto;
    padding: 44px 24px 60px;
  }

  .lobby-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 32px;
    gap: 20px;
    flex-wrap: wrap;
  }

  .lobby-title {
    font-size: clamp(24px, 4vw, 32px);
    font-weight: 800;
    color: var(--premium-text);
    letter-spacing: -0.8px;
    line-height: 1.1;
  }

  .lobby-title span {
    color: hsl(var(--primary));
  }

  .lobby-subtitle {
    font-family: var(--premium-mono);
    font-size: 11px;
    color: var(--premium-text-dim);
    margin-top: 8px;
  }

  .lobby-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .lang-wrap { position: relative; }

  .lang-wrap::after {
    content: '⌄';
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-52%);
    font-size: 12px;
    color: var(--premium-text-dim);
    pointer-events: none;
  }

  .lobby-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--premium-glass-border), transparent);
    margin-bottom: 28px;
  }

  .sessions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 18px;
  }

  .session-card {
    padding: 22px;
    cursor: pointer;
    overflow: hidden;
  }

  .session-card.is-mine {
    border-color: hsl(119 99% 46% / 0.3);
  }

  .session-card.deleting {
    opacity: 0.4;
    pointer-events: none;
    transform: scale(0.97) !important;
  }

  .session-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .session-lang {
    font-family: var(--premium-mono);
    font-size: 10px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .lang-javascript { background: rgba(234, 179, 8, 0.12); color: #e8b84a; }
  .lang-typescript { background: rgba(96, 165, 250, 0.12); color: #6ba8e8; }
  .lang-react { background: rgba(96, 165, 250, 0.12); color: #6ba8e8; }
  .lang-html { background: rgba(249, 115, 22, 0.12); color: #f09555; }

  .session-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--premium-mono);
    font-size: 10px;
    color: var(--premium-success);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .session-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--premium-success);
    box-shadow: 0 0 8px rgba(52, 201, 122, 0.6);
    animation: premium-pulse-glow 2s ease-in-out infinite;
  }

  .session-owner {
    font-size: 16px;
    font-weight: 700;
    color: var(--premium-text);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .my-badge {
    font-family: var(--premium-mono);
    font-size: 9px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 5px;
    background: hsl(119 99% 46% / 0.15);
    color: var(--premium-accent-bright);
    border: 1px solid hsl(119 99% 46% / 0.25);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .session-time {
    font-family: var(--premium-mono);
    font-size: 11px;
    color: var(--premium-text-dim);
    margin-bottom: 20px;
  }

  .btn-row { display: flex; gap: 8px; }

  .join-btn {
    flex: 1;
    padding: 11px 14px;
    background: hsl(119 99% 46% / 0.1);
    border: 1px solid hsl(119 99% 46% / 0.3);
    color: var(--premium-accent-bright);
    border-radius: var(--premium-radius-sm);
    font-family: var(--premium-font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .join-btn:hover {
    background: hsl(119 99% 46% / 0.22);
    border-color: hsl(119 99% 46% / 0.55);
    box-shadow: 0 0 24px hsl(119 99% 46% / 0.15);
  }

  .invite-btn {
    padding: 11px 14px;
    background: transparent;
    border: 1px solid var(--premium-glass-border);
    color: var(--premium-text-dim);
    border-radius: var(--premium-radius-sm);
    font-family: var(--premium-font);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .invite-btn:hover {
    border-color: hsl(119 99% 46% / 0.35);
    color: var(--premium-accent-bright);
    background: hsl(119 99% 46% / 0.08);
  }

  .delete-btn {
    width: 38px;
    height: 38px;
    border-radius: var(--premium-radius-sm);
    border: 1px solid var(--premium-glass-border);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--premium-text-dim);
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .delete-btn:hover {
    border-color: rgba(239, 68, 68, 0.4);
    color: var(--premium-danger);
    background: rgba(239, 68, 68, 0.08);
  }

  .join-link-card {
    padding: 20px 22px;
    margin-bottom: 28px;
  }

  .join-link-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--premium-text);
    margin-bottom: 6px;
  }

  .join-link-hint {
    font-family: var(--premium-mono);
    font-size: 11px;
    color: var(--premium-text-dim);
    margin-bottom: 14px;
  }

  .join-link-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .join-link-input {
    flex: 1;
    min-width: 220px;
    padding: 11px 14px;
    border-radius: var(--premium-radius-sm);
    border: 1px solid var(--premium-glass-border);
    background: hsl(0 0% 6% / 0.6);
    color: var(--premium-text);
    font-family: var(--premium-mono);
    font-size: 12px;
    outline: none;
    transition: border-color 0.2s;
  }

  .join-link-input:focus {
    border-color: hsl(119 99% 46% / 0.45);
  }

  .join-link-input::placeholder {
    color: var(--premium-text-dim);
  }

  .join-link-btn {
    padding: 11px 18px;
    border-radius: var(--premium-radius-sm);
    border: 1px solid hsl(119 99% 46% / 0.35);
    background: hsl(119 99% 46% / 0.12);
    color: var(--premium-accent-bright);
    font-family: var(--premium-font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .join-link-btn:hover:not(:disabled) {
    background: hsl(119 99% 46% / 0.22);
    border-color: hsl(119 99% 46% / 0.55);
  }

  .join-link-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .join-link-error {
    margin-top: 10px;
    font-family: var(--premium-mono);
    font-size: 11px;
    color: var(--premium-danger, #f87171);
  }

  .lobby-empty {
    text-align: center;
    padding: 80px 24px;
    color: var(--premium-text-dim);
    font-family: var(--premium-mono);
    font-size: 13px;
    line-height: 2.2;
  }

  .lobby-empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.3;
    display: block;
  }
`;

const LANG_LABELS = {
  javascript: { cls: 'lang-javascript', label: 'javascript' },
  typescript: { cls: 'lang-typescript', label: 'typescript' },
  react: { cls: 'lang-react', label: 'react' },
  html: { cls: 'lang-html', label: 'html' },
};

const extractJoinToken = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const fromPath = trimmed.match(/\/join\/([a-f0-9]+)/i);
  if (fromPath) return fromPath[1];

  if (/^[a-f0-9]{64}$/i.test(trimmed)) return trimmed;

  return null;
};

const Lobby = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socketRef } = useSocket();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [copiedSessionId, setCopiedSessionId] = useState(null);
  const [joinLink, setJoinLink] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

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

  const handleCopyInviteLink = async (e, sessionId) => {
    e.stopPropagation();
    try {
      const { data } = await api.get(`/sessions/${sessionId}/invite`);
      await navigator.clipboard.writeText(data.joinUrl);
      setCopiedSessionId(sessionId);
      setTimeout(() => setCopiedSessionId(null), 2000);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not copy invite link');
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

  const handleJoinWithLink = async () => {
    const token = extractJoinToken(joinLink);
    if (!token) {
      setJoinError('Paste a valid invite link or token');
      return;
    }

    setJoining(true);
    setJoinError('');
    try {
      const { data } = await api.post(`/sessions/join/${token}`);
      setJoinLink('');
      await fetchSessions();
      navigate(`/session/${data.sessionId}`);
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Could not join session');
    } finally {
      setJoining(false);
    }
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isMySession = (session) => session.isOwner || session.owner === user?.username;
  const langMeta = (lang) => LANG_LABELS[lang] || { cls: 'lang-javascript', label: lang };

  return (
    <AppShell>
      <style>{lobbyStyles}</style>

      <AppNav />

      <div className="lobby-body app-animate-in">
        <div className="lobby-header">
          <div>
            <h1 className="lobby-title">Open <span>Sessions</span></h1>
            <p className="lobby-subtitle">
              // your sessions and ones you were invited to
            </p>
          </div>
          <div className="lobby-controls">
            <div className="lang-wrap">
              <select
                className="app-select"
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
              className="app-btn-primary"
              onClick={handleCreateSession}
              disabled={creating}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
              {creating ? 'Creating…' : 'New Session'}
            </button>
          </div>
        </div>

        <div className="join-link-card glass-card">
          <p className="join-link-title">Join with invite link</p>
          <p className="join-link-hint">// paste the link shared by the session creator</p>
          <div className="join-link-row">
            <input
              type="text"
              className="join-link-input"
              placeholder="https://…/join/abc123… or paste token"
              value={joinLink}
              onChange={(e) => {
                setJoinLink(e.target.value);
                if (joinError) setJoinError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoinWithLink();
              }}
            />
            <button
              type="button"
              className="join-link-btn"
              onClick={handleJoinWithLink}
              disabled={joining || !joinLink.trim()}
            >
              {joining ? 'Joining…' : 'Join Session'}
            </button>
          </div>
          {joinError && <p className="join-link-error">{joinError}</p>}
        </div>

        <div className="lobby-divider" />

        {loading ? (
          <div className="app-loading">// loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="lobby-empty glass-card">
            <span className="lobby-empty-icon">{'</>'}</span>
            <p>// no open sessions yet</p>
            <p>create one or paste an invite link above</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {sessions.map((session, i) => {
              const { cls, label } = langMeta(session.language);
              const mine = isMySession(session);
              return (
                <TiltCard
                  key={session.id}
                  className={`session-card glass-card${mine ? ' is-mine' : ''}${deletingIds.has(session.id) ? ' deleting' : ''}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  intensity={10}
                >
                  <div onClick={() => navigate(`/session/${session.id}`)}>
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
                        Open Session →
                      </button>

                      {mine && (
                        <>
                          <button
                            className="invite-btn"
                            onClick={e => handleCopyInviteLink(e, session.id)}
                            title="Copy invite link"
                          >
                            {copiedSessionId === session.id ? 'Copied' : 'Invite'}
                          </button>
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
                        </>
                      )}
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Lobby;
