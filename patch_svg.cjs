const fs = require('fs');

const filePath = 'src/features/quiz/components/DashboardSVGs.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The issue is with transform={\`rotate(\${deg} 35 35)\`} since we generated it via bash script and the \${deg} got evaluated or escaped incorrectly.
content = content.replace(/transform=\\{\\\`rotate\\(\\\$\\{deg\\} 35 35\\)\\\`\\}/g, "transform={`rotate(${deg} 35 35)`}");
content = content.replace(/transform=\\{\\\`rotate\\(\\\$\\{deg\\} 65 65\\)\\\`\\}/g, "transform={`rotate(${deg} 65 65)`}");

// In case the slashes were completely stripped out:
content = content.replace(/transform=\{`rotate\(\$\{deg\} 35 35\)`\}/g, "transform={`rotate(${deg} 35 35)`}");
content = content.replace(/transform=\{`rotate\(\$\{deg\} 65 65\)`\}/g, "transform={`rotate(${deg} 65 65)`}");

fs.writeFileSync(filePath, content);
