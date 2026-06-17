import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppNav({ showUser = true }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (name) => (name || 'U')[0].toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="app-nav sticky top-0 z-20 flex items-center justify-between border-b border-border/80 bg-hero-bg/80 px-6 py-4 backdrop-blur-md md:px-10">
      <button
        type="button"
        className="text-lg font-semibold tracking-tight text-foreground"
        onClick={() => navigate('/lobby')}
      >
        CodeReview<span className="text-primary">.live</span>
      </button>

      <div className="flex items-center gap-2">
        {showUser && user && (
          <div className="app-user-chip mr-1">
            <div className="app-user-avatar">{initials(user.username)}</div>
            {user.username}
          </div>
        )}
        <button type="button" className="app-btn-ghost" onClick={() => navigate('/lobby')}>
          Lobby
        </button>
        <button type="button" className="app-btn-ghost" onClick={() => navigate('/profile')}>
          Profile
        </button>
        <Link to="/" className="app-btn-ghost hidden sm:inline-flex">
          Home
        </Link>
        <button type="button" className="app-btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
