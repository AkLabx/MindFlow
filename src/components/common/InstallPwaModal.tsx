
import React from 'react';
import { X } from 'lucide-react';

interface InstallPwaModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-sm text-center">
        <div className="flex justify-end">
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="-mt-4">
          <h2 className="text-xl font-bold text-gray-900">Install MindFlow</h2>
          <p className="mt-2 text-sm text-gray-600">
            For quick access and the best experience, add MindFlow to your home screen.
          </p>
          <p className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            Tap 'Install' below, then confirm the prompt. The app icon will appear on your home screen shortly.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all"
          >
            Install
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-transparent text-gray-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 focus:outline-none transition-all"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPwaModal;
