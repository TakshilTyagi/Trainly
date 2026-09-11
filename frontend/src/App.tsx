import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EditProfileModal, ChangePasswordModal } from './components/Modals';

import { LoginPage } from './pages/LoginPage';
import { TrackerPage } from './pages/TrackerPage';
import { FleetPage } from './pages/FleetPage';
import { AssistantPage } from './pages/AssistantPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ControlRoomPage } from './pages/ControlRoomPage';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>(user ? 'tracker' : 'login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTrainNo, setActiveTrainNo] = useState('22490');

  // If user logs out or session is empty, immediately show login page
  React.useEffect(() => {
    if (!user) {
      setCurrentPage('login');
    }
  }, [user]);

  // If user logs out, go to login page
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Support custom event navigation across floating widgets
  React.useEffect(() => {
    const handleCustomNav = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        handleNavigate(customEvent.detail);
      }
    };
    window.addEventListener('navigate-page', handleCustomNav);
    return () => window.removeEventListener('navigate-page', handleCustomNav);
  }, []);

  const handleSelectTrainFromFleet = (trainNo: string) => {
    setActiveTrainNo(trainNo);
    setCurrentPage('tracker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If on login page, render login full screen
  if (currentPage === 'login' || !user) {
    return (
      <>
        <LoginPage
          onSuccess={() => {
            setCurrentPage('tracker');
          }}
        />
        <EditProfileModal />
        <ChangePasswordModal />
      </>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 flex flex-col transition-colors relative overflow-x-hidden">
      {/* Aesthetic Vibrant Ambient Background Hues */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Sky/Cyan Aura - Top Left */}
        <div className="absolute -top-28 -left-28 w-[520px] h-[520px] bg-gradient-to-br from-sky-400/28 to-cyan-500/24 dark:from-sky-500/25 dark:to-cyan-400/20 rounded-full blur-[85px]" />
        {/* Indigo/Violet Aura - Top Right */}
        <div className="absolute -top-28 -right-28 w-[520px] h-[520px] bg-gradient-to-bl from-indigo-500/28 via-purple-500/24 to-pink-500/20 dark:from-indigo-600/30 dark:via-purple-600/28 dark:to-pink-600/22 rounded-full blur-[85px]" />
        {/* Warm Sunset Rose/Amber Glow - Center */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-gradient-to-r from-rose-400/18 via-fuchsia-400/15 to-amber-400/18 dark:from-rose-600/18 dark:via-purple-700/20 dark:to-amber-500/16 rounded-full blur-[100px]" />
        {/* Emerald/Mint Glow - Bottom Right */}
        <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-400/22 to-teal-400/20 dark:from-emerald-500/20 dark:to-teal-500/18 rounded-full blur-[85px]" />
      </div>

      {/* Persistent Header on every page */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(true)}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      {/* Collapsible Sliding Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-16 sm:pt-[70px] pb-16">
        {currentPage === 'tracker' && (
          <TrackerPage
            key={activeTrainNo}
            initialTrain={activeTrainNo}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'fleet' && <FleetPage onSelectTrain={handleSelectTrainFromFleet} />}
        {currentPage === 'assistant' && <AssistantPage />}
        {currentPage === 'feedback' && <FeedbackPage />}
        {currentPage === 'control-room' && <ControlRoomPage onSelectTrain={handleSelectTrainFromFleet} />}
      </main>

      {/* Edit Profile and Password Modals */}
      <EditProfileModal />
      <ChangePasswordModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
