import React from 'react';
import { X, Navigation, Train, MessageSquare, AlertCircle, LayoutDashboard, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { TrainlyLogo } from './TrainlyLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
}) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'tracker', label: t('nav_tracker'), icon: Navigation },
    { id: 'fleet', label: t('nav_fleet'), icon: Train },
    { id: 'assistant', label: t('nav_assistant'), icon: MessageSquare },
    { id: 'safety', label: t('nav_safety') || 'Safety', icon: Shield },
    { id: 'feedback', label: t('nav_feedback'), icon: AlertCircle },
    { id: 'control-room', label: t('nav_control_room'), icon: LayoutDashboard },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <aside className="relative w-72 max-w-[80vw] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col h-full z-10 transition-transform duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <TrainlyLogo size="sm" />
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors text-left ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer: BUILT BY INNOBHARAT */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
            {t('built_by_innobharat')}
          </p>
        </div>

      </aside>
    </div>
  );
};
