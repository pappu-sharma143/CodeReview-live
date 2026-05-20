import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lobby-root {
    min-height: 100vh;
    background: #0d0d0f;
    color: #f0f0f5;
    font-family: 'Syne', sans-serif;
  }

  .lobby-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    border-bottom: 1px solid #1e1e24;
  }

  .lobby-brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: #6366f1;
    font-weight: 600;
  }

  .lobby-user {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #5a5a6e;
    font-family: 'JetBrains Mono', monospace;
  }

  .logout-btn {
    background: none;
    border: 1px solid #1e1e24;
    color: #5a5a6e;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    transition: all 0.2s;
  }
  .logout-btn:hover { border-color: #6366f1; color: #6366f1; }

  .lobby-body {
    max-width: 900px;
    margin: 0 auto;
    padding: 48px 24px;
  }

  .lobby-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  .lobby-title {
    font-size: 28px;
    font-weight: 800;
    color: #f0f0f5;
  }

  .lobby-title span {
    color: #6366f1;
  }

  .new-session-btn {
    background: #6366f1;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }
  .new-session-btn:hover { background: #4f52d4; }
  .new-session-btn:disabled { background: #2e2e3e; cursor: not-allowed; }

  .lang-select {
    background: #111115;
    border: 1px solid #1e1e24;
    color: #f0f0f5;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    outline: none;
    margin-right: 12px;
    cursor: pointer;
  }

  .sessions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .session-card {
    background: #111115;
    border: 1px solid #1e1e24;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .session-card:hover {
    border-color: #6366f1;
    transform: translateY(-2px);
  }

  .session-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .session-lang {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    background: #1e1e2e;
    color: #6366f1;
    padding: 3px 10px;
    border-radius: 20px;
  }

  .session-status {
    font-size: 11px;
    color: #4ec9b0;
    font-family: 'JetBrains Mono', monospace;
  }

  .session-owner {
    font-size: 14px;
    font-weight: 700;
    color: #f0f0f5;
    margin-bottom: 6px;
  }

  .session-time {
    font-size: 11px;
    color: #3e3e52;
    font-family: 'JetBrains Mono', monospace;
  }

  .join-btn {
    margin-top: 16px;
    width: 100%;
    padding: 10px;
    background: transparent;
    border: 1px solid #1e1e24;
    color: #6366f1;
    border-radius: 6px;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .join-btn:hover { background: #6366f1; color: white; border-color: #6366f1; }

  .empty-state {
    text-align: center;
    padding: 80px 0;
    color: #3e3e52;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
  }

  .loading {
    text-align: center;
    padding: 80px 0;
    color: #3e3e52;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }
`;

const Lobby = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [language, setLanguage] = useState('javascript');

  // Load open sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

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
      // Navigate directly into the new session
      navigate(`/session/${data.session.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="lobby-root">

        {/* Nav */}
        <nav className="lobby-nav">
          <span className="lobby-brand">{'</>'} CodeReview.live</span>
          <div className="lobby-user">
            <span>👤 {user?.username}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </nav>

        {/* Body */}
        <div className="lobby-body">

          {/* Header */}
          <div className="lobby-header">
            <h1 className="lobby-title">
              Open <span>Sessions</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <select
                className="lang-select"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
              </select>
              <button
                className="new-session-btn"
                onClick={handleCreateSession}
                disabled={creating}
              >
                {creating ? 'Creating...' : '+ New Session'}
              </button>
            </div>
          </div>

          {/* Sessions list */}
          {loading ? (
            <div className="loading">// loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <p>// no open sessions</p>
              <p style={{ marginTop: 8 }}>Create one to get started</p>
            </div>
          ) : (
            <div className="sessions-grid">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className="session-card"
                  onClick={() => navigate(`/session/${session.id}`)}
                >
                  <div className="session-card-top">
                    <span className="session-lang">{session.language}</span>
                    <span className="session-status">● open</span>
                  </div>
                  <p className="session-owner">
                    {session.owner}'s session
                  </p>
                  <p className="session-time">
                    Created at {formatTime(session.created_at)}
                  </p>
                  <button className="join-btn">
                    Join Session →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Lobby;