import { useAuth } from '../context/AuthContext';

export default function useAppEntryPath() {
  const { user } = useAuth();
  return user ? '/lobby' : '/login';
}
