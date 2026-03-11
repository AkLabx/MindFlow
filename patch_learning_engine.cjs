const fs = require('fs');

let learningFile = 'src/features/quiz/learning/LearningSession.tsx';
let learningCode = fs.readFileSync(learningFile, 'utf8');

learningCode = learningCode.replace(
  /import \{ useMockTimer \} from '\.\.\/hooks\/useMockTimer';/,
  `import { useMockTimer } from '../hooks/useMockTimer';\nimport { quizEngine } from '../engine';`
);

const answerBlock = `        const spent = allowed - timeLeftRef.current;

        const isCorrect = option === currentQuestion.correct;`;

const newAnswerBlock = `        const spent = allowed - timeLeftRef.current;

        const isCorrect = quizEngine.getPlugin('mcq').validateAnswer(currentQuestion, option);`;

learningCode = learningCode.replace(answerBlock, newAnswerBlock);

fs.writeFileSync(learningFile, learningCode);
