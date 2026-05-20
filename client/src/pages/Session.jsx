import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import MonacoEditor from '@monaco-editor/react';

// CURSOR_COLORS — constant, safe to keep at module level
const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD',
];

// ── Component ───────────────────────────────────────────────
const Session = () => {
  const { sessionId } = useParams();
  const { socketRef, socketReady } = useSocket();
  const { user } = useAuth();

  const [code, setCode] = useState('// Start typing your code here...');
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedLine, setSelectedLine] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState({});
  // remoteUsers shape:
  // { "raj": { position: null | {lineNumber, column}, color: "#4ECDC4" } }
  // position = null → cursor hidden
  // position = coords → cursor visible
  // position goes null again after 2s of inactivity

  const joinedRef = useRef(false);
  const codeRef = useRef(code);
  useEffect(() => { codeRef.current = code; }, [code]);

  // Monaco refs
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  // Prevents phantom cursor emit when remote code update
  // triggers Monaco's onDidChangeCursorPosition internally
  const isRemoteUpdate = useRef(false);

  // Per-component color map — isolated per browser tab
  const colorMapRef = useRef({});
  const colorIndexRef = useRef(0);

  // One timeout per remote user — hides cursor after 2s inactivity
  const cursorTimeoutsRef = useRef({});

  const getColorForUser = (username) => {
    if (!colorMapRef.current[username]) {
      colorMapRef.current[username] =
        CURSOR_COLORS[colorIndexRef.current % CURSOR_COLORS.length];
      colorIndexRef.current++;
    }
    return colorMapRef.current[username];
  };

  // ── Socket events ─────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socketReady || joinedRef.current) return;

    joinedRef.current = true;
    socket.emit('join-room', { sessionId });
    console.log('Joined room:', sessionId);

    // ── Server sends existing code + comments when we join ──
    // This fires once per join — loads persisted DB data
    const onSessionInit = ({ code: existingCode, comments: existingComments }) => {
      console.log('Session init received:', existingCode?.slice(0, 30));
      setCode(existingCode || '// Start typing your code here...');
      codeRef.current = existingCode || '// Start typing your code here...';
      setComments(existingComments || []);
    };

    const onCodeChange = ({ code: remoteCode }) => {
      if (remoteCode !== codeRef.current) {
        isRemoteUpdate.current = true;
        setCode(remoteCode);
      }
    };

    const onUserJoined = ({ username }) => {
      setUsers(prev => prev.includes(username) ? prev : [...prev, username]);
      setRemoteUsers(prev => ({
        ...prev,
        [username]: {
          color: getColorForUser(username),
          position: null
        }
      }));
    };

    const onUserLeft = ({ username }) => {
      setUsers(prev => prev.filter(u => u !== username));
      setRemoteUsers(prev => {
        const updated = { ...prev };
        delete updated[username];
        return updated;
      });
      if (cursorTimeoutsRef.current[username]) {
        clearTimeout(cursorTimeoutsRef.current[username]);
        delete cursorTimeoutsRef.current[username];
      }
      const styleEl = document.getElementById(`cursor-style-${username}`);
      if (styleEl) styleEl.remove();
    };

    const onCursorMove = ({ username, position }) => {
      setRemoteUsers(prev => ({
        ...prev,
        [username]: {
          color: prev[username]?.color || getColorForUser(username),
          position
        }
      }));

      if (cursorTimeoutsRef.current[username]) {
        clearTimeout(cursorTimeoutsRef.current[username]);
      }

      cursorTimeoutsRef.current[username] = setTimeout(() => {
        setRemoteUsers(prev => ({
          ...prev,
          [username]: {
            ...prev[username],
            position: null
          }
        }));
      }, 2000);
    };

    const onNewComment = ({ comment }) => {
      setComments(prev => [...prev, comment]);
    };

    socket.on('session-init', onSessionInit);
    socket.on('code-change', onCodeChange);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('cursor-move', onCursorMove);
    socket.on('new-comment', onNewComment);

    return () => {
      socket.off('session-init', onSessionInit);
      socket.off('code-change', onCodeChange);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('cursor-move', onCursorMove);
      socket.off('new-comment', onNewComment);
      Object.values(cursorTimeoutsRef.current).forEach(clearTimeout);
    };
  }, [socketReady, sessionId]);

  // ── Draw remote cursors whenever remoteUsers changes ──────
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    const newDecorations = Object.entries(remoteUsers)
      // Skip users with null position — hidden (just joined or inactive)
      .filter(([_, data]) => data.position !== null)
      .map(([username, data]) => {
        const { position, color } = data;

        // Always remove + re-inject — prevents stale CSS labels
        const styleId = `cursor-style-${username}`;
        const existing = document.getElementById(styleId);
        if (existing) existing.remove();

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .remote-cursor-${username} {
            border-left: 2px solid ${color};
            margin-left: -1px;
          }
          .remote-cursor-label-${username}::before {
            content: "${username}";
            background: ${color};
            color: #000;
            font-size: 10px;
            padding: 1px 5px;
            border-radius: 3px 3px 3px 0;
            position: absolute;
            top: -18px;
            white-space: nowrap;
            pointer-events: none;
            font-family: monospace;
          }
        `;
        document.head.appendChild(style);

        return {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          options: {
            className: `remote-cursor-${username}`,
            beforeContentClassName: `remote-cursor-label-${username}`,
            hoverMessage: { value: `**${username}**` }
          }
        };
      });

    // Replace all old decorations with fresh set
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );

  }, [remoteUsers]);

  // ── Monaco mount ──────────────────────────────────────────
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      // Monaco tells us WHY the cursor moved:
      // Explicit (3) = user clicked or used arrow keys → broadcast
      // NotSet   (0) = automatic on load               → ignore
      // Others       = paste, undo, remote update       → ignore
      const CursorChangeReason = monaco.editor.CursorChangeReason;
      if (e.reason !== CursorChangeReason.Explicit) return;

      // Also skip if this was a remote code update
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
      }

      setSelectedLine(e.position.lineNumber);
      socketRef.current?.emit('cursor-move', {
        sessionId,
        position: {
          lineNumber: e.position.lineNumber,
          column: e.position.column
        }
      });
    });
  };

  // ── Local user typed ──────────────────────────────────────
  const handleCodeChange = (newCode) => {
    setCode(newCode || '');
    socketRef.current?.emit('code-change', {
      sessionId,
      code: newCode || ''
    });

    // Typing doesn't always fire as "Explicit" cursor reason in Monaco
    // Manually grab and emit current position so others see cursor while typing
    const position = editorRef.current?.getPosition();
    if (position) {
      socketRef.current?.emit('cursor-move', {
        sessionId,
        position: {
          lineNumber: position.lineNumber,
          column: position.column
        }
      });
    }
  };

  // ── Post a comment ────────────────────────────────────────
  const handlePostComment = () => {
    if (!newComment.trim() || !selectedLine) return;

    const comment = {
      lineNumber: selectedLine,
      body: newComment,
      author: user.username,
    };

    socketRef.current?.emit('new-comment', { sessionId, comment });
    setNewComment('');
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1e1e1e' }}>

      {/* ── Editor side ───────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '8px 16px', background: '#2d2d2d',
          borderBottom: '1px solid #3d3d3d'
        }}>
          <span style={{ color: '#ccc', fontSize: 13, fontFamily: 'monospace' }}>
            {'</>'} Session #{sessionId}
          </span>

          {/* Current user — always blue */}
          {user && (
            <span style={{
              fontSize: 12, padding: '2px 10px',
              background: '#0e639c', borderRadius: 12, color: '#fff'
            }}>
              👤 {user.username} (you)
            </span>
          )}

          {/* Remote users — colored badges */}
          {Object.entries(remoteUsers).map(([username, data]) => (
            <span key={username} style={{
              fontSize: 12, padding: '2px 10px',
              background: data.color, borderRadius: 12,
              color: '#000', fontWeight: 500
            }}>
              👤 {username}
            </span>
          ))}

          {/* Connection indicator */}
          <span style={{
            marginLeft: 'auto', fontSize: 11,
            color: socketReady ? '#4ec9b0' : '#f44747'
          }}>
            {socketReady ? '● connected' : '○ connecting...'}
          </span>
        </div>

        {/* Monaco Editor */}
        <div style={{ flex: 1 }}>
          <MonacoEditor
            height="100%"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 16 },
              fontFamily: 'JetBrains Mono, monospace',
              cursorBlinking: 'smooth',
            }}
          />
        </div>

        {/* Status bar */}
        <div style={{
          padding: '4px 16px', background: '#007acc',
          color: 'white', fontSize: 12, fontFamily: 'monospace',
          display: 'flex', gap: 16
        }}>
          <span>
            {selectedLine ? `Ln ${selectedLine}` : 'Click in editor'}
          </span>
          <span>
            {Object.keys(remoteUsers).length + 1} user(s) in session
          </span>
        </div>
      </div>

      {/* ── Comments panel ────────────────────────────────── */}
      <div style={{
        width: 300, background: '#252526',
        borderLeft: '1px solid #3d3d3d',
        display: 'flex', flexDirection: 'column'
      }}>

        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #3d3d3d'
        }}>
          <p style={{ color: '#ccc', fontSize: 13, fontWeight: 500, margin: 0 }}>
            💬 Inline Comments
          </p>
          {selectedLine && (
            <p style={{
              color: '#888', fontSize: 11,
              margin: '4px 0 0', fontFamily: 'monospace'
            }}>
              commenting on line {selectedLine}
            </p>
          )}
        </div>

        {/* Comment list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {comments.length === 0 && (
            <p style={{ color: '#555', fontSize: 12 }}>
              Click a line in the editor, then add a comment below
            </p>
          )}
          {comments.map((c, i) => (
            <div key={i} style={{
              marginBottom: 10, padding: 10,
              background: '#1e1e1e', borderRadius: 6,
              borderLeft: `3px solid ${getColorForUser(c.author)}`
            }}>
              <p style={{
                fontSize: 11, margin: '0 0 4px',
                color: getColorForUser(c.author),
                fontFamily: 'monospace'
              }}>
                Line {c.lineNumber} · {c.author}
              </p>
              <p style={{ fontSize: 13, color: '#ccc', margin: 0 }}>
                {c.body}
              </p>
            </div>
          ))}
        </div>

        {/* Add comment */}
        <div style={{ padding: 12, borderTop: '1px solid #3d3d3d' }}>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={
              selectedLine
                ? `Comment on line ${selectedLine}...`
                : 'Click a line in the editor first'
            }
            rows={3}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) handlePostComment();
            }}
            style={{
              width: '100%', background: '#3c3c3c', color: '#ccc',
              border: '1px solid #555', borderRadius: 6,
              padding: 8, fontSize: 12, resize: 'none',
              outline: 'none', fontFamily: 'monospace',
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={handlePostComment}
            disabled={!newComment.trim() || !selectedLine}
            style={{
              marginTop: 6, width: '100%', padding: 8,
              background: (newComment.trim() && selectedLine)
                ? '#007acc' : '#3c3c3c',
              color: (newComment.trim() && selectedLine)
                ? '#fff' : '#666',
              border: 'none', borderRadius: 6,
              cursor: 'pointer', fontSize: 12,
              fontFamily: 'monospace'
            }}
          >
            Add Comment (Ctrl+Enter)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Session;