import React, { useState } from 'react';
import { X, Check, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const EditProfileModal: React.FC = () => {
  const { user, isEditProfileOpen, setIsEditProfileOpen, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);

  if (!isEditProfileOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(name, email);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsEditProfileOpen(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsEditProfileOpen(false)} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2 font-semibold text-gray-900 dark:text-white">
            <User className="w-5 h-5 text-blue-600" />
            <span>{t('edit_profile')}</span>
          </div>
          <button onClick={() => setIsEditProfileOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t('full_name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors flex items-center space-x-1"
            >
              {saved ? <Check className="w-4 h-4" /> : null}
              <span>{saved ? 'Saved' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ChangePasswordModal: React.FC = () => {
  const { isChangePasswordOpen, setIsChangePasswordOpen, changePassword } = useAuth();
  const { t } = useLanguage();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isChangePasswordOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await changePassword(oldPass, newPass);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsChangePasswordOpen(false);
      setOldPass('');
      setNewPass('');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsChangePasswordOpen(false)} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2 font-semibold text-gray-900 dark:text-white">
            <Lock className="w-5 h-5 text-blue-600" />
            <span>{t('change_password')}</span>
          </div>
          <button onClick={() => setIsChangePasswordOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              placeholder="Enter current password"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Enter new password"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors flex items-center space-x-1"
            >
              {saved ? <Check className="w-4 h-4" /> : null}
              <span>{saved ? 'Updated' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
