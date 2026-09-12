import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  chatLanguage: string; // 'EN' | 'HI' | 'TA' | 'TE' | 'ML'
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export const STORAGE_KEY_SESSIONS = 'trainly_saved_chat_sessions';
export const SESSION_STORAGE_KEY_ACTIVE = 'trainly_active_chat_session_id';

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

  const topicScores: Record<string, number> = {
    'Delays & Punctuality': 0,
    'Line Clearance & Congestion': 0,
    'Speed & Telemetry': 0,
    'Arrival Time & Schedule': 0,
    'Station & Platform Info': 0,
    'Best Time to Leave': 0,
  };

  for (const q of userQueries) {
    if (q.includes('vande') || q.includes('22490') || q.includes('वंदे') || q.includes('வந்தே') || q.includes('వందే') || q.includes('വന്ദേ')) trainScores['Vande Bharat'] += 2;
    if (q.includes('manduadih') || q.includes('22536') || q.includes('मडुवाडीह') || q.includes('மண்டுவாடி') || q.includes('మండ్యువాడీ') || q.includes('മണ്ഡുവാഡിഹ്') || q.includes('banaras') || q.includes('बनारस')) trainScores['Manduadih Express'] += 2;
    if (q.includes('rajdhani') || q.includes('12951') || q.includes('राजधानी') || q.includes('ராஜதானி') || q.includes('రాజధాని') || q.includes('രാജധാനി')) trainScores['Mumbai Rajdhani'] += 2;
    if (q.includes('shiv ganga') || q.includes('12560') || q.includes('शिव गंगा')) trainScores['Shiv Ganga Express'] += 2;
    if (q.includes('gt') || q.includes('grand trunk') || q.includes('12615') || q.includes('जीटी')) trainScores['GT Express'] += 2;
    if (q.includes('shatabdi') || q.includes('12004') || q.includes('शताब्दी')) trainScores['Shatabdi Express'] += 2;
    if (q.includes('kerala') || q.includes('12625') || q.includes('केरल')) trainScores['Kerala Express'] += 2;
    if (q.includes('howrah') || q.includes('12301') || q.includes('हावड़ा')) trainScores['Howrah Rajdhani'] += 2;
    if (q.includes('bhopal') || q.includes('12002') || q.includes('भोपाल')) trainScores['Bhopal Shatabdi'] += 2;

    if (q.includes('lucknow') || q.includes('लखनऊ') || q.includes('லக்னோ') || q.includes('లక్నో') || q.includes('ലഖ്‌നൗ')) stationScores['Lucknow'] += 2;
    if (q.includes('moradabad') || q.includes('मुरादाबाद') || q.includes('மொராதாபாத்') || q.includes('మొరాదాబాద్') || q.includes('മൊറാദാബാദ്')) stationScores['Moradabad'] += 2;
    if (q.includes('bareilly') || q.includes('बरेली') || q.includes('பரேலி') || q.includes('బరేలీ') || q.includes('ബറേലി')) stationScores['Bareilly'] += 2;
    if (q.includes('varanasi') || q.includes('वाराणसी') || q.includes('வாரணாசி') || q.includes('వారణాసి') || q.includes('വാരാണസി')) stationScores['Varanasi'] += 2;
    if (q.includes('delhi') || q.includes('दिल्ली') || q.includes('டெல்லி') || q.includes('ఢిల్లీ') || q.includes('ഡൽഹി')) stationScores['New Delhi'] += 2;
    if (q.includes('kanpur') || q.includes('कानपुर') || q.includes('கான்பூர்') || q.includes('కాన్పూర్')) stationScores['Kanpur'] += 2;
    if (q.includes('prayagraj') || q.includes('allahabad') || q.includes('प्रयागराज') || q.includes('பிரயாக்ராஜ்')) stationScores['Prayagraj'] += 2;
    if (q.includes('ayodhya') || q.includes('अयोध्या') || q.includes('அயோத்தி')) stationScores['Ayodhya'] += 2;

    if (q.includes('delay') || q.includes('late') || q.includes('देरी') || q.includes('தாமத') || q.includes('ఆలస్య') || q.includes('വൈക')) topicScores['Delays & Punctuality'] += 2;
    if (q.includes('clearance') || q.includes('signal') || q.includes('track') || q.includes('क्लीयरेंस') || q.includes('அனுமதி') || q.includes('క్లియరెన్స్') || q.includes('ക്ലിയറൻസ്')) topicScores['Line Clearance & Congestion'] += 2;
    if (q.includes('speed') || q.includes('गति') || q.includes('வேகம்') || q.includes('వేగం') || q.includes('വേഗത')) topicScores['Speed & Telemetry'] += 2;
    if (q.includes('reach') || q.includes('time') || q.includes('eta') || q.includes('समय') || q.includes('நேரம்') || q.includes('సమయం') || q.includes('സമയം') || q.includes('पहुंचेगी') || q.includes('அடையுமா')) topicScores['Arrival Time & Schedule'] += 1;
    if (q.includes('nearest') || q.includes('निकटतम') || q.includes('அருகில்') || q.includes('సమీప') || q.includes('അടുത്ത')) topicScores['Station & Platform Info'] += 2;
    if (q.includes('leave') || q.includes('best time') || q.includes('निकलने का सही समय') || q.includes('செல்ல சிறந்த நேரம்')) topicScores['Best Time to Leave'] += 2;
  }

  const topTrain = Object.entries(trainScores).sort((a, b) => b[1] - a[1])[0];
  const topStation = Object.entries(stationScores).sort((a, b) => b[1] - a[1])[0];
  const topTopic = Object.entries(topicScores).sort((a, b) => b[1] - a[1])[0];

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

  const firstQ = messages.find(m => m.sender === 'user')?.text || '';
  if (firstQ) {
    const clean = firstQ.replace(/[?.,!]/g, '').trim();
    const words = clean.split(/\s+/).slice(0, 5).join(' ');
    return words.length > 28 ? words.slice(0, 28) + '...' : words;
  }

  return `${sessionWord[chatLang] || 'Session'} ${sessionNumber}`;
}

