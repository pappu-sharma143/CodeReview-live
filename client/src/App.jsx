import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Session from './pages/Session';
import JoinSession from './pages/JoinSession';
import AuthPage from './pages/AuthPage';
import Lobby from './pages/Lobby';
import Profile from './pages/Profile';
import Landing from './pages/Landing';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/lobby" replace /> : children;
};

const LandingRoute = () => <Landing />;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
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
          <ProtectedRoute><Session /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
