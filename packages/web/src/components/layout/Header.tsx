/**
 * Header Component
 *
 * @description Top header bar with logo/app name, sync status indicator, and user menu with logout
 * @requirements 14.2, 14.3, 14.4 - Platform responsive layouts
 * @requirements 3.4 - Sync status indicator showing connection state
 */

import { useState } from 'react';
import type { SyncConnectionStatus } from '../../types';

export interface HeaderProps {
  /** Current sync connection status */
  syncStatus?: SyncConnectionStatus;
  /** User name to display (optional) */
  userName?: string;
  /** Callback when logout is clicked */
  onLogout?: () => void;
  /** Callback when logo/home is clicked */
  onLogoClick?: () => void;
}

/**
 * Sync status indicator component
 */
function SyncStatusIndicator({ status }: { status: SyncConnectionStatus }) {
  const statusConfig: Record<
    SyncConnectionStatus,
    { label: string; color: string; bgColor: string; icon: React.ReactNode }
  > = {
    online: {
      label: 'Online',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: (
        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
      ),
    },
    offline: {
      label: 'Offline',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      icon: (
        <span className="h-2 w-2 rounded-full bg-gray-400" aria-hidden="true" />
      ),
    },
    syncing: {
      label: 'Syncing',
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
      icon: (
        <svg
          className="h-3 w-3 animate-spin text-primary-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ),
    },
    error: {
      label: 'Sync Error',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: (
        <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
      ),
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${config.bgColor} ${config.color}`}
      role="status"
      aria-live="polite"
    >
      {config.icon}
      <span className="hidden sm:inline">{config.label}</span>
    </div>
  );
}

/**
 * User menu dropdown component
 */
function UserMenu({
  userName,
  onLogout,
}: {
  userName?: string;
  onLogout?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-touch min-w-touch items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* User avatar placeholder */}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </span>
        <span className="hidden md:inline">{userName || 'User'}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop for closing */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout?.();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-surface-700 hover:bg-surface-100"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Header component for the application
 */
export function Header({
  syncStatus = 'online',
  userName,
  onLogout,
  onLogoClick,
}: HeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 lg:px-6">
      {/* Left section - Logo and app name */}
      <button
        type="button"
        onClick={onLogoClick}
        className="flex items-center gap-3 rounded-lg p-1 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        {/* Logo placeholder - will be replaced with actual logo */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500">
          <span className="text-xl font-bold text-white">C</span>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold text-surface-900">
            CandyCapture
          </h1>
          <p className="text-xs text-surface-500">Photography</p>
        </div>
      </button>

      {/* Right section - Sync status and user menu */}
      <div className="flex items-center gap-3">
        <SyncStatusIndicator status={syncStatus} />
        <UserMenu userName={userName} onLogout={onLogout} />
      </div>
    </header>
  );
}

export default Header;
