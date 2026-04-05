const fs = require('fs');

const path = 'src/features/synonyms/SynonymsConfig.tsx';
let content = fs.readFileSync(path, 'utf8');

// The block to replace
const blockToReplace = `                {/* Header / Hero Section */}
                <div className="relative text-left w-full mt-2 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        aria-label="Go back"
                        className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
                            Synonyms Master
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed font-medium">
                            Expand your vocabulary with guided learning, flashcards, and games.
                        </p>
                    </div>
                </div>`;

const newBlock = `                <button
                    onClick={onBack}
                    className="self-start mb-4 z-20 flex items-center justify-center p-2 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-all shadow-sm backdrop-blur-sm border border-white/20 dark:border-gray-700/30"
                    title="Go Back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Header / Hero Section */}
                <div className="relative text-left w-full mt-2">
                    <div>
                        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-1 drop-shadow-sm">
                            Synonyms Master
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed font-medium">
                            Expand your vocabulary with guided learning, flashcards, and games.
                        </p>
                    </div>
                </div>`;

if (content.includes(blockToReplace)) {
    content = content.replace(blockToReplace, newBlock);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully updated SynonymsConfig.tsx');
} else {
    console.log('Could not find the target block in SynonymsConfig.tsx');
}
