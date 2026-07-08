import React from 'react';

export const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse w-full">
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="flex gap-2">
                <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
        </div>
        <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
        <div className="w-2/3 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="flex gap-2">
           <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
           <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
    </div>
);

export const SkeletonList = ({ count = 3 }: { count?: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);
