import React from 'react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContinueLearningBannerProps {
    domainName: string;
    reviewCount: number;
    onClick: () => void;
}

export const ContinueLearningBanner: React.FC<ContinueLearningBannerProps> = ({ domainName, reviewCount, onClick }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-500 dark:to-indigo-700 rounded-xl p-3 sm:p-4 shadow-lg cursor-pointer flex items-center justify-between overflow-hidden relative group"
        >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex flex-col z-10 flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider">Continue Learning</span>
                </div>
                <h3 className="text-white text-base sm:text-lg font-black leading-tight">
                    Resume {domainName}
                </h3>
                <p className="text-indigo-200 text-xs sm:text-sm font-medium mt-0.5">
                    {reviewCount > 0 ? `${reviewCount} cards ready for review` : 'Start your next session'}
                </p>
            </div>

            <div className="z-10 ml-4 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <Play className="w-5 h-5 ml-1 fill-current" />
                </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
        </motion.div>
    );
};
