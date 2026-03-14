import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, MessageSquare, Mic, Wand2, Calendar, ChevronRight, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AICardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
    onClick: () => void;
    badgeText?: string;
}

const AICard: React.FC<AICardProps> = ({ title, description, icon, colorClass, onClick, badgeText }) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-200 shadow-sm active:translate-y-1 active:border-b",
                colorClass
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="mb-4 inline-block rounded-xl bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 p-3 shadow-sm group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {description}
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 dark:bg-gray-800/60 shadow-sm transition-transform group-hover:scale-110">
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
                    </div>
                    {badgeText && (
                        <span className="mt-4 inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            {badgeText}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

export const AIHome: React.FC = () => {
    const navigate = useNavigate();
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const handleFeatureClick = (featureId: string, featureName: string) => {
        if (featureId === 'chat') {
            navigate('/ai/chat');
        } else if (featureId === 'talk') {
            navigate('/ai/talk');
        } else {
            setToastMessage(`"${featureName}" is coming soon!`);
            setTimeout(() => setToastMessage(null), 3000);
        }
    };

    const aiFeatures = [
        {
            id: 'semantic-search',
            title: "Semantic Search",
            description: "Search the question bank by meaning, concepts, or related ideas.",
            icon: <Search className="w-6 h-6 text-rose-600" />,
            bgClass: "bg-rose-50 dark:bg-rose-950/30",
            borderClass: "border-rose-100 dark:border-rose-900/40 border-b-4 border-b-rose-200 dark:border-b-rose-700 hover:border-rose-300 dark:hover:border-rose-500",
            badgeText: "New",
            onClick: () => navigate('/ai/semantic-search')
        },
        {
            id: 'chat',
            title: "Chat with AI",
            description: "Ask questions, get explanations, and clear your doubts instantly.",
            icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
            bgClass: "bg-blue-50 dark:bg-blue-950/30",
            borderClass: "border-blue-100 dark:border-blue-900/40 border-b-4 border-b-blue-200 dark:border-b-blue-700 hover:border-blue-300 dark:hover:border-blue-500"
        },
        {
            id: 'talk',
            title: "Talk to AI",
            description: "Practice spoken English and have real-time voice conversations.",
            icon: <Mic className="w-6 h-6 text-emerald-600" />,
            bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
            borderClass: "border-emerald-100 dark:border-emerald-900/40 border-b-4 border-b-emerald-200 dark:border-b-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-500"
        },
        {
            id: 'quiz',
            title: "Generate Quiz with AI",
            description: "Create personalized quizzes on any topic in seconds.",
            icon: <Wand2 className="w-6 h-6 text-purple-600" />,
            bgClass: "bg-purple-50 dark:bg-purple-950/30",
            borderClass: "border-purple-100 dark:border-purple-900/40 border-b-4 border-b-purple-200 dark:border-b-purple-700 hover:border-purple-300 dark:hover:border-purple-500",
            badgeText: "Beta"
        },
        {
            id: 'planner',
            title: "AI Study Planner",
            description: "Get smart schedules and adaptive learning paths tailored for you.",
            icon: <Calendar className="w-6 h-6 text-amber-600" />,
            bgClass: "bg-amber-50 dark:bg-amber-950/30",
            borderClass: "border-amber-100 dark:border-amber-900/40 border-b-4 border-b-amber-200 dark:border-b-amber-700 hover:border-amber-300 dark:hover:border-amber-500"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 pb-32 animate-fade-in w-full mx-auto relative flex flex-col items-center">

            <div className="w-full max-w-2xl mx-auto flex flex-col">
                {/* Header */}
                <header className="mb-8 mt-2 flex items-center gap-4">
                     <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center">
                            <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                MindFlow AI
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Next-gen learning tools</p>
                        </div>
                    </div>
                </header>

                {/* Content Grid */}
                <div className="grid gap-4 w-full">
                    {aiFeatures.map((feature) => (
                        <AICard
                            key={feature.id}
                            title={feature.title}
                            description={feature.description}
                            icon={feature.icon}
                            colorClass={cn("border", feature.bgClass, feature.borderClass)}
                            onClick={feature.onClick ? feature.onClick : () => handleFeatureClick(feature.title)}
                            badgeText={feature.badgeText}
                        />
                    ))}
                </div>
            </div>

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
                    <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        {toastMessage}
                    </div>
                </div>
            )}
        </div>
    );
};
