const fs = require('fs');

const path = 'src/features/ai/AIHome.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(/<<<<<<< HEAD\n\s*} else if \(featureId === 'talk'\) {\n\s*navigate\('\/ai\/talk'\);\n=======\n>>>>>>> [^\n]+\n/g, `        } else if (featureId === 'talk') {
            navigate('/ai/talk');`);

fs.writeFileSync(path, data);
console.log('Fixed AIHome.tsx');
