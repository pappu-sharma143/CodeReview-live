import { useEffect, useState, useRef, useCallback, useReducer } from 'react';
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
import ErrorBoundary, { SandpackErrorFallback } from '../components/ErrorBoundary';
import Logo from '../components/Logo';
import {
  sessionStateReducer,
  initialSessionState,
  sidebarReducer,
  initialSidebarState,
  outputPanelReducer,
  initialOutputState,
} from './sessionReducers';
import '../styles/session.css';

const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD',
];

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
  const [commentMode, setCommentMode] = useState('text');

  const [sessionState, dispatchSession] = useReducer(sessionStateReducer, initialSessionState);
  const [sidebar, dispatchSidebar] = useReducer(sidebarReducer, initialSidebarState);
  const [output, dispatchOutput] = useReducer(outputPanelReducer, initialOutputState);

  const {
    accessState, isOwner, joinUrl, linkCopied, canEdit, editRequestPending,
    pendingEditRequests, waitingForCreator, roomJoined, sessionEnded,
    showRating, ratingDone, sessionUsers, creatorInfo,
  } = sessionState;

  const { showFiles, showComments, isMobile } = sidebar;
  const { showOutput, outputTab, isFullscreen, editorHeight } = output;

  useEffect(() => {
    const onResize = () => {
      dispatchSidebar({ type: 'RESIZE', isMobile: window.innerWidth < 768 });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSidebar = (panel) => {
    dispatchSidebar({ type: 'TOGGLE', panel });
  };

  const closeSidebarMobile = () => {
    dispatchSidebar({ type: 'CLOSE_MOBILE' });
  };

  const showFilesSidebar = showFiles;
  const showCommentsSidebar = showComments;

  // ── Resizable split ───────────────────────────────────────
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
      dispatchOutput({
        type: 'SET_EDITOR_HEIGHT',
        height: Math.min(80, Math.max(20, newHeight)),
      });
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

  // ── Verify session access ─────────────────────────────────
  useEffect(() => {
    dispatchSession({ type: 'RESET_FOR_SESSION' });
    joinedRef.current = false;

    api.get(`/sessions/${sessionId}`)
      .then(({ data }) => {
        const owner = !!data.session.isOwner;
        dispatchSession({
          type: 'ACCESS_GRANTED',
          isOwner: owner,
          joinUrl: data.session.joinUrl || '',
          creatorInfo: {
            id: data.session.submitter_id,
            username: data.session.owner,
          },
        });
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          dispatchSession({ type: 'ACCESS_DENIED' });
        } else {
          navigate('/lobby');
        }
      });
  }, [sessionId, navigate]);

  const handleCopyInviteLink = async () => {
    try {
      let url = joinUrl;
      if (!url) {
        const { data } = await api.get(`/sessions/${sessionId}/invite`);
        url = data.joinUrl;
        dispatchSession({ type: 'SET_JOIN_URL', joinUrl: url });
      }
      await navigator.clipboard.writeText(url);
      dispatchSession({ type: 'SET_LINK_COPIED', copied: true });
      setTimeout(() => dispatchSession({ type: 'SET_LINK_COPIED', copied: false }), 2000);
    } catch {
      alert('Could not copy invite link');
    }
  };

  const retryJoinRoom = () => {
    joinedRef.current = false;
    dispatchSession({ type: 'RETRY_JOIN' });
    socketRef.current?.emit('join-room', { sessionId });
    joinedRef.current = true;
  };

  // ── Socket events ─────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socketReady || joinedRef.current || accessState !== 'granted') return;

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
    const onUserJoined = ({ username, userId, isCreator }) => {
      setUsers(prev => prev.includes(username) ? prev : [...prev, username]);
      setRemoteUsers(prev => ({
        ...prev,
        [username]: { color: getColorForUser(username), position: null }
      }));
      dispatchSession({ type: 'USER_JOINED', username, userId, isCreator });
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

    const onJoinDenied = ({ message, reason }) => {
      if (reason === 'creator-offline') {
        joinedRef.current = false;
        dispatchSession({ type: 'WAITING_FOR_CREATOR' });
        return;
      }
      alert(message);
      navigate('/lobby');
    };

    const onSessionRole = ({ canEdit: allowed, isOwner: ownerRole }) => {
      dispatchSession({
        type: 'SESSION_ROLE',
        canEdit: allowed,
        isOwner: ownerRole,
      });
    };

    const onEditAccessRequest = ({ userId, username }) => {
      dispatchSession({ type: 'EDIT_REQUEST_ADD', userId, username });
    };

    const onEditRequestsSync = ({ requests }) => {
      dispatchSession({ type: 'EDIT_REQUESTS_SYNC', requests });
    };

    const onEditAccessGranted = () => {
      dispatchSession({ type: 'EDIT_ACCESS_GRANTED' });
    };

    const onEditAccessPending = () => {
      dispatchSession({ type: 'EDIT_REQUEST_PENDING' });
    };

    const onEditAccessDeniedMsg = ({ message }) => {
      dispatchSession({ type: 'EDIT_ACCESS_DENIED' });
      if (message) alert(message);
    };

    const onEditDenied = ({ message }) => {
      alert(message || 'You do not have permission to edit code');
    };

    const onEndSessionDenied = ({ message }) => {
      alert(message);
      dispatchSession({ type: 'SESSION_END_DENIED' });
    };

    const onSessionEnded = () => {
      dispatchSession({
        type: 'SESSION_ENDED',
        showRating: !isOwner,
      });
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
    socket.on('join-denied', onJoinDenied);
    socket.on('end-session-denied', onEndSessionDenied);
    socket.on('session-role', onSessionRole);
    socket.on('edit-access-request', onEditAccessRequest);
    socket.on('edit-requests-sync', onEditRequestsSync);
    socket.on('edit-access-granted', onEditAccessGranted);
    socket.on('edit-access-pending', onEditAccessPending);
    socket.on('edit-access-denied', onEditAccessDeniedMsg);
    socket.on('edit-denied', onEditDenied);

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
      socket.off('join-denied', onJoinDenied);
      socket.off('end-session-denied', onEndSessionDenied);
      socket.off('session-role', onSessionRole);
      socket.off('edit-access-request', onEditAccessRequest);
      socket.off('edit-requests-sync', onEditRequestsSync);
      socket.off('edit-access-granted', onEditAccessGranted);
      socket.off('edit-access-pending', onEditAccessPending);
      socket.off('edit-access-denied', onEditAccessDeniedMsg);
      socket.off('edit-denied', onEditDenied);
      Object.values(cursorTimeoutsRef.current).forEach(clearTimeout);
    };
  }, [socketReady, sessionId, accessState, isOwner, getColorForUser, user, navigate]);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly: !canEdit || sessionEnded });
  }, [canEdit, sessionEnded]);

  const handleRequestEditAccess = () => {
    socketRef.current?.emit('request-edit-access', { sessionId });
  };

  const handleRespondEditAccess = (userId, approved) => {
    socketRef.current?.emit('respond-edit-access', { sessionId, userId, approved });
    dispatchSession({ type: 'EDIT_REQUEST_REMOVE', userId });
  };

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
    if (!canEdit || sessionEnded) return;
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
    if (!canEdit || sessionEnded) return;
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
    if (!canEdit || sessionEnded) return;
    if (Object.keys(files).length === 1) return;
    const updated = { ...files };
    delete updated[path];
    setFiles(updated);
    if (activeFile === path) setActiveFile(Object.keys(updated)[0]);
    socketRef.current?.emit('file-deleted', { sessionId, path });
  };

  const handleFileSelect = (path) => {
    setActiveFile(path);
    if (isMobile) dispatchSidebar({ type: 'CLOSE_FILES' });
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
    if (!isOwner) return;
    if (!window.confirm('End this session for everyone?')) return;
    socketRef.current?.emit('end-session', { sessionId });
    dispatchSession({ type: 'OWNER_END_SESSION' });
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

  const creator = sessionUsers.find(u => u.isCreator) || creatorInfo;

  if (accessState === 'checking') {
    return (
      <div className="session-root">
        <div className="app-loading" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          // verifying access…
        </div>
      </div>
    );
  }

  if (accessState === 'denied') {
    return (
      <div className="session-root">
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <p style={{ color: '#f87171' }}>You do not have access to this session.</p>
          <p style={{ color: '#888', fontSize: 13 }}>Ask the creator for an invite link to join.</p>
          <button type="button" className="session-btn-ghost" onClick={() => navigate('/lobby')}>
            ← Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (waitingForCreator && !roomJoined) {
    return (
      <div className="session-root">
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24,
        }}>
          <p style={{ color: '#fbbf24', fontSize: 15, fontWeight: 600 }}>Waiting for session creator</p>
          <p style={{ color: '#888', fontSize: 13, textAlign: 'center', maxWidth: 420 }}>
            The creator has not opened this session yet. You can join once they enter the session.
          </p>
          <button type="button" className="app-btn-primary" onClick={retryJoinRoom}>
            Try again
          </button>
          <button type="button" className="session-btn-ghost" onClick={() => navigate('/lobby')}>
            ← Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="session-root">

      <div className="session-topbar">
        <span className="topbar-session session-topbar-brand">
          <Logo
            className="inline-flex items-center gap-1.5"
            iconClassName="h-4 w-auto shrink-0"
            textClassName="text-[12px] font-semibold tracking-tight"
          />
          <span className="session-topbar-id"> · #{sessionId}</span>
        </span>
        <span className="topbar-lang session-pill session-pill--lang">
          {language}
        </span>

        {user && (
          <span className="session-pill session-pill--user">
            {user.username}{!isOwner && ' · reviewer'}
          </span>
        )}

        {!isOwner && roomJoined && (
          <span className={`session-pill ${canEdit ? 'session-pill--lang' : 'session-pill--user'}`}>
            {canEdit ? 'can edit' : 'read-only'}
          </span>
        )}

        {Object.entries(remoteUsers).map(([username, data]) => (
          <span
            key={username}
            className="session-pill session-pill--remote"
            style={{ background: data.color }}
          >
            {username}
          </span>
        ))}

        <span className={`session-status-dot ${socketReady ? 'session-status-dot--live' : 'session-status-dot--off'}`}>
          {socketReady ? '● live' : '○ offline'}
        </span>

        <button
          type="button"
          className={`session-run-btn${showOutput ? ' active' : ''}`}
          onClick={() => dispatchOutput({ type: 'TOGGLE_OUTPUT' })}
        >
          {showOutput ? '✕ Close' : '▶ Run'}
        </button>

        {isOwner && (
          <button
            type="button"
            className="session-btn-ghost session-share-btn"
            onClick={handleCopyInviteLink}
            title="Copy invite link"
          >
            {linkCopied ? '✓ Link copied' : '🔗 Invite'}
          </button>
        )}

        {!isOwner && roomJoined && !canEdit && !sessionEnded && (
          <button
            type="button"
            className="session-btn-ghost"
            onClick={handleRequestEditAccess}
            disabled={editRequestPending}
            title="Request permission to edit code"
          >
            {editRequestPending ? 'Edit requested…' : '✎ Request edit'}
          </button>
        )}

        {isOwner && !sessionEnded && (
          <button type="button" className="session-btn-danger" onClick={handleEndSession}>
            ■ End Session
          </button>
        )}

        {sessionEnded && !ratingDone && (
          <span className="session-status-dot session-status-dot--off">Session ended</span>
        )}

        {ratingDone && (
          <span className="session-status-dot session-status-dot--live">✓ Rated</span>
        )}

        <button type="button" className="session-btn-ghost" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {isOwner && pendingEditRequests.length > 0 && (
        <div className="session-edit-requests">
          {pendingEditRequests.map((req) => (
            <div key={req.userId} className="session-edit-request-row">
              <span>{req.username} requested edit access</span>
              <div className="session-edit-request-actions">
                <button type="button" onClick={() => handleRespondEditAccess(req.userId, true)}>
                  Accept
                </button>
                <button type="button" onClick={() => handleRespondEditAccess(req.userId, false)}>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          BODY
      ══════════════════════════════════════ */}
      <ErrorBoundary fallback={SandpackErrorFallback}>
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
            <div className="session-activity-bar">
              <button
                type="button"
                className={`activity-btn ${showFilesSidebar ? 'active' : ''}`}
                onClick={() => toggleSidebar('files')}
                title="Explorer"
              >
                📁
              </button>
              <button
                type="button"
                className={`activity-btn ${showCommentsSidebar ? 'active' : ''}`}
                onClick={() => toggleSidebar('comments')}
                title="Comments"
                style={{ position: 'relative' }}
              >
                💬
                {comments.length > 0 && <span className="session-activity-badge" />}
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
            >
              <div className="session-panel-header">
                <span className="session-panel-title">Explorer</span>
                {isMobile && (
                  <button
                    onClick={() => dispatchSidebar({ type: 'CLOSE_FILES' })}
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
                  readOnly={!canEdit || sessionEnded}
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
              <div className="session-file-tab-bar">
                <span className="session-file-tab">
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
                    readOnly: !canEdit || sessionEnded,
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
                onMouseEnter={e => e.currentTarget.style.background = 'hsl(119, 99%, 46%)'}
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
                      onClick={() => dispatchOutput({ type: 'SET_TAB', tab: tab.id })}
                      style={{
                        padding: '7px 12px',
                        background: outputTab === tab.id ? '#2d2d2d' : 'transparent',
                        color: outputTab === tab.id ? '#fff' : '#888',
                        border: 'none',
                        borderBottom: outputTab === tab.id
                          ? '2px solid hsl(119, 99%, 46%)'
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
                      onClick={() => dispatchOutput({ type: 'TOGGLE_FULLSCREEN' })}
                      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                      style={{
                        padding: '3px 8px',
                        background: isFullscreen ? 'hsl(119, 99%, 46%)' : 'transparent',
                        color: isFullscreen ? '#fff' : '#888',
                        border: `1px solid ${isFullscreen ? 'hsl(119, 99%, 46%)' : '#3d3d3d'}`,
                        borderRadius: 4, cursor: 'pointer', fontSize: 13,
                      }}
                    >
                      {isFullscreen ? '⊡' : '⊞'}
                    </button>
                    {!isFullscreen && (
                      <>
                        <button
                          onClick={() => dispatchOutput({ type: 'SET_EDITOR_HEIGHT', height: 20 })}
                          style={resizeBtnStyle}
                        >
                          ↑ Max
                        </button>
                        <button
                          onClick={() => dispatchOutput({ type: 'SET_EDITOR_HEIGHT', height: 50 })}
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
            <div className="session-status-bar">
              <span>{selectedLine ? `Ln ${selectedLine}` : 'Click in editor'}</span>
              <span>{Object.keys(files).length} file(s)</span>
              <span>{Object.keys(remoteUsers).length + 1} user(s)</span>
              {sessionEnded && <span>● Session ended</span>}
              {showOutput && !isFullscreen && (
                <span style={{ marginLeft: 'auto', opacity: 0.65, fontSize: 10 }}>
                  drag ··· to resize
                </span>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL: Comments ────────────── */}
          {!isFullscreen && (
            <div
              className={`sidebar-panel right ${showCommentsSidebar ? 'open' : ''} ${!showCommentsSidebar && !isMobile ? 'closed-desktop' : ''}`}
            >
              <div className="session-panel-header">
                <div>
                  <span className="session-panel-title">Comments</span>
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
                    onClick={() => dispatchSidebar({ type: 'CLOSE_COMMENTS' })}
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
                {comments.map((c) => (
                  <div key={c.id ?? `${c.author}-${c.lineNumber}-${c.created_at}`} style={{
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
                        src={c.audioUrl}
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
                      background: commentMode === 'text' ? 'hsl(119, 99%, 46%)' : '#3c3c3c',
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
                          ? 'hsl(119, 99%, 46%)' : '#3c3c3c',
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
      </ErrorBoundary>

      {/* ── Rating Modal ──────────────────────────────────── */}
      {showRating && !ratingDone && !isOwner && (
        <RatingModal
          sessionId={sessionId}
          creator={creator}
          onClose={() => dispatchSession({ type: 'SET_SHOW_RATING', show: false })}
          onRated={() => dispatchSession({ type: 'RATING_DONE' })}
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