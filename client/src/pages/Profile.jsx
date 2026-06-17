import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import TiltCard from '../components/TiltCard';
import AppNav from '../components/AppNav';

const profileStyles = `
  .profile-body {
    max-width: 920px;
    margin: 0 auto;
    padding: 40px 24px 60px;
  }

  .profile-hero {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 32px;
    margin-bottom: 18px;
    position: relative;
    overflow: hidden;
  }

  .profile-hero::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--premium-accent), transparent 70%);
  }

  .avatar-ring {
    border: 2px solid hsl(119 99% 46% / 0.35);
    border-radius: 50%;
    padding: 4px;
    flex-shrink: 0;
    box-shadow: 0 0 24px var(--premium-accent-glow);
  }

  .avatar {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: hsl(var(--primary));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 800;
    color: #fff;
  }

  .profile-info { flex: 1; min-width: 0; }

  .profile-name {
    font-size: 26px;
    font-weight: 800;
    color: var(--premium-text);
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .profile-joined {
    font-family: var(--premium-mono);
    font-size: 11px;
    color: var(--premium-text-dim);
    margin-bottom: 16px;
  }

  .rep-row { display: flex; align-items: center; gap: 12px; }

  .rep-bar-bg {
    width: 180px;
    height: 6px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    overflow: hidden;
  }

  .rep-bar-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--premium-accent), hsl(119 99% 55%));
    transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 0 12px var(--premium-accent-glow);
  }

  .rep-score {
    font-family: var(--premium-mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--premium-accent-bright);
  }

  .review-count { text-align: right; flex-shrink: 0; }

  .review-count-num {
    font-size: 38px;
    font-weight: 800;
    color: hsl(var(--primary));
    line-height: 1;
  }

  .review-count-lbl {
    font-family: var(--premium-mono);
    font-size: 10px;
    color: var(--premium-text-dim);
    margin-top: 4px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 28px;
  }

  .stat-card {
    padding: 22px 18px;
    text-align: center;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 800;
    color: hsl(var(--primary));
    line-height: 1;
    margin-bottom: 8px;
  }

  .stat-label {
    font-family: var(--premium-mono);
    font-size: 10px;
    color: var(--premium-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .profile-tabs {
    display: flex;
    border-bottom: 1px solid var(--premium-glass-border);
    margin-bottom: 18px;
  }

  .profile-tab {
    padding: 10px 22px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-family: var(--premium-font);
    font-size: 13px;
    font-weight: 600;
    color: var(--premium-text-dim);
    cursor: pointer;
    margin-bottom: -1px;
    transition: all 0.25s;
  }

  .profile-tab.active {
    color: var(--premium-text);
    border-bottom-color: var(--premium-accent);
  }

  .profile-tab:hover:not(.active) { color: var(--premium-text-muted); }

  .session-list { display: flex; flex-direction: column; gap: 10px; }

  .session-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px 18px;
    cursor: pointer;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .lang-pill {
    font-family: var(--premium-mono);
    font-size: 10px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 5px;
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .pill-javascript { background: rgba(234, 179, 8, 0.12); color: #e8b84a; }
  .pill-typescript { background: rgba(96, 165, 250, 0.12); color: #6ba8e8; }
  .pill-react { background: rgba(96, 165, 250, 0.12); color: #6ba8e8; }
  .pill-html { background: rgba(249, 115, 22, 0.12); color: #f09555; }

  .session-id-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--premium-text);
    flex: 1;
  }

  .reviewer-label { font-size: 12px; color: var(--premium-text-muted); }

  .session-right {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .stars { color: #f4c430; font-size: 13px; }

  .unrated-label {
    font-family: var(--premium-mono);
    font-size: 11px;
    color: var(--premium-text-dim);
  }

  .session-date {
    font-family: var(--premium-mono);
    font-size: 11px;
    color: var(--premium-text-dim);
  }

  .empty-state {
    text-align: center;
    padding: 36px;
    color: var(--premium-text-dim);
    font-family: var(--premium-mono);
    font-size: 12px;
    border: 1px dashed var(--premium-glass-border);
    border-radius: var(--premium-radius-sm);
  }

  @media (max-width: 640px) {
    .profile-hero { flex-wrap: wrap; }
    .review-count { width: 100%; text-align: left; margin-top: 8px; }
    .session-item { flex-wrap: wrap; }
    .session-right { width: 100%; margin-left: 0; margin-top: 8px; }
  }
`;

