import React from 'react';
import { BrainCircuit } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">MindFlow</span>
            </div>
            <nav className="flex gap-4">
              <a href="#" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                Dashboard
              </a>
              <a href="#" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                Profile
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} MindFlow Quiz App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};