import React, { useId } from 'react';
import { X, FileText, FileJson, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { NativeDialog } from './NativeDialog';

interface DownloadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPDF: () => void;
  onDownloadJSON: () => void;
  isGeneratingPDF: boolean;
  isGeneratingJSON: boolean;
}

/**
 * A modal to choose between downloading PDF or JSON.
 */
export const DownloadOptionsModal: React.FC<DownloadOptionsModalProps> = ({
  isOpen,
  onClose,
  onDownloadPDF,
  onDownloadJSON,
  isGeneratingPDF,
  isGeneratingJSON,
}) => {
  const titleId = useId();
  const isBusy = isGeneratingPDF || isGeneratingJSON;

  return (
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      dismissible={!isBusy}
      ariaLabelledBy={titleId}
      className="max-w-sm"
      panelClassName="w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 id={titleId} className="text-lg font-bold text-gray-900 dark:text-white">Download Options</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close download options"
          className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          disabled={isBusy}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Download PDF Button */}
        <button
          type="button"
          onClick={onDownloadPDF}
          disabled={isBusy}
          className={cn(
            "w-full min-h-[44px] flex items-center justify-between p-4 rounded-xl border-2 transition-all",
            "border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:text-red-400",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-50/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <span className="font-semibold">Download PDF</span>
          </div>
          {isGeneratingPDF && <Loader2 className="w-5 h-5 animate-spin" />}
        </button>

        {/* Download JSON Button */}
        <button
          type="button"
          onClick={onDownloadJSON}
          disabled={isBusy}
          className={cn(
            "w-full min-h-[44px] flex items-center justify-between p-4 rounded-xl border-2 transition-all",
            "border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200 text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 dark:text-blue-400",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileJson className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-semibold">Download JSON</span>
          </div>
          {isGeneratingJSON && <Loader2 className="w-5 h-5 animate-spin" />}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        Select a format to download the flashcards
      </p>
    </NativeDialog>
  );
};
