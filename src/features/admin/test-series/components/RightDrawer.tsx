import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface RightDrawerProps {
    width?: "sm" | "md" | "lg" | "xl" | "full";
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const RightDrawer: React.FC<RightDrawerProps> = ({ isOpen, onClose, title, children, width = "md" }) => {

    const widthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full lg:max-w-[90vw]'
    };

    const drawerRef = React.useRef<HTMLDivElement>(null);

    // Prevent scrolling and trap focus when drawer is open
    useEffect(() => {
        if (!isOpen) {
            document.body.style.overflow = 'unset';
            return;
        }

        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Tab') {
                // Focus trapping
                if (!drawerRef.current) return;

                const focusableElements = drawerRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10010]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.2, type: 'tween' }}
                        ref={drawerRef}
                        tabIndex={-1}
                        className={`fixed inset-y-0 right-0 w-full ${widthClasses[width]} bg-white dark:bg-slate-900 shadow-2xl z-[10020] flex flex-col border-l border-slate-200 dark:border-slate-800`}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 pt-[calc(1.5rem_+_env(safe-area-inset-top))]">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
