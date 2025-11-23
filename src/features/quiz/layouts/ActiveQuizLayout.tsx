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
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">
      {/* Header Slot */}
      <header className="flex-none bg-white border-b border-gray-200 shadow-sm z-40 relative">
        {header}
      </header>

      {/* Main Content Slot */}
      <main className="flex-1 overflow-y-auto bg-white relative scroll-smooth">
        <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
          {children}
        </div>
      </main>

      {/* Footer Slot */}
      <footer className="flex-none bg-white border-t border-gray-200 z-30 relative">
        {footer}
      </footer>

      {/* Overlays Slot (Modals, Drawers) */}
      {overlays}
    </div>
  );
};