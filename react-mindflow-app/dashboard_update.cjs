const fs = require('fs');

const path = 'src/features/quiz/components/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the imports to include McqsQuizSVG and remove CreateQuizSVG, SavedQuizzesSVG
content = content.replace(
  /import \{ CreateQuizSVG, SavedQuizzesSVG, EnglishZoneSVG, ToolsSVG, AnalyticsSVG, BookmarksSVG, AboutSVG, DownloadSVG, GodModeSVG \} from '\.\/DashboardSVGs';/,
  "import { McqsQuizSVG, EnglishZoneSVG, ToolsSVG, AnalyticsSVG, BookmarksSVG, AboutSVG, DownloadSVG, GodModeSVG } from './DashboardSVGs';"
);

// We need to replace the first two cards with a single new card.
// Let's use regex or just manual replace.
// Easiest is to replace the whole block if possible, but the file is large.
