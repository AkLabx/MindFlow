const fs = require('fs');

const appRoutesPath = 'src/routes/AppRoutes.tsx';
let content = fs.readFileSync(appRoutesPath, 'utf8');

if (!content.includes('const AITalkPage = lazy')) {
    content = content.replace(
        "const AIHome = lazy(() => import('../features/ai/AIHome').then(m => ({ default: m.AIHome })));",
        "const AIHome = lazy(() => import('../features/ai/AIHome').then(m => ({ default: m.AIHome })));\nconst AITalkPage = lazy(() => import('../features/ai/talk/AITalkPage').then(m => ({ default: m.AITalkPage })));"
    );
    fs.writeFileSync(appRoutesPath, content);
    console.log("Added lazy import to AppRoutes.tsx");
} else {
    console.log("Import already exists.");
}
