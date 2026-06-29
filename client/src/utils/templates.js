// Default file structure for each language
// These are what Sandpack expects for each template

export const TEMPLATES = {

  javascript: {
    sandpackTemplate: 'vanilla',
    files: {
      '/index.js': `// JavaScript — runs in the browser
// console.log output appears in the Console tab

for (let i = 0; i < 3; i++) {
  console.log('count:', i);
}
`,
      '/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CodeReview.live</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div id="app"></div>
  <script src="index.js"></script>
</body>
</html>
`,
      '/styles.css': `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0d0d0f;
  color: #ccc;
}
`,
      '/package.json': JSON.stringify({
        name: 'codereview-project',
        version: '1.0.0',
        main: '/index.js',
        dependencies: {},
      }, null, 2),
    },
    entry: '/index.js',
  },

  typescript: {
    sandpackTemplate: 'vanilla-ts',
    files: {
      '/index.ts': `// TypeScript — runs in the browser
interface Item {
  id: number;
  label: string;
}

const items: Item[] = [
  { id: 1, label: 'first' },
  { id: 2, label: 'second' },
];

items.forEach((item) => console.log(item.label));
`,
      '/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CodeReview.live</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div id="app"></div>
  <script src="index.ts"></script>
</body>
</html>
`,
      '/styles.css': `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0d0d0f;
  color: #ccc;
}
`,
      '/tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          strict: true,
          esModuleInterop: true,
        },
      }, null, 2),
      '/package.json': JSON.stringify({
        name: 'codereview-ts-project',
        version: '1.0.0',
        main: '/index.ts',
        dependencies: {},
        devDependencies: { typescript: '^4.0.0' },
      }, null, 2),
    },
    entry: '/index.ts',
  },

  react: {
    sandpackTemplate: 'react',
    files: {
      '/App.js': `import { useState } from "react";
import "./styles.css";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>CodeReview.live ⚡</h1>
      <p>Edit files and see changes live</p>
      <div className="card">
        <h2>{count}</h2>
        <button onClick={() => setCount(c => c + 1)}>+1</button>
        <button onClick={() => setCount(0)}>Reset</button>
      </div>
    </div>
  );
}
`,
      '/styles.css': `body {
  font-family: 'Segoe UI', sans-serif;
  margin: 0;
  background: #f0f0f5;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

h1 { color: hsl(119, 99%, 46%); }

.card {
  background: white;
  padding: 32px 48px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
}

.card h2 {
  font-size: 48px;
  margin: 0 0 16px;
  color: #333;
}

button {
  padding: 10px 24px;
  margin: 0 6px;
  background: hsl(119, 99%, 46%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

button:last-child {
  background: #eee;
  color: #333;
}
`,
      '/index.js': `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
`
    },
    entry: '/App.js'
  },

  html: {
    sandpackTemplate: 'static',
    files: {
      '/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Hello World! 👋</h1>
    <p>Edit the HTML, CSS and JS files</p>
    <button onclick="handleClick()">Click me!</button>
    <div id="output"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>
`,
      '/styles.css': `* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea, #764ba2);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-width: 400px;
  width: 90%;
}

h1 { color: hsl(119, 99%, 46%); margin-bottom: 8px; }
p  { color: #888; margin-bottom: 24px; }

button {
  padding: 12px 32px;
  background: hsl(119, 99%, 46%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s;
}

button:hover { background: #4f52d4; }

#output {
  margin-top: 16px;
  color: #333;
  font-weight: 500;
}
`,
      '/script.js': `let clickCount = 0;

function handleClick() {
  clickCount++;
  const output = document.getElementById('output');
  output.textContent = \`Clicked \${clickCount} time\${clickCount !== 1 ? 's' : ''}!\`;
}

console.log('Script loaded!');
`
    },
    entry: '/index.html'
  }
};

// Get Sandpack template name for a language
export const getSandpackTemplate = (language) => {
  return TEMPLATES[language]?.sandpackTemplate || 'node';
};

// Node templates use a shell with npm — vanilla/react/static do not
export const supportsSandpackTerminal = (language) => {
  return TEMPLATES[language]?.sandpackTemplate === 'node';
};

// Node templates run in a shell — output goes to Console Server tab, not Preview
export const supportsSandpackPreview = (language) => {
  const tpl = TEMPLATES[language]?.sandpackTemplate;
  return tpl === 'react' || tpl === 'static';
};

// React renders in Preview; console.log output is not the primary UI
export const supportsSandpackConsole = (language) => {
  return TEMPLATES[language]?.sandpackTemplate !== 'react';
};

// Get default files for a language
export const getDefaultFiles = (language) => {
  return TEMPLATES[language]?.files || TEMPLATES.javascript.files;
};

// Ensure Sandpack has support files (e.g. package.json) even if the session only has index.js
export const mergeSandpackFiles = (language, userFiles) => {
  const defaults = getDefaultFiles(language);
  const merged = { ...defaults, ...userFiles };

  if (language === 'react') {
    const userPaths = Object.keys(userFiles);
    const hasUserIndex = userPaths.includes('/index.js');
    const indexContent = merged['/index.js'] || '';
    const indexIsBootstrap =
      indexContent.includes('createRoot') && indexContent.includes('./App');

    if (hasUserIndex && !indexIsBootstrap) {
      merged['/App.js'] = `import * as Module from './index.js';

const Component =
  Module.default ||
  Module.HeroSection ||
  Object.values(Module).find((value) => typeof value === 'function');

export default function App() {
  if (!Component) {
    return <p style={{ padding: 24 }}>Export a React component from index.js</p>;
  }
  return <Component />;
}
`;
    }
  }

  return merged;
};

// Get entry file for a language
export const getEntryFile = (language) => {
  return TEMPLATES[language]?.entry || '/index.js';
};