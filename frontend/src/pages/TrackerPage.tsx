import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Sparkles, Gauge, Compass, ShieldCheck, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { NavigationMap } from '../components/NavigationMap';
import { FloatingAssistantWidget } from '../components/FloatingAssistantWidget';

interface TrackerPageProps {
  initialTrain?: string;
  onNavigate?: (page: string) => void;
}

interface StationStop {
  station_code: string;
  station_name: string;
  status_type: 'departed' | 'current' | 'upcoming';
  role: 'origin' | 'passed' | 'current' | 'upcoming' | 'destination';
  scheduled_time: string;
  actual_time?: string;
  predicted_time?: string;
  delay_min: number;
  time_display: string;
  is_departed?: boolean;
  is_arrived?: boolean;
  status_note?: string;
  confidence_pct?: number | null;
  lat: number;
  lon: number;
}

interface JourneyData {
  train_no: string;
  train_name: string;
  full_name: string;
  origin: string;
  destination: string;
  current_status_label: string;
  current_status_class: string;
  current_subtext: string;
  why_this_eta: string;
  is_departed?: boolean;
  is_completed?: boolean;
  train_status?: string;
  live_position: {
    lat: number;
    lon: number;
    speed_kmh: number;
    current_section: string;
    progress_in_section: number;
    last_updated_secs_ago: number;
  };
  journey_log: StationStop[];
  route_polyline: { lat: number; lon: number; name: string; code: string }[];
}

const TRAIN_OPTIONS = [
  { no: '22490', label: '22490 Vande Bharat: Meerut → Varanasi', theme: 'from-blue-600 to-cyan-500' },
  { no: '12951', label: '12951 Mumbai Rajdhani: Mumbai → New Delhi', theme: 'from-red-600 to-amber-500' },
  { no: '12615', label: '12615 Grand Trunk Express: New Delhi → Chennai', theme: 'from-purple-600 to-pink-500' },
  { no: '22536', label: '22536 Manduadih Express: Banaras → Rameswaram', theme: 'from-amber-600 to-orange-500' },
  { no: '12004', label: '12004 Lucknow Shatabdi: New Delhi → Lucknow (Arrived)', theme: 'from-emerald-600 to-teal-500' },
  { no: '12625', label: '12625 Kerala Express: Trivandrum → New Delhi', theme: 'from-emerald-600 to-green-500' },
  { no: '12301', label: '12301 Howrah Rajdhani: Howrah → New Delhi', theme: 'from-rose-600 to-red-500' },
  { no: '12002', label: '12002 Bhopal Shatabdi: New Delhi → Rani Kamlapati', theme: 'from-indigo-600 to-violet-500' },
  { no: '12723', label: '12723 Telangana Express: Hyderabad → New Delhi', theme: 'from-amber-600 to-red-500' },
  { no: '12839', label: '12839 Howrah–Chennai Mail: Howrah → Chennai Central', theme: 'from-blue-700 to-indigo-600' },
  { no: '12903', label: '12903 Golden Temple Mail: Mumbai Central → Amritsar', theme: 'from-yellow-600 to-amber-500' },
  { no: '12137', label: '12137 Punjab Mail: Mumbai CSMT → Firozpur Cantt', theme: 'from-orange-600 to-red-600' },
  { no: '16031', label: '16031 Andaman Express: Chennai Central → SVDK Katra', theme: 'from-teal-600 to-cyan-600' },
  { no: '12801', label: '12801 Purushottam Express: Puri → New Delhi', theme: 'from-purple-600 to-indigo-600' },
  { no: '12649', label: '12649 Karnataka Sampark Kranti: Yesvantpur → Hazrat Nizamuddin', theme: 'from-yellow-600 to-red-600' },
  { no: '12267', label: '12267 Mumbai–Ahmedabad Duronto: Mumbai Central → Ahmedabad', theme: 'from-emerald-600 to-green-600' },
  { no: '22691', label: '22691 Bengaluru Rajdhani: KSR Bengaluru → Hazrat Nizamuddin', theme: 'from-red-600 to-rose-500' },
  { no: '12273', label: '12273 Howrah–New Delhi Duronto: Howrah → New Delhi', theme: 'from-cyan-600 to-blue-600' },
  { no: '12009', label: '12009 Mumbai–Ahmedabad Shatabdi: Mumbai Central → Ahmedabad', theme: 'from-blue-600 to-indigo-500' },
  { no: '12431', label: '12431 Trivandrum Rajdhani: Thiruvananthapuram → Hazrat Nizamuddin', theme: 'from-red-600 to-orange-500' },
  { no: '12423', label: '12423 Dibrugarh Rajdhani: Dibrugarh → New Delhi', theme: 'from-rose-600 to-pink-600' },
  { no: '12621', label: '12621 Tamil Nadu Express: Chennai Central → New Delhi', theme: 'from-red-700 to-amber-600' },
  { no: '12215', label: '12215 Delhi–Bandra Garib Rath: Delhi Sarai Rohilla → Bandra Terminus', theme: 'from-green-600 to-emerald-500' },
  { no: '12259', label: '12259 Sealdah Duronto: Sealdah → New Delhi', theme: 'from-teal-700 to-blue-600' },
  { no: '20607', label: '20607 Chennai–Mysuru Vande Bharat: Chennai Central → Mysuru', theme: 'from-sky-600 to-blue-500' },
  { no: '12019', label: '12019 Howrah–Ranchi Shatabdi: Howrah → Ranchi', theme: 'from-violet-600 to-purple-500' },
  { no: '12245', label: '12245 Howrah–Yesvantpur Duronto: Howrah → Yesvantpur', theme: 'from-emerald-700 to-teal-500' },
  { no: '12393', label: '12393 Sampoorna Kranti Express: Rajendra Nagar → New Delhi', theme: 'from-orange-600 to-amber-500' },
];

