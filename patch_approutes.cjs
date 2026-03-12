const fs = require('fs');
const filePath = 'src/routes/AppRoutes.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "import { SynonymsConfig } from '../features/synonyms/SynonymsConfig';\n" +
  "import { SynonymFlashcardSession } from '../features/synonyms/components/SynonymFlashcardSession';\n" +
  "import { SynonymClusterList } from '../features/synonyms/components/SynonymClusterList';\n" +
  "import { SynonymQuizSession } from '../features/synonyms/components/SynonymQuizSession';\n" +
  "import { SynonymPhase1Session } from '../features/synonyms/components/SynonymPhase1Session';\n",
  ""
);

const lazyImports = `
const SynonymsConfig = lazy(() => import('../features/synonyms/SynonymsConfig').then(m => ({ default: m.SynonymsConfig })));
const SynonymFlashcardSession = lazy(() => import('../features/synonyms/components/SynonymFlashcardSession').then(m => ({ default: m.SynonymFlashcardSession })));
const SynonymClusterList = lazy(() => import('../features/synonyms/components/SynonymClusterList').then(m => ({ default: m.SynonymClusterList })));
const SynonymQuizSession = lazy(() => import('../features/synonyms/components/SynonymQuizSession').then(m => ({ default: m.SynonymQuizSession })));
const SynonymPhase1Session = lazy(() => import('../features/synonyms/components/SynonymPhase1Session').then(m => ({ default: m.SynonymPhase1Session })));
`;

content = content.replace(
  "const OWSConfig = lazy(() => import('../features/ows/OWSConfig').then(m => ({ default: m.OWSConfig })));",
  "const OWSConfig = lazy(() => import('../features/ows/OWSConfig').then(m => ({ default: m.OWSConfig })));" + lazyImports
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('AppRoutes.tsx patched.');
