import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Clock, MapPin, ChevronDown, Check, Search, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface StationStop {
  station_code?: string;
  station_name: string;
  lat: number;
  lon: number;
  predicted_time?: string;
  scheduled_time: string;
  delay_min?: number;
  confidence_pct?: number | null;
  status_type?: 'departed' | 'current' | 'upcoming';
  role?: string;
  distanceKm?: number | null;
}

interface LeaveHomeByBannerProps {
  journeyLog?: StationStop[];
  boardingStation?: StationStop | null;
}

// Haversine formula for distance in kilometers (reused from Safety auto-detection)
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const LeaveHomeByBanner: React.FC<LeaveHomeByBannerProps> = ({
  journeyLog,
  boardingStation: manualPropStation,
}) => {
  const { t, tStation } = useLanguage();

  // Location state
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);

  // Station selection state (auto-determined nearest with manual override option)
  const [selectedStationName, setSelectedStationName] = useState<string | null>(null);
  const [isStationDropdownOpen, setIsStationDropdownOpen] = useState<boolean>(false);
  const [nearestDistanceKm, setNearestDistanceKm] = useState<number | null>(null);
  const [stationSearch, setStationSearch] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStationDropdownOpen(false);
        setStationSearch('');
      }
    };
    if (isStationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStationDropdownOpen]);

  // Traffic / Drive-time state
  const [driveTimeMinutes, setDriveTimeMinutes] = useState<number | null>(null);
  const [trafficCondition, setTrafficCondition] = useState<'Light' | 'Moderate' | 'Heavy'>('Light');

  // Safety buffer in minutes
  const BUFFER_MINUTES = 15;

  // 1. Get user's location (device location) on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLoc({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setIsLocating(false);
        },
        () => {
          setLocError(t('enable_location_prompt') || 'Enable location to see when to leave.');
          setIsLocating(false);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      setLocError('Location not supported by browser.');
      setIsLocating(false);
    }
  }, [t]);

  // 2. Automatically determine nearest station along the selected train's route
  const stationsList = useMemo(() => {
    if (journeyLog && journeyLog.length > 0) return journeyLog;
    if (manualPropStation) return [manualPropStation];
    return [];
  }, [journeyLog, manualPropStation]);

  // Compute individual distance for every station on the route based on user coordinates
  const stationsWithDistance = useMemo(() => {
    if (!stationsList || stationsList.length === 0) return [];

    return stationsList.map((stn) => {
      let dist: number | null = null;
      if (userLoc && typeof stn.lat === 'number' && typeof stn.lon === 'number') {
        dist = Math.round(getDistanceKm(userLoc.lat, userLoc.lon, stn.lat, stn.lon) * 10) / 10;
        console.log(`[NearestStationCalc] Station: ${stn.station_name} (${stn.lat}, ${stn.lon}) | Distance: ${dist} km`);
      }
      return {
        ...stn,
        distanceKm: dist,
      };
    });
  }, [stationsList, userLoc]);

  useEffect(() => {
    if (!stationsWithDistance || stationsWithDistance.length === 0) return;

    if (userLoc) {
      let closestStation: StationStop = stationsWithDistance[0];
      let minDistance = Infinity;

      for (const stn of stationsWithDistance) {
        if (typeof stn.distanceKm === 'number' && stn.distanceKm < minDistance) {
          minDistance = stn.distanceKm;
          closestStation = stn;
        }
      }

      console.log(`[NearestStationCalc] Selected nearest station: ${closestStation.station_name} at ${closestStation.distanceKm} km (min: ${minDistance} km)`);
      setNearestDistanceKm(closestStation.distanceKm ?? null);

      // Only set auto station if user has not manually selected another station or if the previous selection is invalid
      setSelectedStationName((prev) => {
        if (prev && stationsWithDistance.some((s) => s.station_name === prev)) {
          return prev;
        }
        return closestStation.station_name;
      });
    } else {
      // Fallback: Default to first upcoming or first route station
      setSelectedStationName((prev) => {
        if (prev && stationsWithDistance.some((s) => s.station_name === prev)) {
          return prev;
        }
        return stationsWithDistance[0]?.station_name || null;
      });
    }
  }, [userLoc, stationsWithDistance]);

  // The active station object, continuously refreshed with live journey updates
  const activeStation = useMemo(() => {
    if (!stationsWithDistance || stationsWithDistance.length === 0) return null;
    return stationsWithDistance.find((s) => s.station_name === selectedStationName) || stationsWithDistance[0];
  }, [stationsWithDistance, selectedStationName]);

  // Filtered station list based on user search query (matching English or localized names, or station code)
  const filteredStations = useMemo(() => {
    if (!stationSearch.trim()) return stationsWithDistance;
    const query = stationSearch.toLowerCase().trim();
    return stationsWithDistance.filter((stn) => {
      const enName = (stn.station_name || '').toLowerCase();
      const localizedName = (tStation(stn.station_name) || '').toLowerCase();
      const code = (stn.station_code || '').toLowerCase();
      return enName.includes(query) || localizedName.includes(query) || code.includes(query);
    });
  }, [stationsWithDistance, stationSearch, tStation]);

  // 3. Traffic / Drive-Time Fetcher: Runs on a SLOWER, fixed cadence (every 3-5 mins)
  const fetchTrafficData = useCallback(async () => {
    if (!userLoc || !activeStation || !activeStation.lat || !activeStation.lon) return;

    try {
      // Using OSRM (Open Source Routing Machine API) for real-time driving road network metrics
      const url = `https://router.project-osrm.org/route/v1/driving/${userLoc.lon},${userLoc.lat};${activeStation.lon},${activeStation.lat}?overview=false`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const durationSeconds = data.routes[0].duration;
        const minutes = Math.max(1, Math.round(durationSeconds / 60));
        setDriveTimeMinutes(minutes);

        // Derive traffic condition based on trip duration profile
        if (minutes > 55) {
          setTrafficCondition('Heavy');
        } else if (minutes > 25) {
          setTrafficCondition('Moderate');
        } else {
          setTrafficCondition('Light');
        }
      } else {
        // Fallback drive time approximation based on direct distance if road routing is unavailable
        const distKm = getDistanceKm(userLoc.lat, userLoc.lon, activeStation.lat, activeStation.lon);
        const approxMinutes = Math.max(5, Math.round((distKm / 35) * 60));
        setDriveTimeMinutes(approxMinutes);
        setTrafficCondition('Moderate');
      }
    } catch (err) {
      console.warn('Failed to query live traffic route:', err);
      // Fallback approximation
      const distKm = getDistanceKm(userLoc.lat, userLoc.lon, activeStation.lat, activeStation.lon);
      const approxMinutes = Math.max(5, Math.round((distKm / 35) * 60));
      setDriveTimeMinutes(approxMinutes);
    }
  }, [userLoc, activeStation?.lat, activeStation?.lon, activeStation?.station_name]);

  // Initial and slow interval traffic updates (every 3.5 minutes = 210,000 ms)
  useEffect(() => {
    if (userLoc && activeStation) {
      fetchTrafficData();
      const intervalId = setInterval(fetchTrafficData, 3.5 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [userLoc, activeStation?.lat, activeStation?.lon, fetchTrafficData]);

  // 4. IMMEDIATE EVENT-DRIVEN LEAVE-BY RECALCULATION
  // Re-runs reactively the instant the activeStation's predicted_time or scheduled_time changes!
  const { leaveByTime, departureTimeStr, confidencePct } = useMemo(() => {
    if (!activeStation) {
      return { leaveByTime: null, departureTimeStr: null, confidencePct: null };
    }

    const timeStr = activeStation.predicted_time || activeStation.scheduled_time;
    if (!timeStr || driveTimeMinutes === null) {
      return {
        leaveByTime: null,
        departureTimeStr: timeStr,
        confidencePct: activeStation.confidence_pct ?? 92,
      };
    }

    // Parse HH:mm
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    let mins = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(mins)) {
      return { leaveByTime: null, departureTimeStr: timeStr, confidencePct: 92 };
    }

    // Subtract drive time + 15 min buffer
    const totalSubtract = driveTimeMinutes + BUFFER_MINUTES;
    mins -= totalSubtract;

    while (mins < 0) {
      mins += 60;
      hours -= 1;
    }
    while (hours < 0) {
      hours += 24;
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMins = mins.toString().padStart(2, '0');

    return {
      leaveByTime: `${displayHours}:${displayMins} ${ampm}`,
      departureTimeStr: timeStr,
      confidencePct: activeStation.confidence_pct ?? 92,
    };
  }, [activeStation?.predicted_time, activeStation?.scheduled_time, driveTimeMinutes, activeStation?.confidence_pct]);

  if (!stationsWithDistance || stationsWithDistance.length === 0) return null;

  return (
    <div className="w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xl shadow-emerald-500/5 relative flex flex-col mb-6 mt-2 z-20">
      {/* Visual Accent Top Bar - Distinct Emerald to Teal Gradient */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 rounded-t-3xl pointer-events-none"></div>

      {/* Main Content Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Icon + Headline */}
        <div className="flex items-center space-x-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 block leading-tight">
              {t('leave_home_by') || 'LEAVE HOME BY'}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mt-1">
              {leaveByTime ? (
                leaveByTime
              ) : isLocating ? (
                <span className="text-lg text-gray-400 font-medium animate-pulse">
                  {t('calculating') || 'Calculating...'}
                </span>
              ) : (
                <span className="text-xl text-gray-400 font-medium">--:--</span>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Four Compact Stats (matching Speed / Next Stop / Confidence chips) */}
        <div className="flex-1 w-full grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          
          {/* 1. Drive Time */}
          <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 block">
              {t('drive_time') || 'Drive Time'}
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block mt-0.5">
              {driveTimeMinutes !== null
                ? `${driveTimeMinutes} ${t('min_unit') || 'min'}`
                : isLocating
                ? '...'
                : 'N/A'}
            </span>
          </div>

          {/* 2. Buffer */}
          <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 block">
              {t('buffer_time') || 'Buffer'}
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block mt-0.5">
              {BUFFER_MINUTES} {t('min_unit') || 'min'}
            </span>
          </div>

          {/* 3. Departure */}
          <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 block">
              {t('departure_time') || 'Departure'}
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block mt-0.5">
              {departureTimeStr ? `${departureTimeStr} ${t('ist_unit') || 'IST'}` : '--:--'}
            </span>
          </div>

          {/* 4. Traffic Condition */}
          <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 block">
              {t('traffic_condition') || 'Traffic'}
            </span>
            <span
              className={`text-sm font-bold block mt-0.5 ${
                trafficCondition === 'Heavy'
                  ? 'text-rose-600'
                  : trafficCondition === 'Moderate'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {driveTimeMinutes !== null
                ? trafficCondition === 'Heavy'
                  ? t('traffic_heavy') || 'Heavy'
                  : trafficCondition === 'Moderate'
                  ? t('traffic_moderate') || 'Moderate'
                  : t('traffic_light') || 'Light'
                : 'N/A'}
            </span>
          </div>

        </div>

        {/* Right: Semicircle Confidence Gauge */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="relative w-16 h-8 overflow-hidden flex justify-center">
            {/* Background Arc */}
            <div className="absolute top-0 w-16 h-16 rounded-full border-[6px] border-gray-100 dark:border-gray-800 border-b-transparent border-r-transparent rotate-45"></div>
            {/* Value Arc */}
            <div
              className="absolute top-0 w-16 h-16 rounded-full border-[6px] border-emerald-500 border-b-transparent border-r-transparent rotate-45 transition-transform duration-700"
              style={{
                transform: `rotate(${45 + (180 * (confidencePct || 92)) / 100}deg)`,
              }}
            ></div>
          </div>
          <div className="text-center mt-1">
            <span className="text-sm font-black text-gray-900 dark:text-white block leading-none">
              {confidencePct ?? 92}%
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block">
              {t('confidence') || 'Confidence'}
            </span>
          </div>
        </div>

      </div>

      {/* Bottom Sub-Bar: Nearest Station Info & Manual Override Dropdown */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center justify-between text-xs text-gray-600 dark:text-gray-400 gap-2">
        <div className="flex items-center space-x-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {t('nearest_station') || 'Nearest Station'}:
            </span>{' '}
            {activeStation ? tStation(activeStation.station_name) : '...'}
            {(activeStation?.distanceKm ?? nearestDistanceKm) !== null && !isLocating && (
              <span className="text-gray-400 ml-1.5 font-normal">
                ({activeStation?.distanceKm ?? nearestDistanceKm} km {t('away') || 'away'})
              </span>
            )}
          </span>
          <span className="inline-block text-[10px] uppercase font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">
            {t('auto_matched') || 'Auto-matched'}
          </span>
        </div>

        {/* Change Boarding Station Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              const nextState = !isStationDropdownOpen;
              setIsStationDropdownOpen(nextState);
              if (!nextState) setStationSearch('');
            }}
            className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer focus:outline-none py-1 px-1.5 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-950/40 transition-colors"
          >
            <span>{t('change_station') || 'Change'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isStationDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStationDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/80 py-2.5 z-50 flex flex-col">
              {/* Header */}
              <div className="px-3.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                <span>{t('select_boarding_station') || 'Select Boarding Station'}</span>
                <span className="text-[10px] text-gray-400 font-normal">
                  ({filteredStations.length}{filteredStations.length !== stationsWithDistance.length ? ` / ${stationsWithDistance.length}` : ''} {t('stations') || 'stations'})
                </span>
              </div>

              {/* Station Search Input */}
              <div className="px-2.5 py-2 border-b border-gray-100 dark:border-gray-800/80">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={stationSearch}
                    onChange={(e) => setStationSearch(e.target.value)}
                    placeholder={t('search_station') || 'Search station...'}
                    autoFocus
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  {stationSearch && (
                    <button
                      type="button"
                      onClick={() => setStationSearch('')}
                      className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Station List */}
              <div className="space-y-1 px-1.5 pt-1.5 max-h-60 overflow-y-auto">
                {filteredStations.length > 0 ? (
                  filteredStations.map((stn) => {
                    const isSelected = stn.station_name === activeStation?.station_name;
                    return (
                      <button
                        key={stn.station_name}
                        type="button"
                        onClick={() => {
                          setSelectedStationName(stn.station_name);
                          setIsStationDropdownOpen(false);
                          setStationSearch('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800'
                            : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/80'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                          <span className="truncate">{tStation(stn.station_name)}</span>
                          {stn.distanceKm !== null && stn.distanceKm !== undefined && (
                            <span
                              className={`text-[11px] font-medium shrink-0 ${
                                isSelected
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              ({stn.distanceKm} km)
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-5 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {t('no_stations_found') || 'No stations found'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Graceful Fallback Notice if location permissions denied */}
      {locError && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium px-1 flex items-center">
          <MapPin className="w-3 h-3 mr-1 shrink-0" />
          <span>{locError}</span>
        </div>
      )}
    </div>
  );
};
