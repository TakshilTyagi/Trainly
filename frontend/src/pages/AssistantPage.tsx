import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, ArrowUp, Bot, History, Plus, X, Trash2, Clock, MessageSquare, Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../api/config';

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  sessionNumber: number;
  title: string;
  chatLanguage: string; // The specific language used in this chatting session: 'EN' | 'HI' | 'TA' | 'TE' | 'ML'
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

/**
 * Detects the language actually used in the chatting of a session based on message content script.
 */
export function detectChatLanguage(messages: Message[], fallbackLanguage: string = 'EN'): string {
  const userTexts = messages.filter(m => m.sender === 'user').map(m => m.text).join(' ');
  if (!userTexts.trim()) {
    const assistantTexts = messages.filter(m => m.sender === 'assistant').map(m => m.text).join(' ');
    if (/[\u0B80-\u0BFF]/.test(assistantTexts)) return 'TA';
    if (/[\u0900-\u097F]/.test(assistantTexts)) return 'HI';
    if (/[\u0C00-\u0C7F]/.test(assistantTexts)) return 'TE';
    if (/[\u0D00-\u0D7F]/.test(assistantTexts)) return 'ML';
    return fallbackLanguage || 'EN';
  }

  if (/[\u0B80-\u0BFF]/.test(userTexts)) return 'TA';
  if (/[\u0900-\u097F]/.test(userTexts)) return 'HI';
  if (/[\u0C00-\u0C7F]/.test(userTexts)) return 'TE';
  if (/[\u0D00-\u0D7F]/.test(userTexts)) return 'ML';
  return 'EN';
}

/**
 * Generates an intelligent session title strictly in the language used in that chatting.
 * Named on the basis of what was heavily asked.
 */
export function generateSessionTitle(
  messages: Message[],
  sessionNumber: number,
  forceLanguage?: string
): string {
  const chatLang = forceLanguage || detectChatLanguage(messages, 'EN');

  const sessionWord: Record<string, string> = {
    HI: 'सत्र',
    TA: 'அமர்வு',
    TE: 'సెషన్',
    ML: 'സെഷൻ',
    EN: 'Session',
  };

  const userQueries = messages
    .filter(m => m.sender === 'user')
    .map(m => m.text.toLowerCase());

  if (userQueries.length === 0) {
    return `${sessionWord[chatLang] || 'Session'} ${sessionNumber}`;
  }

  // Frequency tracking for trains (multilingual triggers)
  const trainScores: Record<string, number> = {
    'Vande Bharat': 0,
    'Manduadih Express': 0,
    'Mumbai Rajdhani': 0,
    'Shiv Ganga Express': 0,
    'GT Express': 0,
    'Shatabdi Express': 0,
    'Kerala Express': 0,
    'Howrah Rajdhani': 0,
    'Bhopal Shatabdi': 0,
  };

  // Frequency tracking for stations (multilingual triggers)
  const stationScores: Record<string, number> = {
    'Lucknow': 0,
    'Moradabad': 0,
    'Bareilly': 0,
    'Varanasi': 0,
    'New Delhi': 0,
    'Kanpur': 0,
    'Prayagraj': 0,
    'Ayodhya': 0,
    'Kota': 0,
    'Ratlam': 0,
    'Mumbai': 0,
  };

  // Frequency tracking for operational topics (multilingual triggers)
  const topicScores: Record<string, number> = {
    'Delays & Punctuality': 0,
    'Line Clearance & Congestion': 0,
    'Speed & Telemetry': 0,
    'Arrival Time & Schedule': 0,
    'Station & Platform Info': 0,
    'Best Time to Leave': 0,
  };

  for (const q of userQueries) {
    // Trains
    if (q.includes('vande') || q.includes('22490') || q.includes('वंदे') || q.includes('வந்தே') || q.includes('వందే') || q.includes('വന്ദേ')) trainScores['Vande Bharat'] += 2;
    if (q.includes('manduadih') || q.includes('22536') || q.includes('मडुवाडीह') || q.includes('மண்டுவாடி') || q.includes('మండ్యువాడీ') || q.includes('മണ്ഡുവാഡിഹ്') || q.includes('banaras') || q.includes('बनारस')) trainScores['Manduadih Express'] += 2;
    if (q.includes('rajdhani') || q.includes('12951') || q.includes('राजधानी') || q.includes('ராஜதானி') || q.includes('రాజధాని') || q.includes('രാജധാനി')) trainScores['Mumbai Rajdhani'] += 2;
    if (q.includes('shiv ganga') || q.includes('12560') || q.includes('शिव गंगा')) trainScores['Shiv Ganga Express'] += 2;
    if (q.includes('gt') || q.includes('grand trunk') || q.includes('12615') || q.includes('जीटी')) trainScores['GT Express'] += 2;
    if (q.includes('shatabdi') || q.includes('12004') || q.includes('शताब्दी')) trainScores['Shatabdi Express'] += 2;
    if (q.includes('kerala') || q.includes('12625') || q.includes('केरल')) trainScores['Kerala Express'] += 2;
    if (q.includes('howrah') || q.includes('12301') || q.includes('हावड़ा')) trainScores['Howrah Rajdhani'] += 2;
    if (q.includes('bhopal') || q.includes('12002') || q.includes('भोपाल')) trainScores['Bhopal Shatabdi'] += 2;

    // Stations
    if (q.includes('lucknow') || q.includes('लखनऊ') || q.includes('லக்னோ') || q.includes('లక్నో') || q.includes('ലഖ്‌നൗ')) stationScores['Lucknow'] += 2;
    if (q.includes('moradabad') || q.includes('मुरादाबाद') || q.includes('மொராதாபாத்') || q.includes('మొరాదాబాద్') || q.includes('മൊറാദാബാദ്')) stationScores['Moradabad'] += 2;
    if (q.includes('bareilly') || q.includes('बरेली') || q.includes('பரேலி') || q.includes('బరేలీ') || q.includes('ബറേലി')) stationScores['Bareilly'] += 2;
    if (q.includes('varanasi') || q.includes('वाराणसी') || q.includes('வாரணாசி') || q.includes('వారణాసి') || q.includes('വാരാണസി')) stationScores['Varanasi'] += 2;
    if (q.includes('delhi') || q.includes('दिल्ली') || q.includes('டெல்லி') || q.includes('ఢిల్లీ') || q.includes('ഡൽഹി')) stationScores['New Delhi'] += 2;
    if (q.includes('kanpur') || q.includes('कानपुर') || q.includes('கான்பூர்') || q.includes('కాన్పూర్')) stationScores['Kanpur'] += 2;
    if (q.includes('prayagraj') || q.includes('allahabad') || q.includes('प्रयागराज') || q.includes('பிரயாக்ராஜ்')) stationScores['Prayagraj'] += 2;
    if (q.includes('ayodhya') || q.includes('अयोध्या') || q.includes('அயோத்தி')) stationScores['Ayodhya'] += 2;

    // Topics
    if (q.includes('delay') || q.includes('late') || q.includes('देरी') || q.includes('தாமத') || q.includes('ఆలస్య') || q.includes('వైക')) topicScores['Delays & Punctuality'] += 2;
    if (q.includes('clearance') || q.includes('signal') || q.includes('track') || q.includes('क्लीयरेंस') || q.includes('அனுமதி') || q.includes('క్లియరెన్స్') || q.includes('ക്ലിയറൻസ്')) topicScores['Line Clearance & Congestion'] += 2;
    if (q.includes('speed') || q.includes('गति') || q.includes('வேகம்') || q.includes('వేగం') || q.includes('വേഗത')) topicScores['Speed & Telemetry'] += 2;
    if (q.includes('reach') || q.includes('time') || q.includes('eta') || q.includes('समय') || q.includes('நேரம்') || q.includes('సమయం') || q.includes('സമയം') || q.includes('पहुंचेगी') || q.includes('அடையுமா')) topicScores['Arrival Time & Schedule'] += 1;
    if (q.includes('nearest') || q.includes('निकटतम') || q.includes('அருகில்') || q.includes('సమీప') || q.includes('അടുത്ത')) topicScores['Station & Platform Info'] += 2;
    if (q.includes('leave') || q.includes('best time') || q.includes('निकलने का सही समय') || q.includes('செல்ல சிறந்த நேரம்')) topicScores['Best Time to Leave'] += 2;
  }

  const topTrain = Object.entries(trainScores).sort((a, b) => b[1] - a[1])[0];
  const topStation = Object.entries(stationScores).sort((a, b) => b[1] - a[1])[0];
  const topTopic = Object.entries(topicScores).sort((a, b) => b[1] - a[1])[0];

  // Localized naming based strictly on the language used in this chatting
  const trainLabel = (tName: string): string => {
    if (tName === 'Vande Bharat') {
      if (chatLang === 'HI') return 'वंदे भारत';
      if (chatLang === 'TA') return 'வந்தே பாரத்';
      if (chatLang === 'TE') return 'వందే భారత్';
      if (chatLang === 'ML') return 'വന്ദേ ഭാരത്';
      return 'Vande Bharat';
    }
    if (tName === 'Manduadih Express') {
      if (chatLang === 'HI') return 'मडुवाडीह एक्सप्रेस';
      if (chatLang === 'TA') return 'மண்டுவாடி எக்ஸ்பிரஸ்';
      if (chatLang === 'TE') return 'మండ్యువాడీ ఎక్స్‌ప్రెస్';
      if (chatLang === 'ML') return 'മണ്ഡുവാഡിഹ് എക്സ്പ്രസ്';
      return 'Manduadih Express';
    }
    return tName;
  };

  const stationLabel = (sName: string): string => {
    if (sName === 'Lucknow') {
      if (chatLang === 'HI') return 'लखनऊ';
      if (chatLang === 'TA') return 'லக்னோ';
      if (chatLang === 'TE') return 'లక్నో';
      if (chatLang === 'ML') return 'ലഖ്‌നൗ';
      return 'Lucknow';
    }
    return sName;
  };

  const topicLabel = (tTopic: string): string => {
    if (tTopic === 'Delays & Punctuality') {
      if (chatLang === 'HI') return 'देरी और समयपालन';
      if (chatLang === 'TA') return 'தாமதம் மற்றும் நேரம்';
      if (chatLang === 'TE') return 'ఆలస్యం & సమయపాలన';
      if (chatLang === 'ML') return 'കാലതാമസ വിവരങ്ങൾ';
      return 'Delays & Punctuality';
    }
    if (tTopic === 'Line Clearance & Congestion') {
      if (chatLang === 'HI') return 'लाइन क्लियरेंस';
      if (chatLang === 'TA') return 'பாதை அனுமதி';
      if (chatLang === 'TE') return 'లైన్ క్లియరెన్స్';
      if (chatLang === 'ML') return 'ലൈൻ ക്ലിയറൻസ്';
      return 'Line Clearance & Congestion';
    }
    if (tTopic === 'Station & Platform Info') {
      if (chatLang === 'HI') return 'स्टेशन जानकारी';
      if (chatLang === 'TA') return 'நிலைய தகவல்';
      if (chatLang === 'TE') return 'స్టేషన్ సమాచారం';
      if (chatLang === 'ML') return 'സ്റ്റേഷൻ വിവരങ്ങൾ';
      return 'Station Info';
    }
    return tTopic;
  };

  const inquiryWord = chatLang === 'HI' ? 'पूछताछ' : chatLang === 'TA' ? 'விசாரணை' : chatLang === 'TE' ? 'సమాచారం' : chatLang === 'ML' ? 'വിവരം' : 'Inquiry';

  if (topTrain[1] > 0 && topStation[1] > 0) {
    return `${trainLabel(topTrain[0])} • ${stationLabel(topStation[0])} ${inquiryWord}`;
  }
  if (topTrain[1] > 0 && topTopic[1] > 0) {
    return `${trainLabel(topTrain[0])} • ${topicLabel(topTopic[0])}`;
  }
  if (topTrain[1] > 0) {
    return `${trainLabel(topTrain[0])} ${inquiryWord}`;
  }
  if (topStation[1] > 0 && topTopic[1] > 0) {
    return `${stationLabel(topStation[0])} • ${topicLabel(topTopic[0])}`;
  }
  if (topStation[1] > 0) {
    return `${stationLabel(topStation[0])} ${inquiryWord}`;
  }
  if (topTopic[1] > 0) {
    return topicLabel(topTopic[0]);
  }

  // Fallback to capitalizing the first query words in the exact language typed
  const firstQ = messages.find(m => m.sender === 'user')?.text || '';
  if (firstQ) {
    const clean = firstQ.replace(/[?.,!]/g, '').trim();
    const words = clean.split(/\s+/).slice(0, 5).join(' ');
    return words.length > 28 ? words.slice(0, 28) + '...' : words;
  }

  return `${sessionWord[chatLang] || 'Session'} ${sessionNumber}`;
}

