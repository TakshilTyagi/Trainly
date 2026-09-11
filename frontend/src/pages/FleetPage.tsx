import React, { useState, useEffect } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp, Sparkles, Gauge, ArrowRight, Search, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type FleetStatusFilter = 'ALL' | 'ON_TIME' | 'DELAYED' | 'NOT_DEPARTED' | 'ARRIVED';

interface FleetTrain {
  train_no: string;
  name: string;
  full_name: string;
  origin: string;
  destination: string;
  status_label: string;
  status_class: string;
  delay_min: number;
  currently_near: string;
  next_station: string;
  next_eta: string;
  confidence_pct: number;
  speed_kmh: number;
  why_this_eta: string;
  updated_secs_ago: number;
}

interface FleetPageProps {
  onSelectTrain: (trainNo: string) => void;
}

const isTrainArrived = (train: FleetTrain): boolean => {
  return (
    train.status_label.toLowerCase().includes('arrived') ||
    train.status_class === 'completed' ||
    train.next_station.toLowerCase() === 'terminated'
  );
};

const isTrainNotDeparted = (train: FleetTrain): boolean => {
  if (isTrainArrived(train)) return false;
  return (
    train.status_label.toLowerCase().includes('scheduled') ||
    train.status_class === 'scheduled' ||
    (train.speed_kmh === 0 && train.currently_near === train.origin && train.why_this_eta.toLowerCase().includes('not departed'))
  );
};

const isTrainOnTime = (train: FleetTrain): boolean => {
  if (isTrainArrived(train) || isTrainNotDeparted(train)) return false;
  return (
    train.status_label.toLowerCase().includes('on time') ||
    train.status_class === 'ontime' ||
    train.delay_min <= 5
  );
};

const isTrainDelayed = (train: FleetTrain): boolean => {
  if (isTrainArrived(train) || isTrainNotDeparted(train)) return false;
  return (
    train.delay_min > 5 ||
    train.status_label.includes('+') ||
    train.status_class.includes('delayed')
  );
};

const FILTER_OPTIONS: { id: FleetStatusFilter; labelKey: string; dotColor: string }[] = [
  { id: 'ALL', labelKey: 'filter_all', dotColor: 'bg-blue-500' },
  { id: 'ON_TIME', labelKey: 'filter_on_time', dotColor: 'bg-emerald-500' },
  { id: 'DELAYED', labelKey: 'filter_delayed', dotColor: 'bg-rose-500' },
  { id: 'NOT_DEPARTED', labelKey: 'filter_not_departed', dotColor: 'bg-amber-500' },
  { id: 'ARRIVED', labelKey: 'filter_arrived', dotColor: 'bg-purple-500' },
];