const PILL_MAP = {
  javascript: 'pill-javascript',
  typescript: 'pill-typescript',
  react: 'pill-react',
  html: 'pill-html',
};

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submitted');
  const [repWidth, setRepWidth] = useState(0);

  useEffect(() => {
    api.get('/profile/me')
      .then(({ data }) => {
        setProfile(data);
        requestAnimationFrame(() => {
          const rep = data?.user?.reputation || 0;
          setTimeout(() => setRepWidth(Math.min(rep, 100)), 150);
        });
      })
      .catch(err => console.error('Profile load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const renderStars = (rating) => {
    if (!rating) return <span className="unrated-label">unrated</span>;
    return (
      <span className="stars">
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
        <span style={{ color: 'var(--premium-text-dim)', fontSize: 11, marginLeft: 4 }}>({rating}/5)</span>
      </span>
    );
  };

  const getStatusColor = (status) => status === 'done' ? '#34c97a' : '#f4c430';
  const pillCls = (lang) => PILL_MAP[lang] || 'pill-javascript';

  if (loading) {
    return (
      <AppShell>
        <style>{profileStyles}</style>
        <AppNav showUser={false} />
        <div className="app-loading" style={{ minHeight: '80vh' }}>// loading profile…</div>
      </AppShell>
    );
  }

  if (!profile) return null;

  const { user: profileUser, submitted, reviewed, commentCount } = profile;
  const reputation = profileUser.reputation || 0;
  const initials = (profileUser.username || 'U')[0].toUpperCase();

  return (
    <AppShell>
      <style>{profileStyles}</style>

      <AppNav showUser={false} />

      <div className="profile-body app-animate-in">

        <TiltCard className="profile-hero glass-card" intensity={6}>
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
        </TiltCard>

        <div className="stats-grid">
          {[
            { value: submitted.length, label: 'Sessions created' },
            { value: reviewed.length, label: 'Sessions reviewed' },
            { value: commentCount, label: 'Comments made' },
            { value: reputation, label: 'Reputation score' },
          ].map((stat, i) => (
            <TiltCard key={stat.label} className="stat-card glass-card" intensity={8}>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </TiltCard>
          ))}
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'submitted' ? 'active' : ''}`}
            onClick={() => setActiveTab('submitted')}
          >
            My Sessions ({submitted.length})
          </button>
          <button
            className={`profile-tab ${activeTab === 'reviewed' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviewed')}
          >
            Reviewed ({reviewed.length})
          </button>
        </div>

        <div className="session-list">
          {activeTab === 'submitted' && (
            submitted.length === 0
              ? <div className="empty-state glass-card">// no sessions created yet</div>
              : submitted.map(s => (
                <TiltCard
                  key={s.id}
                  className="session-item glass-card"
                  intensity={5}
                  onClick={() => navigate(`/session/${s.id}`)}
                >
                  <div className="status-dot" style={{ background: getStatusColor(s.status) }} />
                  <span className={`lang-pill ${pillCls(s.language)}`}>{s.language}</span>
                  <span className="session-id-label">Session #{s.id}</span>
                  {s.reviewer_name && (
                    <span className="reviewer-label">rated by {s.reviewer_name}</span>
                  )}
                  <div className="session-right">
                    {renderStars(s.rating)}
                    <span className="session-date">{formatDate(s.created_at)}</span>
                  </div>
                </TiltCard>
              ))
          )}

          {activeTab === 'reviewed' && (
            reviewed.length === 0
              ? <div className="empty-state glass-card">// no sessions reviewed yet</div>
              : reviewed.map(s => (
                <TiltCard
                  key={s.id}
                  className="session-item glass-card"
                  intensity={5}
                  onClick={() => navigate(`/session/${s.id}`)}
                >
                  <div className="status-dot" style={{ background: getStatusColor(s.status) }} />
                  <span className={`lang-pill ${pillCls(s.language)}`}>{s.language}</span>
                  <span className="session-id-label">Session #{s.id}</span>
                  <span className="reviewer-label">by {s.submitter_name}</span>
                  <div className="session-right">
                    {renderStars(s.rating)}
                    <span className="session-date">{formatDate(s.created_at)}</span>
                  </div>
                </TiltCard>
              ))
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Profile;
