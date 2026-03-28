const fs = require('fs');

const path = 'src/features/auth/hooks/useTargetAudience.ts';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(
  "  useEffect(() => {",
  "  useEffect(() => {\n    // Listener for auth redirects updating target audience\n    const handleIntentUpdate = (e: any) => {\n      if (e.detail) {\n        handleSetAudience(e.detail);\n      }\n    };\n    window.addEventListener('mindflow-target-audience-update', handleIntentUpdate);\n\n    return () => window.removeEventListener('mindflow-target-audience-update', handleIntentUpdate);\n  }, [user]);\n\n  useEffect(() => {"
);

fs.writeFileSync(path, data);
console.log('done');