export const FleetPage: React.FC<FleetPageProps> = ({ onSelectTrain }) => {
  const { t, tStation, tTrainName, tStatusLabel, tDynamic } = useLanguage();
  const [fleet, setFleet] = useState<FleetTrain[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FleetStatusFilter>('ALL');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [expandedTrainNo, setExpandedTrainNo] = useState<string | null>(null);
  const [sortByDelay, setSortByDelay] = useState(false);
  const [lastUpdatedSecs, setLastUpdatedSecs] = useState(12);

  const fetchFleet = async () => {
    try {
      const res = await fetch('/api/fleet');
      if (res.ok) {
        const data = await res.json();
        setFleet(data);
        setLastUpdatedSecs(data[0]?.updated_secs_ago ?? 1);
      }
    } catch (e) {
      console.error('Failed to fetch fleet:', e);
    }
  };

  useEffect(() => {
    fetchFleet();
    const pollTimer = setInterval(fetchFleet, 5000);
    const tickTimer = setInterval(() => {
      setLastUpdatedSecs(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(tickTimer);
    };
  }, []);

  const matchesStatusFilter = (train: FleetTrain, filter: FleetStatusFilter): boolean => {
    switch (filter) {
      case 'ALL': return true;
      case 'ON_TIME': return isTrainOnTime(train);
      case 'DELAYED': return isTrainDelayed(train);
      case 'NOT_DEPARTED': return isTrainNotDeparted(train);
      case 'ARRIVED': return isTrainArrived(train);
      default: return true;
    }
  };

  const filterCounts = {
    ALL: fleet.length,
    ON_TIME: fleet.filter(isTrainOnTime).length,
    DELAYED: fleet.filter(isTrainDelayed).length,
    NOT_DEPARTED: fleet.filter(isTrainNotDeparted).length,
    ARRIVED: fleet.filter(isTrainArrived).length,
  };

  const sortedFleet = [...fleet].sort((a, b) => {
    if (sortByDelay) {
      return b.delay_min - a.delay_min;
    }
    return a.train_no.localeCompare(b.train_no);
  });

  const filteredFleet = sortedFleet.filter((train) => {
    if (!matchesStatusFilter(train, statusFilter)) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const translatedName = tTrainName(train.name, train.train_no, false).toLowerCase();
    const origin = tStation(train.origin).toLowerCase();
    const dest = tStation(train.destination).toLowerCase();
    return (
      train.train_no.includes(q) ||
      train.name.toLowerCase().includes(q) ||
      translatedName.includes(q) ||
      train.origin.toLowerCase().includes(q) ||
      train.destination.toLowerCase().includes(q) ||
      origin.includes(q) ||
      dest.includes(q) ||
      train.currently_near.toLowerCase().includes(q) ||
      train.next_station.toLowerCase().includes(q)
    );
  });

  const getThemeGradient = (trainNo: string) => {
    switch (trainNo) {
      case '22490': return 'from-blue-600 via-indigo-600 to-cyan-500';
      case '12951': return 'from-red-600 via-orange-600 to-amber-500';
      case '12615': return 'from-purple-600 via-fuchsia-600 to-pink-500';
      case '22536': return 'from-amber-600 via-orange-600 to-rose-600';
      case '12004': return 'from-emerald-600 via-teal-600 to-cyan-600';
      case '12625': return 'from-emerald-600 via-green-600 to-teal-500';
      case '12301': return 'from-rose-600 via-red-600 to-orange-500';
      case '12002': return 'from-indigo-600 via-blue-600 to-violet-500';
      case '12723': return 'from-amber-600 via-orange-600 to-red-500';
      case '12839': return 'from-blue-700 via-indigo-600 to-sky-600';
      case '12903': return 'from-yellow-600 via-amber-600 to-orange-500';
      case '12137': return 'from-orange-600 via-red-600 to-rose-600';
      case '16031': return 'from-teal-600 via-emerald-600 to-cyan-600';
      case '12801': return 'from-purple-600 via-indigo-600 to-violet-600';
      case '12649': return 'from-yellow-600 via-orange-600 to-red-600';
      case '12267': return 'from-emerald-600 via-green-600 to-teal-600';
      case '22691': return 'from-red-600 via-rose-600 to-pink-500';
      case '12273': return 'from-cyan-600 via-sky-600 to-blue-600';
      case '12009': return 'from-blue-600 via-indigo-600 to-sky-500';
      case '12431': return 'from-red-600 via-orange-600 to-amber-500';
      case '12423': return 'from-rose-600 via-pink-600 to-red-600';
      case '12621': return 'from-red-700 via-rose-600 to-amber-600';
      case '12215': return 'from-green-600 via-emerald-600 to-teal-500';
      case '12259': return 'from-teal-700 via-cyan-600 to-blue-600';
      case '20607': return 'from-sky-600 via-blue-600 to-indigo-500';
      case '12019': return 'from-violet-600 via-purple-600 to-indigo-500';
      case '12245': return 'from-emerald-700 via-teal-600 to-cyan-600';
      case '12393': return 'from-orange-600 via-amber-600 to-red-500';
      default: return 'from-blue-600 via-indigo-600 to-cyan-500';
    }
  };

  const getStatusBadge = (statusLabel: string) => {
    const lower = statusLabel.toLowerCase();
    if (lower.includes('arrived')) {
      return (
        <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 shadow-sm flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          <span>{t('filter_arrived')}</span>
        </span>
      );
    }
    if (lower.includes('scheduled') || lower.includes('not started')) {
      return (
        <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>{t('filter_not_departed')}</span>
        </span>
      );
    }
    if (lower.includes('on time')) {
      return (
        <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-sm flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{t('on_time')}</span>
        </span>
      );
    }
    if (statusLabel.includes('h') || parseInt(statusLabel) > 40) {
      return (
        <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shadow-sm flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>{tStatusLabel(statusLabel)}</span>
        </span>
      );
    }
    return (
      <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm flex items-center space-x-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        <span>{tStatusLabel(statusLabel)}</span>
      </span>
    );
  };

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 space-y-4 sm:space-y-5">
      
      {/* Page Title Header */}
      <div className="w-full text-center py-1 sm:py-2 relative">
        <div className="absolute inset-0 max-w-xl mx-auto bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-amber-500/15 dark:from-purple-500/25 dark:via-pink-500/25 dark:to-amber-500/25 blur-3xl rounded-full pointer-events-none -z-10" />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 bg-clip-text text-transparent pb-1">
          {t('fleet_overview')}
        </h1>
      </div>

      {/* Page Sub-Header: Subtitle & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('live_active_trains')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-normal">
            {t('fleet_subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Partial Match Fleet Search Input */}
          <div className="relative w-full sm:w-[280px] md:w-[320px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_fleet')}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl pl-11 pr-8 py-2 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 shadow-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs sm:text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/60 px-3.5 py-1.5 rounded-xl whitespace-nowrap">
              {t('updated_ago')} {lastUpdatedSecs} {t('seconds_short')}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Section (Collapsible with Extract / Retract Filter Button) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
        {/* The Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer flex-shrink-0 ${
            isFilterExpanded || statusFilter !== 'ALL' || sortByDelay
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/25'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 shadow-xs'
          }`}
          aria-expanded={isFilterExpanded}
          aria-label={t('filter_label')}
        >
          <Filter className={`w-3.5 h-3.5 ${isFilterExpanded || statusFilter !== 'ALL' || sortByDelay ? 'text-white' : 'text-blue-600'}`} />
          <span>{t('filter_label')}</span>
          {/* Active status indicator badge when retracted */}
          {!isFilterExpanded && statusFilter !== 'ALL' && (
            <span className="text-[11px] px-1.5 py-0.2 rounded-full font-bold bg-white/25 text-white">
              {filterCounts[statusFilter]}
            </span>
          )}
          {!isFilterExpanded && sortByDelay && statusFilter === 'ALL' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          )}
          {isFilterExpanded ? (
            <ChevronUp className={`w-3.5 h-3.5 ${isFilterExpanded || statusFilter !== 'ALL' || sortByDelay ? 'text-white/80' : 'text-gray-400'}`} />
          ) : (
            <ChevronDown className={`w-3.5 h-3.5 ${isFilterExpanded || statusFilter !== 'ALL' || sortByDelay ? 'text-white/80' : 'text-gray-400'}`} />
          )}
        </button>

        {/* Extracted filters: visible when isFilterExpanded is true */}
        {isFilterExpanded && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none animate-in fade-in slide-in-from-left-2 duration-200">
            {FILTER_OPTIONS.map((f) => {
              const isActive = statusFilter === f.id;
              const count = filterCounts[f.id] ?? 0;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/25'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 shadow-xs'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${f.dotColor} ${isActive ? 'ring-1 ring-white' : ''}`}></span>
                  <span>{t(f.labelKey)}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Visual separator before Sort control */}
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-1 flex-shrink-0" />

            {/* Sort by delay / train (integrated inside the filters section only) */}
            <button
              type="button"
              onClick={() => setSortByDelay(!sortByDelay)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer flex-shrink-0 ${
                sortByDelay
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/25'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 shadow-xs'
              }`}
              title={sortByDelay ? t('sort_by_train') : t('sort_by_delay')}
            >
              <ArrowUpDown className={`w-3.5 h-3.5 ${sortByDelay ? 'text-white' : 'text-blue-600'}`} />
              <span>{sortByDelay ? t('sort_by_train') : t('sort_by_delay')}</span>
            </button>

            {/* Quick clear button if any non-default filter/sort is active */}
            {(statusFilter !== 'ALL' || sortByDelay) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setSortByDelay(false);
                }}
                className="text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 px-2 py-1 transition-colors whitespace-nowrap cursor-pointer ml-1"
              >
                {t('clear_filters')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Train List Cards */}
      <div className="space-y-4">
        {filteredFleet.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 space-y-3">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {searchQuery
                ? `No trains match "${searchQuery}" with the active filter.`
                : t('no_filter_matches')}
            </p>
            {(searchQuery || statusFilter !== 'ALL' || sortByDelay) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setSortByDelay(false);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>{t('clear_filters')}</span>
              </button>
            )}
          </div>
        )}
        {filteredFleet.map((train) => {
          const isExpanded = expandedTrainNo === train.train_no;
          const gradient = getThemeGradient(train.train_no);

          return (
            <div
              key={train.train_no}
              className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all overflow-hidden relative"
            >
              {/* Colorful Left Highlight Line */}
              <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${gradient}`}></div>

              {/* Clickable Card Header */}
              <div
                onClick={() => setExpandedTrainNo(isExpanded ? null : train.train_no)}
                className="p-5 sm:p-6 pl-6 sm:pl-7 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
              >
                {/* Top Row: Train Name & Status Badge */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-sm font-semibold text-blue-600 dark:text-cyan-400 uppercase tracking-wider">
                        #{train.train_no}
                      </span>
                      <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">
                        {tTrainName(train.name, train.train_no, true)}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-normal">
                      {tStation(train.origin)} → {tStation(train.destination)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(train.status_label)}
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800/80 my-4" />

                {/* Bottom Row: Near Station, Next Stop, Live Speed (Bold when clicked), & Colorful Confidence */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left">
                  {/* Currently Near */}
                  <div>
                    <span className="block text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                      {t('currently_near')}
                    </span>
                    <span className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-100 truncate block mt-1">
                      {tStation(train.currently_near)}
                    </span>
                  </div>

                  {/* Next Stop */}
                  <div>
                    <span className="block text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide break-words">
                      {t('next_stop')} · {tStation(train.next_station)}
                    </span>
                    <span className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-100 mt-1 block">
                      {train.next_eta}
                    </span>
                  </div>

                  {/* Speed: In BOLD when this train is clicked! */}
                  <div>
                    <span className="block text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                      {t('speed')}
                    </span>
                    <span className={`text-sm sm:text-base mt-1 block transition-all ${
                      isExpanded 
                        ? 'font-black text-blue-600 dark:text-cyan-400' 
                        : 'font-normal text-gray-600 dark:text-gray-300'
                    }`}>
                      {train.speed_kmh} km/h
                    </span>
                  </div>

                  {/* Colorful Confidence Percentage with Progress Bar */}
                  <div className="text-right self-start sm:self-auto">
                    <span className="block text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                      {t('confidence')}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className={`text-base sm:text-lg font-bold mt-0.5 block ${
                        train.confidence_pct >= 85
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : train.confidence_pct >= 70
                          ? 'text-blue-600 dark:text-cyan-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {train.confidence_pct}%
                      </span>
                      {/* Colorful Confidence Progress Meter */}
                      <div className="w-16 sm:w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1 p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            train.confidence_pct >= 85
                              ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                              : train.confidence_pct >= 70
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-400'
                              : 'bg-gradient-to-r from-amber-500 to-orange-400'
                          }`}
                          style={{ width: `${train.confidence_pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inline Accordion Expansion (When clicked) */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-3 bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-gray-950/60 dark:to-blue-950/10 border-t border-gray-100 dark:border-gray-800/80 animate-in fade-in duration-200">
                  <div className="space-y-3.5">
                    <div className="flex items-start space-x-2.5 text-xs sm:text-sm">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {t('why_this_eta')}:
                        </span>{' '}
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                          {tDynamic(train.why_this_eta)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-200/60 dark:border-gray-800">
                      {/* Bold Speed Display in Clicked State */}
                      <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 shadow-xs">
                        <Gauge className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {t('live_gps_speed')}:{' '}
                          <strong className="text-sm sm:text-base font-black text-blue-600 dark:text-cyan-400">
                            {train.speed_kmh} km/h
                          </strong>
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTrain(train.train_no);
                        }}
                        className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                      >
                        <span>{t('track_on_map')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
