import { useState } from 'react';

const FileManager = ({ files, activeFile, onFileSelect, onFileCreate, onFileDelete, readOnly = false }) => {
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    const name = newFileName.trim();
    if (!name) return;

    // Add leading slash if missing — Sandpack requires /filename format
    const path = name.startsWith('/') ? name : `/${name}`;

    // Don't create duplicates
    if (files[path]) {
      alert('File already exists');
      return;
    }

    onFileCreate(path);
    setNewFileName('');
    setIsCreating(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') {
      setIsCreating(false);
      setNewFileName('');
    }
  };

  // Sort files — entry point first, then alphabetical
  const sortedFiles = Object.keys(files).sort((a, b) => {
    const entryPoints = ['/index.js', '/App.js', '/index.html', '/index.ts'];
    if (entryPoints.includes(a)) return -1;
    if (entryPoints.includes(b)) return 1;
    return a.localeCompare(b);
  });

  // Get file icon based on extension
  const getIcon = (filename) => {
    if (filename.endsWith('.jsx') || filename.endsWith('.js')) return '🟨';
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return '🔷';
    if (filename.endsWith('.css')) return '🎨';
    if (filename.endsWith('.html')) return '🌐';
    if (filename.endsWith('.json')) return '📋';
    if (filename.endsWith('.md')) return '📝';
    return '📄';
  };

  return (
    <div style={{
      width: 200, background: '#1e1e1e',
      borderRight: '1px solid #3d3d3d',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0
    }}>

      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #3d3d3d',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ color: '#888', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
          Files
        </span>
        {!readOnly && (
        <button
          onClick={() => setIsCreating(true)}
          title="New file"
          style={{
            background: 'none', border: 'none',
            color: '#888', cursor: 'pointer',
            fontSize: 16, padding: '0 4px',
            lineHeight: 1
          }}
        >
          +
        </button>
        )}
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {sortedFiles.map(path => (
          <div
            key={path}
            onClick={() => onFileSelect(path)}
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 12px',
              background: activeFile === path ? '#2d2d2d' : 'transparent',
              borderLeft: activeFile === path ? '2px solid hsl(119, 99%, 46%)' : '2px solid transparent',
              cursor: 'pointer',
              gap: 6
            }}
          >
            <span style={{
              fontSize: 12, color: activeFile === path ? '#fff' : '#ccc',
              fontFamily: 'monospace', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span>{getIcon(path)}</span>
              {/* Show just filename not full path */}
              {path.replace('/', '')}
            </span>

            {/* Delete button — only show on hover */}
            {sortedFiles.length > 1 && !readOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // don't select file when deleting
                  onFileDelete(path);
                }}
                style={{
                  background: 'none', border: 'none',
                  color: '#555', cursor: 'pointer',
                  fontSize: 12, padding: '0 2px',
                  opacity: 0.6
                }}
                title="Delete file"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {/* New file input */}
        {!readOnly && isCreating && (
          <div style={{ padding: '4px 12px' }}>
            <input
              autoFocus
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="filename.js"
              style={{
                width: '100%', background: '#2d2d2d',
                border: '1px solid hsl(119, 99%, 46%)', borderRadius: 4,
                color: '#fff', padding: '4px 8px',
                fontSize: 12, fontFamily: 'monospace',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: 10, color: '#555', marginTop: 4, fontFamily: 'monospace' }}>
              Enter to create · Esc to cancel
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManager;