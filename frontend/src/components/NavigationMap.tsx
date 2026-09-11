import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Locate, Maximize2, Layers } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface NavigationMapProps {
  routePoints: Array<{ lat: number; lon: number; name: string; code: string }>;
  currentPosition: { lat: number; lon: number; speed_kmh: number; current_section: string };
  statusLabel: string;
  scrollProgress?: number;
  activeStationIdx?: number;
  trainNo?: string;
  trainName?: string;
  onSelectStation?: (index: number) => void;
  className?: string;
}

const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;
  const deltaLambda = (lon2 - lon1) * toRad;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return (theta * toDeg + 360) % 360;
};

const getTrackBearing = (
  pos: { lat: number; lon: number },
  points: Array<{ lat: number; lon: number }>
): number => {
  if (!points || points.length < 2) return 45;
  let bestIdx = 0;
  let minDistance = Infinity;

  for (let i = 0; i < points.length - 1; i++) {
    const midLat = (points[i].lat + points[i + 1].lat) / 2;
    const midLon = (points[i].lon + points[i + 1].lon) / 2;
    const dist = Math.hypot(pos.lat - midLat, pos.lon - midLon);
    if (dist < minDistance) {
      minDistance = dist;
      bestIdx = i;
    }
  }

  return calculateBearing(
    points[bestIdx].lat,
    points[bestIdx].lon,
    points[bestIdx + 1].lat,
    points[bestIdx + 1].lon
  );
};

