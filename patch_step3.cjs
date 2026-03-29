const fs = require('fs');

const filePath = 'src/features/quiz/components/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add import for the SVGs
if (!content.includes('DashboardSVGs')) {
    content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\nimport { CreateQuizSVG, SavedQuizzesSVG, EnglishZoneSVG, ToolsSVG, AnalyticsSVG, BookmarksSVG, AboutSVG } from './DashboardSVGs';");
}

// ----------------------------------------------------------------------
// Define the new grid variants and styling
// ----------------------------------------------------------------------
const variantsStr = `
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };
`;

// Insert variants
if (!content.includes('containerVariants')) {
    content = content.replace("const getGreeting = () => {", `${variantsStr}\n    const getGreeting = () => {`);
}

// ----------------------------------------------------------------------
// Replace the grid container
// ----------------------------------------------------------------------
const gridRegex = /<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">/;
const newGrid = `<motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl mx-auto z-20">`;
content = content.replace(gridRegex, newGrid);

// Change the closing div of the grid
const closingGridRegex = /<\/div>\s*\{\/\* Footer Link \*\/\}/;
content = content.replace(closingGridRegex, "</motion.div>\n\n                {/* Footer Link */}");


// ----------------------------------------------------------------------
// Helper to generate the new glassmorphic card
// ----------------------------------------------------------------------
function generateCard(id, name, desc, SvgComponent, bgColorClass, glowColorClass, onClickStr, iconComponentStr) {
    // Determine gradient for text
    let textGradient = "from-slate-700 to-slate-900 dark:from-white dark:to-slate-300";
    if (id === 'card-1') textGradient = "from-indigo-600 to-indigo-900 dark:from-indigo-300 dark:to-indigo-100";
    if (id === 'card-2') textGradient = "from-emerald-600 to-emerald-900 dark:from-emerald-300 dark:to-emerald-100";
    if (id === 'card-3') textGradient = "from-rose-600 to-rose-900 dark:from-rose-300 dark:to-rose-100";
    if (id === 'card-4') textGradient = "from-amber-600 to-amber-900 dark:from-amber-300 dark:to-amber-100";
    if (id === 'card-5') textGradient = "from-blue-600 to-blue-900 dark:from-blue-300 dark:to-blue-100";
    if (id === 'card-6') textGradient = "from-violet-600 to-violet-900 dark:from-violet-300 dark:to-violet-100";
    if (id === 'card-7') textGradient = "from-slate-600 to-slate-900 dark:from-slate-300 dark:to-slate-100";

    return `
                    {/* Card ${id} */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation('${id}', ${onClickStr})}
                        className="relative group cursor-pointer aspect-square rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden"
                    >
                        {/* Glow Background Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

                        {/* Interactive Inner Shadow / Border */}
                        <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 group-active:border-b-0 border-b-[4px] border-b-${bgColorClass}-200/50 dark:border-b-${bgColorClass}-700/50 group-hover:border-${bgColorClass}-300 dark:group-hover:border-${bgColorClass}-500"></div>

                        {/* Centered Subtle Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0 ${glowColorClass}"></div>

                        {loadingId === '${id}' ? (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[32px] sm:rounded-[40px]">
                                <Loader2 className="w-8 h-8 text-${bgColorClass}-500 animate-spin drop-shadow-md" />
                            </div>
                        ) : null}

                        <div className={\`relative z-20 flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 transition-opacity duration-300 \${loadingId === '${id}' ? 'opacity-0' : 'opacity-100'}\`}>

                            {/* SVG Container */}
                            <motion.div
                                className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mt-2 relative drop-shadow-xl"
                                initial={{ scale: 0.9, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <${SvgComponent} />
                            </motion.div>

                            {/* Text Area */}
                            <div className="flex flex-col items-center justify-end w-full text-center pb-2">
                                <h3 className={\`text-sm sm:text-lg font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r \${textGradient} mb-1 sm:mb-2\`}>${name}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2 max-w-[90%]">
                                    ${desc}
                                </p>
                            </div>
                        </div>
                    </motion.div>`;
}


// Replace individual cards
const card1Regex = /\{\/\* Card 1 - Custom Quiz \*\/\}[\s\S]*?(?=\{\/\* Card 2)/;
const card2Regex = /\{\/\* Card 2 - Created Quizzes \*\/\}[\s\S]*?(?=\{\/\* Card 3)/;
const card3Regex = /\{\/\* Card 3 - English \*\/\}[\s\S]*?(?=\{\/\* Card 4)/;
const card4Regex = /\{\/\* Card 4 - Tools \*\/\}[\s\S]*?(?=\{\/\* Card 5)/;
const card5Regex = /\{\/\* Card 5 - Analytics \*\/\}[\s\S]*?(?=\{\/\* Card 6)/;
const card6Regex = /\{\/\* Card 6 - Bookmarks \*\/\}[\s\S]*?(?=\{\/\* Card 7)/;
const card7Regex = /\{\/\* Card 7 - About Us \*\/\}[\s\S]*?(?=<\/div>\s*\{\/\* Footer Link \*\/\}|<\/motion.div>\s*\{\/\* Footer Link \*\/\} )/;

content = content.replace(card1Regex, generateCard('card-1', 'Create Quiz', 'Filter by subject, topic, and difficulty.', 'CreateQuizSVG', 'indigo', 'bg-indigo-500', 'onStartQuiz', '') + "\n");
content = content.replace(card2Regex, generateCard('card-2', 'Created Quizzes', 'Resume paused quizzes or view completed ones.', 'SavedQuizzesSVG', 'emerald', 'bg-emerald-500', 'onSavedQuizzes', '') + "\n");
content = content.replace(card3Regex, generateCard('card-3', 'English Zone', 'Vocab, Grammar & Mock Tests.', 'EnglishZoneSVG', 'rose', 'bg-rose-500', 'onEnglish', '') + "\n");
content = content.replace(card4Regex, generateCard('card-4', 'Tools', 'Flashcard Maker & Utilities.', 'ToolsSVG', 'amber', 'bg-amber-500', "() => navigate('/tools')", '') + "\n");
content = content.replace(card5Regex, generateCard('card-5', 'Analytics', 'Detailed report cards & stats.', 'AnalyticsSVG', 'blue', 'bg-blue-500', "() => navigate('/quiz/analytics')", '') + "\n");
content = content.replace(card6Regex, generateCard('card-6', 'Bookmarks', 'Review your saved questions.', 'BookmarksSVG', 'violet', 'bg-violet-500', "() => navigate('/quiz/bookmarks')", '') + "\n");
content = content.replace(card7Regex, generateCard('card-7', 'About Us', 'Developer info, Privacy Policy & Terms.', 'AboutSVG', 'slate', 'bg-slate-500', "() => navigate('/about')", '') + "\n");

// Ensure Lucide icon imports are removed if unused (optional, but good practice). We can just leave them if they don't break.
// Write to file
fs.writeFileSync(filePath, content);
console.log('Step 3/4 complete');
