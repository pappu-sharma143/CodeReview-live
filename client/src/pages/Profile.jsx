import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .profile-root {
    min-height: 100vh;
    background: #080810;
    color: #e8e8f0;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Nav ── */
  .profile-nav {
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

  .profile-brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    color: #7c6af7;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .profile-brand-tag { color: rgba(255,255,255,0.3); }

  .profile-nav-right { display: flex; gap: 6px; }

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
  .profile-body {
    max-width: 900px;
    margin: 0 auto;
    padding: 36px 24px;
  }

  /* ── Hero ── */
  .profile-hero {
    display: flex;
    align-items: center;
    gap: 22px;
    background: #0f0f18;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 26px 28px;
    margin-bottom: 14px;
    position: relative;
    overflow: hidden;
  }
  .profile-hero::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #7c6af7 0%, rgba(124,106,247,0.1) 60%, transparent 100%);
  }

  .avatar-ring {
    border: 2px solid rgba(124,106,247,0.3);
    border-radius: 50%;
    padding: 3px;
    flex-shrink: 0;
  }
  .avatar {
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: #7c6af7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 800;
    color: #fff;
  }

  .profile-info { flex: 1; min-width: 0; }

  .profile-name {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.4px;
    margin-bottom: 3px;
  }

  .profile-joined {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.28);
    margin-bottom: 14px;
  }

  .rep-row { display: flex; align-items: center; gap: 10px; }

  .rep-bar-bg {
    width: 160px;
    height: 5px;
    background: rgba(255,255,255,0.07);
    border-radius: 3px;
    overflow: hidden;
  }

  .rep-bar-fill {
    height: 100%;
    border-radius: 3px;
    background: #7c6af7;
    transition: width 1s ease;
  }

  .rep-score {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: #9d8cf5;
  }

  .review-count { text-align: right; flex-shrink: 0; }
  .review-count-num {
    font-size: 34px;
    font-weight: 800;
    color: #7c6af7;
    line-height: 1;
  }
  .review-count-lbl {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: rgba(255,255,255,0.28);
    margin-top: 4px;
    letter-spacing: 0.5px;
  }

  /* ── Stats ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: #0f0f18;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 18px 16px;
    text-align: center;
    transition: border-color 0.2s;
  }
  .stat-card:hover { border-color: rgba(124,106,247,0.25); }

  .stat-value {
    font-size: 30px;
    font-weight: 800;
    color: #7c6af7;
    line-height: 1;
    margin-bottom: 7px;
  }

  .stat-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: rgba(255,255,255,0.28);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  /* ── Tabs ── */
  .tab-row {
    display: flex;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    margin-bottom: 16px;
  }

  .tab-btn {
    padding: 9px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.35);
    cursor: pointer;
    margin-bottom: -1px;
    transition: all 0.2s;
  }
  .tab-btn.active { color: #fff; border-bottom-color: #7c6af7; }
  .tab-btn:hover:not(.active) { color: rgba(255,255,255,0.6); }

  /* ── Session list ── */
  .session-list { display: flex; flex-direction: column; gap: 8px; }

  .session-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 16px;
    background: #0f0f18;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .session-item:hover { border-color: rgba(124,106,247,0.3); }

  .status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

  .lang-pill {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 5px;
    flex-shrink: 0;
  }
  .pill-javascript { background: rgba(234,179,8,0.1); color: #c8960c; }
  .pill-typescript { background: rgba(96,165,250,0.1); color: #4d90c8; }
  .pill-react      { background: rgba(96,165,250,0.1); color: #4d90c8; }
  .pill-html       { background: rgba(249,115,22,0.1); color: #d9621b; }

  .session-id-label {
    font-size: 13px;
    font-weight: 600;
    color: #e8e8f0;
    flex: 1;
  }

  .reviewer-label { font-size: 12px; color: rgba(255,255,255,0.35); }

  .session-right {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .stars { color: #f4c430; font-size: 13px; }
  .unrated-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.22);
  }

  .session-date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.22);
  }

  /* ── States ── */
  .empty-state {
    text-align: center;
    padding: 32px;
    color: rgba(255,255,255,0.2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    border: 1px dashed rgba(255,255,255,0.07);
    border-radius: 10px;
  }

  .profile-loading {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: rgba(255,255,255,0.2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }
  .profile-loading::before {
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

const PILL_MAP = {
  javascript: 'pill-javascript',
  typescript: 'pill-typescript',
  react: 'pill-react',
  html: 'pill-html',
};

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submitted');
  const [repWidth, setRepWidth] = useState(0);

  useEffect(() => {
    api.get('/profile/me')
      .then(({ data }) => {
        setProfile(data);
        // animate rep bar after paint
        requestAnimationFrame(() => {
          const rep = data?.user?.reputation || 0;
          setTimeout(() => setRepWidth(Math.min(rep, 100)), 100);
        });
      })
      .catch(err => console.error('Profile load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const renderStars = (rating) => {
    if (!rating) return <span className="unrated-label">unrated</span>;
    return (
      <span className="stars">
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 4 }}>({rating}/5)</span>
      </span>
    );
  };

  const getStatusColor = (status) => status === 'done' ? '#34c97a' : '#f4c430';

  const pillCls = (lang) => PILL_MAP[lang] || 'pill-javascript';

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="profile-root">
          <div className="profile-loading">// loading profile…</div>
        </div>
      </>
    );
  }

  if (!profile) return null;

  const { user: profileUser, submitted, reviewed, commentCount } = profile;
  const reputation = profileUser.reputation || 0;
  const initials = (profileUser.username || 'U')[0].toUpperCase();

  return (
    <>
      <style>{styles}</style>
      <div className="profile-root">

        {/* Nav */}
        <nav className="profile-nav">
          <span className="profile-brand" onClick={() => navigate('/lobby')}>
            <span className="profile-brand-tag">&lt;/&gt;</span>
            CodeReview.live
          </span>
          <div className="profile-nav-right">
            <button className="nav-action-btn" onClick={() => navigate('/lobby')}>Lobby</button>
            <button className="nav-action-btn" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <div className="profile-body">

          {/* Hero */}
          <div className="profile-hero">
            <div className="avatar-ring">
              <div className="avatar">{initials}</div>
            </div>
            <div className="profile-info">
              <p className="profile-name">{profileUser.username}</p>
              <p className="profile-joined">// joined {formatDate(profileUser.created_at)}</p>
              <div className="rep-row">
                <div className="rep-bar-bg">
                  <div className="rep-bar-fill" style={{ width: `${repWidth}%` }} />
                </div>
                <span className="rep-score">{reputation} / 100 rep</span>
              </div>
            </div>
            <div className="review-count">
              <div className="review-count-num">{profileUser.review_count || 0}</div>
              <div className="review-count-lbl">reviews done</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{submitted.length}</div>
              <div className="stat-label">Sessions created</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{reviewed.length}</div>
              <div className="stat-label">Sessions reviewed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{commentCount}</div>
              <div className="stat-label">Comments made</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{reputation}</div>
              <div className="stat-label">Reputation score</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tab-row">
            <button
              className={`tab-btn ${activeTab === 'submitted' ? 'active' : ''}`}
              onClick={() => setActiveTab('submitted')}
            >
              My Sessions ({submitted.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'reviewed' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviewed')}
            >
              Reviewed ({reviewed.length})
            </button>
          </div>

          {/* Session list */}
          <div className="session-list">
            {activeTab === 'submitted' && (
              submitted.length === 0
                ? <div className="empty-state">// no sessions created yet</div>
                : submitted.map(s => (
                  <div key={s.id} className="session-item" onClick={() => navigate(`/session/${s.id}`)}>
                    <div className="status-dot" style={{ background: getStatusColor(s.status) }} />
                    <span className={`lang-pill ${pillCls(s.language)}`}>{s.language}</span>
                    <span className="session-id-label">Session #{s.id}</span>
                    {s.reviewer_name && (
                      <span className="reviewer-label">reviewed by {s.reviewer_name}</span>
                    )}
                    <div className="session-right">
                      {renderStars(s.rating)}
                      <span className="session-date">{formatDate(s.created_at)}</span>
                    </div>
                  </div>
                ))
            )}

            {activeTab === 'reviewed' && (
              reviewed.length === 0
                ? <div className="empty-state">// no sessions reviewed yet</div>
                : reviewed.map(s => (
                  <div key={s.id} className="session-item" onClick={() => navigate(`/session/${s.id}`)}>
                    <div className="status-dot" style={{ background: getStatusColor(s.status) }} />
                    <span className={`lang-pill ${pillCls(s.language)}`}>{s.language}</span>
                    <span className="session-id-label">Session #{s.id}</span>
                    <span className="reviewer-label">by {s.submitter_name}</span>
                    <div className="session-right">
                      {renderStars(s.rating)}
                      <span className="session-date">{formatDate(s.created_at)}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;