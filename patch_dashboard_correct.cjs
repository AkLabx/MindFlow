const fs = require('fs');

const path = 'src/features/quiz/components/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the imports to include McqsQuizSVG and remove CreateQuizSVG, SavedQuizzesSVG
content = content.replace(
  /import \{ CreateQuizSVG, SavedQuizzesSVG, EnglishZoneSVG, ToolsSVG, AnalyticsSVG, BookmarksSVG, AboutSVG, DownloadSVG, GodModeSVG \} from '\.\/DashboardSVGs';/,
  "import { McqsQuizSVG, EnglishZoneSVG, ToolsSVG, AnalyticsSVG, BookmarksSVG, AboutSVG, DownloadSVG, GodModeSVG } from './DashboardSVGs';"
);

// 1. Remove the onStartQuiz and onSavedQuizzes from DashboardProps
content = content.replace(/    \/\*\* Callback to start creating a new quiz\. \*\/\n    onStartQuiz: \(\) => void;\n/, '');
content = content.replace(/    \/\*\* Callback to view saved quizzes\. \*\/\n    onSavedQuizzes: \(\) => void;\n/, '');

// 2. Change the Dashboard component signature
content = content.replace(
  /export const Dashboard: React\.FC<DashboardProps> = \(\{ onStartQuiz, onEnglish, onBackToIntro, onSavedQuizzes \}\) => \{/,
  'export const Dashboard: React.FC<DashboardProps> = ({ onEnglish, onBackToIntro }) => {'
);

const mcqsQuizCard = `{/* Card card-mcqs */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('card-mcqs', () => navigate('/mcqs'))}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-fuchsia-200/50 dark:border-b-fuchsia-700/50 group-hover:border-fuchsia-300 dark:group-hover:border-fuchsia-500"></div>

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 bg-fuchsia-500"></div>

                        {loadingId === 'card-mcqs' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={\`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 \${loadingId === 'card-mcqs' ? 'opacity-0' : 'opacity-100'}\`}>

                            {/* SVG Container */}
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <McqsQuizSVG />
                            </motion.div>

                            {/* Text Area */}
                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className="text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 to-fuchsia-900 dark:from-fuchsia-300 dark:to-fuchsia-100 mb-1 sm:mb-2">MCQs Quiz</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    Create, resume, or review tests.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card card-3 */`;

// Replace content more carefully. Let's find the start of Card 1 and the start of Card 3
const card1Start = content.indexOf('{/* Card card-1 */}');
const card3Start = content.indexOf('{/* Card card-3 */}');

if (card1Start !== -1 && card3Start !== -1) {
  content = content.substring(0, card1Start) + mcqsQuizCard + content.substring(card3Start + '{/* Card card-3 */'.length);
}

fs.writeFileSync(path, content);
console.log('Done!');
