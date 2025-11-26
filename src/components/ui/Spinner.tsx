import React from 'react';
import { Loader } from 'lucide-react';

export const Spinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  );
};
