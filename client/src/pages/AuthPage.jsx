import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/lobby';

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
      navigate(redirectTo, { replace: true });
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
    <div className="flex min-h-screen items-center justify-center bg-hero-bg px-6 font-sora antialiased">
      <div className="w-full max-w-md rounded-lg border border-border bg-secondary/80 p-8 backdrop-blur-sm">
        <Link
          to="/"
          className="mb-8 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to home
        </Link>

        <div className="mb-8 flex border-b border-border">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              type="button"
              className={`flex-1 pb-3 text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => { setTab(t); setError(''); }}
            >
              {t}
            </button>
          ))}
        </div>

        <h2 className="mb-1 text-2xl font-bold text-foreground">
          {tab === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="mb-8 text-sm text-muted-foreground">
          {tab === 'login' ? 'Sign in to join review sessions' : 'Join CodeReview.live'}
        </p>

        {tab === 'register' && (
          <div className="mb-4">
            <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
              Username
            </label>
            <input
              type="text"
              placeholder="yourname"
              value={form.username}
              onChange={set('username')}
              onKeyDown={handleKey}
              className="w-full rounded-sm border border-input bg-muted px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
        )}

        <div className="mb-4">
          <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            onKeyDown={handleKey}
            className="w-full rounded-sm border border-input bg-muted px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            autoFocus={tab === 'login'}
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            onKeyDown={handleKey}
            className="w-full rounded-sm border border-input bg-muted px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-sm bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Please wait…' : tab === 'login' ? 'Sign in →' : 'Create account →'}
        </button>
      </div>
    </div>
  );
}
