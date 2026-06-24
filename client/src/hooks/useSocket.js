import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
  const socketRef = useRef(null);
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    // Only create the socket once
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
      setSocketReady(true); // flip once → triggers Session useEffect exactly once
    });

    socket.on('disconnect', () => {
      setSocketReady(false);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // runs exactly once

  return { socketRef, socketReady };
};

export default useSocket;