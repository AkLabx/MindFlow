import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface RightDrawerProps {
    width?: "sm" | "md" | "lg" | "xl" | "full";
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    isDirty?: boolean;
    footer?: React.ReactNode | ((requestClose: () => void) => React.ReactNode);
}

export const RightDrawer: React.FC<RightDrawerProps> = ({
    isOpen,
    onClose,
    title,
    children,
    width = "md",
    isDirty = false,
    footer
}) => {

    const widthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full lg:max-w-[90vw]'
    };

    const drawerRef = React.useRef<HTMLDivElement>(null);
    const previousFocusRef = React.useRef<HTMLElement | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleRequestClose = () => {
        if (isDirty) {
            setShowConfirmDialog(true);
        } else {
            onClose();
        }
    };

    const confirmClose = () => {
        setShowConfirmDialog(false);
        onClose();
    };

    // Prevent scrolling and trap focus when drawer is open
    useEffect(() => {
        if (!isOpen) {
            document.body.style.overflow = 'unset';
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
                previousFocusRef.current = null;
            }
            return;
        }

        previousFocusRef.current = document.activeElement as HTMLElement;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // Ignore if the confirm dialog is already open,
                // the dialog has its own escape handling or will block.
                if (!showConfirmDialog) {
                    handleRequestClose();
                }
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
    }, [isOpen, showConfirmDialog, isDirty]);

    const portalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10010]"
                        onClick={handleRequestClose}
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
                                onClick={handleRequestClose}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {children}
                        </div>
                        {footer && (
                            <div className="p-6 pb-[calc(1.5rem_+_env(safe-area-inset-bottom))] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                {typeof footer === 'function' ? footer(handleRequestClose) : footer}
                            </div>
                        )}
                    </motion.div>

                    <ConfirmDialog
                        isOpen={showConfirmDialog}
                        onClose={() => setShowConfirmDialog(false)}
                        onConfirm={confirmClose}
                        title="Unsaved Changes"
                        message="You have unsaved changes. Are you sure you want to discard them and close this drawer?"
                        confirmText="Discard Changes"
                    />
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(portalContent, document.body);
};
