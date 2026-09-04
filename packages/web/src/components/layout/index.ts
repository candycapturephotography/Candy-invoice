/**
 * Layout Components
 *
 * @description Exports all layout components for the application shell
 * @requirements 14.2 - Mobile: single-column layout with bottom navigation bar
 * @requirements 14.3 - Tablet: two-column layout with side navigation drawer
 * @requirements 14.4 - Desktop: multi-column layout with fixed side navigation
 */

export { Header } from './Header';
export type { HeaderProps } from './Header';

export { Sidebar } from './Sidebar';
export type { SidebarProps, NavItem } from './Sidebar';

export { BottomNav } from './BottomNav';
export type { BottomNavProps, BottomNavItem } from './BottomNav';

export { MainLayout } from './MainLayout';
export type { MainLayoutProps } from './MainLayout';
