import React, { useId } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { NativeDialog } from '../../../components/ui/NativeDialog';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Delete Post',
    message = 'Are you sure you want to delete this? This action cannot be undone.',
    isDeleting = false
}) => {
    const titleId = useId();

    return (
        <NativeDialog
            isOpen={isOpen}
            onClose={onClose}
            role="alertdialog"
            dismissible={!isDeleting}
            ariaLabelledBy={titleId}
            className="max-w-sm"
            panelClassName="bg-white dark:bg-slate-900 rounded-2xl w-full shadow-xl overflow-hidden"
        >
            <div className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                    <AlertTriangle size={24} />
                </div>
                <h3 id={titleId} className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    {message}
                </p>

                <div className="flex w-full gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </div>
        </NativeDialog>
    );
};
