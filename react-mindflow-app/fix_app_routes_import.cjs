const fs = require('fs');
let content = fs.readFileSync('src/routes/AppRoutes.tsx', 'utf8');

// I mistakenly injected `import { MockSession } from '../features/quiz/mock/MockSession';\nimport { GodModeSession } from '../features/quiz/mock/GodModeSession';` at the top? Wait, no. My replace didn't work properly if it wasn't there.
// Actually, I wrote `if (!ar.includes('import { GodModeSession }')) { ar = ar.replace(/import { MockSession } from '\.\.\/features\/quiz\/mock\/MockSession';/g, ...); }`
// But MockSession was lazy loaded!

// Let's remove any explicit import of MockSession/GodModeSession if I added it accidentally
content = content.replace(/import { MockSession } from '\.\.\/features\/quiz\/mock\/MockSession';\nimport { GodModeSession } from '\.\.\/features\/quiz\/mock\/GodModeSession';/g, '');

// And add the lazy load for GodModeSession right below MockSession
const mockLazy = `const MockSession = lazy(() => import('../features/quiz/mock/MockSession').then(m => ({ default: m.MockSession })));`;
const godLazy = `const GodModeSession = lazy(() => import('../features/quiz/mock/GodModeSession').then(m => ({ default: m.GodModeSession })));`;

content = content.replace(mockLazy, `${mockLazy}\n${godLazy}`);

fs.writeFileSync('src/routes/AppRoutes.tsx', content);