export const TrackerPage: React.FC<TrackerPageProps> = ({ initialTrain = '22490', onNavigate }) => {
  const { t, tStation, tTrainName, tTrainFullRoute, tSubtext, tStatusLabel, tDynamic } = useLanguage();
  const [selectedTrainNo, setSelectedTrainNo] = useState(initialTrain);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [comboboxSearch, setComboboxSearch] = useState('');
  const comboboxRef = useRef<HTMLDivElement>(null);
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [activeStationIdx, setActiveStationIdx] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const journeyLogRef = useRef<HTMLDivElement>(null);

  // Close combobox dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsComboboxOpen(false);
        setComboboxSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedTrainOption = TRAIN_OPTIONS.find((t) => t.no === selectedTrainNo) || TRAIN_OPTIONS[0];

  const filteredTrainOptions = useMemo(() => {
    const q = comboboxSearch.trim().toLowerCase();
    if (!q) return TRAIN_OPTIONS;
    return TRAIN_OPTIONS.filter((opt) => {
      const translated = tTrainName(opt.label, opt.no, false).toLowerCase();
      const route = tTrainFullRoute(opt.no).toLowerCase();
      return (
        opt.no.includes(q) ||
        opt.label.toLowerCase().includes(q) ||
        translated.includes(q) ||
        route.includes(q)
      );
    });
  }, [comboboxSearch, tTrainName, tTrainFullRoute]);

  // Fetch train journey and live ETA from backend
  const fetchTrainData = async (trainNo: string) => {
    try {
      const res = await fetch(`/api/train/${trainNo}/journey`);
      if (res.ok) {
        const data: JourneyData = await res.json();
        setJourneyData(data);
        const currIdx = data.journey_log.findIndex(s => s.status_type === 'current');
        if (currIdx !== -1) {
          setActiveStationIdx(currIdx);
        }
      }
    } catch (e) {
      console.error('Error fetching train data:', e);
    }
  };

  useEffect(() => {
    fetchTrainData(selectedTrainNo);
    const interval = setInterval(() => {
      fetchTrainData(selectedTrainNo);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedTrainNo]);

  // Scrollytelling: Track scroll position inside Journey Log and sync map navigation marker
  const handleJourneyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const maxScroll = target.scrollHeight - target.clientHeight;
    if (maxScroll > 0) {
      const progress = Math.min(1, Math.max(0, target.scrollTop / maxScroll));
      setScrollProgress(progress);
      if (journeyData && journeyData.journey_log.length > 0) {
        const index = Math.min(
          journeyData.journey_log.length - 1,
          Math.floor(progress * journeyData.journey_log.length)
        );
        setActiveStationIdx(index);
      }
    }
  };

  // Status badge styling with vibrant glowing accents
  const getStatusBadge = (statusLabel: string) => {
    if (statusLabel.toLowerCase().includes('arrived') || statusLabel.toLowerCase().includes('completed')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-sm flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{t('arrived')}</span>
        </span>
      );
    }
    if (statusLabel.toLowerCase().includes('on time')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-sm flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{t('on_time')}</span>
        </span>
      );
    }
    if (statusLabel.toLowerCase().includes('scheduled') || statusLabel.toLowerCase().includes('not started')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>{t('scheduled')}</span>
        </span>
      );
    }
    if (statusLabel.includes('h') || parseInt(statusLabel) > 40) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shadow-sm flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>{tStatusLabel(statusLabel)}</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm flex items-center space-x-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        <span>{tStatusLabel(statusLabel)}</span>
      </span>
    );
  };

  if (!journeyData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">
          {t('connecting_ntes')}
        </p>
      </div>
    );
  }

  const isTrainCompleted =
    journeyData.is_completed === true ||
    journeyData.train_status === 'COMPLETED' ||
    journeyData.current_status_class === 'completed' ||
    journeyData.current_status_label.toLowerCase().includes('arrived') ||
    journeyData.current_status_label.toLowerCase().includes('completed');

  const isTrainNotDeparted =
    !isTrainCompleted && (
      journeyData.is_departed === false ||
      journeyData.train_status === 'NOT_STARTED' ||
      journeyData.current_status_class === 'scheduled' ||
      (journeyData.live_position?.speed_kmh === 0 && journeyData.current_status_label === 'Scheduled')
    );

  return (
    <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-5 space-y-4 sm:space-y-5">
      
      {/* Page Title Header with reduced 1-line distance and fresh vibrant color */}
      <div className="w-full text-center py-1 sm:py-1.5 mb-1 sm:mb-2 relative">
        <div className="absolute inset-0 max-w-xl mx-auto bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 dark:from-emerald-500/25 dark:via-teal-500/25 dark:to-cyan-500/25 blur-3xl rounded-full pointer-events-none -z-10" />
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent pb-1">
          {t('nav_tracker')}
        </h1>
      </div>

      {/* Top Controls Row: Train Selector on Left & Small NTES Badge in Rightmost Corner just above 'Why this ETA' */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Unified Searchable Combobox Dropdown (Exact original footprint) */}
        <div className="relative group w-full sm:w-[480px]" ref={comboboxRef}>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-2xl blur-xs opacity-30 group-hover:opacity-60 transition duration-300 pointer-events-none"></div>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={isComboboxOpen ? comboboxSearch : tTrainName(selectedTrainOption.label, selectedTrainOption.no, false)}
              onChange={(e) => {
                setComboboxSearch(e.target.value);
                if (!isComboboxOpen) setIsComboboxOpen(true);
              }}
              onFocus={() => {
                setIsComboboxOpen(true);
                setComboboxSearch('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (filteredTrainOptions.length > 0) {
                    setSelectedTrainNo(filteredTrainOptions[0].no);
                    setIsComboboxOpen(false);
                    setComboboxSearch('');
                    (e.target as HTMLInputElement).blur();
                  }
                } else if (e.key === 'Escape') {
                  setIsComboboxOpen(false);
                  setComboboxSearch('');
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder={t('search_train')}
              aria-label="Select or search train to track"
              className="w-full appearance-none bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl pl-11 pr-12 py-3.5 text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 shadow-md cursor-pointer focus:cursor-text focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button
              type="button"
              onClick={() => {
                setIsComboboxOpen((prev) => !prev);
                if (!isComboboxOpen) setComboboxSearch('');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1"
              aria-label="Toggle train list"
            >
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isComboboxOpen ? 'rotate-180 text-blue-600 dark:text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Floating Dropdown List of Trains */}
          {isComboboxOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-h-72 overflow-y-auto py-2 divide-y divide-gray-100 dark:divide-gray-800/60">
              {filteredTrainOptions.length > 0 ? (
                filteredTrainOptions.map((opt) => {
                  const isSelected = opt.no === selectedTrainNo;
                  return (
                    <div
                      key={opt.no}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedTrainNo(opt.no);
                        setIsComboboxOpen(false);
                        setComboboxSearch('');
                      }}
                      className={`px-5 py-3 text-sm sm:text-base font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-bold'
                          : 'text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/70'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-100/70 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono font-bold">
                          {opt.no}
                        </span>
                        <span>{tTrainName(opt.label, opt.no, false)}</span>
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-cyan-400"></span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-5 py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center font-medium">
                  No matching trains found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rightmost Corner: Small Live NTES Telemetry & AI Quantile Forecasting Badge */}
        <div className="self-end sm:self-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 dark:from-blue-950/80 dark:via-indigo-950/80 dark:to-cyan-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            <span>{t('live_ntes_telemetry_badge')}</span>
          </div>
        </div>

      </div>

      {/* 2-Column Responsive Split Grid: Both Columns Start and End at Exact Same Level */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">

        {/* LEFT COLUMN: Main Train Navigation Card with Map */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col h-full">
          
          {/* Main Train Card */}
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-blue-200/60 dark:border-blue-900/40 shadow-xl shadow-blue-500/5 relative overflow-hidden flex flex-col flex-1 h-full">
            {/* Colorful top border bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400"></div>

            {/* Train Name Header - Aligned at exact same line with Why this ETA on the right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[48px] shrink-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  <span className="text-blue-600 dark:text-cyan-400 mr-2">#{journeyData.train_no}</span>
                  {tTrainFullRoute(journeyData.train_no)}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                  {tSubtext(journeyData.current_subtext)}
                </p>
              </div>
              <div className="shrink-0">
                {getStatusBadge(journeyData.current_status_label)}
              </div>
            </div>

            {/* Telemetry Strip: Speed, Next Stop, Confidence */}
            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-4 text-left shrink-0">
              {/* Speed Metric */}
              <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-cyan-50/90 dark:from-blue-950/60 dark:to-cyan-950/60 border border-blue-200/80 dark:border-blue-800/80 shadow-xs min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
                  <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-blue-600/80 dark:text-blue-300/80 block leading-tight">{t('speed')}</span>
                  <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900 dark:text-white block leading-snug">
                    {journeyData.live_position.speed_kmh} km/h
                  </span>
                </div>
              </div>

              {/* Next Stop Metric - Fully Appearing without ellipsis/truncation */}
              <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/60 dark:to-purple-950/60 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30">
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-indigo-600/80 dark:text-indigo-300/80 block leading-tight">{t('next_stop')}</span>
                  <span className="text-xs sm:text-sm md:text-[15px] font-bold text-gray-900 dark:text-white block leading-snug break-words">
                    {tStation(journeyData.journey_log.find(s => s.status_type === 'current')?.station_name || '')}
                  </span>
                </div>
              </div>

              {/* Confidence Metric */}
              <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/90 dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-emerald-600/80 dark:text-emerald-300/80 block leading-tight">{t('confidence')}</span>
                  <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900 dark:text-white block leading-snug">
                    {journeyData.journey_log.find(s => s.status_type === 'current')?.confidence_pct || 92}%
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Google Maps Style Interactive Navigation Map */}
            <div className="mt-5 flex-1 flex flex-col min-h-[500px]">
              <NavigationMap
                routePoints={journeyData.route_polyline}
                currentPosition={journeyData.live_position}
                statusLabel={journeyData.current_status_label}
                scrollProgress={scrollProgress}
                activeStationIdx={activeStationIdx}
                trainNo={journeyData.train_no}
                trainName={journeyData.train_name}
                onSelectStation={(idx) => {
                  setActiveStationIdx(idx);
                  setScrollProgress(idx / (journeyData.journey_log.length - 1));
                }}
                className="w-full h-full min-h-[500px] sm:min-h-[560px] lg:min-h-[640px] xl:min-h-[700px] flex-1"
              />
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Why this ETA + Live Journey Log (Ends on Exact Same Level as Map) */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-6 h-full">
          
          {/* 4. "Why this ETA" (ML Explainability Card) - Aligned at exact same line with Train Name on the left */}
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-purple-200/60 dark:border-purple-900/40 shadow-xl shadow-purple-500/5 relative overflow-hidden shrink-0">
            {/* Colorful top border bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500"></div>

            <div className="flex items-center space-x-2.5 min-h-[48px] mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {t('why_this_eta')}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-normal pl-10">
              {tDynamic(journeyData.why_this_eta)}
            </p>
          </div>

          {/* 5. Live Journey Log Timeline Card (Fills remaining height to end on exact same level as Map column) */}
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-indigo-200/60 dark:border-indigo-900/40 shadow-xl shadow-indigo-500/5 relative overflow-hidden flex flex-col flex-1 min-h-0">
            {/* Colorful top border bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-500"></div>

            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  {t('journey_log')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
                  {journeyData.journey_log.length} {t('stations_count')}
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                {t('scroll_to_trace')}
              </span>
            </div>

            {/* If train has not departed yet, show dedicated prominent Journey Log status alert banner */}
            {isTrainNotDeparted && (
              <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5 shadow-xs shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <span>
                  <strong>{t('train_not_departed_banner')}</strong> — {t('scheduled_departure')} {tStation(journeyData.origin)}: <strong>{journeyData.journey_log[0]?.scheduled_time} IST</strong>
                </span>
              </div>
            )}

            {/* If train has arrived at final destination, show dedicated prominent Journey Log status alert banner */}
            {isTrainCompleted && (
              <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 shadow-xs shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 flex items-center justify-center text-white text-[8px] font-bold">✓</span>
                <span>
                  <strong>{t('train_completed_banner')}</strong> — {t('arrived_at')} {tStation(journeyData.destination)}: <strong>{journeyData.journey_log[journeyData.journey_log.length - 1]?.actual_time || journeyData.journey_log[journeyData.journey_log.length - 1]?.scheduled_time} IST</strong> ({t('journey_completed')})
                </span>
              </div>
            )}

            {/* Scrollable Timeline Container - Flex-1 to end at exact same level as Left column */}
            <div
              ref={journeyLogRef}
              onScroll={handleJourneyScroll}
              className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4 focus:outline-none"
            >
              {journeyData.journey_log.map((stop, index) => {
                const isDeparted = !isTrainNotDeparted && stop.status_type === 'departed';
                const isCurrent = stop.status_type === 'current';
                const isHighlighted = activeStationIdx === index;
                const isOriginStop = index === 0 || stop.role === 'origin';
                const isDestStop = index === journeyData.journey_log.length - 1 || stop.role === 'destination';

                return (
                  <div
                    key={stop.station_code}
                    onClick={() => {
                      setActiveStationIdx(index);
                      setScrollProgress(index / (journeyData.journey_log.length - 1));
                    }}
                    className={`relative pl-11 transition-all cursor-pointer rounded-2xl p-3.5 -ml-2.5 ${
                      isHighlighted 
                        ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/60 dark:from-blue-950/60 dark:to-indigo-950/40 border border-blue-300 dark:border-blue-700 shadow-md shadow-blue-500/5' 
                        : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    {/* Timeline connector track */}
                    {index !== journeyData.journey_log.length - 1 && (
                      <div className={`absolute left-[18px] top-9 bottom-[-20px] w-[3px] rounded-full ${
                        isTrainCompleted 
                          ? 'bg-gradient-to-b from-blue-500 to-emerald-500' 
                          : 'bg-gradient-to-b from-blue-500 to-gray-200 dark:to-gray-800'
                      }`} />
                    )}

                    {/* Timeline Dot Beacon */}
                    <div className="absolute left-2.5 top-4 flex items-center justify-center">
                      {isTrainCompleted && isDestStop ? (
                        <div className="relative flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-emerald-600 dark:bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950 flex items-center justify-center text-white text-[9px] font-bold shadow-xs">
                            ✓
                          </div>
                          <div className="absolute w-7 h-7 rounded-full border-2 border-emerald-500/60 animate-pulse" />
                        </div>
                      ) : isTrainNotDeparted && isOriginStop ? (
                        <div className="w-4 h-4 rounded-full bg-amber-500 ring-2 ring-amber-100 dark:ring-amber-950 flex items-center justify-center text-white text-[9px] font-bold shadow-xs">
                          ⏸
                        </div>
                      ) : (isDeparted || (isTrainCompleted && !isDestStop)) ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-600 dark:bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950 flex items-center justify-center text-white text-[9px] font-bold shadow-xs">
                          ✓
                        </div>
                      ) : isCurrent ? (
                        <div className="relative flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-950 shadow-md shadow-emerald-500/40" />
                          <div className="absolute w-7 h-7 rounded-full border-2 border-emerald-500 animate-ping opacity-75" />
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-900" />
                      )}
                    </div>

                    {/* Station Info & Predictions - Clean, Normal Text with Only Predicted Time Slightly Bold */}
                    <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 tracking-tight truncate block">
                            {(!isTrainNotDeparted && !isTrainCompleted && isCurrent) ? `${t('en_route')} ${tStation(stop.station_name)}` : tStation(stop.station_name)}
                          </span>
                          {isTrainCompleted && isDestStop ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{t('arrived')}</span>
                            </span>
                          ) : isTrainNotDeparted && isOriginStop ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>{t('yet_to_depart')}</span>
                            </span>
                          ) : (!isTrainCompleted && isCurrent) ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>LIVE LOCATION</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-normal uppercase text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md shrink-0">
                              {t(stop.role) || stop.role}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm mt-1 font-normal">
                          {isTrainCompleted && isDestStop ? (
                            <span className="text-emerald-700 dark:text-emerald-300">
                              <span>{t('arrived_at')}</span>{' '}
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {stop.actual_time || stop.scheduled_time} IST
                              </span>
                              <span className="mx-1 text-gray-400 dark:text-gray-600">·</span>
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                {Math.round(stop.delay_min || 0) <= 0 ? t('on_time') : `+${Math.round(stop.delay_min)}m delayed`}
                              </span>
                              <span className="mx-1 text-gray-400 dark:text-gray-600">·</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {t('reached_final_station')}
                              </span>
                            </span>
                          ) : isTrainNotDeparted ? (
                            isOriginStop ? (
                              <span className="text-amber-700 dark:text-amber-300">
                                <span>{t('scheduled_departure')}</span>{' '}
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {stop.scheduled_time} IST
                                </span>
                                <span className="mx-1 text-gray-400 dark:text-gray-600">·</span>
                                <span className="font-medium text-amber-600 dark:text-amber-400">
                                  {t('not_departed_yet')}
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">
                                <span>{t('scheduled')}</span>{' '}
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  {stop.scheduled_time}
                                </span>
                                <span className="mx-1 text-gray-400 dark:text-gray-600">·</span>
                                <span>
                                  {t('journey_yet_to_start')}
                                </span>
                              </span>
                            )
                          ) : (isDeparted || (isTrainCompleted && !isDestStop)) ? (
                            <>
                              <span className="text-gray-500 dark:text-gray-400">{t('departed')}</span>{' '}
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {stop.actual_time || stop.scheduled_time}
                              </span>
                              <span className="mx-1 text-gray-400 dark:text-gray-600">·</span>
                              <span className={`font-normal ${Math.round(stop.delay_min || 0) <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {Math.round(stop.delay_min || 0) <= 0 ? t('on_time') : `+${Math.round(stop.delay_min)}m delayed`}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-gray-500 dark:text-gray-400">{t('predicted')}</span>{' '}
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {stop.predicted_time || stop.scheduled_time}
                              </span>
                              <span className="mx-1 text-gray-400 dark:text-gray-600">·</span>
                              <span className={`font-normal ${Math.round(stop.delay_min || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {Math.round(stop.delay_min || 0) > 0 ? `+${Math.round(stop.delay_min)}m delayed` : t('on_time')}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Visual Confidence Meter & Sleek Meter Badge */}
                      {stop.confidence_pct && (
                        <div className="text-right self-start sm:self-center shrink-0 flex flex-col items-end space-y-1">
                          <span className={`inline-flex items-center space-x-1.5 text-xs font-normal px-2.5 py-1 rounded-xl border shadow-2xs ${
                            stop.confidence_pct >= 85
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : stop.confidence_pct >= 70
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}>
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>{stop.confidence_pct}% {t('confidence')}</span>
                          </span>

                          {/* Confidence Progress Meter Bar */}
                          <div className="w-20 sm:w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                stop.confidence_pct >= 85
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                  : stop.confidence_pct >= 70
                                  ? 'bg-gradient-to-r from-blue-600 to-cyan-400'
                                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
                              }`}
                              style={{ width: `${stop.confidence_pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Floating AI Assistant Widget (Fixed Bottom-Right Corner) */}
      <FloatingAssistantWidget
        onNavigate={onNavigate}
      />

    </div>
  );
};
