const fs = require('fs');

// Patch ScrollableCapsules
const scPath = 'src/features/quiz/components/ui/ScrollableCapsules.tsx';
let scCode = fs.readFileSync(scPath, 'utf8');

scCode = scCode.replace(
  '  isLoading?: boolean;\n}',
  '  isLoading?: boolean;\n  hideZeroCount?: boolean;\n}'
);

scCode = scCode.replace(
  '  isLoading\n}: ScrollableCapsulesProps) {',
  '  isLoading,\n  hideZeroCount = false\n}: ScrollableCapsulesProps) {'
);

scCode = scCode.replace(
  'options.map(option => {',
  `options.filter(opt => {
              if (!hideZeroCount || !counts) return true;
              return selectedOptions.includes(opt) || (counts[opt] || 0) > 0;
          }).map(option => {`
);

fs.writeFileSync(scPath, scCode);


// Patch SegmentedControl
const scgPath = 'src/features/quiz/components/ui/SegmentedControl.tsx';
let scgCode = fs.readFileSync(scgPath, 'utf8');

scgCode = scgCode.replace(
  '  allowMultiple?: boolean;\n  tooltip?: string;\n}) {',
  '  allowMultiple?: boolean;\n  tooltip?: string;\n  hideZeroCount?: boolean;\n}) {'
);

scgCode = scgCode.replace(
  '  allowMultiple = true,\n  tooltip\n}: {',
  '  allowMultiple = true,\n  tooltip,\n  hideZeroCount = false\n}: {'
);

scgCode = scgCode.replace(
  '{options.map(option => {',
  `{options.filter(opt => {
            if (!hideZeroCount || !counts) return true;
            return selectedOptions.includes(opt) || (counts[opt] || 0) > 0;
        }).map(option => {`
);

fs.writeFileSync(scgPath, scgCode);

// Patch QuizConfig
const qcPath = 'src/features/quiz/components/QuizConfig.tsx';
let qcCode = fs.readFileSync(qcPath, 'utf8');

qcCode = qcCode.replace(
  /counts=\{filterCounts\.subject \|\| \{\}\}/,
  'counts={filterCounts.subject || {}}\n              hideZeroCount'
);
qcCode = qcCode.replace(
  /counts=\{filterCounts\.topic \|\| \{\}\}/,
  'counts={filterCounts.topic || {}}\n              hideZeroCount'
);
qcCode = qcCode.replace(
  /counts=\{filterCounts\.subTopic \|\| \{\}\}/,
  'counts={filterCounts.subTopic || {}}\n              hideZeroCount'
);
qcCode = qcCode.replace(
  /counts=\{filterCounts\.difficulty \|\| \{\}\}/,
  'counts={filterCounts.difficulty || {}}\n              hideZeroCount'
);
qcCode = qcCode.replace(
  /counts=\{filterCounts\.questionType \|\| \{\}\}/,
  'counts={filterCounts.questionType || {}}\n              hideZeroCount'
);
qcCode = qcCode.replace(
  /counts=\{filterCounts\.tags \|\| \{\}\}/,
  'counts={filterCounts.tags || {}}\n                    hideZeroCount'
);

fs.writeFileSync(qcPath, qcCode);
