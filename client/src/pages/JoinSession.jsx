import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';

const JoinSession = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const redeemInvite = async () => {
      try {
        const { data } = await api.post(`/sessions/join/${token}`);
        if (!cancelled) {
          navigate(`/session/${data.sessionId}`, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Could not join session');
        }
      }
    };

    redeemInvite();
    return () => { cancelled = true; };
  }, [token, navigate]);

  return (
    <AppShell>
      <div className="app-loading" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        {error ? (
          <>
            <p style={{ color: 'var(--premium-danger, #f87171)' }}>{error}</p>
            <button type="button" className="app-btn-primary" onClick={() => navigate('/lobby')}>
              Back to Lobby
            </button>
          </>
        ) : (
          <p>// joining session…</p>
        )}
      </div>
    </AppShell>
  );
};

export default JoinSession;
