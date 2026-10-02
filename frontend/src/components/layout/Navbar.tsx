import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Menu, X, Bell, User as UserIcon, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../ui/Logo';
import { NotificationDrawer } from '../ui/NotificationDrawer';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch unread count if authenticated
  const { data: unreadData } = useQuery<{ unread_count: number }>({
    queryKey: ['notifications-unread'],
    queryFn: () => apiRequest('/notifications/unread-count'),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const unreadCount = unreadData?.unread_count || 0;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getWorkspacePath = () => {
    if (!user?.role) return '/workspace';
    switch (user.role) {
      case 'Customer':
        return '/customer';
      case 'Technician':
        return '/technician';
      case 'Manager':
        return '/manager';
      case 'Admin':
        return '/admin';
      default:
        return '/workspace';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-brand-ivory/90 dark:bg-brand-dark-bg/90 backdrop-blur-md border-b border-brand-evergreen/10 dark:border-brand-dark-border transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Logo size="md" />
            </div>

            {/* Desktop Navigation Links */}
            {!isAuthenticated ? (
              <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-forest/80 dark:text-brand-dark-text">
                <Link to="/how-it-works" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  How it works
                </Link>
                <Link to="/capabilities" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  Capabilities
                </Link>
                <Link to="/teams" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  For teams
                </Link>
                <Link to="/pricing" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  Pricing
                </Link>
              </nav>
            ) : (
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link
                  to={getWorkspacePath()}
                  className="px-3 py-1.5 rounded-lg bg-brand-evergreen/10 dark:bg-brand-mint/15 text-brand-evergreen dark:text-brand-mint font-semibold hover:bg-brand-evergreen/15 transition-colors flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-brand-jade" />
                  {user?.role} Workspace
                </Link>
                {user?.role === 'Admin' && (
                  <Link to="/admin/audit" className="text-brand-forest/70 hover:text-brand-forest dark:text-brand-dark-muted dark:hover:text-white text-xs">
                    Audit Logs
                  </Link>
                )}
              </nav>
            )}

            {/* Right Action Icons & Auth */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Theme Toggle (Moon in screenshot) */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle theme"
                className="w-9 h-9 flex items-center justify-center rounded-full text-brand-forest/80 hover:text-brand-evergreen hover:bg-brand-forest/5 dark:text-brand-dark-text dark:hover:bg-brand-dark-hover transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-brand-amber" /> : <Moon className="w-5 h-5" />}
              </button>

              {isAuthenticated ? (
                <>
                  {/* Notification Bell */}
                  <button
                    onClick={() => setNotifDrawerOpen(true)}
                    className="relative w-9 h-9 flex items-center justify-center rounded-full text-brand-forest/80 hover:text-brand-evergreen hover:bg-brand-forest/5 dark:text-brand-dark-text dark:hover:bg-brand-dark-hover transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-brand-coral rounded-full ring-2 ring-white dark:ring-brand-dark-bg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* User Profile Pill */}
                  <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-brand-evergreen/15 dark:border-brand-dark-border">
                    <div className="w-8 h-8 rounded-full bg-brand-evergreen text-white flex items-center justify-center text-xs font-bold uppercase">
                      {user?.full_name ? user.full_name.charAt(0) : 'U'}
                    </div>
                    <div className="text-left text-xs">
                      <div className="font-semibold text-brand-forest dark:text-brand-dark-text leading-tight truncate max-w-[120px]">
                        {user?.full_name}
                      </div>
                      <div className="text-[11px] text-brand-forest/60 dark:text-brand-dark-muted">
                        {user?.role}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      title="Sign out"
                      className="ml-2 p-1.5 text-brand-forest/50 hover:text-brand-coral transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-brand-forest/90 dark:text-brand-dark-text hover:text-brand-evergreen dark:hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-evergreen hover:bg-brand-forest dark:bg-brand-jade dark:hover:bg-brand-evergreen rounded-lg transition-colors shadow-soft"
                  >
                    <span>Get started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-brand-forest dark:text-brand-dark-text hover:bg-brand-forest/5 dark:hover:bg-brand-dark-hover"
                aria-label="Open menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-brand-evergreen/10 dark:border-brand-dark-border bg-brand-ivory dark:bg-brand-dark-card px-4 pt-3 pb-6 space-y-3">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-brand-forest dark:text-brand-dark-text rounded-lg hover:bg-brand-forest/5"
                >
                  How it works
                </Link>
                <Link
                  to="/capabilities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-brand-forest dark:text-brand-dark-text rounded-lg hover:bg-brand-forest/5"
                >
                  Capabilities
                </Link>
                <Link
                  to="/teams"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-brand-forest dark:text-brand-dark-text rounded-lg hover:bg-brand-forest/5"
                >
                  For teams
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-brand-forest dark:text-brand-dark-text rounded-lg hover:bg-brand-forest/5"
                >
                  Pricing
                </Link>
                <div className="pt-4 border-t border-brand-evergreen/10 dark:border-brand-dark-border flex flex-col gap-2.5">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-medium text-brand-forest dark:text-brand-dark-text border border-brand-evergreen/20 rounded-lg"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-medium text-white bg-brand-evergreen rounded-lg"
                  >
                    Get started →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-brand-evergreen/10 dark:border-brand-dark-border pb-3">
                  <div className="font-semibold text-brand-evergreen dark:text-brand-mint">{user?.full_name}</div>
                  <div className="text-xs text-brand-forest/70 dark:text-brand-dark-muted">{user?.email} · {user?.role}</div>
                </div>
                <Link
                  to={getWorkspacePath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-brand-forest dark:text-brand-dark-text rounded-lg hover:bg-brand-forest/5"
                >
                  Open {user?.role} Workspace
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setNotifDrawerOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-base font-medium text-brand-forest dark:text-brand-dark-text rounded-lg hover:bg-brand-forest/5 flex items-center justify-between"
                >
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-brand-coral text-white rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        onSelectRequest={reqId => {
          navigate(`${getWorkspacePath()}?request=${reqId}`);
        }}
      />
    </>
  );
};
