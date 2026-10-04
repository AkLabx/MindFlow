import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/tools/ascii-art-hub')}
          className="p-2.5 sm:p-3 hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-md rounded-2xl text-gray-600 dark:text-gray-400 transition-all active:scale-95 shadow-sm border border-black/5 dark:border-white/5"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          {title}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <Construction className="w-24 h-24 text-gray-400 mb-6 animate-pulse" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
          Under Construction
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          The {title} tool is currently being built. Check back later for updates!
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
