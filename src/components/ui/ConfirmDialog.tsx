import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { NativeDialog } from './NativeDialog';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'danger',
  isLoading = false,
}) => {
  const getButtonStyle = () => {
    switch (confirmStyle) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20';
      case 'primary':
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20';
    }
  };

  return (
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      role="alertdialog"
      dismissible={!isLoading}
      ariaLabelledBy="confirm-dialog-title"
      ariaDescribedBy="confirm-dialog-message"
      className="max-w-sm"
      panelClassName="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`p-3 rounded-full shrink-0 ${
            confirmStyle === 'danger'
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
              : confirmStyle === 'warning'
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 id="confirm-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>
      <p id="confirm-dialog-message" className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`min-h-[44px] min-w-[44px] px-5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${getButtonStyle()}`}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </NativeDialog>
  );
};
