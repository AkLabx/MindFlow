import React, { Suspense, useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminCommandPalette } from './AdminCommandPalette';
import { NativeDialog } from '@/components/ui/NativeDialog';
import { SynapticLoader } from '@/components/ui/SynapticLoader';
import { ErrorBoundary } from '@/providers/ErrorBoundary';
import { telemetry } from '@/lib/telemetry/telemetryService';

export const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [outletResetKey, setOutletResetKey] = useState(0);
  const location = useLocation();

  // Close mobile menu whenever pathname or query params change (e.g. ?tab=tests)
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.altKey || e.shiftKey) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased overflow-x-hidden">
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-indigo-600 focus:text-white focus:text-xs focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="flex flex-1 h-[100dvh] overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex shrink-0 h-full">
          <AdminSidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          />
        </div>

        {/* Mobile Slide-Over Sidebar */}
        <NativeDialog
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          variant="drawer-left"
          ariaLabel="Admin navigation menu"
          className="w-[min(18.5rem,85vw)] md:hidden"
          panelClassName="relative flex-1 flex flex-col w-full h-full bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        >
          <AdminSidebar
            isCollapsed={false}
            onToggleCollapse={() => setIsMobileMenuOpen(false)}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        </NativeDialog>

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <AdminHeader
            isMobileMenuOpen={isMobileMenuOpen}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenCommandPalette={() => {
              setIsMobileMenuOpen(false);
              setIsCommandPaletteOpen(true);
            }}
          />

          {/* Scrollable Viewport */}
          <main
            id="admin-main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/70 dark:bg-slate-950/70 p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-[calc(4rem+env(safe-area-inset-bottom))] lg:p-8 lg:pb-[calc(4rem+env(safe-area-inset-bottom))] scroll-mb-28 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 focus:outline-none"
          >
            <div className="max-w-7xl mx-auto w-full min-w-0">
              <ErrorBoundary
                key={`${location.pathname}:${outletResetKey}`}
                fallbackMessage="This admin module encountered an unexpected error. Retry loading this screen or switch sections from the sidebar or Ctrl+K palette."
                onReset={() => {
                  telemetry.emit('recovery_action_clicked', {
                    view: 'admin_layout',
                    actionChosen: 'reload_admin_outlet',
                  });
                  setOutletResetKey((prev) => prev + 1);
                }}
              >
                <Suspense
                  fallback={
                    <div className="min-h-[50vh] w-full flex items-center justify-center">
                      <SynapticLoader size="lg" />
                    </div>
                  }
                >
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>

      {/* Global Command Palette */}
      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};
export default AdminLayout;
