const fs = require('fs');

const appRoutesPath = 'src/routes/AppRoutes.tsx';
let content = fs.readFileSync(appRoutesPath, 'utf8');

if (!content.includes('import { AITalkPage }')) {
    content = content.replace(
        "import { AIHome } from '../features/ai/AIHome';",
        "import { AIHome } from '../features/ai/AIHome';\nimport { AITalkPage } from '../features/ai/talk/AITalkPage';"
    );
    fs.writeFileSync(appRoutesPath, content);
    console.log("Added import to AppRoutes.tsx");
} else {
    console.log("Import already exists.");
}
