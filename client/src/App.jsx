import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const Session = lazy(() => import('./pages/Session'));
const JoinSession = lazy(() => import('./pages/JoinSession'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Profile = lazy(() => import('./pages/Profile'));
const Landing = lazy(() => import('./pages/Landing'));

const PageLoader = () => (
  <div className="app-loading" style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0d0d0f',
    color: '#888',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 13,
  }}>
    // loading…
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/lobby" replace /> : children;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={
            <PublicRoute><AuthPage /></PublicRoute>
          } />
          <Route path="/lobby" element={
            <ProtectedRoute><Lobby /></ProtectedRoute>
          } />
          <Route path="/join/:token" element={
            <ProtectedRoute><JoinSession /></ProtectedRoute>
          } />
          <Route path="/session/:sessionId" element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Session />
              </ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
