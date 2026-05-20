import { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';

// remoteUsers = { username: { position, color } }
// onCodeChange = called when local user types
// onCursorChange = called when local cursor moves

const Editor = ({ code, onCodeChange, onCursorChange, remoteUsers = {} }) => {
  const editorRef = useRef(null);       // the Monaco editor instance
  const monacoRef = useRef(null);       // the Monaco API itself
  const decorationsRef = useRef([]);    // tracks cursor decorations so we can update them

  // Called once Monaco is ready
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen for cursor position changes
    // This fires every time local user moves cursor or clicks
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange({
        lineNumber: e.position.lineNumber,
        column: e.position.column
      });
    });
  };

  // Called every time local user types
  const handleChange = (value) => {
    onCodeChange(value || '');
  };

  // Draw remote users' cursors whenever remoteUsers changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    // Build decorations array — one per remote user
    const newDecorations = Object.entries(remoteUsers).map(([username, data]) => {
      const { position, color } = data;

      return {
        // WHERE to put the decoration
        range: new monaco.Range(
          position.lineNumber,  // start line
          position.column,      // start column
          position.lineNumber,  // end line (same — it's a cursor, not a selection)
          position.column       // end column
        ),
        // WHAT the decoration looks like
        options: {
          className: `remote-cursor-${username}`, // CSS class
          // Show username label above the cursor
          beforeContentClassName: `remote-cursor-label-${username}`,
          hoverMessage: { value: `**${username}**` } // tooltip on hover
        }
      };
    });

    // deltaDecorations replaces old decorations with new ones
    // First arg = old decoration IDs to remove
    // Second arg = new decorations to add
    // Returns new IDs — save them to remove next time
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );

    // Inject CSS for each remote user's cursor color
    // We do this in JS because colors are dynamic (assigned per user)
    Object.entries(remoteUsers).forEach(([username, data]) => {
      const styleId = `cursor-style-${username}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .remote-cursor-${username} {
            border-left: 2px solid ${data.color};
            margin-left: -1px;
          }
          .remote-cursor-label-${username}::before {
            content: "${username}";
            background: ${data.color};
            color: white;
            font-size: 10px;
            padding: 1px 4px;
            border-radius: 3px 3px 3px 0;
            position: absolute;
            top: -18px;
            white-space: nowrap;
            pointer-events: none;
          }
        `;
        document.head.appendChild(style);
      }
    });

  }, [remoteUsers]); // re-run whenever remoteUsers updates

  return (
    <MonacoEditor
      height="100%"
      defaultLanguage="javascript"
      theme="vs-dark"           // dark theme like VS Code
      value={code}              // controlled — we own the value
      onChange={handleChange}
      onMount={handleEditorMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },  // hide the minimap (right side preview)
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,        // resize when container resizes
        padding: { top: 16 },
      }}
    />
  );
};

export default Editor;