import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    const navigate = useNavigate();

    return (
        <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <React.Fragment key={index}>
                        {item.path && !isLast ? (
                            <button
                                onClick={() => navigate(item.path!)}
                                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                {item.label}
                            </button>
                        ) : (
                            <span className={isLast ? "text-slate-800 dark:text-slate-200 font-semibold" : ""}>
                                {item.label}
                            </span>
                        )}
                        {!isLast && <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-300 dark:text-slate-600" />}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
