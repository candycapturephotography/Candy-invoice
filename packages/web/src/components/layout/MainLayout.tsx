/**
 * MainLayout Component
 *
 * @description Main application layout composing Header, Sidebar, BottomNav, and content area
 * @requirements 14.2 - Mobile: single-column layout with bottom navigation bar
 * @requirements 14.3 - Tablet: two-column layout with side navigation drawer
 * @requirements 14.4 - Desktop: multi-column layout with fixed side navigation
 * @requirements 10.13 - Dashboard responsive layout
 */

import { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import type { SyncConnectionStatus } from '../../types';

export interface MainLayoutProps {
  /** Current sync connection status */
  syncStatus?: SyncConnectionStatus;
  /** Current user name */
  userName?: string;
  /** Callback when logout is clicked */
  onLogout?: () => void;
}

/**
 * Hamburger menu button for mobile sidebar toggle
 */
function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed left-4 top-4 z-40 flex min-h-touch min-w-touch items-center justify-center rounded-lg bg-white p-2 shadow-md hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
      aria-label="Open navigation menu"
    >
      <svg
        className="h-6 w-6 text-surface-700"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    </button>
  );
}

/**
 * Main layout component that provides the application shell
 * - Header is fixed at the top
 * - Sidebar is fixed on the left (hidden on mobile, visible on desktop)
 * - BottomNav is fixed at the bottom on mobile only
 * - Content area scrolls and uses Outlet for nested routes
 */
export function MainLayout({
  syncStatus = 'online',
  userName,
  onLogout,
}: MainLayoutProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogoClick = useCallback(() => {
    navigate('/');
    setIsSidebarOpen(false);
  }, [navigate]);

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleSidebarOpen = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Mobile menu button - only visible on mobile/tablet when sidebar is closed */}
      <div className="lg:hidden">
        <MobileMenuButton onClick={handleSidebarOpen} />
      </div>

      {/* Header - fixed at top */}
      <Header
        syncStatus={syncStatus}
        userName={userName}
        onLogout={onLogout}
        onLogoClick={handleLogoClick}
      />

      {/* Sidebar - fixed left, hidden on mobile unless toggled */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

      {/* Main content area */}
      <main
        className={`
          min-h-screen pt-16
          pb-20 md:pb-4
          lg:ml-64
          px-4 md:px-6 lg:px-8
        `}
      >
        {/* Content container with max width and padding */}
        <div className="mx-auto max-w-7xl py-6">
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation - only visible on mobile */}
      <BottomNav />
    </div>
  );
}

export default MainLayout;
