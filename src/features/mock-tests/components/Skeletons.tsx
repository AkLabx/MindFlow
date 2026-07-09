import React from 'react';

export const HeroSkeleton: React.FC = () => (
    <div className="w-full bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 mb-8 animate-pulse shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 aspect-video md:aspect-square rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
        <div className="flex-1 flex flex-col justify-center">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 mb-8"></div>
            <div className="flex gap-4">
                <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-full w-32"></div>
                <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-full w-32"></div>
            </div>
        </div>
    </div>
);

export const CardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm animate-pulse flex flex-col h-full">
        <div className="w-full aspect-video rounded-xl bg-slate-200 dark:bg-slate-700 mb-4"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mt-auto"></div>
    </div>
);

export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="flex flex-col gap-4">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm animate-pulse flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                <div className="flex-1 w-full">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                </div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-32 mt-4 sm:mt-0"></div>
            </div>
        ))}
    </div>
);
