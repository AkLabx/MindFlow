const fs = require('fs');
const file = 'src/features/quiz/components/QuizNavigationPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

const logicReplacement = `
  const handleGroupModeChange = (mode: 'default' | 'subject') => {
      setGroupByMode(mode);
      if (mode === 'subject') {
          // Reorder global questions array by subject
          const newSortedQuestions = [...questions].sort((a, b) => {
              const subA = a.classification?.subject || 'Unknown';
              const subB = b.classification?.subject || 'Unknown';
              return subA.localeCompare(subB);
          });
          onReorderQuestions?.(newSortedQuestions);
          // Set open groups to all open by default when switching to subject mode for easier viewing
          const subjects = Array.from(new Set(newSortedQuestions.map(q => q.classification?.subject || 'Unknown')));
          setOpenGroups(new Set(subjects.map((_, i) => i)));
      } else {
          // In real implementation we don't necessarily have to "un-sort" it unless required.
          // Re-sorting back to original is hard without a stored original order, but the user is fine
          // keeping the subject sorted order and just paginating by 25.
          // Reset open groups
          const groupIdx = Math.floor(currentQuestionIndex / chunkSize);
          setOpenGroups(new Set([groupIdx]));
      }
  };

  const groups: { title: string, count: number, items: Question[] }[] = [];

  if (groupByMode === 'default') {
      for (let i = 0; i < questions.length; i += chunkSize) {
          const groupItems = questions.slice(i, i + chunkSize);
          groups.push({
              title: \`Questions \${i + 1}-\${i + groupItems.length}\`,
              count: groupItems.length,
              items: groupItems
          });
      }
  } else {
      const subjectMap = new Map<string, Question[]>();
      questions.forEach(q => {
          const sub = q.classification?.subject || 'Unknown Subject';
          if (!subjectMap.has(sub)) subjectMap.set(sub, []);
          subjectMap.get(sub)!.push(q);
      });

      Array.from(subjectMap.entries()).forEach(([sub, items]) => {
          groups.push({
              title: sub,
              count: items.length,
              items: items
          });
      });
  }
`;

code = code.replace(
  `  const groups = [];\n  for (let i = 0; i < questions.length; i += chunkSize) {\n      groups.push(questions.slice(i, i + chunkSize));\n  }`,
  logicReplacement.trim()
);

fs.writeFileSync(file, code);
console.log('patched nav logic');
