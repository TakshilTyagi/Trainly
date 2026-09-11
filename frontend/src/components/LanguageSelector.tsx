import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useLanguage, LANGUAGES, type Language } from '../context/LanguageContext';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  className = '',
}) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select application language"
        className={`flex items-center space-x-2 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all cursor-pointer select-none active:scale-98 ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm font-extrabold'
        }`}
      >
        <Globe className={`shrink-0 text-blue-600 dark:text-blue-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
        <span className="font-extrabold tracking-tight">
          {currentLang.nativeName} ({currentLang.code})
        </span>
        <ChevronDown
          className={`shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            compact ? 'w-3.5 h-3.5' : 'w-4 h-4'
          } ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu - 100% Solid & High-Contrast in both Light and Dark modes */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Language options"
          className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Select Language
            </span>
          </div>

          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => {
                  setLanguage(lang.code as Language);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black'
                    : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold'
                }`}
              >
                <div className="flex flex-col">
                  <span className="leading-snug">{lang.nativeName}</span>
                  <span className="text-[10px] opacity-70 font-normal">{lang.label} ({lang.code})</span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
