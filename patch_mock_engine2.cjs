const fs = require('fs');

let mockFile = 'src/features/quiz/mock/MockSession.tsx';
let mockCode = fs.readFileSync(mockFile, 'utf8');

mockCode = mockCode.replace(
  /import \{ useMockTimer \} from '\.\.\/hooks\/useMockTimer';/,
  `import { useMockTimer } from '../hooks/useMockTimer';\nimport { quizEngine } from '../engine';`
);

const answerBlock = `    const handleAnswer = (option: string) => {
        setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: option }));
    };`;

const newAnswerBlock = `    const handleAnswer = (option: string) => {
        // Here we could validate via engine, but MockMode validation usually happens at the end
        // If we want real-time analytics tracking, we'd do it here:
        // const isCorrect = quizEngine.getPlugin('mcq').validateAnswer(questions[currentIndex], option);
        setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: option }));
    };`;

mockCode = mockCode.replace(answerBlock, newAnswerBlock);

const finishBlock = /const score = questions\.reduce\(\(acc, q\) => \{\s*\n\s*if \(answers\[q\.id\] === q\.correct\) acc\+\+;\s*\n\s*return acc;\s*\n\s*\}, 0\);/;
const newFinishBlock = `const score = questions.reduce((acc, q) => {
            if (quizEngine.getPlugin('mcq').validateAnswer(q, answers[q.id])) acc++;
            return acc;
        }, 0);`;

mockCode = mockCode.replace(finishBlock, newFinishBlock);

fs.writeFileSync(mockFile, mockCode);
