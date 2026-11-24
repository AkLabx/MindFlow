/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AdminLayout } from '../AdminLayout';
import { ADMIN_NAV_GROUPS } from '../AdminSidebar';
import { NavigationManager, RouteAccessType } from '@/lib/navigation';
import { AuthPolicy } from '@/lib/navigation/policies/AuthPolicy';
import { IntentPolicy } from '@/lib/navigation/policies/IntentPolicy';
import { ROUTES } from '@/config/routes';

const mockUseAuth = vi.fn();
const mockToggleDarkMode = vi.fn();
const mockTelemetryEmit = vi.fn();

vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/stores/useSettingsStore', () => ({
  useSettingsStore: () => ({
    isDarkMode: false,
    toggleDarkMode: mockToggleDarkMode,
  }),
}));

vi.mock('@/components/ui/PresenceAvatar', () => ({
  PresenceAvatar: ({ altText }: { altText: string }) => (
    <span data-testid="presence-avatar">{altText}</span>
  ),
}));

vi.mock('@/lib/telemetry/telemetryService', () => ({
  telemetry: {
    emit: (...args: any[]) => mockTelemetryEmit(...args),
  },
}));

const LocationObserver: React.FC<{ onLocation: (fullPath: string) => void }> = ({ onLocation }) => {
  const location = useLocation();
  React.useEffect(() => {
    onLocation(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search, onLocation]);
  return null;
};

describe('Admin Shell, Command Palette, Mobile Drawer, ErrorBoundary & RBAC Guards (v1.0.377)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    // Polyfill native <dialog> methods for JSDOM
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });

    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1', email: 'admin@mindflow.edu', user_metadata: {} },
      profile: { full_name: 'Admin Lead', avatar_url: null },
      roles: ['admin'],
      loading: false,
      isAdmin: true,
      hasRole: () => true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens Command Palette via Ctrl+K, filters BPSC quick actions, resets stale query on reopen, and navigates cleanly', async () => {
    let latestLocation = '';
    render(
      <MemoryRouter initialEntries={[ROUTES.ADMIN.OVERVIEW]}>
        <LocationObserver onLocation={(loc) => { latestLocation = loc; }} />
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.ADMIN.OVERVIEW} element={<div>Admin Overview Stub</div>} />
            <Route path={ROUTES.ADMIN.TEST_SERIES} element={<div>Admin Test Series Stub</div>} />
            <Route path={ROUTES.ADMIN.TEST_NEW} element={<div>Admin New Test Stub</div>} />
          </Route>
          <Route path={ROUTES.TEST_SERIES.BPSC} element={<div>BPSC Student Listing Stub</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Open Command Palette via Ctrl+K
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    const searchInput = await screen.findByRole('combobox', { name: /search admin commands/i });
    expect(searchInput).toBeTruthy();

    // Verify all 3 required Mock Tests / BPSC quick actions exist
    expect(screen.getByRole('option', { name: /jump to mock tests catalog/i })).toBeTruthy();
    expect(screen.getByRole('option', { name: /create new mock test/i })).toBeTruthy();
    expect(screen.getByRole('option', { name: /student preview: bpsc prepared mock tests/i })).toBeTruthy();

    // Filter to non-existent command and ensure ArrowUp/ArrowDown do not throw or go negative
    fireEvent.change(searchInput, { target: { value: 'zzzznonexistent' } });
    fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    expect(screen.getByText(/no matching commands found/i)).toBeTruthy();

    // Filter for Mock Tests Catalog & trigger via Enter
    fireEvent.change(searchInput, { target: { value: 'mock tests catalog' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    await waitFor(() => {
      expect(latestLocation).toBe(`${ROUTES.ADMIN.TEST_SERIES}?tab=tests`);
    });

    // Reopen Command Palette and verify stale query was reset
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const reopenedInput = await screen.findByRole('combobox', { name: /search admin commands/i }) as HTMLInputElement;
    expect(reopenedInput.value).toBe('');

    // Verify jumping to New Test Builder
    fireEvent.change(reopenedInput, { target: { value: 'create new mock' } });
    fireEvent.click(screen.getByRole('option', { name: /create new mock test/i }));
    await waitFor(() => {
      expect(latestLocation).toBe(ROUTES.ADMIN.TEST_NEW);
    });

    // Reopen and jump to Student BPSC Preview
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const thirdInput = await screen.findByRole('combobox', { name: /search admin commands/i });
    fireEvent.change(thirdInput, { target: { value: 'bpsc preview' } });
    fireEvent.click(screen.getByRole('option', { name: /student preview: bpsc prepared mock tests/i }));
    await waitFor(() => {
      expect(latestLocation).toBe(ROUTES.TEST_SERIES.BPSC);
    });
  });

  it('auto-closes the mobile slide-over drawer on route and query-param switches while keeping >=44px type="button" controls', async () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.ADMIN.OVERVIEW]}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.ADMIN.OVERVIEW} element={<div>Admin Overview Body</div>} />
            <Route path={ROUTES.ADMIN.TEST_SERIES} element={<div>Admin Test Series Body</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const openMenuBtn = screen.getByRole('button', { name: /open navigation menu/i });
    expect(openMenuBtn.getAttribute('type')).toBe('button');
    expect(openMenuBtn.getAttribute('aria-expanded')).toBe('false');
    expect(openMenuBtn.className).toContain('min-w-[44px]');
    expect(openMenuBtn.className).toContain('min-h-[44px]');

    // Open mobile drawer
    fireEvent.click(openMenuBtn);

    const drawerDialog = await screen.findByRole('dialog', { name: /admin navigation menu/i });
    expect(drawerDialog.hasAttribute('open')).toBe(true);
    expect(openMenuBtn.getAttribute('aria-expanded')).toBe('true');

    const closeDrawerBtn = screen.getByRole('button', { name: /close navigation menu/i });
    expect(closeDrawerBtn.getAttribute('type')).toBe('button');
    expect(closeDrawerBtn.className).toContain('min-w-[44px]');
    expect(closeDrawerBtn.className).toContain('min-h-[44px]');

    // Navigate via link inside mobile drawer -> drawer must auto-close
    const catalogLinks = screen.getAllByRole('link', { name: /mock tests catalog/i });
    fireEvent.click(catalogLinks[catalogLinks.length - 1]);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /admin navigation menu/i })).toBeNull();
    });
    expect(screen.getByText('Admin Test Series Body')).toBeTruthy();

    // Verify main viewport enforces safe-area clearance and scroll-mb-28
    const mainLandmark = screen.getByRole('main');
    expect(mainLandmark.className).toContain('scroll-mb-28');
    expect(mainLandmark.className).toContain('env(safe-area-inset-bottom)');
  });

  it('isolates child route errors inside ErrorBoundary around <Outlet />, preserves shell navigation, and supports Reload Screen recovery', async () => {
    let shouldThrow = true;
    const CrashablePage: React.FC = () => {
      if (shouldThrow) {
        throw new Error('Simulated analytics module crash');
      }
      return <div>Recovered Admin Analytics Page</div>;
    };

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={[ROUTES.ADMIN.ANALYTICS]}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.ADMIN.ANALYTICS} element={<CrashablePage />} />
            <Route path={ROUTES.ADMIN.OVERVIEW} element={<div>Healthy Overview Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText(/Simulated analytics module crash/i)).toBeTruthy();

    // Admin shell sidebar & header remain alive and accessible
    expect(screen.getByRole('navigation', { name: /admin sections/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /open command palette/i })).toBeTruthy();

    // Fix error condition and recover via Reload Screen without full window reload
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /reload screen/i }));

    await waitFor(() => {
      expect(screen.getByText('Recovered Admin Analytics Page')).toBeTruthy();
    });
    expect(mockTelemetryEmit).toHaveBeenCalledWith('recovery_action_clicked', {
      view: 'admin_layout',
      actionChosen: 'reload_admin_outlet',
    });

    consoleErrorSpy.mockRestore();
  });

  it('verifies zero broken or unregistered routes across all ADMIN_NAV_GROUPS items', () => {
    const validAdminPaths = new Set<string>(
      [...Object.values(ROUTES.ADMIN), ROUTES.TEST_SERIES.BPSC]
        .filter((v) => typeof v === 'string')
        .map((v) => String(v))
    );

    const allNavItems = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
    expect(allNavItems.length).toBeGreaterThanOrEqual(15);

    for (const item of allNavItems) {
      const basePath = item.to.split('?')[0];
      expect(validAdminPaths.has(basePath)).toBe(true);
    }
  });

  it('enforces RouteAccessType.ADMIN RBAC guards: redirects unauthenticated & non-admin users and permits admins', async () => {
    // 1. Direct AuthPolicy unit assertions
    expect(AuthPolicy.isAdmin(null, null, [])).toBe(false);
    expect(AuthPolicy.isAdmin({ id: 'u1' } as any, { role: 'student' }, ['student'])).toBe(false);
    expect(AuthPolicy.isAdmin({ id: 'u2' } as any, null, ['moderator', 'content_creator'])).toBe(false);
    expect(AuthPolicy.isAdmin({ id: 'u3' } as any, null, ['admin'])).toBe(true);
    expect(AuthPolicy.isAdmin({ id: 'u4' } as any, null, ['super_admin'])).toBe(true);

    // 2. Loading state does NOT leak Admin content prematurely
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      roles: [],
      loading: true,
      isAdmin: false,
      hasRole: () => false,
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={[ROUTES.ADMIN.TEST_SERIES]}>
        <Routes>
          <Route path={ROUTES.HOME} element={<div>Guest Auth Portal</div>} />
          <Route path={ROUTES.DASHBOARD} element={<div>Student Dashboard</div>} />
          <Route
            path={ROUTES.ADMIN.TEST_SERIES}
            element={
              <NavigationManager type={RouteAccessType.ADMIN}>
                <div>Protected Admin Portal</div>
              </NavigationManager>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText('Protected Admin Portal')).toBeNull();
    unmount();

    // 3. Unauthenticated user redirects to Guest Auth Portal ('/') and preserves intent
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      roles: [],
      loading: false,
      isAdmin: false,
      hasRole: () => false,
    });

    const unauthView = render(
      <MemoryRouter initialEntries={[ROUTES.ADMIN.TEST_SERIES]}>
        <Routes>
          <Route path={ROUTES.HOME} element={<div>Guest Auth Portal</div>} />
          <Route path={ROUTES.DASHBOARD} element={<div>Student Dashboard</div>} />
          <Route
            path={ROUTES.ADMIN.TEST_SERIES}
            element={
              <NavigationManager type={RouteAccessType.ADMIN}>
                <div>Protected Admin Portal</div>
              </NavigationManager>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Guest Auth Portal')).toBeTruthy();
    expect(screen.queryByText('Protected Admin Portal')).toBeNull();
    expect(IntentPolicy.peekIntent()).toBe(ROUTES.ADMIN.TEST_SERIES);
    unauthView.unmount();

    // 4. Authenticated student / non-admin redirects to '/dashboard'
    mockUseAuth.mockReturnValue({
      user: { id: 'student-1', email: 'student@mindflow.edu', user_metadata: { onboarding_completed: true } },
      profile: { role: 'student', onboarding_completed: true },
      roles: ['student'],
      loading: false,
      isAdmin: false,
      hasRole: () => false,
    });

    const studentView = render(
      <MemoryRouter initialEntries={[ROUTES.ADMIN.TEST_SERIES]}>
        <Routes>
          <Route path={ROUTES.HOME} element={<div>Guest Auth Portal</div>} />
          <Route path={ROUTES.DASHBOARD} element={<div>Student Dashboard</div>} />
          <Route
            path={ROUTES.ADMIN.TEST_SERIES}
            element={
              <NavigationManager type={RouteAccessType.ADMIN}>
                <div>Protected Admin Portal</div>
              </NavigationManager>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Student Dashboard')).toBeTruthy();
    expect(screen.queryByText('Protected Admin Portal')).toBeNull();
    studentView.unmount();

    // 5. Authenticated admin enters protected portal cleanly
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1', email: 'admin@mindflow.edu', user_metadata: { onboarding_completed: true } },
      profile: { role: 'admin', onboarding_completed: true },
      roles: ['admin'],
      loading: false,
      isAdmin: true,
      hasRole: () => true,
    });

    render(
      <MemoryRouter initialEntries={[ROUTES.ADMIN.TEST_SERIES]}>
        <Routes>
          <Route path={ROUTES.HOME} element={<div>Guest Auth Portal</div>} />
          <Route path={ROUTES.DASHBOARD} element={<div>Student Dashboard</div>} />
          <Route
            path={ROUTES.ADMIN.TEST_SERIES}
            element={
              <NavigationManager type={RouteAccessType.ADMIN}>
                <div>Protected Admin Portal</div>
              </NavigationManager>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Protected Admin Portal')).toBeTruthy();
  });
});
