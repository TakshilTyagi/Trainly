import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Moon, Sun, ChevronDown, User, Lock, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { TrainlyLogo } from './TrainlyLogo';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { user, logout, setIsEditProfileOpen, setIsChangePasswordOpen } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'RS';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full bg-white dark:bg-gray-900 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800/80 shadow-xs transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 sm:h-[70px] flex items-center justify-between relative">
        
        {/* Leftmost: Dashboard Button in the corner */}
        <div className="flex items-center z-10">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle dashboard menu"
            title={t('dashboard') || 'Dashboard'}
            className="flex items-center space-x-2 px-3 sm:px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/90 dark:bg-gray-800/90 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-gray-800 dark:text-gray-100 focus:outline-none active:scale-95 shadow-2xs cursor-pointer group"
          >
            <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-gray-900 dark:text-white">
              {t('dashboard') || 'Dashboard'}
            </span>
          </button>
        </div>

        {/* Center: Official Logo in the top bar */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-auto z-10">
          <button
            onClick={() => onNavigate('tracker')}
            className="flex items-center focus:outline-none cursor-pointer group px-3 py-1.5 rounded-2xl hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all"
            aria-label="Trainly Home"
            title="Trainly - Home"
          >
            <TrainlyLogo size="lg" className="h-9 sm:h-10 md:h-11 w-auto group-hover:scale-105 transition-transform duration-200" />
          </button>
        </div>

        {/* Rightmost: Language, Theme & Profile Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 z-10">
          
          {/* Language Selector Dropdown - High Contrast in Light & Dark Mode */}
          <LanguageSelector />

          {/* Theme Toggle Button with smooth visual indicator */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark or light theme"
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all active:scale-95 shadow-2xs focus:outline-none"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600" />
            )}
          </button>

          {/* User Profile Avatar with Chevron */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-1.5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all focus:outline-none"
              aria-label="User profile menu"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center ring-2 ring-blue-500/30 shadow-sm">
                {getInitials(user?.name)}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-150">
                {/* Identity Header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {getInitials(user?.name)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-900 dark:text-white truncate">
                      {user?.name || 'Passenger'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || 'guest@trainly.in'}
                    </p>
                    {user?.is_guest && (
                      <span className="inline-block mt-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        Guest Mode
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsEditProfileOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 flex items-center space-x-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors font-medium"
                  >
                    <User className="w-4 h-4 text-blue-500" />
                    <span>{t('edit_profile')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 flex items-center space-x-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors font-medium"
                  >
                    <Lock className="w-4 h-4 text-indigo-500" />
                    <span>{t('change_password')}</span>
                  </button>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                {/* Log Out */}
                <div className="px-2 py-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                      onNavigate('login');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors font-bold text-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('log_out')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
