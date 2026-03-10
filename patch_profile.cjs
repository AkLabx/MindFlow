const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'features', 'auth', 'components', 'ProfilePage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Replace Accuracy block
content = content.replace(
  /<p className="text-xl font-black text-indigo-700">\{statsLoading \? '-' : \`\$\{userStats\.averageScore\}\%\`\}<\/p>/,
  `{statsLoading ? (
                      <div className="h-7 w-16 bg-indigo-200 dark:bg-indigo-800/50 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-indigo-700">{userStats.averageScore}%</p>
                  )}`
);

// Replace Tests block
content = content.replace(
  /<p className="text-xl font-black text-slate-800 dark:text-slate-100">\{statsLoading \? '-' : userStats\.quizzesCompleted\.toLocaleString\(\)\}<\/p>/,
  `{statsLoading ? (
                      <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">{userStats.quizzesCompleted.toLocaleString()}</p>
                  )}`
);

// Replace Correct block
content = content.replace(
  /<p className="text-xl font-black text-slate-800 dark:text-slate-100">\{statsLoading \? '-' : userStats\.correctAnswers\.toLocaleString\(\)\}<\/p>/,
  `{statsLoading ? (
                      <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">{userStats.correctAnswers.toLocaleString()}</p>
                  )}`
);

// Replace Time Spent block
content = content.replace(
  /<p className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">\s*<Clock className="w-4 h-4 text-slate-400" \/> -\s*<\/p>/,
  `{statsLoading ? (
                      <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-400" /> {userStats.totalTimeSpentFormatted || '0s'}
                      </p>
                  )}`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully patched ProfilePage.tsx');
