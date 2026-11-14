import React, { useId } from 'react';
import { Loader2 } from 'lucide-react';
import { NativeDialog } from '@/components/ui/NativeDialog';

interface GeneratorModalProps {
  isOpen: boolean;
  type: 'PDF' | 'PPT' | 'JSON' | null;
  progress: number;
  details: string;
}

export const GeneratorModal: React.FC<GeneratorModalProps> = ({
  isOpen,
  type,
  progress,
  details,
}) => {
  const titleId = useId();

  return (
    <NativeDialog
      isOpen={isOpen && !!type}
      onClose={() => {}}
      dismissible={false}
      ariaLabelledBy={titleId}
      className="max-w-sm"
      panelClassName="w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col items-center"
    >
      {type && (
        <>
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <h3 id={titleId} className="text-xl font-bold text-gray-900 dark:text-white mb-2">Generating Your {type}...</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">{details}</p>

          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                  className="h-full bg-indigo-600 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
              />
          </div>
          <p className="text-xs text-gray-400 font-medium text-right w-full mt-2">{progress}%</p>
        </>
      )}
    </NativeDialog>
  );
};
