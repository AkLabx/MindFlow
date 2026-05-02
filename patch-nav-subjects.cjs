const fs = require('fs');
const file = 'src/features/quiz/components/QuizNavigationPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

// Compute distinct subjects
code = code.replace(
  'const [groupByMode, setGroupByMode] = useState<\'default\' | \'subject\'>(\'default\');',
  `const [groupByMode, setGroupByMode] = useState<'default' | 'subject'>('default');

  const subjects = useMemo(() => {
    const subs = new Set<string>();
    questions.forEach(q => {
      if (q.classification?.subject) subs.add(q.classification.subject);
    });
    return Array.from(subs);
  }, [questions]);

  const hasMultipleSubjects = subjects.length >= 2;`
);

fs.writeFileSync(file, code);
console.log('patched subjects');
