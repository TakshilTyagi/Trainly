import React, { useState, useEffect } from 'react';
import {
  CloudFog,
  TrafficCone,
  Clock,
  Wrench,
  HelpCircle,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Users
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const TRAIN_OPTIONS = [
  { no: '22490', label: '22490 Vande Bharat Express' },
  { no: '12951', label: '12951 Mumbai Rajdhani' },
  { no: '12615', label: '12615 Grand Trunk Express' },
  { no: '22536', label: '22536 Banaras (Manduadih) Exp' },
  { no: '12004', label: '12004 Lucknow Shatabdi Express' },
  { no: '12625', label: '12625 Kerala Express' },
  { no: '12301', label: '12301 Howrah Rajdhani' },
  { no: '12002', label: '12002 Bhopal Shatabdi' },
  { no: '12723', label: '12723 Telangana Express' },
  { no: '12839', label: '12839 Howrah–Chennai Mail' },
  { no: '12903', label: '12903 Golden Temple Mail' },
  { no: '12137', label: '12137 Punjab Mail' },
  { no: '16031', label: '16031 Andaman Express' },
  { no: '12801', label: '12801 Purushottam Express' },
  { no: '12649', label: '12649 Karnataka Sampark Kranti' },
  { no: '12267', label: '12267 Mumbai–Ahmedabad Duronto' },
  { no: '22691', label: '22691 Bengaluru Rajdhani' },
  { no: '12273', label: '12273 Howrah–New Delhi Duronto' },
  { no: '12009', label: '12009 Mumbai–Ahmedabad Shatabdi' },
  { no: '12431', label: '12431 Trivandrum Rajdhani' },
  { no: '12423', label: '12423 Dibrugarh Rajdhani' },
  { no: '12621', label: '12621 Tamil Nadu Express' },
  { no: '12215', label: '12215 Delhi–Bandra Garib Rath' },
  { no: '12259', label: '12259 Sealdah Duronto' },
  { no: '20607', label: '20607 Chennai–Mysuru Vande Bharat' },
  { no: '12019', label: '12019 Howrah–Ranchi Shatabdi' },
  { no: '12245', label: '12245 Howrah–Yesvantpur Duronto' },
  { no: '12393', label: '12393 Sampoorna Kranti Express' },
];

interface FeedbackReport {
  id: number;
  train_no: string;
  cause_tag: string;
  note: string;
  user_name: string;
  confirmations: number;
  disagreements?: number;
  created_at: string;
}

export const FeedbackPage: React.FC = () => {
  const { t, tTrainName, tDynamic } = useLanguage();
  const { user, isGuest } = useAuth();

  const [selectedTrainNo, setSelectedTrainNo] = useState('22490');
  const [selectedCause, setSelectedCause] = useState<string>('Signal');
  const [note, setNote] = useState('');
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track user's votes: reportId -> 'agree' | 'disagree' | null
  const [userVotes, setUserVotes] = useState<Record<number, 'agree' | 'disagree' | null>>(() => {
    try {
      const saved = localStorage.getItem('trainly_passenger_votes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const causeOptions = [
    { id: 'Fog', label: t('fog'), icon: CloudFog, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700' },
    { id: 'Signal', label: t('signal'), icon: TrafficCone, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700' },
    { id: 'Congestion', label: t('congestion'), icon: TrafficCone, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700' },
    { id: 'Late start', label: t('late_start'), icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700' },
    { id: 'Technical', label: t('technical'), icon: Wrench, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700' },
    { id: 'Other', label: t('other'), icon: HelpCircle, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700' },
  ];

  const fetchReports = async (trainNo: string) => {
    try {
      const res = await fetch(`/api/feedback/${trainNo}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error('Failed to load feedback:', e);
    }
  };

  useEffect(() => {
    fetchReports(selectedTrainNo);
    const interval = setInterval(() => {
      fetchReports(selectedTrainNo);
    }, 6000);
    return () => clearInterval(interval);
  }, [selectedTrainNo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      alert(t('guest_notice'));
      return;
    }
    if (!selectedCause) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          train_no: selectedTrainNo,
          cause_tag: selectedCause,
          note: note.trim(),
          user_id: user?.id || 'usr_demo1',
          user_name: user?.name || 'Passenger',
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setNote('');
        fetchReports(selectedTrainNo);
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (e) {
      console.error('Failed to submit feedback:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Toggles Agree or Disagree for a report:
   * - Clicking once registers the vote (+1, highlights button).
   * - Clicking the same button again un-registers (-1, restores button to neutral).
   * - Clicking the opposite button cleanly switches votes.
   */
  const handleToggleVote = async (reportId: number, targetVote: 'agree' | 'disagree') => {
    const currentVote = userVotes[reportId] || null;
    let newVote: 'agree' | 'disagree' | null = null;
    let action = '';

    if (targetVote === 'agree') {
      if (currentVote === 'agree') {
        // Un-register
        newVote = null;
        action = 'unagree';
      } else if (currentVote === 'disagree') {
        // Switch from disagree to agree
        newVote = 'agree';
        action = 'switch_to_agree';
      } else {
        // Register agree
        newVote = 'agree';
        action = 'agree';
      }
    } else {
      if (currentVote === 'disagree') {
        // Un-register
        newVote = null;
        action = 'undisagree';
      } else if (currentVote === 'agree') {
        // Switch from agree to disagree
        newVote = 'disagree';
        action = 'switch_to_disagree';
      } else {
        // Register disagree
        newVote = 'disagree';
        action = 'disagree';
      }
    }

    // 1. Optimistically update local userVotes state & localStorage
    const updatedVotes = { ...userVotes, [reportId]: newVote };
    setUserVotes(updatedVotes);
    try {
      localStorage.setItem('trainly_passenger_votes', JSON.stringify(updatedVotes));
    } catch (err) {
      console.error('Failed saving votes:', err);
    }

    // 2. Optimistically update report counters in state
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        let conf = r.confirmations || 0;
        let dis = r.disagreements || 0;

        if (action === 'agree') {
          conf += 1;
        } else if (action === 'unagree') {
          conf = Math.max(0, conf - 1);
        } else if (action === 'disagree') {
          dis += 1;
        } else if (action === 'undisagree') {
          dis = Math.max(0, dis - 1);
        } else if (action === 'switch_to_agree') {
          conf += 1;
          dis = Math.max(0, dis - 1);
        } else if (action === 'switch_to_disagree') {
          dis += 1;
          conf = Math.max(0, conf - 1);
        }

        return { ...r, confirmations: conf, disagreements: dis };
      })
    );

    // 3. Sync with backend API
    try {
      await fetch(`/api/feedback/${reportId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 'usr_local',
          action: action,
        }),
      });
    } catch (e) {
      console.error('Error synchronizing vote:', e);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return t('just_now');
    if (diff < 60) return `${diff} ${t('m_ago')}`;
    const hours = Math.floor(diff / 60);
    return `${hours} ${t('h_ago')}`;
  };

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Page Title Header with (For passengers) */}
      <div className="w-full text-center py-2 sm:py-3 mb-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {t('nav_feedback')} {t('for_passengers')}
        </h1>
      </div>

      {/* Two-Column Side-by-Side Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Report Delay Cause Form */}
        <div className="lg:col-span-6 xl:col-span-5 bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500"></div>

          <div className="flex items-center space-x-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {t('report_delay')}
            </h2>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6 font-medium">
            {t('delay_subtitle')}
          </p>

          {isGuest && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold">
              ⚠️ {t('guest_notice')}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Train Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                {t('select_train')}
              </label>
              <div className="relative">
                <select
                  value={selectedTrainNo}
                  onChange={(e) => setSelectedTrainNo(e.target.value)}
                  className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-bold rounded-2xl px-4 py-3 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                >
                  {TRAIN_OPTIONS.map((opt) => (
                    <option key={opt.no} value={opt.no}>
                      {tTrainName(opt.label, opt.no, false)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick-Tap Delay Cause Button Grid */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                {t('delay_cause')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {causeOptions.map((opt) => {
                  const isSelected = selectedCause === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedCause(opt.id)}
                      className={`flex items-center space-x-3 px-3.5 py-3 rounded-2xl border text-left font-bold text-sm transition-all focus:outline-none cursor-pointer ${
                        isSelected
                          ? `${opt.bg} shadow-md scale-102 ring-2 ring-blue-500/40 font-black`
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isSelected ? opt.color : 'text-gray-400'}`} />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Note Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                {t('optional_note')}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('optional_note_placeholder')}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-xs"
              />
            </div>

            {/* Submit Button with Gradient */}
            <button
              type="submit"
              disabled={isSubmitting || isGuest}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-md shadow-blue-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
            >
              {submitted ? (
                <>
                  <Check className="w-5 h-5 animate-bounce" />
                  <span>{t('submitted_success')}</span>
                </>
              ) : (
                <span>{isSubmitting ? t('submitting') : t('submit_report')}</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Recent Passenger Reports Feed */}
        <div className="lg:col-span-6 xl:col-span-7 bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-md relative overflow-hidden space-y-5">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500"></div>

          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {t('recent_reports')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {t('live_passenger_delay_stream')}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center space-x-1">
              <Users className="w-3.5 h-3.5" />
              <span>{reports.length} {t('reports_count')}</span>
            </span>
          </div>

          {/* Report Feed Cards */}
          <div className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm font-medium">
                {t('no_reports_yet')}
              </div>
            ) : (
              reports.map((report) => {
                const myVote = userVotes[report.id] || null;
                const isAgreed = myVote === 'agree';
                const isDisagreed = myVote === 'disagree';

                return (
                  <div
                    key={report.id}
                    className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 text-blue-700 dark:text-blue-300">
                          {t(report.cause_tag.toLowerCase().replace(' ', '_')) || report.cause_tag}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                          {t('by')} {report.user_name} · {formatTimeAgo(report.created_at)}
                        </span>
                      </div>
                      {report.note && (
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium break-words">
                          "{tDynamic(report.note)}"
                        </p>
                      )}
                    </div>

                    {/* Agree and Disagree Toggle Action Buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {/* Agree Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleVote(report.id, 'agree')}
                        title={isAgreed ? 'Click again to remove your agreement' : 'Agree with this report'}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none active:scale-95 ${
                          isAgreed
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isAgreed ? 'text-white fill-white/20' : 'text-gray-400'}`} />
                        <span>{t('agree')}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[11px] font-black ${
                            isAgreed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {report.confirmations || 0}
                        </span>
                      </button>

                      {/* Disagree Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleVote(report.id, 'disagree')}
                        title={isDisagreed ? 'Click again to remove your disagreement' : 'Disagree with this report'}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none active:scale-95 ${
                          isDisagreed
                            ? 'border-rose-500 bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400'
                        }`}
                      >
                        <ThumbsDown className={`w-3.5 h-3.5 ${isDisagreed ? 'text-white fill-white/20' : 'text-gray-400'}`} />
                        <span>{t('disagree')}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[11px] font-black ${
                            isDisagreed
                              ? 'bg-rose-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {report.disagreements || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
