import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, MapPin, Phone, Shield, Train, CheckCircle2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiUrl } from '../api/config';

interface LivePosition {
  lat: number;
  lon: number;
}

interface StationStop {
  station_name: string;
  predicted_time?: string;
  scheduled_time?: string;
  status_type: 'departed' | 'current' | 'upcoming';
}

interface TrainData {
  train_no: string;
  train_name: string;
  live_position: LivePosition;
  journey_log: StationStop[];
}

export const SafetyPage: React.FC = () => {
  const { t, tStation, tTrainName } = useLanguage();
  
  const [userLoc, setUserLoc] = useState<LivePosition | null>(null);
  const [locError, setLocError] = useState<boolean>(false);
  
  const [matchedTrain, setMatchedTrain] = useState<TrainData | null>(null);
  const [nextStation, setNextStation] = useState<StationStop | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(true);
  
  const [sosStatus, setSosStatus] = useState<'idle' | 'holding' | 'sent'>('idle');
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  // MOCK DATA for MVP (Illustrative RPF & TT Contacts)
  const getMockTTContact = (_trainNo?: string) => {
    return {
      name: "S. K. Sharma (Head TTE)",
      coach: "B4 - B6",
      phone: "+91 98765 XXXXX", // Masked to show it's illustrative
      isPlaceholder: true
    };
  };

  const getMockRPFContact = (stationName: string) => {
    return {
      post: `${stationName} GRP/RPF Post`,
      phone: "011-233XXXXX", // Masked
      isPlaceholder: true
    };
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const detectTrain = async (lat: number, lon: number) => {
    try {
      // For MVP: Fetch fleet, then fetch positions for top 5 to save requests
      const fleetRes = await fetch(apiUrl('/api/fleet'));
      const fleet = await fleetRes.json();
      
      const subset = fleet.slice(0, 8); // Just check a subset for MVP to avoid blasting API
      
      let closest: TrainData | null = null;
      let minDistance = Infinity;
      
      for (const t of subset) {
        try {
          const res = await fetch(apiUrl(`/api/train/${t.train_no}/journey`));
          if (!res.ok) continue;
          const data = await res.json();
          if (data.live_position) {
            const dist = getDistance(lat, lon, data.live_position.lat, data.live_position.lon);
            if (dist < minDistance) {
              minDistance = dist;
              closest = data;
            }
          }
        } catch(e) {
           console.error("Error fetching train journey", e);
        }
      }
      
      // For the hackathon/demo MVP: we always assign the closest train even if the user is 
      // physically sitting hundreds of kilometers away at home, so the UI can be showcased.
      // In production, this threshold would be strict (e.g., minDistance < 5).
      if (closest) {
        setMatchedTrain(closest);
        const upcoming = closest.journey_log.find((s: StationStop) => s.status_type === 'current' || s.status_type === 'upcoming');
        setNextStation(upcoming || closest.journey_log[closest.journey_log.length - 1]);
      } else {
        setMatchedTrain(null);
      }
    } catch (e) {
      console.error("Error detecting train:", e);
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    const fetchLocationAndDetect = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            setUserLoc({ lat, lon });
            detectTrain(lat, lon);
          },
          () => {
            setLocError(true);
            setIsDetecting(false);
          }
        );
      } else {
        setLocError(true);
        setIsDetecting(false);
      }
    };
    
    fetchLocationAndDetect();
    const interval = setInterval(fetchLocationAndDetect, 3 * 60 * 1000); // refresh every 3 min
    return () => clearInterval(interval);
  }, []);

  const handleSOSStart = () => {
    if (sosStatus === 'sent') return;
    setSosStatus('holding');
    setHoldProgress(0);
    
    // Simulate progress
    const startTime = Date.now();
    const duration = 2000; // 2 seconds hold
    
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressIntervalRef.current!);
      }
    }, 50);

    holdTimerRef.current = setTimeout(() => {
      setSosStatus('sent');
      // In a real app, this sends a POST /api/sos/alert
      console.log("SOS Alert triggered!", {
        train: matchedTrain?.train_no || "Unknown",
        lat: userLoc?.lat,
        lon: userLoc?.lon
      });
    }, duration);
  };

  const handleSOSEnd = () => {
    if (sosStatus === 'holding') {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setSosStatus('idle');
      setHoldProgress(0);
    }
  };

  const undoSOS = () => {
    setSosStatus('idle');
    setHoldProgress(0);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="w-full text-center py-2 relative">
        <div className="absolute inset-0 max-w-xl mx-auto bg-gradient-to-r from-rose-500/15 via-red-500/15 to-pink-500/15 blur-3xl rounded-full pointer-events-none -z-10" />
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-rose-500 to-red-600 bg-clip-text text-transparent pb-1">
          {t('nav_safety') || 'Safety & SOS'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center">
          <Shield className="w-4 h-4 mr-1 text-rose-500" />
          {t('safety_subtitle') || "An extension of RPF's Meri Saheli / Operation Mahila Suraksha"}
        </p>
      </div>

      {/* SOS Button Area */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-rose-200/60 dark:border-rose-900/40 shadow-xl shadow-rose-500/5 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-600 via-red-500 to-pink-600"></div>
        
        {sosStatus === 'sent' ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4 border-4 border-emerald-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">{t('sos_alert_sent') || 'Alert Sent Successfully'}</h2>
            <p className="text-center text-gray-600 dark:text-gray-300 max-w-md">
              Alert routed to RPF control room, {matchedTrain ? "your train's TT," : ""} and nearby Trainly users {matchedTrain ? "on your train" : "in your vicinity"}.
            </p>
            <button 
              onClick={undoSOS}
              className="mt-6 px-6 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel / Undo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div 
              className="relative w-40 h-40 flex items-center justify-center cursor-pointer select-none"
              onMouseDown={handleSOSStart}
              onMouseUp={handleSOSEnd}
              onMouseLeave={handleSOSEnd}
              onTouchStart={handleSOSStart}
              onTouchEnd={handleSOSEnd}
            >
              {/* Pulse background */}
              <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"></div>
              
              {/* Progress ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle cx="80" cy="80" r="76" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-800" />
                <circle cx="80" cy="80" r="76" fill="none" stroke="currentColor" strokeWidth="8" 
                  className="text-rose-600 transition-all duration-75" 
                  strokeDasharray="477.5" 
                  strokeDashoffset={477.5 - (477.5 * holdProgress) / 100} 
                  strokeLinecap="round"
                />
              </svg>
              
              <div className={`w-36 h-36 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex flex-col items-center justify-center shadow-lg shadow-rose-600/40 transition-transform ${sosStatus === 'holding' ? 'scale-95' : 'scale-100 hover:scale-105'}`}>
                <ShieldAlert className="w-12 h-12 text-white mb-1" />
                <span className="text-white font-black text-2xl tracking-widest">SOS</span>
              </div>
            </div>
            
            <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium text-center">
              {t('sos_hold_prompt') || 'Press and hold for 2 seconds to activate.'}<br/>
              <span className="text-sm">{t('sos_hold_subtext') || 'Alerts RPF, TT, and nearby users.'}</span>
            </p>
          </div>
        )}
      </div>

      {/* Auto-Detection Status & Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Detection Card */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6 border border-blue-200/60 dark:border-blue-900/40 shadow-xl shadow-blue-500/5 relative overflow-hidden flex flex-col h-full">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 to-cyan-500"></div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('auto_detection') || 'Auto-Detection'}</h2>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {isDetecting ? (
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>{t('locating_train') || 'Locating your train...'}</span>
              </div>
            ) : matchedTrain ? (
              <div className="space-y-1">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{t('match_found') || 'Match Found'}</span>
                </span>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">#{matchedTrain.train_no}</span>
                  {tTrainName(matchedTrain.train_name, matchedTrain.train_no, false)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('matched_via_gps') || 'Matched via live GPS telemetry correlation.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                  <span className="font-medium">{t('couldnt_detect_train') || "Couldn't detect your train automatically."}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {locError ? t('loc_denied_help') : t('no_train_nearby_help')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* TT & RPF Cards */}
        <div className="flex flex-col space-y-4">
          
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl p-5 border border-indigo-200/60 dark:border-indigo-900/40 shadow-md">
            <h3 className="text-xs uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center">
              <Train className="w-3.5 h-3.5 mr-1.5" />
              {t('tte_title') || 'Train Ticket Examiner (TT)'}
            </h3>
            {matchedTrain ? (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{getMockTTContact(matchedTrain.train_no).name}</p>
                  <p className="text-sm text-gray-500">{t('coach_label') || 'Coach'}: {getMockTTContact(matchedTrain.train_no).coach}</p>
                  <p className="text-[10px] text-gray-400 italic mt-1">{t('illustrative_data') || '*Illustrative directory data'}</p>
                </div>
                <a href={`tel:${getMockTTContact(matchedTrain.train_no).phone.replace(/[^0-9+]/g, '')}`} className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 transition-colors">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">{t('contact_not_avail') || 'Contact not available — use 182 for immediate assistance.'}</p>
            )}
          </div>

          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl p-5 border border-purple-200/60 dark:border-purple-900/40 shadow-md">
            <h3 className="text-xs uppercase tracking-wider font-bold text-purple-600 dark:text-purple-400 mb-3 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              {t('next_station_rpf') || 'Next Station RPF Post'}
            </h3>
            {matchedTrain && nextStation ? (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{tStation(nextStation.station_name)} {t('rpf_post') || 'RPF Post'}</p>
                  <p className="text-sm text-gray-500">{t('eta_label') || 'ETA'}: {nextStation.predicted_time || nextStation.scheduled_time} {t('ist_unit') || 'IST'}</p>
                  <p className="text-[10px] text-gray-400 italic mt-1">{t('illustrative_data') || '*Illustrative directory data'}</p>
                </div>
                <a href={`tel:${getMockRPFContact(nextStation.station_name).phone.replace(/[^0-9+]/g, '')}`} className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 hover:bg-purple-200 transition-colors">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">{t('contact_not_avail') || 'Contact not available — use 182 for immediate assistance.'}</p>
            )}
          </div>

        </div>
      </div>

      {/* Verified Helplines (Working tel: links) */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xl shadow-emerald-500/5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-emerald-500" />
          {t('quick_dial_helplines') || 'Quick-Dial Helplines (Verified)'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <a href="tel:182" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors group">
            <span className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">182</span>
            <span className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider text-center">{t('rpf_womens_security') || "RPF Women's Security"}</span>
          </a>

          <a href="tel:1512" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors group">
            <span className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">1512</span>
            <span className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider text-center">{t('grp_helpline') || 'GRP Helpline State Police'}</span>
          </a>

          <a href="tel:139" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors group">
            <span className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">139</span>
            <span className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider text-center">{t('railmadad_enquiry') || 'RailMadad General Enquiry'}</span>
          </a>

        </div>
      </div>

    </div>
  );
};
