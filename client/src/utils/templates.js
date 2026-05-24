// Default file structure for each language
// These are what Sandpack expects for each template

export const TEMPLATES = {

  javascript: {
    sandpackTemplate: 'node',
    files: {
      '/index.js': `// JavaScript — Node.js environment
// You can import npm packages after installing them in the terminal

const greet = (name) => {
  return \`Hello, \${name}!\`;
};

console.log(greet('World'));
console.log('Node version:', process.version);

// Try installing a package:
// In terminal below, run: npm install lodash
// Then import it: const _ = require('lodash')
`,
      '/package.json': JSON.stringify({
        name: 'codereview-project',
        version: '1.0.0',
        description: 'CodeReview.live session',
        main: 'index.js',
        dependencies: {}
      }, null, 2)
    },
    entry: '/index.js'
  },

  typescript: {
    sandpackTemplate: 'node',
    files: {
      '/index.ts': `// TypeScript — full type support
interface User {
  name: string;
  age: number;
  role: 'admin' | 'user';
}

const createUser = (name: string, age: number): User => ({
  name,
  age,
  role: 'user'
});

const user = createUser('Pappu', 22);
console.log('User created:', user);

const greetUser = (user: User): string =>
  \`Hello \${user.name}! You are \${user.age} years old.\`;

console.log(greetUser(user));
`,
      '/tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          strict: true,
          esModuleInterop: true
        }
      }, null, 2),
      '/package.json': JSON.stringify({
        name: 'codereview-ts-project',
        version: '1.0.0',
        dependencies: {}
      }, null, 2)
    },
    entry: '/index.ts'
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

h1 { color: #6366f1; }

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
  background: #6366f1;
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

h1 { color: #6366f1; margin-bottom: 8px; }
p  { color: #888; margin-bottom: 24px; }

button {
  padding: 12px 32px;
  background: #6366f1;
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

// Get default files for a language
export const getDefaultFiles = (language) => {
  return TEMPLATES[language]?.files || TEMPLATES.javascript.files;
};

// Get entry file for a language
export const getEntryFile = (language) => {
  return TEMPLATES[language]?.entry || '/index.js';
};