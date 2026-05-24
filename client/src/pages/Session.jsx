import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import MonacoEditor from '@monaco-editor/react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
} from '@codesandbox/sandpack-react';
import FileManager from '../components/FileManager';
import { getDefaultFiles, getEntryFile, getSandpackTemplate } from '../utils/templates';
import { VoiceRecorder, VoicePlayer } from '../components/VoiceNote';
import RatingModal from '../components/RatingModal';
import api from '../api/axios';

const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD',
];

// ── Inject responsive styles once ────────────────────────
const STYLE_ID = 'session-responsive-styles';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.innerHTML = `
    * { box-sizing: border-box; }

    .activity-btn {
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: transparent; border: none; cursor: pointer;
      border-left: 3px solid transparent;
      font-size: 18px; transition: background 0.15s;
      color: #858585;
    }
    .activity-btn:hover  { background: #2a2d2e; color: #ccc; }
    .activity-btn.active { border-left-color: #6366f1; color: #fff; background: #2a2d2e; }

    .sidebar-overlay {
      display: none;
      position: fixed; inset: 0; z-index: 40;
      background: rgba(0,0,0,0.5);
    }

    @media (max-width: 767px) {
      .sidebar-panel {
        position: fixed !important;
        top: 0 !important; bottom: 0 !important;
        z-index: 50;
        transition: transform 0.25s ease;
        width: 80vw !important;
        max-width: 320px !important;
      }
      .sidebar-panel.left  { left: 0;  transform: translateX(-100%); }
      .sidebar-panel.right { right: 0; transform: translateX(100%);  }
      .sidebar-panel.open  { transform: translateX(0) !important; box-shadow: 4px 0 24px rgba(0,0,0,0.6); }
      .sidebar-overlay.visible { display: block; }
      .topbar-session { display: none; }
      .topbar-lang    { display: none; }
    }

    @media (min-width: 768px) {
      .sidebar-panel { position: relative !important; transform: none !important; }
      .sidebar-panel.closed-desktop { display: none !important; }
    }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #1e1e1e; }
    ::-webkit-scrollbar-thumb { background: #424242; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #555; }
  `;
  document.head.appendChild(style);
}

