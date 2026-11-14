import React, { useId } from 'react';
import { UserMinus } from 'lucide-react';
import { NativeDialog } from '../../../../components/ui/NativeDialog';

interface BlockUserPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBlock: () => void;
    targetName: string;
}

export const BlockUserPromptModal: React.FC<BlockUserPromptModalProps> = ({ isOpen, onClose, onBlock, targetName }) => {
    const titleId = useId();

    return (
        <NativeDialog
            isOpen={isOpen}
            onClose={onClose}
            role="alertdialog"
            ariaLabelledBy={titleId}
            className="max-w-sm"
            panelClassName="relative w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-center p-6"
        >
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <UserMinus className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <h3 id={titleId} className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                Would you also like to block this user?
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Blocking {targetName} will hide their posts from you and prevent them from messaging you.
            </p>

            <div className="flex flex-col gap-3">
                <button
                    type="button"
                    onClick={() => {
                        onBlock();
                        onClose();
                    }}
                    className="w-full min-h-[44px] py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-600/20"
                >
                    Yes, Block {targetName}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full min-h-[44px] py-3 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                    No, Just Report
                </button>
            </div>
        </NativeDialog>
    );
};