const STORAGE_KEY_SESSIONS = 'trainly_saved_chat_sessions';
const SESSION_STORAGE_KEY_ACTIVE = 'trainly_active_chat_session_id';

export const AssistantPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const getDefaultMessages = (): Message[] => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let welcomeText = 'Welcome, ask your query.';
    if (language === 'HI') {
      welcomeText = 'स्वागत है, अपना प्रश्न पूछें।';
    } else if (language === 'TA') {
      welcomeText = 'வரவேற்கிறோம், உங்கள் கேள்வியைக் கேளுங்கள்.';
    } else if (language === 'TE') {
      welcomeText = 'స్వాగతం, మీ ప్రశ్నను అడగండి.';
    } else if (language === 'ML') {
      welcomeText = 'സ്വാഗതം, നിങ്ങളുടെ ചോദ്യം ചോദിക്കൂ.';
    }

    return [
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        text: welcomeText,
        timestamp: nowStr,
      },
    ];
  };

  // All saved sessions (persisted in localStorage)
  // Ensures any session with messages retains its true chatLanguage and title!
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        return parsed.map(s => {
          const chatLang = s.chatLanguage || detectChatLanguage(s.messages, 'EN');
          const title = s.messages.some(m => m.sender === 'user')
            ? generateSessionTitle(s.messages, s.sessionNumber, chatLang)
            : s.title;
          return {
            ...s,
            chatLanguage: chatLang,
            title,
          };
        });
      }
    } catch (e) {
      // ignore
    }
    return [];
  });

  // Current active session ID
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isRecentModalOpen, setIsRecentModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUserRef = useRef(user);

  /**
   * Helper to create a fresh session object
   */
  const createNewSessionObject = (existingList: ChatSession[]): ChatSession => {
    const maxNum = existingList.reduce((max, s) => Math.max(max, s.sessionNumber || 0), 0);
    const sessionNumber = maxNum + 1;
    const initialMsgs = getDefaultMessages();
    const id = `session_${Date.now()}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      id,
      sessionNumber,
      title: generateSessionTitle(initialMsgs, sessionNumber, language),
      chatLanguage: language,
      createdAt: nowStr,
      updatedAt: nowStr,
      messages: initialMsgs,
    };
  };

  /**
   * Initialize Session Lifecycle:
   * Whenever a window is opened fresh (or sessionStorage is empty), start a new session.
   * If sessionStorage has an active session ID and it exists in sessions, restore it.
   */
  useEffect(() => {
    const activeInSessionStorage = sessionStorage.getItem(SESSION_STORAGE_KEY_ACTIVE);

    if (activeInSessionStorage && sessions.some(s => s.id === activeInSessionStorage)) {
      setActiveSessionId(activeInSessionStorage);
    } else {
      // Window was closed/reopened or no active session in current tab -> restart fresh chat!
      const newSession = createNewSessionObject(sessions);
      const updated = [newSession, ...sessions];
      setSessions(updated);
      setActiveSessionId(newSession.id);
      sessionStorage.setItem(SESSION_STORAGE_KEY_ACTIVE, newSession.id);
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  /**
   * Restart chat when person signs out:
   * If user goes from authenticated to null (sign-out), clear active session token and start fresh.
   */
  useEffect(() => {
    if (prevUserRef.current && !user) {
      // User signed out!
      sessionStorage.removeItem(SESSION_STORAGE_KEY_ACTIVE);
      const newSession = createNewSessionObject(sessions);
      const updated = [newSession, ...sessions];
      setSessions(updated);
      setActiveSessionId(newSession.id);
      sessionStorage.setItem(SESSION_STORAGE_KEY_ACTIVE, newSession.id);
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
    prevUserRef.current = user;
  }, [user]);

  // Persist sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
      } catch (e) {
        // ignore
      }
    }
  }, [sessions]);

  // Synchronize when chat is updated from the floating tracker widget
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
        if (saved) {
          setSessions(JSON.parse(saved));
        }
        const active = sessionStorage.getItem(SESSION_STORAGE_KEY_ACTIVE);
        if (active) {
          setActiveSessionId(active);
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('trainly-chat-sync', handleSync);
    return () => window.removeEventListener('trainly-chat-sync', handleSync);
  }, []);

  // Update welcome message if user switches language on a fresh session with NO user queries yet
  useEffect(() => {
    if (currentSession && !currentSession.messages.some(m => m.sender === 'user')) {
      let welcomeText = 'Welcome, ask your query.';
      if (language === 'HI') welcomeText = 'स्वागत है, अपना प्रश्न पूछें।';
      else if (language === 'TA') welcomeText = 'வரவேற்கிறோம், உங்கள் கேள்வியைக் கேளுங்கள்.';
      else if (language === 'TE') welcomeText = 'స్వాగతం, మీ ప్రశ్నను అడగండి.';
      else if (language === 'ML') welcomeText = 'സ്വാഗതം, നിങ്ങളുടെ ചോദ്യം ചോദിക്കൂ.';

      setSessions(prev =>
        prev.map(s =>
          s.id === currentSession.id
            ? {
                ...s,
                chatLanguage: language,
                title: generateSessionTitle([{ ...s.messages[0], text: welcomeText }], s.sessionNumber, language),
                messages: [{ ...s.messages[0], text: welcomeText }],
              }
            : s
        )
      );
    }
  }, [language]);

  // Current active session
  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || sessions[0] || null;
  }, [sessions, activeSessionId]);

  const activeMessages = currentSession ? currentSession.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  /**
   * Start a brand new session manually on click
   */
  const handleStartNewSession = () => {
    const newSession = createNewSessionObject(sessions);
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newSession.id);
    sessionStorage.setItem(SESSION_STORAGE_KEY_ACTIVE, newSession.id);
    setIsRecentModalOpen(false);
  };

  /**
   * Select a session from the Recent list
   */
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    sessionStorage.setItem(SESSION_STORAGE_KEY_ACTIVE, sessionId);
    setIsRecentModalOpen(false);
  };

  /**
   * Delete a session from history
   */
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== sessionId);
    setSessions(filtered);
    if (activeSessionId === sessionId) {
      if (filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
        sessionStorage.setItem(SESSION_STORAGE_KEY_ACTIVE, filtered[0].id);
      } else {
        const newSession = createNewSessionObject([]);
        setSessions([newSession]);
        setActiveSessionId(newSession.id);
        sessionStorage.setItem(SESSION_STORAGE_KEY_ACTIVE, newSession.id);
      }
    }
  };

  /**
   * Send message in the current session (multilingual grounded chat)
   */
  const handleSend = async (queryText?: string) => {
    const query = queryText || inputText;
    if (!query.trim() || !currentSession) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: timeStr,
    };

    const newMessagesWithUser = [...currentSession.messages, userMsg];
    // Detect the exact language used in this chatting session:
    const sessionChatLanguage = detectChatLanguage(newMessagesWithUser, language);
    // Generate and save name in the language of this chatting:
    const newTitle = generateSessionTitle(newMessagesWithUser, currentSession.sessionNumber, sessionChatLanguage);

    // Update active session immediately with user message, detected chat language, and title
    setSessions(prev =>
      prev.map(s =>
        s.id === currentSession.id
          ? {
              ...s,
              title: newTitle,
              chatLanguage: sessionChatLanguage,
              updatedAt: timeStr,
              messages: newMessagesWithUser,
            }
          : s
      )
    );

    if (!queryText) setInputText('');
    setIsSending(true);

    try {
      const res = await fetch(apiUrl('/api/assistant/query'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          active_train_no: '22490',
          lang: language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: Message = {
          id: `ast_${Date.now()}`,
          sender: 'assistant',
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setSessions(prev =>
          prev.map(s =>
            s.id === currentSession.id
              ? {
                  ...s,
                  updatedAt: assistantMsg.timestamp,
                  messages: [...s.messages, assistantMsg],
                }
              : s
          )
        );
      } else {
        throw new Error('Assistant API error');
      }
    } catch (e) {
      const errorMessages: Record<string, string> = {
        HI: 'लाइव टेलीमेट्री सिग्नल जांच विफल। कृपया कुछ सेकंड में पुनः प्रयास करें।',
        TA: 'நேரடி தொலை அளவியல் சிக்னல் சரிபார்ப்பு தோல்வியடைந்தது. சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.',
        TE: 'ప్రత్యక్ష టెలిమెట్రీ సిగ్నల్ తనిఖీ విఫలమైంది. దయచేసి కాసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.',
        ML: 'ടെലിമെട്രി സിഗ്നൽ പരിശോധന പരാജയപ്പെട്ടു. ദയവായി കുറച്ച് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.',
        EN: 'Live telemetry signal check failed. Please retry in a few seconds.',
      };

      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: errorMessages[language] || errorMessages['EN'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessions(prev =>
        prev.map(s =>
          s.id === currentSession.id
            ? { ...s, messages: [...s.messages, errorMsg] }
            : s
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  // Multilingual quick chips: query is in the selected interface language!
  const quickChips = [
    { label: t('quick_vande_lucknow'), query: t('quick_vande_lucknow') },
    { label: t('quick_manduadih'), query: t('quick_manduadih') },
    { label: t('quick_why_late'), query: t('quick_why_late') },
    { label: t('quick_nearest'), query: t('quick_nearest') },
    { label: t('quick_best_time'), query: t('quick_best_time') },
  ];

  // Localized UI strings for current interface
  const recentButtonLabel = language === 'HI' ? 'हालिया' : language === 'TA' ? 'சமீபத்தியவை' : language === 'TE' ? 'ఇటీవలివి' : language === 'ML' ? 'സമീപകാലം' : 'Recent';
  const newChatButtonLabel = language === 'HI' ? 'नई चैट' : language === 'TA' ? 'புதிய உரையாடல்' : language === 'TE' ? 'కొత్త చాట్' : language === 'ML' ? 'പുതിയ ചാറ്റ്' : 'New Chat';
  const activeLabel = language === 'HI' ? 'सक्रिय' : language === 'TA' ? 'செயலில்' : language === 'TE' ? 'క్రియాశీల' : language === 'ML' ? 'സജീവം' : 'Active';

  const loadingMessages: Record<string, string> = {
    HI: 'लाइव टेलीमेट्री और एमएल क्वांटाइल जांच चल रही है...',
    TA: 'நேரடி தொலை அளவியல் மற்றும் ML மதிப்பீடு இயங்குகிறது...',
    TE: 'ప్రత్యక్ష టెలిమెట్రీ మరియు ML విశ్లేషణ నడుస్తోంది...',
    ML: 'തത്സമയ ടെലിമെട്രി, ML പരിശോധന നടക്കുന്നു...',
    EN: 'Running live telemetry tool execution & ML quantile check...',
  };

  const languageLabels: Record<string, { name: string; badge: string }> = {
    EN: { name: 'English', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 border-blue-200 dark:border-blue-800' },
    HI: { name: 'हिन्दी', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    TA: { name: 'தமிழ்', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    TE: { name: 'తెలుగు', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    ML: { name: 'മലയാളം', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  };

  const sessionWordMap: Record<string, string> = {
    EN: 'Session',
    HI: 'सत्र',
    TA: 'அமர்வு',
    TE: 'సెషన్',
    ML: 'സെഷൻ',
  };

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-5 flex flex-col h-[calc(100vh-4.5rem)]">
      
      {/* 1. Page Title Header with Centered "Ask Anything..." bar directly below */}
      <div className="w-full text-center py-2 sm:py-3 relative shrink-0">
        <div className="absolute inset-0 max-w-xl mx-auto bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-amber-500/15 dark:from-purple-500/25 dark:via-pink-500/25 dark:to-amber-500/25 blur-3xl rounded-full pointer-events-none -z-10" />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 bg-clip-text text-transparent pb-1">
          {t('nav_assistant')}
        </h1>

        {/* Centered 'Ask anything about any train, station or line clearance' Bar */}
        <div className="mt-2.5 flex items-center justify-center">
          <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200/80 dark:border-blue-800/60 shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
              {t('ask_anything')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Full-Page Chat Container */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden w-full mt-3">
        
        {/* Top Chat Action Strip: Active Session Name, Recent Button, New Chat Button */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/70 dark:bg-gray-900/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 flex items-center space-x-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>{sessionWordMap[currentSession?.chatLanguage || language] || 'Session'} {currentSession?.sessionNumber || 1}</span>
            </span>

            {/* Language Tag of this specific chatting */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${
              languageLabels[currentSession?.chatLanguage || language]?.badge || languageLabels['EN'].badge
            }`}>
              {languageLabels[currentSession?.chatLanguage || language]?.name || 'English'}
            </span>

            <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[280px] sm:max-w-md">
              {currentSession?.title || `${sessionWordMap[currentSession?.chatLanguage || language] || 'Session'} ${currentSession?.sessionNumber || 1}`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Recent Sessions Button */}
            <button
              onClick={() => setIsRecentModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="View recent session chats"
            >
              <History className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>{recentButtonLabel}</span>
              {sessions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300">
                  {sessions.length}
                </span>
              )}
            </button>

            {/* New Chat Button */}
            <button
              onClick={handleStartNewSession}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
              title="Start a fresh chat session"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{newChatButtonLabel}</span>
            </button>
          </div>
        </div>

        {/* Full-Page Messages Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 w-full">
          {activeMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {isUser ? (
                  <div className="max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl rounded-tr-xs px-5 py-3 text-sm sm:text-base font-medium shadow-sm shadow-blue-500/20 leading-relaxed">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="block text-[10px] text-blue-200 mt-1 text-right font-normal">
                      {msg.timestamp}
                    </span>
                  </div>
                ) : (
                  <div className="max-w-[92%] sm:max-w-[85%] lg:max-w-[75%] bg-gray-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 rounded-3xl rounded-tl-xs px-5 py-3.5 text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-relaxed font-normal shadow-2xs">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="block text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-left font-normal">
                      {msg.timestamp}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center space-x-2.5 text-xs sm:text-sm text-blue-600 dark:text-cyan-400 py-2 pl-11">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
              <span className="font-semibold animate-pulse">
                {loadingMessages[language] || loadingMessages['EN']}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Bar: Quick Chips & Full-Width Input */}
        <div className="shrink-0 p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">
          {/* Quick Suggestion Chips in current interface language */}
          <div className="flex flex-wrap gap-2">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.query)}
                className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-cyan-400 transition-all shadow-2xs hover:scale-102 active:scale-95 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Full-Width Input Bar */}
          <div className="relative flex items-center w-full">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={t('ask_placeholder')}
              className="w-full pl-5 pr-14 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isSending}
              aria-label="Send query"
              className="absolute right-2.5 w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

      {/* 3. History / Recent Sessions Modal */}
      {isRecentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {language === 'HI' ? 'हालिया चैट सत्र (इतिहास)' : language === 'TA' ? 'சமீபத்திய அரட்டை வரலாறு' : language === 'TE' ? 'ఇటీవలి చాట్ చరిత్ర' : language === 'ML' ? 'സമീപകാല ചാറ്റ് ഹിസ്റ്ററി' : 'Recent Chat History'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'HI' ? 'चैटिंग की भाषा में ही नाम सुरक्षित और प्रदर्शित होता है' : language === 'TA' ? 'உரையாடிய மொழியிலேயே அமர்வின் பெயர் சேமிக்கப்பட்டு காட்டப்படும்' : language === 'TE' ? 'చాటింగ్ చేసిన భాషలోనే పేరు భద్రపరచబడి ప్రదర్శించబడుతుంది' : language === 'ML' ? 'ചാറ്റ് ചെയ്ത ഭാഷയിൽ തന്നെ പേര് സംരക്ഷിക്കപ്പെടുന്നു' : 'Each chat is named and displayed in the language it was conducted in'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRecentModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">
                    {language === 'HI' ? 'कोई पूर्व सत्र उपलब्ध नहीं है।' : language === 'TA' ? 'முந்தைய அமர்வுகள் எதுவும் இல்லை.' : language === 'TE' ? 'గత చాట్ సెషన్‌లు ఏవీ లేవు.' : language === 'ML' ? 'മുൻകാല സെഷനുകൾ ലഭ്യമല്ല.' : 'No past chat sessions yet.'}
                  </p>
                </div>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.id === currentSession?.id;
                  const userQCount = sess.messages.filter(m => m.sender === 'user').length;
                  const chatLang = sess.chatLanguage || detectChatLanguage(sess.messages, 'EN');
                  const sessionPrefix = sessionWordMap[chatLang] || 'Session';
                  const langConfig = languageLabels[chatLang] || languageLabels['EN'];

                  const qWord = chatLang === 'HI' ? 'प्रश्न' : chatLang === 'TA' ? 'கேள்விகள்' : chatLang === 'TE' ? 'ప్రశ్నలు' : chatLang === 'ML' ? 'ചോദ്യങ്ങൾ' : (userQCount === 1 ? 'query' : 'queries');

                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs'
                          : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5 min-w-0 flex-1 pr-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:text-blue-600'
                        }`}>
                          <MessageSquare className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            {/* Session Word in that session's chat language */}
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              {sessionPrefix} {sess.sessionNumber}
                            </span>

                            {/* Chat Language Badge for this session */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${langConfig.badge}`}>
                              {langConfig.name}
                            </span>

                            {isActive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>{activeLabel}</span>
                              </span>
                            )}
                          </div>

                          {/* Chat Name: Strictly in the language used during that chat! */}
                          <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-1.5 truncate">
                            {sess.title}
                          </h4>

                          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                            <span>{sess.createdAt}</span>
                            <span>•</span>
                            <span>{userQCount} {qWord}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={(e) => handleDeleteSession(e, sess.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 flex items-center justify-between">
              <button
                onClick={handleStartNewSession}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{newChatButtonLabel}</span>
              </button>

              <button
                onClick={() => setIsRecentModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer"
              >
                {language === 'HI' ? 'बंद करें' : language === 'TA' ? 'மூடு' : language === 'TE' ? 'మూసివేయి' : language === 'ML' ? 'അടയ്ക്കുക' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
