
import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '../../../../components/Button/Button';
import { usePWAInstall } from '../../../../hooks/usePWAInstall';

export const InstallPWA: React.FC = () => {
  const { canInstall, triggerInstall, isInstalled } = usePWAInstall();

  if (isInstalled || !canInstall) return null;

  return (
    <div className="py-4 border-t border-gray-100 mt-4">
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Download className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-indigo-900 mb-1">Install MindFlow</h4>
                    <p className="text-xs text-indigo-700 mb-3">Add to your home screen for the best experience.</p>
                    <Button 
                        onClick={triggerInstall}
                        size="sm" 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm"
                    >
                        Install App
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
};
