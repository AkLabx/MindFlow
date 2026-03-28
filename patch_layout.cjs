const fs = require('fs');

const path = 'src/features/school/components/SchoolLayout.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(
  "const isActive = location.pathname.startsWith(tab.path);",
  "const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');"
);

fs.writeFileSync(path, data);
console.log('done');
