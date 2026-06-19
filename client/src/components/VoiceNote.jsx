import { useState, useRef, useEffect } from 'react';

// ── VoiceNote component ─────────────────────────────────────
// Two modes:
// 1. Recorder mode — shown when posting a comment
// 2. Player mode  — shown when viewing someone's voice note

// ── RECORDER ───────────────────────────────────────────────
export const VoiceRecorder = ({ onRecordingComplete, onCancel }) => {
  const [state, setState] = useState('idle');
  // idle → recording → recorded → done
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // Max 30 seconds
  const MAX_DURATION = 30;

  const startRecording = async () => {
    try {
      // Request microphone access
      // Browser will show permission prompt if first time
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // MediaRecorder — browser's built-in audio recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg' // Firefox fallback
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Each chunk of audio data arrives here
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // When recording stops — build the final audio blob
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType
        });

        // Create a URL for local preview playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState('recorded');

        // Convert blob to base64 for sending via Socket.io
        // Socket.io can't send binary blobs directly
        const reader = new FileReader();
        reader.onloadend = () => {
          // reader.result = "data:audio/webm;base64,AAAA..."
          onRecordingComplete({
            base64: reader.result,
            duration,
            mimeType: mediaRecorder.mimeType
          });
        };
        reader.readAsDataURL(blob);

        // Stop all microphone tracks — releases the mic
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording — collect data every 100ms
      mediaRecorder.start(100);
      setState('recording');
      setDuration(0);

      // Count up timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow mic access and try again.');
      } else {
        console.error('Recording error:', err);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    onCancel();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Format seconds as MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{
      background: '#1e1e1e', borderRadius: 8,
      padding: 12, marginBottom: 8,
      border: '1px solid #3d3d3d'
    }}>

      {state === 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={startRecording}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#f44747', border: 'none',
              cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            🎙️
          </button>
          <span style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>
            Click to record voice note (max 30s)
          </span>
          <button
            onClick={onCancel}
            style={{
              marginLeft: 'auto', background: 'none',
              border: 'none', color: '#555',
              cursor: 'pointer', fontSize: 12
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {state === 'recording' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Pulsing red dot */}
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: '#f44747',
            animation: 'pulse 1s infinite',
            flexShrink: 0
          }} />

          <span style={{
            color: '#f44747', fontFamily: 'monospace', fontSize: 13
          }}>
            {formatTime(duration)}
          </span>

          {/* Progress bar */}
          <div style={{
            flex: 1, height: 4, background: '#3d3d3d', borderRadius: 2
          }}>
            <div style={{
              width: `${(duration / MAX_DURATION) * 100}%`,
              height: '100%', background: '#f44747',
              borderRadius: 2, transition: 'width 1s linear'
            }} />
          </div>

          <span style={{ color: '#555', fontSize: 11, fontFamily: 'monospace' }}>
            {formatTime(MAX_DURATION - duration)}
          </span>

          {/* Stop button */}
          <button
            onClick={stopRecording}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#3d3d3d', border: 'none',
              cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ⏹
          </button>

          <button onClick={cancelRecording} style={{
            background: 'none', border: 'none',
            color: '#555', cursor: 'pointer', fontSize: 12
          }}>
            ✕
          </button>
        </div>
      )}

      {state === 'recorded' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#4ec9b0', fontSize: 12, fontFamily: 'monospace' }}>
            ✓ {formatTime(duration)} recorded
          </span>
          {audioUrl && (
            <audio
              src={audioUrl}
              controls
              style={{ height: 28, flex: 1 }}
            />
          )}
          <button onClick={cancelRecording} style={{
            background: 'none', border: 'none',
            color: '#555', cursor: 'pointer', fontSize: 12
          }}>
            Re-record
          </button>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

// ── PLAYER ─────────────────────────────────────────────────
export const VoicePlayer = ({ base64, duration, author, color }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(base64);
    audioRef.current = audio;

    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [base64]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = duration > 0
    ? (currentTime / duration) * 100
    : 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#1e1e1e', borderRadius: 8,
      padding: '6px 10px', marginTop: 6,
      border: `1px solid ${color}33`
    }}>

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: color, border: 'none',
          cursor: 'pointer', fontSize: 11, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#000', fontWeight: 600
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Waveform / progress bar */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: 4, background: '#3d3d3d',
            borderRadius: 2, cursor: 'pointer'
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) {
              audioRef.current.currentTime = ratio * duration;
            }
          }}
        >
          <div style={{
            width: `${progress}%`, height: '100%',
            background: color, borderRadius: 2,
            transition: 'width 0.1s linear'
          }} />
        </div>
      </div>

      {/* Time */}
      <span style={{
        color: '#888', fontSize: 10,
        fontFamily: 'monospace', flexShrink: 0
      }}>
        {formatTime(currentTime)} / {formatTime(duration || 0)}
      </span>

      {/* Mic icon */}
      <span style={{ fontSize: 12 }}>🎙️</span>
    </div>
  );
};