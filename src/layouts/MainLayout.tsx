
import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50 relative overflow-x-hidden">
      
      {/* Header removed as requested */}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} MindFlow Quiz App by Aalok Kumar Sharma. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
