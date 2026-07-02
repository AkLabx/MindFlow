import React, { useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { useScrollDirection, ScrollDirection } from '../../hooks/useScrollDirection';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { cn } from '../../utils/cn';


export interface TabConfig {
    key: string;
    label: string;
    component: React.ComponentType<any>;
    icon?: React.ReactNode;
    legacyRoutes?: string[];
}

interface CentralizedTabbedPageProps {
    tabs: Record<string, TabConfig>;
    defaultTab: string;
    baseRoute: string;
    onTabChange?: (tabKey: string) => void;
    headerTitle?: React.ReactNode;
    headerDescription?: React.ReactNode;
    onBack?: () => void;
    backLabel?: string;
    stickyTabs?: boolean;
    autoHideFooter?: boolean;
    hideHero?: boolean;
}

export const CentralizedTabbedPage: React.FC<CentralizedTabbedPageProps> = ({
    tabs,
    defaultTab,
    baseRoute,
    onTabChange,
    headerTitle,
    headerDescription,
    onBack,
    backLabel = "Back",
    stickyTabs = false,
    autoHideFooter = false,
    hideHero = false
}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();


    // Determine active tab from URL, fallback to defaultTab
    const tabKeyParam = searchParams.get('tab');
    const isValidTab = tabKeyParam && tabs[tabKeyParam];
    const activeTabKey = isValidTab ? tabKeyParam : defaultTab;

    // Optional layout store hook for hiding bottom nav
    const setHideGlobalFooter = useLayoutStore((state) => state.setHideGlobalFooter);
    const scrollDirection = useScrollDirection();

    useEffect(() => {
        if (autoHideFooter) {
            setHideGlobalFooter(scrollDirection === ScrollDirection.Down);
        }
    }, [scrollDirection, autoHideFooter, setHideGlobalFooter]);

    // Restore footer on unmount
    useEffect(() => {
        return () => {
            if (autoHideFooter) {
                setHideGlobalFooter(false);
            }
        };
    }, [autoHideFooter, setHideGlobalFooter]);


    // Scroll positions storage (in-memory per runtime)
    const scrollPositions = useRef<Record<string, number>>({});

    // Fix invalid URL param by replacing history entry
    useEffect(() => {
        if (!isValidTab) {
            setSearchParams({ tab: defaultTab }, { replace: true });
        }
    }, [isValidTab, defaultTab, setSearchParams]);

    // Handle tab change
    const handleTabChange = (key: string) => {
        if (key !== activeTabKey) {
            // Save current scroll position
            scrollPositions.current[activeTabKey] = window.scrollY;

            // Invoke analytic tracking if provided
            if (onTabChange) {
                onTabChange(key);
            }

            // Update URL
            setSearchParams({ tab: key }, { replace: true });
        }
    };

    // Restore scroll position when active tab changes
    useEffect(() => {
        const savedScrollY = scrollPositions.current[activeTabKey] || 0;
        // Use a slight timeout to allow the Suspense component to mount and render content
        setTimeout(() => {
            window.scrollTo({ top: savedScrollY, behavior: 'auto' });
        }, 50);
    }, [activeTabKey]);

    const ActiveComponent = tabs[activeTabKey]?.component;

    // Swipe logic
    const touchStartX = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartX.current) return;
        const touchEndX = e.changedTouches[0].clientX;
        const distance = touchStartX.current - touchEndX;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe || isRightSwipe) {
            const tabKeys = Object.keys(tabs);
            const currentIndex = tabKeys.indexOf(activeTabKey);

            if (isLeftSwipe && currentIndex < tabKeys.length - 1) {
                handleTabChange(tabKeys[currentIndex + 1]);
            }
            if (isRightSwipe && currentIndex > 0) {
                handleTabChange(tabKeys[currentIndex - 1]);
            }
        }
        touchStartX.current = null;
    };


    // Reusable segmented control rendering
    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative -m-2 p-2 sm:p-2">
            {/* Minimal background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col min-h-screen w-full max-w-7xl mx-auto px-0 py-2">

                                {/* Optional Header Section */}
                {(onBack || (!hideHero && headerTitle)) && (
                    <header className="flex flex-col gap-2 mb-2">
                        {onBack && (
                            <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit">
                                <span className="mr-2">&larr;</span> {backLabel}
                            </button>
                        )}
                        {!hideHero && headerTitle && (
                            <div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight drop-shadow-sm">
                                    {headerTitle}
                                </h1>
                                {headerDescription && (
                                    <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-medium leading-relaxed">
                                        {headerDescription}
                                    </p>
                                )}
                            </div>
                        )}
                    </header>
                )}

                                {/* Scalable Segmented Control Tab Switcher */}
                <div className={cn(
                    "overflow-x-auto pb-2 scrollbar-hide w-full transition-all duration-300",
                    stickyTabs ? "sticky top-[env(safe-area-inset-top,0px)] z-50 py-1 px-1 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md" : "mb-8"
                )}>
                    <div className="flex bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-0.5 w-fit min-w-full sm:min-w-0 border border-slate-300/50 dark:border-slate-700/50 shadow-sm">
                        {Object.entries(tabs).map(([key, tabConfig]) => {
                            const isActive = key === activeTabKey;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleTabChange(key)}
                                    className={`relative flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs sm:text-sm whitespace-nowrap min-w-[90px] ${
                                        isActive
                                        ? 'text-indigo-700 dark:text-indigo-300 font-bold'
                                        : 'text-slate-600 dark:text-slate-400 font-semibold hover:bg-white/40 dark:hover:bg-slate-700/40 hover:text-indigo-600 dark:hover:text-indigo-400'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabIndicator"
                                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-indigo-100 dark:border-slate-600"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        {tabConfig.icon}
                                        {tabConfig.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content Area with Conditional Rendering and Suspense */}
                <div className="flex-1 w-full animate-fade-in relative min-h-[400px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                    <Suspense fallback={
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    }>
                        {ActiveComponent && <ActiveComponent />}
                    </Suspense>
                </div>

            </div>
        </div>
    );
};
