const fs = require('fs');
const filePath = 'src/features/quiz/components/DashboardSVGs.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The error is because bash replaced the \` and \$ during the cat << EOF but failed to unescape some characters correctly.
content = content.replace(/transform=\\{\\\`rotate\\\(\\\$\\{deg\\} 35 35\\\)\\\`\\}/g, "transform={`rotate(${deg} 35 35)`}");
content = content.replace(/transform=\\{\\\`rotate\\\(\\\$\\{deg\\} 65 65\\\)\\\`\\}/g, "transform={`rotate(${deg} 65 65)`}");

// More robust regex replace
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('rect key={deg}')) {
        if (lines[i].includes('35 35')) {
             lines[i] = '         <rect key={deg} x="32" y="15" width="6" height="5" fill="#FDE68A" transform={`rotate(${deg} 35 35)`} />';
        } else if (lines[i].includes('65 65')) {
             lines[i] = '         <rect key={deg} x="61" y="40" width="8" height="6" fill="url(#toolsGrad)" transform={`rotate(${deg} 65 65)`} />';
        }
    }
}

fs.writeFileSync(filePath, lines.join('\n'));
