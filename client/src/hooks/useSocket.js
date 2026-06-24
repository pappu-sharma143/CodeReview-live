import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
  const socketRef = useRef(null);
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    if (socketRef.current) return;

    const serverUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : '';

    const socket = io(serverUrl, {
      withCredentials: true,
      path: '/socket.io',
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setSocketReady(true);
    });

    socket.on('disconnect', () => setSocketReady(false));

    socket.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socketRef, socketReady };
};

export default useSocket;
