import React, { useId } from 'react';
import { X } from 'lucide-react';
import { NativeDialog } from '../ui/NativeDialog';

/**
 * Props for the InstallPwaModal component.
 */
interface InstallPwaModalProps {
  /** Callback function executed when the user confirms the installation. */
  onConfirm: () => void;
  /** Callback function executed when the user cancels or closes the modal. */
  onCancel: () => void;
}

/**
 * A modal dialog prompting the user to install the application as a PWA.
 *
 * This component provides instructions and buttons to trigger the browser's
 * native installation prompt or dismiss the suggestion.
 *
 * @param {InstallPwaModalProps} props - The component props.
 * @returns {JSX.Element} The rendered modal component.
 */
const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ onConfirm, onCancel }) => {
  const titleId = useId();

  return (
    <NativeDialog
      isOpen
      onClose={onCancel}
      ariaLabelledBy={titleId}
      className="max-w-sm"
      panelClassName="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 w-full text-center"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close install prompt"
          className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="-mt-2">
        <h2 id={titleId} className="text-xl font-bold text-gray-900 dark:text-white">Install MindFlow</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          For quick access and the best experience, add MindFlow to your home screen.
        </p>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          Tap 'Install' below, then confirm the prompt. The app icon will appear on your home screen shortly.
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full min-h-[44px] bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all"
        >
          Install
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full min-h-[44px] bg-transparent text-gray-600 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 dark:bg-gray-800 focus:outline-none transition-all"
        >
          Not Now
        </button>
      </div>
    </NativeDialog>
  );
};

export default InstallPwaModal;
