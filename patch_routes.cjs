const fs = require('fs');

const appRoutesPath = 'src/routes/AppRoutes.tsx';
let content = fs.readFileSync(appRoutesPath, 'utf8');

if (!content.includes('AITalkPage')) {
    content = content.replace(
        "import { AIHome } from '../features/ai/AIHome';",
        "import { AIHome } from '../features/ai/AIHome';\nimport { AITalkPage } from '../features/ai/talk/AITalkPage';"
    );

    content = content.replace(
        "<Route path=\"/ai/chat\" element={<AIChatPage />} />",
        "<Route path=\"/ai/chat\" element={<AIChatPage />} />\n                    <Route path=\"/ai/talk\" element={<AITalkPage />} />"
    );

    fs.writeFileSync(appRoutesPath, content);
    console.log("Patched AppRoutes.tsx");
}

const aiHomePath = 'src/features/ai/AIHome.tsx';
let aiHomeContent = fs.readFileSync(aiHomePath, 'utf8');

if (!aiHomeContent.includes('/ai/talk')) {
    aiHomeContent = aiHomeContent.replace(
        "if (featureId === 'chat') {\n            navigate('/ai/chat');\n        }",
        "if (featureId === 'chat') {\n            navigate('/ai/chat');\n        } else if (featureId === 'talk') {\n            navigate('/ai/talk');\n        }"
    );

    fs.writeFileSync(aiHomePath, aiHomeContent);
    console.log("Patched AIHome.tsx");
}
