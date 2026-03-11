
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Image as ImageIcon, FileText, Presentation, ArrowLeft, ChevronRight } from 'lucide-react';

const ToolsHome: React.FC = () => {
    const navigate = useNavigate();

    const tools = [
        {
            id: 'flashcard-maker',
            title: 'Flashcard Image Maker',
            description: 'Create beautiful vintage-style flashcards for idioms and OWS.',
            icon: <ImageIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
            bgColorClass: "bg-indigo-50 dark:bg-indigo-950/30",
            borderClasses: "border border-indigo-100 dark:border-indigo-900/40 border-b-4 border-b-indigo-200 dark:border-b-indigo-700 hover:border-indigo-300 dark:hover:border-indigo-500",
            chevronClass: "text-indigo-400 dark:text-indigo-500",
            action: () => navigate('/tools/flashcard-maker'),
            disabled: false
        },
        {
            id: 'pdf-generator',
            title: 'Bilingual PDF Generator',
            description: 'Create flawless bilingual quiz PDFs from your JSON questions.',
            icon: <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
            bgColorClass: "bg-purple-50 dark:bg-purple-950/30",
            borderClasses: "border border-purple-100 dark:border-purple-900/40 border-b-4 border-b-purple-200 dark:border-b-purple-700 hover:border-purple-300 dark:hover:border-purple-500",
            chevronClass: "text-purple-400 dark:text-purple-500",
            action: () => navigate('/tools/bilingual-pdf-maker'),
            disabled: false
        },
        {
            id: 'ppt-generator',
            title: 'GK PDF/PPT Generator',
            description: 'Create customized PDF worksheets and PPT slides for GK Questions.',
            icon: <Presentation className="w-6 h-6 text-gray-600 dark:text-gray-400" />,
            bgColorClass: "bg-gray-50 dark:bg-gray-900/40",
            borderClasses: "border border-gray-200 dark:border-gray-800 border-b-4 border-b-gray-300 dark:border-b-gray-700 hover:border-gray-400 dark:hover:border-gray-600",
            chevronClass: "text-gray-400 dark:text-gray-500",
            action: () => navigate('/tools/quiz-pdf-ppt-generator'),
            disabled: false
        }
    ];

    return (
        <div className="flex flex-col min-h-full bg-gray-50 dark:bg-slate-900">
             {/* Header */}
             <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-slate-800 rounded-xl text-gray-600 dark:text-gray-400 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-amber-500" />
                        Tools & Utilities
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Helper tools to enhance your content creation.</p>
                </div>
            </div>

            <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tools.map((tool) => (
                        <div
                            key={tool.id}
                            onClick={!tool.disabled ? tool.action : undefined}
                            className={`
                                p-6 rounded-2xl relative z-20 transition-all duration-200 shadow-sm flex items-center justify-between
                                ${tool.bgColorClass} ${tool.borderClasses}
                                ${tool.disabled ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer active:translate-y-1 active:border-b group'}
                            `}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                    {tool.icon}
                                </div>
                                <div className="flex-1 pr-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                        {tool.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                        {tool.description}
                                    </p>
                                    {tool.disabled && (
                                        <span className="inline-block mt-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                            Coming Soon
                                        </span>
                                    )}
                                </div>
                            </div>
                            {!tool.disabled && (
                                <ChevronRight className={`w-5 h-5 ${tool.chevronClass} flex-shrink-0 group-hover:translate-x-1 transition-transform`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ToolsHome;
