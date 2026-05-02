const fs = require('fs');
const file = 'vite.config.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/import\.meta\.env\.VITE_APP_VERSION\s*=\s*'(\d+)\.(\d+)\.(\d+)'/, (match, major, minor, patch) => {
    return `import.meta.env.VITE_APP_VERSION = '${major}.${minor}.${parseInt(patch) + 1}'`;
});

fs.writeFileSync(file, code);
