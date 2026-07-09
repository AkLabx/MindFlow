import React from 'react';
import { BookOpen, Layers, CheckSquare } from 'lucide-react';

interface BrandedThumbnailProps {
    title: string;
    type: 'category' | 'series' | 'test';
    imageUrl?: string | null;
    className?: string;
}

export const BrandedThumbnail: React.FC<BrandedThumbnailProps> = ({ title, type, imageUrl, className = "" }) => {
    if (imageUrl) {
        return (
            <div className={`overflow-hidden relative bg-slate-100 dark:bg-slate-800 ${className}`}>
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
            </div>
        );
    }

    // Generate initials or short name for placeholder
    const shortName = title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'MF';

    let bgClass = '';
    let Icon = BookOpen;

    if (type === 'category') {
        bgClass = 'bg-gradient-to-br from-indigo-500 to-purple-700';
        Icon = BookOpen;
    } else if (type === 'series') {
        bgClass = 'bg-gradient-to-br from-emerald-500 to-teal-700';
        Icon = Layers;
    } else {
        bgClass = 'bg-gradient-to-br from-amber-500 to-orange-700';
        Icon = CheckSquare;
    }

    return (
        <div className={`relative flex items-center justify-center p-4 overflow-hidden shadow-inner ${bgClass} ${className}`}>
            <div className="absolute inset-0 bg-black/10"></div>
            {/* Minimal Icon Background */}
            <Icon className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-10 transform -rotate-12" />
            {/* Large Typography */}
            <h2 className="relative z-10 text-white font-black text-4xl sm:text-5xl tracking-tighter drop-shadow-md text-center line-clamp-2 leading-none">
                {shortName}
            </h2>
        </div>
    );
};
