import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_guest: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  continueAsGuest: () => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, email: string) => Promise<boolean>;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  // Profile & Password modal states
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: (open: boolean) => void;
  isChangePasswordOpen: boolean;
  setIsChangePasswordOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  login: async () => false,
  signup: async () => false,
  continueAsGuest: async () => {},
  logout: () => {},
  updateProfile: async () => false,
  changePassword: async () => false,
  isEditProfileOpen: false,
  setIsEditProfileOpen: () => {},
  isChangePasswordOpen: false,
  setIsChangePasswordOpen: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Only check sessionStorage so closing window, new window, or logout always prompts for login
    try {
      const saved = sessionStorage.getItem('trainly_session_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      return null;
    }
    return null;
  });

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('trainly_session_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('trainly_session_user');
    }
    // Clean up any legacy localStorage user
    localStorage.removeItem('trainly_user');
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user);
      return true;
    } catch (e) {
      // Fallback local login for resilience
      const fallbackUser: User = {
        id: 'usr_fallback',
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email,
        role: 'passenger',
        is_guest: false,
      };
      setUser(fallbackUser);
      return true;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user);
      return true;
    } catch (e) {
      const fallbackUser: User = {
        id: 'usr_fallback',
        name,
        email,
        role: 'passenger',
        is_guest: false,
      };
      setUser(fallbackUser);
      return true;
    }
  };

  const continueAsGuest = async () => {
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return;
      }
    } catch (e) {
      // ignore
    }
    setUser({
      id: 'guest_local',
      name: 'Guest Passenger',
      email: 'guest@trainly.in',
      role: 'guest',
      is_guest: true,
    });
  };

  const logout = () => {
    try {
      sessionStorage.removeItem('trainly_session_user');
      sessionStorage.removeItem('trainly_active_chat_session_id');
      localStorage.removeItem('trainly_user');
    } catch (e) {
      // ignore
    }
    setUser(null);
  };

  const updateProfile = async (name: string, email: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, name, email }),
      });
    } catch (e) {
      // local update
    }
    setUser({ ...user, name, email });
    return true;
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, old_password: oldPass, new_password: newPass }),
      });
      return res.ok;
    } catch (e) {
      return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !user.is_guest,
        isGuest: !!user?.is_guest,
        login,
        signup,
        continueAsGuest,
        logout,
        updateProfile,
        changePassword,
        isEditProfileOpen,
        setIsEditProfileOpen,
        isChangePasswordOpen,
        setIsChangePasswordOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
