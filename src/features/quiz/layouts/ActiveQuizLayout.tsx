import React from 'react';

interface ActiveQuizLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  overlays?: React.ReactNode;
}

export const ActiveQuizLayout: React.FC<ActiveQuizLayoutProps> = ({
  header,
  children,
  footer,
  overlays
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col animate-in fade-in duration-200 overflow-x-hidden w-full max-w-[100vw] select-none">
      {/* Sticky Top App Bar & Timer Header */}
      {header && (
        <header className="flex-none z-30 border-b border-gray-200 dark:border-gray-800 shadow-xs bg-white dark:bg-gray-900">
          {header}
        </header>
      )}

      {/* Main Scrollable Question & Explanation Canvas */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y w-full max-w-[100vw] bg-white dark:bg-gray-900 relative scroll-smooth">
        <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
          {children}
        </div>
      </main>

      {/* Footer Slot - Remains fixed/sticky at bottom with Android gesture bar safe-area clearance */}
      <footer className="flex-none bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-30 relative pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.06)]">
        {footer}
      </footer>

      {/* Overlays Slot (Modals, Drawers) */}
      {overlays}
    </div>
  );
};