const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'features', 'auth', 'components', 'ProfilePage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// The regex I used missed a few replacements due to slight differences or string literal escapes.
// Writing a simpler targeted string replacement instead.

content = content.replace(
    /<p className="text-xl font-black text-indigo-700">\{statsLoading \? '-' : \`\$\{userStats\.averageScore\}%\`\}<\/p>/g,
    `{statsLoading ? (
                      <div className="h-7 w-16 bg-indigo-200 dark:bg-indigo-800/50 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-indigo-700">{userStats.averageScore}%</p>
                  )}`
);

content = content.replace(
    /<p className="text-xl font-black text-slate-800 dark:text-slate-100">\{statsLoading \? '-' : userStats\.quizzesCompleted\.toLocaleString\(\)\}<\/p>/g,
    `{statsLoading ? (
                      <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">{userStats.quizzesCompleted.toLocaleString()}</p>
                  )}`
);

content = content.replace(
    /<p className="text-xl font-black text-slate-800 dark:text-slate-100">\{statsLoading \? '-' : userStats\.correctAnswers\.toLocaleString\(\)\}<\/p>/g,
    `{statsLoading ? (
                      <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">{userStats.correctAnswers.toLocaleString()}</p>
                  )}`
);

content = content.replace(
    /<p className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">\s*<Clock className="w-4 h-4 text-slate-400" \/> -\s*<\/p>/g,
    `{statsLoading ? (
                      <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-400" /> {userStats.totalTimeSpentFormatted || '0s'}
                      </p>
                  )}`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Fixed ProfilePage.tsx loaders');