export function useChatAssistant(defaultTrainNo?: string) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  const getDefaultMessages = useCallback((): Message[] => {
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
  }, [language]);

  const createNewSessionObject = useCallback((existingList: ChatSession[]): ChatSession => {
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
  }, [getDefaultMessages, language]);

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

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessionStorage.getItem(SESSION_STORAGE_KEY_ACTIVE) || '';
  });

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const prevUserRef = useRef(user);

  // Initialize or restore active session
  useEffect(() => {
    const activeInSessionStorage = sessionStorage.getItem(SESSION_STORAGE_KEY_ACTIVE);
    if (activeInSessionStorage && sessions.some(s => s.id === activeInSessionStorage)) {
      setActiveSessionId(activeInSessionStorage);
    } else if (sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
      sessionStorage.setItem(SESSION_STORAGE_KEY_ACTIVE, sessions[0].id);
    } else {
      const newSession = createNewSessionObject([]);
      const updated = [newSession];
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

  // Handle logout
  useEffect(() => {
    if (prevUserRef.current && !user) {
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
  }, [user, createNewSessionObject, sessions]);

  // Persist sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
      } catch (e) {
        // ignore
      }
    }
  }, [sessions]);

  // Listen for sync events between multiple components (e.g. Floating widget & Assistant page)
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
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('trainly-chat-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || sessions[0] || null;
  }, [sessions, activeSessionId]);

  const activeMessages = currentSession ? currentSession.messages : [];

  const handleStartNewSession = useCallback(() => {
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
    window.dispatchEvent(new CustomEvent('trainly-chat-sync'));
  }, [createNewSessionObject, sessions]);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    sessionStorage.setItem(SESSION_STORAGE_KEY_ACTIVE, sessionId);
    window.dispatchEvent(new CustomEvent('trainly-chat-sync'));
  }, []);

  const handleDeleteSession = useCallback((e: React.MouseEvent, sessionId: string) => {
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
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(filtered));
    } catch (err) {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('trainly-chat-sync'));
  }, [activeSessionId, createNewSessionObject, sessions]);

  const handleSend = useCallback(async (queryText?: string, overrideTrainNo?: string) => {
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
    const sessionChatLanguage = detectChatLanguage(newMessagesWithUser, language);
    const newTitle = generateSessionTitle(newMessagesWithUser, currentSession.sessionNumber, sessionChatLanguage);

    const updatedSessions = sessions.map(s =>
      s.id === currentSession.id
        ? {
            ...s,
            title: newTitle,
            chatLanguage: sessionChatLanguage,
            updatedAt: timeStr,
            messages: newMessagesWithUser,
          }
        : s
    );

    setSessions(updatedSessions);
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updatedSessions));
    } catch (e) {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('trainly-chat-sync'));

    if (!queryText) setInputText('');
    setIsSending(true);

    try {
      const res = await fetch(apiUrl('/api/assistant/query'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          active_train_no: overrideTrainNo || defaultTrainNo || null,
          user_lat: userLoc?.lat,
          user_lon: userLoc?.lon,
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

        setSessions(prev => {
          const finalSessions = prev.map(s =>
            s.id === currentSession.id
              ? {
                  ...s,
                  updatedAt: assistantMsg.timestamp,
                  messages: [...s.messages, assistantMsg],
                }
              : s
          );
          try {
            localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(finalSessions));
          } catch (e) {
            // ignore
          }
          window.dispatchEvent(new CustomEvent('trainly-chat-sync'));
          return finalSessions;
        });
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

      setSessions(prev => {
        const finalSessions = prev.map(s =>
          s.id === currentSession.id
            ? { ...s, messages: [...s.messages, errorMsg] }
            : s
        );
        try {
          localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(finalSessions));
        } catch (err) {
          // ignore
        }
        window.dispatchEvent(new CustomEvent('trainly-chat-sync'));
        return finalSessions;
      });
    } finally {
      setIsSending(false);
    }
  }, [currentSession, defaultTrainNo, inputText, language, sessions]);

  return {
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    currentSession,
    activeMessages,
    inputText,
    setInputText,
    isSending,
    handleSend,
    handleStartNewSession,
    handleSelectSession,
    handleDeleteSession,
  };
}