export const NavigationMap: React.FC<NavigationMapProps> = ({
  routePoints,
  currentPosition,
  statusLabel,
  activeStationIdx = 0,
  trainNo,
  trainName,
  onSelectStation,
  className,
}) => {
  const { theme } = useTheme();
  const { t, tStation } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLabelsRef = useRef<L.TileLayer | null>(null);
  const satelliteTransportRef = useRef<L.TileLayer | null>(null);
  const trainMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const glowPolylineRef = useRef<L.Polyline | null>(null);
  const stationMarkersRef = useRef<L.CircleMarker[]>([]);
  const currentCoordRef = useRef<{ lat: number; lon: number }>({
    lat: currentPosition.lat,
    lon: currentPosition.lon,
  });
  const targetCoordRef = useRef<{ lat: number; lon: number }>({
    lat: currentPosition.lat,
    lon: currentPosition.lon,
  });
  const animFrameRef = useRef<number | null>(null);

  const [mapStyle, setMapStyle] = useState<'default' | 'satellite'>('default');

  // Static High-Fidelity Train Symbol (Real Current Location)
  const createTrainIcon = (bearing: number, speed: number, tNo?: string, tName?: string) => {
    const displayName = tNo ? `${tNo}` : (tName || 'Train');
    const displaySpeed = `${Math.round(speed)} km/h`;
    const idPrefix = (tNo || 'sim').replace(/\D/g, '') || 'train';

    return L.divIcon({
      className: 'train-custom-nav-icon',
      html: `
        <div class="relative flex items-center justify-center pointer-events-none select-none" style="width: 96px; height: 96px;">
          
          <!-- Concentric Live GPS Sonar Ping -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-14 h-14 rounded-full bg-cyan-400/25 border border-cyan-400/50 animate-ping"></div>
            <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 blur-xs"></div>
          </div>

          <!-- Oriented to Track Direction -->
          <div class="train-bearing-rotate relative flex items-center justify-center transition-transform duration-150 ease-linear" style="transform: rotate(${Math.round(bearing)}deg);">
            
            <!-- Miniature Express Train Vehicle -->
            <div class="relative flex items-center justify-center">

              <svg
                width="44"
                height="86"
                viewBox="0 0 48 92"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="overflow-visible filter drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]"
              >
                <defs>
                  <!-- Headlight Projection Beam Gradient -->
                  <linearGradient id="trainBeamGrad_${idPrefix}" x1="24" y1="28" x2="24" y2="-10" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
                    <stop offset="40%" stop-color="#fef08a" stop-opacity="0.5" />
                    <stop offset="100%" stop-color="#fef08a" stop-opacity="0" />
                  </linearGradient>

                  <!-- Locomotive Shell Gradient -->
                  <linearGradient id="trainLocoShell_${idPrefix}" x1="12" y1="22" x2="36" y2="52" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#0284c7" />
                    <stop offset="45%" stop-color="#1e40af" />
                    <stop offset="100%" stop-color="#172554" />
                  </linearGradient>

                  <!-- Carriage Shell Gradient -->
                  <linearGradient id="trainCoachShell_${idPrefix}" x1="14" y1="56" x2="34" y2="78" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#1e40af" />
                    <stop offset="100%" stop-color="#0f172a" />
                  </linearGradient>
                </defs>

                <!-- 1. HEADLIGHT CONE BEAM (Projected on track) -->
                <polygon
                  points="24,24 4,-10 44,-10"
                  fill="url(#trainBeamGrad_${idPrefix})"
                  opacity="0.75"
                />

                <!-- 2. STEEL WHEELS / BOGIES -->
                <rect x="9.5" y="30" width="3" height="7" rx="1.5" fill="#1e293b" />
                <rect x="35.5" y="30" width="3" height="7" rx="1.5" fill="#1e293b" />
                <rect x="9.5" y="44" width="3" height="7" rx="1.5" fill="#1e293b" />
                <rect x="35.5" y="44" width="3" height="7" rx="1.5" fill="#1e293b" />
                <rect x="11" y="60" width="3" height="6.5" rx="1.5" fill="#1e293b" />
                <rect x="34" y="60" width="3" height="6.5" rx="1.5" fill="#1e293b" />
                <rect x="11" y="70" width="3" height="6.5" rx="1.5" fill="#1e293b" />
                <rect x="34" y="70" width="3" height="6.5" rx="1.5" fill="#1e293b" />

                <!-- 3. REAR PASSENGER CARRIAGE (COACH) -->
                <rect x="13" y="55" width="22" height="23" rx="3.5" fill="url(#trainCoachShell_${idPrefix})" stroke="#38bdf8" stroke-width="1.3" />
                <rect x="15" y="56.5" width="18" height="2" rx="1" fill="#93c5fd" opacity="0.85" />
                
                <!-- Illuminated Passenger Windows -->
                <rect x="15.5" y="60.5" width="4.5" height="5" rx="1" fill="#fef08a" />
                <rect x="28" y="60.5" width="4.5" height="5" rx="1" fill="#fef08a" />
                <rect x="15.5" y="69" width="4.5" height="5" rx="1" fill="#fef08a" />
                <rect x="28" y="69" width="4.5" height="5" rx="1" fill="#fef08a" />
                
                <!-- Side Gold Racing Stripe -->
                <line x1="13" y1="67" x2="35" y2="67" stroke="#f59e0b" stroke-width="1.6" />
                
                <!-- Rear Red Marker Lights -->
                <circle cx="15.5" cy="76" r="1.5" fill="#ef4444" />
                <circle cx="32.5" cy="76" r="1.5" fill="#ef4444" />

                <!-- 4. ACCORDION VESTIBULE COUPLER -->
                <rect x="19" y="51" width="10" height="4.5" rx="1" fill="#0f172a" stroke="#475569" stroke-width="1" />
                <line x1="20" y1="53" x2="28" y2="53" stroke="#94a3b8" stroke-width="0.8" />

                <!-- 5. LEAD LOCOMOTIVE ENGINE -->
                <path
                  d="M 12,51 L 12,28 C 12,18 17,12 24,12 C 31,12 36,18 36,28 L 36,51 Z"
                  fill="url(#trainLocoShell_${idPrefix})"
                  stroke="#60a5fa"
                  stroke-width="1.6"
                />

                <!-- Chrome Nose Cowcatcher -->
                <path d="M 16,18 Q 24,13 32,18" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9" />

                <!-- Cockpit Windshield Visor with Cyan Glass Glint -->
                <path
                  d="M 15,26 C 15,20.5 18.5,17 24,17 C 29.5,17 33,20.5 33,26 Z"
                  fill="#0284c7"
                  stroke="#38bdf8"
                  stroke-width="1.2"
                />
                <path d="M 18,22 Q 24,18.5 30,22" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" opacity="0.9" />

                <!-- Express Liveries: Vibrant Racing Stripes -->
                <rect x="12" y="32" width="24" height="2.2" fill="#f59e0b" />
                <rect x="12" y="37" width="24" height="1.8" fill="#38bdf8" />

                <!-- High-Speed Roof Equipment -->
                <rect x="20" y="41" width="8" height="7" rx="1.5" fill="#475569" stroke="#94a3b8" stroke-width="0.8" />
                <line x1="24" y1="42" x2="24" y2="47" stroke="#f1f5f9" stroke-width="1.5" stroke-linecap="round" />

                <!-- Dual High-Intensity Headlight Beacons -->
                <circle cx="17.5" cy="18" r="2.5" fill="#fef08a" stroke="#ffffff" stroke-width="1" />
                <circle cx="30.5" cy="18" r="2.5" fill="#fef08a" stroke="#ffffff" stroke-width="1" />
              </svg>

            </div>
          </div>

          <!-- Floating Navigation HUD Tag (Always upright above the train) -->
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-auto">
            <div class="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gray-950/95 dark:bg-gray-900/95 backdrop-blur-md text-white text-[11px] font-bold border border-cyan-400/60 shadow-xl ring-2 ring-black/40">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span class="text-cyan-300 font-extrabold tracking-tight train-hud-name">${displayName}</span>
              <span class="text-gray-500">•</span>
              <span class="text-amber-300 font-extrabold tracking-tight train-hud-speed">${displaySpeed}</span>
            </div>
          </div>

        </div>
      `,
      iconSize: [96, 96],
      iconAnchor: [48, 48],
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      trainMarkerRef.current = null;
      routePolylineRef.current = null;
      glowPolylineRef.current = null;
      stationMarkersRef.current = [];
    }

    const defaultCenter: [number, number] = routePoints.length > 0 
      ? [routePoints[0].lat, routePoints[0].lon]
      : [28.6139, 77.2090];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      trainMarkerRef.current = null;
    };
  }, []);

  // Update Base Tiles & Overlay Layers (100% Free OpenStreetMap & Refined Satellite with Places/Borders)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up existing tile layers
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (satelliteLabelsRef.current) {
      map.removeLayer(satelliteLabelsRef.current);
      satelliteLabelsRef.current = null;
    }
    if (satelliteTransportRef.current) {
      map.removeLayer(satelliteTransportRef.current);
      satelliteTransportRef.current = null;
    }

    if (mapStyle === 'satellite') {
      // 1. High-Resolution Esri World Imagery Satellite Base
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: '&copy; Esri World Imagery' }
      ).addTo(map);

      // 2. High-Contrast Boundaries and Place Names (Cities, Districts, States)
      satelliteLabelsRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, zIndex: 500 }
      ).addTo(map);

      // 3. Transportation Network (Railway Lines & Highways)
      satelliteTransportRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, zIndex: 501 }
      ).addTo(map);
    } else {
      // Standard Street View: OpenStreetMap (No API key, No watermarks, Complete Indian Railway & City details)
      const isDark = theme === 'dark';
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '&copy; OpenStreetMap contributors',
          className: isDark ? 'map-tiles-dark' : '',
        }
      ).addTo(map);
    }
  }, [mapStyle, theme]);

  // Update Route Polyline & Permanent Station Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || routePoints.length < 2) return;

    if (routePolylineRef.current) map.removeLayer(routePolylineRef.current);
    if (glowPolylineRef.current) map.removeLayer(glowPolylineRef.current);
    stationMarkersRef.current.forEach(m => map.removeLayer(m));
    stationMarkersRef.current = [];

    const latLngs = routePoints.map(p => [p.lat, p.lon] as [number, number]);
    const isSat = mapStyle === 'satellite';

    // Outer glow polyline (High contrast on satellite and street)
    glowPolylineRef.current = L.polyline(latLngs, {
      color: isSat ? '#38bdf8' : (theme === 'dark' ? '#0284c7' : '#3b82f6'),
      weight: isSat ? 9 : 8,
      opacity: isSat ? 0.6 : 0.35,
      lineCap: 'round',
    }).addTo(map);

    // Main Google Maps style navigation route track
    routePolylineRef.current = L.polyline(latLngs, {
      color: isSat ? '#00f0ff' : (theme === 'dark' ? '#38bdf8' : '#1d4ed8'),
      weight: isSat ? 5 : 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Station Nodes with Clear, Permanent Labels (Proper Locations)
    routePoints.forEach((stn, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === routePoints.length - 1;
      const isCurrent = idx === activeStationIdx;

      const marker = L.circleMarker([stn.lat, stn.lon], {
        radius: isCurrent ? 8 : (isFirst || isLast ? 7 : 5.5),
        fillColor: isCurrent ? '#2563eb' : (isFirst ? '#10b981' : isLast ? '#8b5cf6' : '#ffffff'),
        color: isSat ? '#ffffff' : (theme === 'dark' ? '#60a5fa' : '#1e3a8a'),
        weight: 2.5,
        fillOpacity: 1,
      }).addTo(map);

      // Station label tooltip - permanent so proper station locations are always clearly visible
      marker.bindTooltip(
        `<div class="font-bold text-[11px] px-1 py-0.5 tracking-tight">${tStation(stn.name)}</div>`,
        { permanent: true, direction: 'top', offset: [0, -8], className: 'station-tooltip' }
      );

      marker.on('click', () => {
        if (onSelectStation) onSelectStation(idx);
      });

      stationMarkersRef.current.push(marker);
    });
  }, [routePoints, theme, mapStyle, activeStationIdx]);

  // When train changes, cleanly recreate train marker & fly smoothly to route corridor
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (trainMarkerRef.current) {
      map.removeLayer(trainMarkerRef.current);
      trainMarkerRef.current = null;
    }

    currentCoordRef.current = { lat: currentPosition.lat, lon: currentPosition.lon };
    targetCoordRef.current = { lat: currentPosition.lat, lon: currentPosition.lon };

    const bearing = getTrackBearing(currentPosition, routePoints);
    const icon = createTrainIcon(bearing, currentPosition.speed_kmh, trainNo, trainName);
    trainMarkerRef.current = L.marker([currentPosition.lat, currentPosition.lon], { icon, zIndexOffset: 1000 }).addTo(map);

    if (routePoints.length > 0) {
      const latLngs = routePoints.map(p => [p.lat, p.lon] as [number, number]);
      map.flyToBounds(L.latLngBounds(latLngs), { padding: [50, 50], duration: 1.2 });
    }
  }, [trainNo]);

  // Handle telemetry position updates from backend
  useEffect(() => {
    targetCoordRef.current = { lat: currentPosition.lat, lon: currentPosition.lon };

    // Update floating HUD values immediately
    const el = trainMarkerRef.current?.getElement();
    if (el) {
      const speedEl = el.querySelector('.train-hud-speed');
      if (speedEl) speedEl.textContent = `${Math.round(currentPosition.speed_kmh)} km/h`;
      const nameEl = el.querySelector('.train-hud-name');
      if (nameEl) nameEl.textContent = trainNo ? `${trainNo}` : (trainName || 'Train');
    }
  }, [currentPosition.lat, currentPosition.lon, currentPosition.speed_kmh, trainNo, trainName]);

  // 60FPS continuous smooth gliding along tracks between GPS telemetry updates
  useEffect(() => {
    const animate = () => {
      const cur = currentCoordRef.current;
      const tgt = targetCoordRef.current;
      const dLat = tgt.lat - cur.lat;
      const dLon = tgt.lon - cur.lon;

      if (Math.abs(dLat) > 0.000002 || Math.abs(dLon) > 0.000002) {
        cur.lat += dLat * 0.05;
        cur.lon += dLon * 0.05;

        if (trainMarkerRef.current) {
          trainMarkerRef.current.setLatLng([cur.lat, cur.lon]);
          const bearing = getTrackBearing(cur, routePoints);
          const el = trainMarkerRef.current.getElement();
          if (el) {
            const rotEl = el.querySelector('.train-bearing-rotate') as HTMLElement;
            if (rotEl) rotEl.style.transform = `rotate(${Math.round(bearing)}deg)`;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [routePoints]);

  const handleCenterTrain = () => {
    const map = mapInstanceRef.current;
    if (map) {
      const cur = currentCoordRef.current;
      map.flyTo([cur.lat, cur.lon], 9, { duration: 1.0 });
    }
  };

  const handleFitRoute = () => {
    const map = mapInstanceRef.current;
    if (map && routePoints.length > 0) {
      const latLngs = routePoints.map(p => [p.lat, p.lon] as [number, number]);
      map.flyToBounds(L.latLngBounds(latLngs), { padding: [50, 50], duration: 1.0 });
    }
  };

  // ResizeObserver to invalidate map size whenever the container resizes
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl group ${className || 'h-[520px] sm:h-[600px] lg:h-[660px] xl:h-[720px]'}`}>
      
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-inherit" />

      {/* Top Floating Telemetry & Navigation Bar */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
        
        {/* Left: Speed & Section Pill */}
        <div className="pointer-events-auto flex items-center space-x-2.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-emerald-500/30 dark:border-emerald-500/40 shadow-lg shadow-emerald-500/5">
          <div className="relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="absolute w-5 h-5 rounded-full bg-emerald-400/40 animate-ping"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <span>LIVE GPS TRACKING ACTIVE</span>
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
              {currentPosition.speed_kmh} km/h · {statusLabel}
            </span>
          </div>
        </div>

        {/* Right: Map Action Controls (Google Maps Navigation Style) */}
        <div className="pointer-events-auto flex items-center space-x-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-md">
          
          {/* Toggle Satellite / Street Layer */}
          <button
            onClick={() => setMapStyle(mapStyle === 'default' ? 'satellite' : 'default')}
            title="Switch Map Tiles (Street / Satellite)"
            className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
              mapStyle === 'satellite'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Fit Route Button */}
          <button
            onClick={handleFitRoute}
            title={t('fit_route')}
            className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Center on Train Button */}
          <button
            onClick={handleCenterTrain}
            title={t('center_on_train')}
            className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Locate className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
