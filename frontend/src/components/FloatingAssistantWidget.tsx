import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  X,
  Maximize2,
  Plus
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useChatAssistant } from '../hooks/useChatAssistant';

interface FloatingAssistantWidgetProps {
  activeTrainNo?: string;
  trainName?: string;
  onNavigate?: (page: string) => void;
}

export const FloatingAssistantWidget: React.FC<FloatingAssistantWidgetProps> = ({
  activeTrainNo,
  trainName,
  onNavigate,
}) => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    activeMessages,
    inputText,
    setInputText,
    isSending,
    handleSend,
    handleStartNewSession,
  } = useChatAssistant(activeTrainNo);

  // Auto-scroll messages inside the mini panel
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleExpandToFullAssistant = () => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate('assistant');
    } else {
      window.dispatchEvent(new CustomEvent('navigate-page', { detail: 'assistant' }));
    }
  };

  // Universal multilingual quick suggestion chips
  const quickChips = [
    { label: t('quick_vande_lucknow'), query: t('quick_vande_lucknow') },
    { label: t('quick_manduadih'), query: t('quick_manduadih') },
    {
      label: language === 'HI' ? '12951 राजधानी स्थिति' :
             language === 'TA' ? '12951 ராஜதானி நிலை' :
             language === 'TE' ? '12951 రాజధాని స్థితి' :
             language === 'ML' ? '12951 രാജധാനി നില' :
             '12951 Rajdhani Status',
      query: language === 'HI' ? '12951 मुंबई राजधानी की स्थिति क्या है?' :
             language === 'TA' ? '12951 மும்பை ராஜதானி நிலை என்ன?' :
             language === 'TE' ? '12951 ముంబై రాజధాని స్థితి ఏమిటి?' :
             language === 'ML' ? '12951 മുംബൈ രാജധാനി നില എന്താണ്?' :
             'What is the status of 12951 Mumbai Rajdhani?'
    },
    {
      label: language === 'HI' ? 'ट्रेनों में देरी के कारण' :
             language === 'TA' ? 'ரயில் தாமத காரணங்கள்' :
             language === 'TE' ? 'రైలు ఆలస్య కారణాలు' :
             language === 'ML' ? 'വൈകുന്നതിനുള്ള കാരണങ്ങൾ' :
             'Why are trains delayed?',
      query: language === 'HI' ? 'ट्रेनों में देरी के मुख्य कारण क्या हैं?' :
             language === 'TA' ? 'ரயில்கள் தாமதமாவதற்கு காரணங்கள் என்ன?' :
             language === 'TE' ? 'రైళ్లు ఆలస్యం కావడానికి కారణాలు ఏమిటి?' :
             language === 'ML' ? 'ട്രെയിനുകൾ വൈകുന്നതിന് കാരണങ്ങൾ എന്തൊക്കെയാണ്?' :
             'Why are trains delayed across the network?'
    },
  ];

  const loadingMessages: Record<string, string> = {
    HI: 'लाइव टेलीमेट्री जांच चल रही है...',
    TA: 'நேரடி தொலை அளவியல் மதிப்பீடு...',
    TE: 'లైవ్ టెలిమెట్రీ విశ్లేషణ...',
    ML: 'തത്സമയ ടെലിമെട്രി പരിശോധന...',
    EN: 'Checking live telemetry & ML forecast...',
  };

  return (
    <>
      {/* 1. Mini Chat Panel (Anchored directly above the floating bubble) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Trainly AI Assistant Mini Chat"
          className="fixed bottom-20 right-4 sm:right-6 z-50 w-[360px] sm:w-[410px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6.5rem)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl border border-gray-200/90 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 select-none"
        >
          {/* Top Bar / Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/90 bg-gray-50/80 dark:bg-gray-900/80 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {/* User Avatar Logo replacing the AI symbol in the header */}
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-xs border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800 flex items-center justify-center p-0.5">
                <img
                  src="/ai-avatar.png"
                  alt="AI Assistant"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate">
                    {t('nav_assistant')}
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                </div>
                {/* Universal Railway Tagline (no train pre-selected) */}
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-medium">
                  {trainName && activeTrainNo ? `${activeTrainNo} • ${trainName}` : (
                    language === 'HI' ? 'यूनिवर्सल रेलवे एआई • कोई भी ट्रेन पूछें' :
                    language === 'TA' ? 'உலகளாவிய AI • எந்த ரயிலையும் கேளுங்கள்' :
                    language === 'TE' ? 'యూనివర్సల్ AI • ఏదైనా రైలు గురించి అడగండి' :
                    language === 'ML' ? 'സാർവത്രിക AI • ഏത് ട്രെയിനും ചോദിക്കാം' :
                    'Universal Railways AI • Ask about any train'
                  )}
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center space-x-1 shrink-0">
              {/* New Chat */}
              <button
                onClick={handleStartNewSession}
                aria-label="Start new chat"
                title={language === 'HI' ? 'नई चैट' : 'New Chat'}
                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Expand to Full Page */}
              <button
                onClick={handleExpandToFullAssistant}
                aria-label="Expand to full Assistant page"
                title="Expand to full Assistant page"
                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Close / Minimize */}
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                title="Close"
                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Messages Thread (Independent scroll) */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
            {activeMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mt-0.5 shadow-2xs border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800 flex items-center justify-center p-0.5">
                      <img
                        src="/ai-avatar.png"
                        alt="AI"
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                  )}

                  {isUser ? (
                    <div className="max-w-[82%] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs sm:text-sm font-medium shadow-2xs leading-relaxed">
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className="block text-[9px] text-blue-200 mt-0.5 text-right font-normal">
                        {msg.timestamp}
                      </span>
                    </div>
                  ) : (
                    <div className="max-w-[88%] bg-gray-50 dark:bg-gray-800/90 border border-gray-200/70 dark:border-gray-700/70 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-gray-900 dark:text-gray-100 text-xs sm:text-sm leading-relaxed font-normal shadow-2xs">
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className="block text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 text-left font-normal">
                        {msg.timestamp}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-cyan-400 py-1.5 pl-8">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
                <span className="font-semibold animate-pulse text-[11px]">
                  {loadingMessages[language] || loadingMessages['EN']}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Controls: Quick Chips + Message Input */}
          <div className="shrink-0 p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-2">
            {/* Contextual Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-0.5 max-h-16">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(chip.query)}
                  className="px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-cyan-400 transition-all shadow-2xs hover:scale-102 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="relative flex items-center w-full">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder={t('ask_placeholder')}
                className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isSending}
                aria-label="Send message"
                className="absolute right-1.5 w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer active:scale-95"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Chat Bubble / Logo Button (Fixed in bottom-right corner, smaller in size) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
          className="relative group w-11 h-11 sm:w-12 sm:h-12 rounded-full p-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-lg shadow-black/15 border border-gray-200/90 dark:border-gray-700/90 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-3 focus:ring-blue-500/30 flex items-center justify-center"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 opacity-20 blur-xs group-hover:opacity-40 transition-opacity duration-300" />

          {/* Active Status Beacon */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-gray-900" />
          </span>

          {/* User Provided Avatar Logo / Close Indicator */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {isOpen ? (
              <div className="w-full h-full rounded-full bg-gray-900/90 dark:bg-gray-700/90 text-white flex items-center justify-center transition-all animate-in fade-in duration-150">
                <X className="w-4 h-4" />
              </div>
            ) : (
              <img
                src="/ai-avatar.png"
                alt="AI Assistant"
                className="w-full h-full object-contain rounded-full select-none drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
              />
            )}
          </div>

          {/* Tooltip on Hover (When Closed) */}
          {!isOpen && (
            <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-md text-white text-xs font-semibold py-1 px-2.5 rounded-lg shadow-lg border border-gray-700/60 flex items-center space-x-1.5">
              <img src="/ai-avatar.png" alt="" className="w-3.5 h-3.5 object-contain rounded-full" />
              <span>{t('nav_assistant')}</span>
            </div>
          )}
        </button>
      </div>
    </>
  );
};