const Session = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socketRef, socketReady } = useSocket();
  const { user } = useAuth();

  // ── Multi-file state ──────────────────────────────────────
  const [files, setFiles] = useState({ '/index.js': '// Start coding...' });
  const [activeFile, setActiveFile] = useState('/index.js');
  const [language, setLanguage] = useState('javascript');

  // ── UI state ──────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedLine, setSelectedLine] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [showOutput, setShowOutput] = useState(false);
  const [outputTab, setOutputTab] = useState('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [commentMode, setCommentMode] = useState('text');

  // ── Session end + rating state ────────────────────────────
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [sessionUsers, setSessionUsers] = useState([]);

  // ── TWO independent sidebar booleans ─────────────────────
  const [showFiles, setShowFiles] = useState(true);
  const [showComments, setShowComments] = useState(true);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowFiles(false);
        setShowComments(false);
      } else {
        setShowFiles(true);
        setShowComments(true);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSidebar = (panel) => {
    if (panel === 'files') setShowFiles(v => !v);
    if (panel === 'comments') setShowComments(v => !v);
  };

  const closeSidebarMobile = () => {
    if (isMobile) {
      setShowFiles(false);
      setShowComments(false);
    }
  };

  const showFilesSidebar = showFiles;
  const showCommentsSidebar = showComments;

  // ── Resizable split ───────────────────────────────────────
  const [editorHeight, setEditorHeight] = useState(50);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const containerRef = useRef(null);

  const joinedRef = useRef(false);
  const filesRef = useRef(files);
  useEffect(() => { filesRef.current = files; }, [files]);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const isRemoteUpdate = useRef(false);
  const colorMapRef = useRef({});
  const colorIndexRef = useRef(0);
  const cursorTimeoutsRef = useRef({});

  const getColorForUser = useCallback((username) => {
    if (!colorMapRef.current[username]) {
      colorMapRef.current[username] =
        CURSOR_COLORS[colorIndexRef.current % CURSOR_COLORS.length];
      colorIndexRef.current++;
    }
    return colorMapRef.current[username];
  }, []);

  // ── Drag to resize ────────────────────────────────────────
  const handleDragStart = (e) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartHeight.current = editorHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaY = e.clientY - dragStartY.current;
      const deltaPercent = (deltaY / containerRect.height) * 100;
      const newHeight = dragStartHeight.current + deltaPercent;
      setEditorHeight(Math.min(80, Math.max(20, newHeight)));
    };
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // ── Socket events ─────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socketReady || joinedRef.current) return;

    joinedRef.current = true;
    socket.emit('join-room', { sessionId });

    const onSessionInit = ({ files: existingFiles, language: existingLang, comments: existingComments }) => {
      const lang = existingLang || 'javascript';
      setLanguage(lang);
      if (existingFiles && Object.keys(existingFiles).length > 0) {
        setFiles(existingFiles);
        filesRef.current = existingFiles;
        const entry = getEntryFile(lang);
        setActiveFile(existingFiles[entry] ? entry : Object.keys(existingFiles)[0]);
      } else {
        const defaultFiles = getDefaultFiles(lang);
        setFiles(defaultFiles);
        filesRef.current = defaultFiles;
        setActiveFile(getEntryFile(lang));
      }
      setComments(existingComments || []);
    };

    const onFileChange = ({ path, content }) => {
      isRemoteUpdate.current = true;
      setFiles(prev => ({ ...prev, [path]: content }));
    };
    const onFileCreated = ({ path, content }) => {
      setFiles(prev => prev[path] ? prev : { ...prev, [path]: content || '' });
    };
    const onFileDeleted = ({ path }) => {
      setFiles(prev => { const u = { ...prev }; delete u[path]; return u; });
    };

    // ── user-joined: also track userId for rating modal ───
    const onUserJoined = ({ username, userId }) => {
      setUsers(prev => prev.includes(username) ? prev : [...prev, username]);
      setRemoteUsers(prev => ({
        ...prev,
        [username]: { color: getColorForUser(username), position: null }
      }));
      // Track for rating selector
      setSessionUsers(prev => {
        if (prev.find(u => u.username === username)) return prev;
        return [...prev, { username, id: userId }];
      });
    };

    const onUserLeft = ({ username }) => {
      setUsers(prev => prev.filter(u => u !== username));
      setRemoteUsers(prev => { const u = { ...prev }; delete u[username]; return u; });
      if (cursorTimeoutsRef.current[username]) {
        clearTimeout(cursorTimeoutsRef.current[username]);
        delete cursorTimeoutsRef.current[username];
      }
      document.getElementById(`cursor-style-${username}`)?.remove();
    };

    const onCursorMove = ({ username, position }) => {
      setRemoteUsers(prev => ({
        ...prev,
        [username]: { color: prev[username]?.color || getColorForUser(username), position }
      }));
      if (cursorTimeoutsRef.current[username]) clearTimeout(cursorTimeoutsRef.current[username]);
      cursorTimeoutsRef.current[username] = setTimeout(() => {
        setRemoteUsers(prev => ({ ...prev, [username]: { ...prev[username], position: null } }));
      }, 2000);
    };

    const onNewComment = ({ comment }) => setComments(prev => [...prev, comment]);

    // ── Session was deleted by creator — redirect everyone out
    const onSessionDeleted = ({ deletedBy }) => {
      alert(`This session was deleted by ${deletedBy}`);
      navigate('/lobby');
    };

    // ── Session ended by someone ──────────────────────────
    const onSessionEnded = ({ endedBy }) => {
      setSessionEnded(true);
      // If current user is the one who ended it, show rating modal
      if (endedBy === user?.username) {
        setShowRating(true);
      }
    };

    socket.on('session-init',    onSessionInit);
    socket.on('file-change',     onFileChange);
    socket.on('file-created',    onFileCreated);
    socket.on('file-deleted',    onFileDeleted);
    socket.on('user-joined',     onUserJoined);
    socket.on('user-left',       onUserLeft);
    socket.on('cursor-move',     onCursorMove);
    socket.on('new-comment',     onNewComment);
    socket.on('session-ended',   onSessionEnded);
    socket.on('session-deleted', onSessionDeleted);

    return () => {
      socket.off('session-init',    onSessionInit);
      socket.off('file-change',     onFileChange);
      socket.off('file-created',    onFileCreated);
      socket.off('file-deleted',    onFileDeleted);
      socket.off('user-joined',     onUserJoined);
      socket.off('user-left',       onUserLeft);
      socket.off('cursor-move',     onCursorMove);
      socket.off('new-comment',     onNewComment);
      socket.off('session-ended',   onSessionEnded);
      socket.off('session-deleted', onSessionDeleted);
      Object.values(cursorTimeoutsRef.current).forEach(clearTimeout);
    };
  }, [socketReady, sessionId, getColorForUser, user, navigate]);

  // ── Draw remote cursors ───────────────────────────────────
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    const newDecorations = Object.entries(remoteUsers)
      .filter(([_, data]) => data.position !== null)
      .map(([username, data]) => {
        const { position, color } = data;
        document.getElementById(`cursor-style-${username}`)?.remove();
        const style = document.createElement('style');
        style.id = `cursor-style-${username}`;
        style.innerHTML = `
          .remote-cursor-${username} { border-left: 2px solid ${color}; margin-left: -1px; }
          .remote-cursor-label-${username}::before {
            content: "${username}"; background: ${color}; color: #000;
            font-size: 10px; padding: 1px 5px; border-radius: 3px 3px 3px 0;
            position: absolute; top: -18px; white-space: nowrap;
            pointer-events: none; font-family: monospace;
          }
        `;
        document.head.appendChild(style);
        return {
          range: new monaco.Range(
            position.lineNumber, position.column,
            position.lineNumber, position.column
          ),
          options: {
            className: `remote-cursor-${username}`,
            beforeContentClassName: `remote-cursor-label-${username}`,
            hoverMessage: { value: `**${username}**` }
          }
        };
      });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [remoteUsers]);

  // ── Monaco mount ──────────────────────────────────────────
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.onDidChangeCursorPosition((e) => {
      if (e.reason !== monaco.editor.CursorChangeReason.Explicit) return;
      if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }
      setSelectedLine(e.position.lineNumber);
      socketRef.current?.emit('cursor-move', {
        sessionId,
        position: { lineNumber: e.position.lineNumber, column: e.position.column }
      });
    });
  };

  const handleCodeChange = (newContent) => {
    if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }
    const updated = newContent || '';
    setFiles(prev => ({ ...prev, [activeFile]: updated }));
    socketRef.current?.emit('file-change', { sessionId, path: activeFile, content: updated });
    const position = editorRef.current?.getPosition();
    if (position) {
      socketRef.current?.emit('cursor-move', {
        sessionId,
        position: { lineNumber: position.lineNumber, column: position.column }
      });
    }
  };

  const handleFileCreate = (path) => {
    const defaultContent = {
      '.js': '// New JavaScript file\n',
      '.jsx': 'export default function Component() {\n  return <div>Component</div>;\n}\n',
      '.ts': '// New TypeScript file\n',
      '.tsx': 'export default function Component() {\n  return <div>Component</div>;\n}\n',
      '.css': '/* New styles */\n',
      '.html': '<!DOCTYPE html>\n<html>\n<head></head>\n<body>\n\n</body>\n</html>\n',
      '.json': '{\n  \n}\n',
    };
    const ext = path.match(/\.[^.]+$/)?.[0] || '';
    const content = defaultContent[ext] || '';
    setFiles(prev => ({ ...prev, [path]: content }));
    setActiveFile(path);
    socketRef.current?.emit('file-created', { sessionId, path, content });
  };

  const handleFileDelete = (path) => {
    if (Object.keys(files).length === 1) return;
    const updated = { ...files };
    delete updated[path];
    setFiles(updated);
    if (activeFile === path) setActiveFile(Object.keys(updated)[0]);
    socketRef.current?.emit('file-deleted', { sessionId, path });
  };

  const handleFileSelect = (path) => {
    setActiveFile(path);
    if (isMobile) setShowFiles(false);
    setRemoteUsers(prev => {
      const reset = {};
      Object.entries(prev).forEach(([u, d]) => { reset[u] = { ...d, position: null }; });
      return reset;
    });
  };

  const handlePostComment = () => {
    if (!newComment.trim() || !selectedLine) return;
    const comment = {
      lineNumber: selectedLine,
      body: newComment,
      author: user.username,
      file: activeFile
    };
    socketRef.current?.emit('new-comment', { sessionId, comment });
    setNewComment('');
  };

  const handleVoiceComplete = (recording) => {
    if (!selectedLine) {
      alert('Click a line in the editor first, then record');
      return;
    }
    socketRef.current?.emit('voice-note', {
      sessionId,
      lineNumber: selectedLine,
      base64: recording.base64,
      duration: recording.duration,
      mimeType: recording.mimeType,
      file: activeFile
    });
    setCommentMode('text');
  };

  // ── End Session ───────────────────────────────────────────
  const handleEndSession = () => {
    socketRef.current?.emit('end-session', { sessionId });
    setSessionEnded(true);
    setShowRating(true);
  };

  const getMonacoLang = (filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
    if (filePath.endsWith('.css')) return 'css';
    if (filePath.endsWith('.html')) return 'html';
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.md')) return 'markdown';
    return 'javascript';
  };

  const sandpackTemplate = getSandpackTemplate(language);

  // Reviewers = everyone in the session except the current user
  const reviewers = sessionUsers.filter(u => u.username !== user?.username);

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: '#1e1e1e', overflow: 'hidden',
    }}>

      {/* ══════════════════════════════════════
          TOP BAR
      ══════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', background: '#2d2d2d',
        borderBottom: '1px solid #3d3d3d',
        flexShrink: 0, flexWrap: 'wrap', minHeight: 42,
      }}>
        <span className="topbar-session" style={{
          color: '#ccc', fontSize: 13, fontFamily: 'monospace'
        }}>
          {'</>'} Session #{sessionId}
        </span>
        <span className="topbar-lang" style={{
          fontSize: 11, padding: '2px 8px',
          background: '#1e1e2e', color: '#6366f1',
          borderRadius: 20, fontFamily: 'monospace'
        }}>
          {language}
        </span>

        {user && (
          <span style={{
            fontSize: 11, padding: '2px 8px',
            background: '#0e639c', borderRadius: 12,
            color: '#fff', whiteSpace: 'nowrap',
          }}>
            👤 {user.username}
          </span>
        )}

        {Object.entries(remoteUsers).map(([username, data]) => (
          <span key={username} style={{
            fontSize: 11, padding: '2px 8px',
            background: data.color, borderRadius: 12,
            color: '#000', fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            👤 {username}
          </span>
        ))}

        <span style={{
          fontSize: 11,
          color: socketReady ? '#4ec9b0' : '#f44747'
        }}>
          {socketReady ? '●' : '○'}
        </span>

        <button
          onClick={() => { setShowOutput(v => !v); setIsFullscreen(false); }}
          style={{
            marginLeft: 'auto', padding: '5px 16px',
            background: showOutput ? '#3c3c3c' : '#4ec9b0',
            color: showOutput ? '#ccc' : '#000',
            border: 'none', borderRadius: 6,
            fontFamily: 'monospace', fontSize: 12,
            fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.2s', whiteSpace: 'nowrap',
          }}
        >
          {showOutput ? '✕ Close' : '▶ Run'}
        </button>

        {/* ── End Session button ──────────────────── */}
        {!sessionEnded ? (
          <button
            onClick={handleEndSession}
            style={{
              padding: '5px 12px',
              background: 'transparent',
              color: '#f44747',
              border: '1px solid #f44747',
              borderRadius: 6,
              fontFamily: 'monospace', fontSize: 12,
              cursor: 'pointer',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(244,71,71,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ■ End Session
          </button>
        ) : (
          !ratingDone && (
            <span style={{
              fontSize: 11, color: '#f44747',
              fontFamily: 'monospace', whiteSpace: 'nowrap',
            }}>
              Session ended
            </span>
          )
        )}

        {ratingDone && (
          <span style={{
            fontSize: 11, color: '#4ec9b0',
            fontFamily: 'monospace', whiteSpace: 'nowrap',
          }}>
            ✓ Rated
          </span>
        )}

        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '5px 12px',
            background: '#1e1e1e', color: '#ccc',
            border: '1px solid #3d3d3d', borderRadius: 6,
            cursor: 'pointer', fontSize: 12, fontFamily: 'monospace',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#333'}
          onMouseLeave={e => e.currentTarget.style.background = '#1e1e1e'}
        >
          ← Back
        </button>
      </div>

      {/* ══════════════════════════════════════
          BODY
      ══════════════════════════════════════ */}
      <SandpackProvider
        template={sandpackTemplate}
        files={files}
        theme="dark"
        options={{ recompileMode: 'delayed', recompileDelay: 600 }}
        style={{
          flex: 1, minHeight: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* ── Activity bar ─────────────────────── */}
          {!isFullscreen && (
            <div style={{
              width: 44, background: '#333333',
              borderRight: '1px solid #252526',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', paddingTop: 4,
              flexShrink: 0, zIndex: 10,
            }}>
              <button
                className={`activity-btn ${showFilesSidebar ? 'active' : ''}`}
                onClick={() => toggleSidebar('files')}
                title="Explorer"
              >
                📁
              </button>
              <button
                className={`activity-btn ${showCommentsSidebar ? 'active' : ''}`}
                onClick={() => toggleSidebar('comments')}
                title="Comments"
                style={{ position: 'relative' }}
              >
                💬
                {comments.length > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#6366f1', display: 'block',
                  }} />
                )}
              </button>
            </div>
          )}

          {/* ── Mobile overlay backdrop ──────────── */}
          <div
            className={`sidebar-overlay ${isMobile && (showFiles || showComments) ? 'visible' : ''}`}
            onClick={closeSidebarMobile}
          />

          {/* ── LEFT PANEL: File manager ─────────── */}
          {!isFullscreen && (
            <div
              className={`sidebar-panel left ${showFilesSidebar ? 'open' : ''} ${!showFilesSidebar && !isMobile ? 'closed-desktop' : ''}`}
              style={{
                width: 200, background: '#252526',
                borderRight: '1px solid #3d3d3d',
                display: 'flex', flexDirection: 'column',
                flexShrink: 0, overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '8px 12px', borderBottom: '1px solid #3d3d3d',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexShrink: 0,
              }}>
                <span style={{
                  color: '#bbb', fontSize: 11, fontFamily: 'monospace',
                  textTransform: 'uppercase', letterSpacing: 1
                }}>
                  Explorer
                </span>
                {isMobile && (
                  <button
                    onClick={() => setShowFiles(false)}
                    style={{
                      background: 'none', border: 'none',
                      color: '#888', cursor: 'pointer',
                      fontSize: 16, lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <FileManager
                  files={files}
                  activeFile={activeFile}
                  onFileSelect={handleFileSelect}
                  onFileCreate={handleFileCreate}
                  onFileDelete={handleFileDelete}
                />
              </div>
            </div>
          )}

          {/* ── EDITOR + OUTPUT column ───────────── */}
          <div
            ref={containerRef}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              overflow: 'hidden', minHeight: 0,
            }}
          >
            {/* Active file tab */}
            {!isFullscreen && (
              <div style={{
                padding: '4px 12px', background: '#2d2d2d',
                borderBottom: '1px solid #3d3d3d',
                display: 'flex', alignItems: 'center',
                flexShrink: 0, gap: 8,
              }}>
                <span style={{
                  fontSize: 12, color: '#ccc', fontFamily: 'monospace',
                  background: '#1e1e1e', padding: '3px 12px',
                  borderRadius: '4px 4px 0 0',
                  borderTop: '2px solid #6366f1',
                  maxWidth: '60vw', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {activeFile.replace('/', '')}
                </span>
              </div>
            )}

            {/* Monaco editor */}
            {!isFullscreen && (
              <div style={{
                flex: showOutput ? `0 0 ${editorHeight}%` : '1 1 0',
                overflow: 'hidden', minHeight: 0,
              }}>
                <MonacoEditor
                  height="100%"
                  language={getMonacoLang(activeFile)}
                  theme="vs-dark"
                  value={files[activeFile] || ''}
                  onChange={handleCodeChange}
                  onMount={handleEditorMount}
                  path={activeFile}
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                    padding: { top: 12 },
                    fontFamily: 'JetBrains Mono, monospace',
                    cursorBlinking: 'smooth',
                  }}
                />
              </div>
            )}

            {/* Drag handle */}
            {showOutput && !isFullscreen && (
              <div
                onMouseDown={handleDragStart}
                style={{
                  height: 6, background: '#3d3d3d',
                  cursor: 'row-resize', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#6366f1'}
                onMouseLeave={e => e.currentTarget.style.background = '#3d3d3d'}
              >
                <div style={{ display: 'flex', gap: 3 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 3, height: 3,
                      borderRadius: '50%', background: '#666'
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Output panel */}
            {showOutput && (
              <div style={{
                flex: isFullscreen ? '1 1 0' : `0 0 ${100 - editorHeight}%`,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', background: '#0d0d0f', minHeight: 0,
              }}>
                {/* Output tab bar */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: '#1a1a1f',
                  borderBottom: '1px solid #2d2d2d',
                  flexShrink: 0,
                }}>
                  {[
                    { id: 'preview', label: '🌐 Preview' },
                    { id: 'console', label: '⬛ Console' },
                    { id: 'terminal', label: '💻 Terminal' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setOutputTab(tab.id)}
                      style={{
                        padding: '7px 12px',
                        background: outputTab === tab.id ? '#2d2d2d' : 'transparent',
                        color: outputTab === tab.id ? '#fff' : '#888',
                        border: 'none',
                        borderBottom: outputTab === tab.id
                          ? '2px solid #6366f1'
                          : '2px solid transparent',
                        cursor: 'pointer',
                        fontSize: 11, fontFamily: 'monospace',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}

                  <div style={{
                    marginLeft: 'auto',
                    display: 'flex', gap: 4, paddingRight: 8
                  }}>
                    <button
                      onClick={() => setIsFullscreen(v => !v)}
                      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                      style={{
                        padding: '3px 8px',
                        background: isFullscreen ? '#6366f1' : 'transparent',
                        color: isFullscreen ? '#fff' : '#888',
                        border: `1px solid ${isFullscreen ? '#6366f1' : '#3d3d3d'}`,
                        borderRadius: 4, cursor: 'pointer', fontSize: 13,
                      }}
                    >
                      {isFullscreen ? '⊡' : '⊞'}
                    </button>
                    {!isFullscreen && (
                      <>
                        <button
                          onClick={() => setEditorHeight(20)}
                          style={resizeBtnStyle}
                        >
                          ↑ Max
                        </button>
                        <button
                          onClick={() => setEditorHeight(50)}
                          style={resizeBtnStyle}
                        >
                          ⬚ 50/50
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Tab content */}
                <div style={{
                  flex: 1, minHeight: 0, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column'
                }}>
                  <div style={{
                    flex: 1, minHeight: 0,
                    display: outputTab === 'preview' ? 'flex' : 'none',
                    overflow: 'hidden'
                  }}>
                    <SandpackPreview
                      style={{ height: '100%', width: '100%', border: 'none' }}
                      showNavigator
                      showOpenInCodeSandbox={false}
                    />
                  </div>
                  <div style={{
                    flex: 1, minHeight: 0,
                    display: outputTab === 'console' ? 'flex' : 'none',
                    overflow: 'hidden'
                  }}>
                    <SandpackConsole
                      style={{ height: '100%', width: '100%' }}
                      showHeader={false}
                    />
                  </div>
                  <div style={{
                    flex: 1, minHeight: 0,
                    display: outputTab === 'terminal' ? 'flex' : 'none',
                    flexDirection: 'column', overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '5px 16px', background: '#111',
                      color: '#888', fontSize: 11,
                      fontFamily: 'monospace', flexShrink: 0
                    }}>
                      💻 try: <span style={{ color: '#4ec9b0' }}>npm install lodash</span>
                    </div>
                    <SandpackTerminalComponent />
                  </div>
                </div>
              </div>
            )}

            {/* Status bar */}
            <div style={{
              padding: '3px 12px', background: '#007acc',
              color: 'white', fontSize: 11, fontFamily: 'monospace',
              display: 'flex', gap: 12, flexShrink: 0, alignItems: 'center',
            }}>
              <span>{selectedLine ? `Ln ${selectedLine}` : 'Click in editor'}</span>
              <span>{Object.keys(files).length} file(s)</span>
              <span>{Object.keys(remoteUsers).length + 1} user(s)</span>
              {sessionEnded && (
                <span style={{ color: 'rgba(255,100,100,0.9)' }}>● Session ended</span>
              )}
              {showOutput && !isFullscreen && (
                <span style={{
                  marginLeft: 'auto',
                  color: 'rgba(255,255,255,0.6)', fontSize: 10
                }}>
                  drag ··· to resize
                </span>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL: Comments ────────────── */}
          {!isFullscreen && (
            <div
              className={`sidebar-panel right ${showCommentsSidebar ? 'open' : ''} ${!showCommentsSidebar && !isMobile ? 'closed-desktop' : ''}`}
              style={{
                width: 270, background: '#252526',
                borderLeft: '1px solid #3d3d3d',
                display: 'flex', flexDirection: 'column',
                flexShrink: 0, minHeight: 0, overflow: 'hidden',
              }}
            >
              {/* Panel header */}
              <div style={{
                padding: '8px 12px', borderBottom: '1px solid #3d3d3d',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexShrink: 0,
              }}>
                <div>
                  <span style={{
                    color: '#bbb', fontSize: 11,
                    fontFamily: 'monospace',
                    textTransform: 'uppercase', letterSpacing: 1
                  }}>
                    Comments
                  </span>
                  {selectedLine && (
                    <span style={{
                      color: '#888', fontSize: 10,
                      marginLeft: 8, fontFamily: 'monospace'
                    }}>
                      {activeFile.replace('/', '')} · Ln {selectedLine}
                    </span>
                  )}
                </div>
                {isMobile && (
                  <button
                    onClick={() => setShowComments(false)}
                    style={{
                      background: 'none', border: 'none',
                      color: '#888', cursor: 'pointer',
                      fontSize: 16, lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Comment list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 10, minHeight: 0 }}>
                {comments.length === 0 && (
                  <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
                    Click a line in the editor then comment
                  </p>
                )}
                {comments.map((c, i) => (
                  <div key={i} style={{
                    marginBottom: 8, padding: 9,
                    background: '#1e1e1e', borderRadius: 6,
                    borderLeft: `3px solid ${getColorForUser(c.author)}`,
                  }}>
                    <p style={{
                      fontSize: 10, margin: '0 0 4px',
                      color: getColorForUser(c.author),
                      fontFamily: 'monospace'
                    }}>
                      {c.file?.replace('/', '') || ''} · Ln {c.lineNumber} · {c.author}
                    </p>
                    {c.isVoiceNote && c.audioUrl ? (
                      <VoicePlayer
                        base64={c.audioUrl}
                        duration={c.duration || 0}
                        author={c.author}
                        color={getColorForUser(c.author)}
                      />
                    ) : (
                      <p style={{ fontSize: 12, color: '#ccc', margin: 0 }}>{c.body}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Add comment area */}
              <div style={{ padding: 10, borderTop: '1px solid #3d3d3d', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  <button
                    onClick={() => setCommentMode('text')}
                    style={{
                      flex: 1, padding: '5px 0',
                      background: commentMode === 'text' ? '#007acc' : '#3c3c3c',
                      color: commentMode === 'text' ? '#fff' : '#888',
                      border: 'none', borderRadius: 4, cursor: 'pointer',
                      fontSize: 11, fontFamily: 'monospace',
                      transition: 'background 0.2s',
                    }}
                  >
                    ✏️ Text
                  </button>
                  <button
                    onClick={() => setCommentMode('voice')}
                    style={{
                      flex: 1, padding: '5px 0',
                      background: commentMode === 'voice' ? '#f44747' : '#3c3c3c',
                      color: commentMode === 'voice' ? '#fff' : '#888',
                      border: 'none', borderRadius: 4, cursor: 'pointer',
                      fontSize: 11, fontFamily: 'monospace',
                      transition: 'background 0.2s',
                    }}
                  >
                    🎙️ Voice
                  </button>
                </div>

                {commentMode === 'voice' && (
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceComplete}
                    onCancel={() => setCommentMode('text')}
                  />
                )}

                {commentMode === 'text' && (
                  <>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder={
                        selectedLine
                          ? `Comment on line ${selectedLine}...`
                          : 'Click a line first'
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
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={handlePostComment}
                      disabled={!newComment.trim() || !selectedLine}
                      style={{
                        marginTop: 6, width: '100%', padding: 7,
                        background: (newComment.trim() && selectedLine)
                          ? '#007acc' : '#3c3c3c',
                        color: (newComment.trim() && selectedLine)
                          ? '#fff' : '#666',
                        border: 'none', borderRadius: 6,
                        cursor: 'pointer', fontSize: 12,
                        fontFamily: 'monospace',
                      }}
                    >
                      Add Comment (Ctrl+Enter)
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </SandpackProvider>

      {/* ── Rating Modal ──────────────────────────────────── */}
      {showRating && !ratingDone && (
        <RatingModal
          sessionId={sessionId}
          reviewers={reviewers}
          onClose={() => setShowRating(false)}
          onRated={(data) => {
            setRatingDone(true);
            setShowRating(false);
            console.log('Rating submitted:', data);
          }}
        />
      )}
    </div>
  );
};

// ── Shared button style for resize controls ───────────────
const resizeBtnStyle = {
  padding: '3px 8px', background: 'transparent',
  color: '#888', border: '1px solid #3d3d3d',
  borderRadius: 4, cursor: 'pointer',
  fontSize: 10, fontFamily: 'monospace',
};

// ── Sandpack Terminal — lazy loaded ──────────────────────
const SandpackTerminalComponent = () => {
  const [TerminalComp, setTerminalComp] = useState(null);

  useEffect(() => {
    import('@codesandbox/sandpack-react').then(module => {
      if (module.SandpackTerminal) {
        setTerminalComp(() => module.SandpackTerminal);
      }
    });
  }, []);

  if (!TerminalComp) {
    return (
      <div style={{
        flex: 1, background: '#0d0d0f',
        color: '#4ec9b0', fontFamily: 'monospace',
        fontSize: 13, padding: 16
      }}>
        $ loading terminal...
      </div>
    );
  }

  return (
    <TerminalComp
      style={{ height: '100%', width: '100%' }}
      showHeader={false}
    />
  );
};

export default Session;