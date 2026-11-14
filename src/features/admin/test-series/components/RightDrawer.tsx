import React, { useId, useState } from 'react';
import { X } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { NativeDialog } from '@/components/ui/NativeDialog';

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
    const titleId = useId();

    const widthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full lg:max-w-[90vw]'
    };

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

    return (
        <>
            <NativeDialog
                isOpen={isOpen}
                onClose={onClose}
                variant="drawer-right"
                isDirty={isDirty}
                onDirtyCloseAttempt={() => setShowConfirmDialog(true)}
                ariaLabelledBy={titleId}
                className={widthClasses[width]}
                panelClassName="w-full h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 pt-[calc(1.5rem_+_env(safe-area-inset-top))]">
                    <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                    <button
                        type="button"
                        onClick={handleRequestClose}
                        aria-label="Close drawer"
                        className="p-2 min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
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
            </NativeDialog>

            <ConfirmDialog
                isOpen={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                onConfirm={confirmClose}
                title="Unsaved Changes"
                message="You have unsaved changes. Are you sure you want to discard them and close this drawer?"
                confirmText="Discard Changes"
            />
        </>
    );
};
