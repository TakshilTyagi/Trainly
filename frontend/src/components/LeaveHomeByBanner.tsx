import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LeaveHomeByBannerProps {
  boardingStation: {
    station_name: string;
    lat: number;
    lon: number;
    predicted_time?: string;
    scheduled_time: string;
    delay_min: number;
    confidence_pct?: number | null;
  } | null;
}

export const LeaveHomeByBanner: React.FC<LeaveHomeByBannerProps> = ({ boardingStation }) => {
  const { t } = useLanguage();
  const [homeLocation, setHomeLocation] = useState<{lat: number, lon: number} | null>(null);
  const [driveTimeMinutes, setDriveTimeMinutes] = useState<number | null>(null);
  const [trafficCondition, setTrafficCondition] = useState<string>('Light');
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const BUFFER_MINUTES = 15;

  // 1. Get user location (once on mount)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHomeLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        () => {
          setLocationError("Enable location to see when to leave.");
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLocationError("Location not supported.");
    }
  }, []);

  // 2. Fetch traffic data on a slower cadence (every 3-5 mins)
  const fetchTrafficData = useCallback(async () => {
    if (!homeLocation || !boardingStation) return;
    
    try {
      // Using OSRM as a free, keyless maps/routing API for the MVP
      // Coordinates must be lon,lat
      const url = `https://router.project-osrm.org/route/v1/driving/${homeLocation.lon},${homeLocation.lat};${boardingStation.lon},${boardingStation.lat}?overview=false`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const durationSeconds = data.routes[0].duration;
        const minutes = Math.round(durationSeconds / 60);
        setDriveTimeMinutes(minutes);
        
        // Mock traffic condition based on duration (since OSRM doesn't have live traffic)
        // In a real app with Google Maps, you'd compare duration_in_traffic with standard duration
        if (minutes > 60) setTrafficCondition('Heavy');
        else if (minutes > 30) setTrafficCondition('Moderate');
        else setTrafficCondition('Light');
      }
    } catch (e) {
      console.error("Failed to fetch route data", e);
    }
  }, [homeLocation, boardingStation?.lat, boardingStation?.lon]);

  useEffect(() => {
    if (homeLocation && boardingStation) {
      fetchTrafficData();
      
      // Slow interval for traffic (3 minutes)
      const intervalId = setInterval(fetchTrafficData, 3 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [homeLocation, boardingStation?.lat, boardingStation?.lon, fetchTrafficData]);

  // 3. Immediately recalculate leave-by time when train prediction changes
  const { leaveByTime, departureTimeStr, confidence } = useMemo(() => {
    if (!boardingStation) return { leaveByTime: null, departureTimeStr: null, confidence: null };
    
    const timeStr = boardingStation.predicted_time || boardingStation.scheduled_time;
    if (!timeStr || driveTimeMinutes === null) return { leaveByTime: null, departureTimeStr: timeStr, confidence: boardingStation.confidence_pct };
    
    // Parse HH:mm
    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = parseInt(hoursStr, 10);
    let mins = parseInt(minutesStr, 10);
    
    // Subtract drive time + buffer
    const totalSubtractMins = driveTimeMinutes + BUFFER_MINUTES;
    
    mins -= totalSubtractMins;
    while (mins < 0) {
      mins += 60;
      hours -= 1;
    }
    if (hours < 0) hours += 24;
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMins = mins.toString().padStart(2, '0');
    
    return {
      leaveByTime: `${displayHours}:${displayMins} ${ampm}`,
      departureTimeStr: timeStr,
      confidence: boardingStation.confidence_pct
    };
  }, [boardingStation?.predicted_time, boardingStation?.scheduled_time, driveTimeMinutes]); // Only depends on fast train updates + slow traffic updates

  if (!boardingStation) return null;

  return (
    <div className="w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xl shadow-emerald-500/5 relative overflow-hidden flex flex-col mb-6 mt-2">
      {/* Colorful top border bar - visually distinct from other cards */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500"></div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Icon + Headline */}
        <div className="flex items-center space-x-4 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 block leading-tight">
              {t('leave_home_by') || 'Leave Home By'}
            </span>
            <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mt-1">
              {leaveByTime || (locationError ? <span className="text-xl text-gray-400 font-medium">--:--</span> : <span className="text-xl text-gray-400 font-medium animate-pulse">{t('calculating') || 'Calculating...'}</span>)}
            </div>
          </div>
        </div>

        {/* Middle: Four compact stats */}
        <div className="flex-1 w-full grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          
          <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 block">{t('drive_time') || 'Drive Time'}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block mt-0.5">
              {driveTimeMinutes !== null ? `${driveTimeMinutes} ${t('min_unit')}` : (locationError ? 'N/A' : '...')}
            </span>
          </div>

          <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 block">{t('buffer_time') || 'Buffer'}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block mt-0.5">{BUFFER_MINUTES} {t('min_unit')}</span>
          </div>

          <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 block">{t('departure_time') || 'Departure'}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block mt-0.5">{departureTimeStr} {t('ist_unit')}</span>
          </div>

          <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 block">{t('traffic_condition') || 'Traffic'}</span>
            <span className={`text-sm font-bold block mt-0.5 ${trafficCondition === 'Heavy' ? 'text-rose-600' : trafficCondition === 'Moderate' ? 'text-amber-600' : 'text-emerald-600'}`}>
              {driveTimeMinutes !== null 
                ? (trafficCondition === 'Heavy' ? t('traffic_heavy') : trafficCondition === 'Moderate' ? t('traffic_moderate') : t('traffic_light')) 
                : 'N/A'}
            </span>
          </div>
          
        </div>

        {/* Right: Confidence gauge */}
        {confidence !== null && confidence !== undefined && (
          <div className="shrink-0 flex flex-col items-center">
             <div className="relative w-16 h-8 overflow-hidden flex justify-center">
               <div className="absolute top-0 w-16 h-16 rounded-full border-[6px] border-gray-100 dark:border-gray-800 border-b-transparent border-r-transparent rotate-45"></div>
               <div className="absolute top-0 w-16 h-16 rounded-full border-[6px] border-emerald-500 border-b-transparent border-r-transparent rotate-45 transition-transform duration-1000" style={{ transform: `rotate(${45 + (180 * (confidence || 0) / 100)}deg)` }}></div>
             </div>
             <div className="text-center mt-1">
               <span className="text-sm font-black text-gray-900 dark:text-white block leading-none">{confidence}%</span>
               <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block">{t('confidence') || 'Confidence'}</span>
             </div>
          </div>
        )}

      </div>
      
      {locationError && (
        <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium px-2 flex items-center">
          <MapPin className="w-3 h-3 mr-1" />
          {t('enable_location_prompt') || locationError}
        </div>
      )}
    </div>
  );
};
