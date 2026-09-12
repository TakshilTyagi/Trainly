import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle2, ShieldCheck, ExternalLink, Activity, ShieldAlert, MapPin, Radio, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../api/config';

interface ControlRoomData {
  summary: {
    avg_fleet_delay_min: number;
    on_time_count: number;
    total_trains: number;
    active_alerts_count: number;
    avg_confidence_pct: number;
  };
  alerts: Array<{
    id: string;
    train_no: string;
    train_name: string;
    severity: string;
    title: string;
    issue?: string;
    confidence_pct?: number;
    passenger_report?: string;
    message: string;
    time_ago: string;
  }>;
  fleet_table: Array<{
    train_no: string;
    name: string;
    origin: string;
    destination: string;
    status_label: string;
    status_class: string;
    currently_near: string;
    next_station: string;
    next_eta: string;
    confidence_pct: number;
    speed_kmh: number;
  }>;
  bottlenecks: Array<{
    id: number;
    section_name: string;
    route_trains: string;
    avg_delay_min: number;
    congestion_pct: number;
    cause_summary: string;
  }>;
  recent_feedback: Array<{
    id: number;
    train_no: string;
    cause_tag: string;
    note: string;
    user_name: string;
    confirmations: number;
  }>;
  sos_alerts?: Array<{
    id: number;
    train_no: string;
    train_name: string;
    coach?: string | null;
    lat?: number | null;
    lon?: number | null;
    status: 'active' | 'acknowledged' | 'resolved';
    notified_destinations: string;
    user_id?: string;
    user_name?: string;
    acknowledged_by?: string | null;
    resolved_by?: string | null;
    created_at: string;
    updated_at: string;
    time_ago?: string;
  }>;
  api_access?: {
    endpoint: string;
    sample_response: Record<string, any>;
  };
}

export const ControlRoomPage: React.FC<{ onSelectTrain: (trainNo: string) => void }> = ({ onSelectTrain }) => {
  const { t, tStation, tTrainName, tSectionName, tStatusLabel, tDynamic, tAlertTitle, tAlertIssue, tPassengerReport, tTimeAgo } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<ControlRoomData | null>(null);
  const [updatingAlertId, setUpdatingAlertId] = useState<number | null>(null);

  const handleUpdateSOSStatus = async (alertId: number, nextStatus: 'acknowledged' | 'resolved') => {
    setUpdatingAlertId(alertId);
    const officialTitle = user?.name ? `${user.name} (${user.role === 'railway_official' ? 'Official' : 'Staff'})` : 'Railway Official';
    
    // Optimistic UI update
    setData((prev) => {
      if (!prev || !prev.sos_alerts) return prev;
      return {
        ...prev,
        sos_alerts: prev.sos_alerts.map((a) =>
          a.id === alertId
            ? {
                ...a,
                status: nextStatus,
                acknowledged_by: nextStatus === 'acknowledged' ? officialTitle : a.acknowledged_by,
                resolved_by: nextStatus === 'resolved' ? officialTitle : a.resolved_by,
              }
            : a
        ),
      };
    });

    try {
      const res = await fetch(apiUrl(`/api/control-room/sos/${alertId}/status`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          official_name: officialTitle,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.alert) {
          setData((prev) => {
            if (!prev || !prev.sos_alerts) return prev;
            return {
              ...prev,
              sos_alerts: prev.sos_alerts.map((a) => (a.id === alertId ? { ...a, ...json.alert } : a)),
            };
          });
        }
      }
    } catch (err) {
      console.error('Failed to update SOS alert status:', err);
    } finally {
      setUpdatingAlertId(null);
    }
  };

  const fetchControlRoom = async () => {
    try {
      const res = await fetch(apiUrl('/api/control-room'), { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          if (json && json.summary) {
            setData(json);
          }
        } catch (parseErr) {
          console.error('Non-JSON response for control room:', text.slice(0, 100));
        }
      }
    } catch (e) {
      console.error('Failed to load control room data:', e);
    }
  };

  useEffect(() => {
    fetchControlRoom();
    const interval = setInterval(fetchControlRoom, 6000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-16">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-6 space-y-4 sm:space-y-5">
      
      {/* Page Title Header (Centered Prominently like Mockup) */}
      <div className="w-full text-center py-1 sm:py-2 relative">
        <div className="absolute inset-0 max-w-xl mx-auto bg-gradient-to-r from-red-500/15 via-rose-500/15 to-amber-500/15 dark:from-red-500/25 dark:via-rose-500/25 dark:to-amber-500/25 blur-3xl rounded-full pointer-events-none -z-10" />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 bg-clip-text text-transparent pb-1">
          {t('control_room_title')}
        </h1>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-md">
            <Activity className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {t('dispatch_bottlenecks')}
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 rounded-xl shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{t('live_telemetry_connected')}</span>
        </div>
      </div>

      {/* 1. Vibrant 4-Metric Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Avg Fleet Delay */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('avg_fleet_delay')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              +{data.summary.avg_fleet_delay_min}m
            </span>
            <span className="block text-[11px] text-gray-400 font-semibold mt-0.5">
              {t('across_monitored_corridors')}
            </span>
          </div>
        </div>

        {/* Metric 2: On-Time Count */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('on_time_count')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {data.summary.on_time_count} / {data.summary.total_trains}
            </span>
            <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              {Math.round((data.summary.on_time_count / data.summary.total_trains) * 100)}% {t('punctuality_index')}
            </span>
          </div>
        </div>

        {/* Metric 3: Active Alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('active_alerts')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {data.summary.active_alerts_count}
            </span>
            <span className="block text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
              {t('requires_section_review')}
            </span>
          </div>
        </div>

        {/* Metric 4: Avg Confidence */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('avg_confidence')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-cyan-400 tracking-tight">
              {data.summary.avg_confidence_pct}%
            </span>
            <span className="block text-[11px] text-blue-600 dark:text-cyan-400 font-bold mt-0.5">
              {t('confidence_interval')}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Needs Attention Alerts Panel */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-black text-sm uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>{t('needs_attention')} ({data.alerts.length})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs text-rose-900 dark:text-rose-200">
                    #{alert.train_no} {tTrainName(alert.train_name, alert.train_no, true)} · {tAlertTitle(alert)}
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-black">
                    {tTimeAgo((alert as any).time_ago_secs !== undefined ? (alert as any).time_ago_secs : alert.time_ago)}
                  </span>
                </div>

                {/* 3 Explicit Lines: Line 1 Issue, Line 2 Confidence, Line 3 Passenger Report */}
                <div className="space-y-1.5 text-xs text-rose-800 dark:text-rose-300/90 font-medium">
                  {/* Line 1: Issue */}
                  <div className="leading-relaxed">
                    <span className="font-bold text-rose-950 dark:text-rose-100">{t('issue')}: </span>
                    <span>{tAlertIssue(alert)}</span>
                  </div>

                  {/* Line 2: Confidence */}
                  <div className="leading-relaxed">
                    <span className="font-bold text-rose-950 dark:text-rose-100">{t('confidence')}: </span>
                    <span className="font-bold text-rose-900 dark:text-rose-200">{alert.confidence_pct || 80}%</span>
                    <span className="text-[11px] text-rose-700/80 dark:text-rose-300/70 ml-1">({t('confidence_interval')})</span>
                  </div>

                  {/* Line 3: Passenger Report */}
                  <div className="leading-relaxed">
                    <span className="font-bold text-rose-950 dark:text-rose-100">{t('passenger_report')}: </span>
                    <span className={alert.passenger_report && alert.passenger_report !== 'No passenger reports yet' ? 'italic font-semibold' : 'text-rose-700/80 dark:text-rose-400/80'}>
                      {tPassengerReport(alert)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-rose-200/60 dark:border-rose-900/40 flex justify-end">
                <button
                  onClick={() => onSelectTrain(alert.train_no)}
                  className="text-xs font-black text-rose-700 dark:text-rose-300 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>{t('inspect_telemetry')}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Dense Fleet Status Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <h2 className="text-base font-black text-gray-900 dark:text-white">
          {t('fleet_status_table')}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">{t('train_col')}</th>
                <th className="pb-3">{t('route_col')}</th>
                <th className="pb-3">{t('current_near_col')}</th>
                <th className="pb-3">{t('next_stop_eta_col')}</th>
                <th className="pb-3">{t('delay_status_col')}</th>
                <th className="pb-3">{t('confidence')}</th>
                <th className="pb-3 pr-2 text-right">{t('action_col')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-semibold">
              {data.fleet_table.map((tRow) => (
                <tr key={tRow.train_no} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 pl-2 font-black text-gray-900 dark:text-white">
                    <span className="text-blue-600 dark:text-cyan-400 mr-1.5 font-bold">#{tRow.train_no}</span>
                    {tTrainName(tRow.name, tRow.train_no, true)}
                  </td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center">
                      <span>{tStation(tRow.origin)}</span>
                      <span className="text-blue-600 dark:text-cyan-400 font-black mx-1.5 select-none">→</span>
                      <span>{tStation(tRow.destination)}</span>
                    </span>
                  </td>
                  <td className="py-3 text-gray-800 dark:text-gray-200">
                    {tStation(tRow.currently_near)}
                  </td>
                  <td className="py-3 font-bold text-gray-900 dark:text-white">
                    {tStation(tRow.next_station)} ({tRow.next_eta})
                  </td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                      tRow.status_label.includes('On time')
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : tRow.status_label.includes('h')
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {tStatusLabel(tRow.status_label)}
                    </span>
                  </td>
                  <td className="py-3 font-black text-gray-900 dark:text-white">
                    {tRow.confidence_pct}%
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <button
                      onClick={() => onSelectTrain(tRow.train_no)}
                      className="text-blue-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
                    >
                      {t('track_btn')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Top Delay Sections (Bottlenecks) & Recent Passenger Feedback Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Top Delay Sections with Progress Bars */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-base font-black text-gray-900 dark:text-white">
            {t('top_delay_sections')}
          </h2>

          <div className="space-y-3">
            {data.bottlenecks.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs text-gray-900 dark:text-white">
                    {tSectionName(b.section_name)} <span className="text-gray-400 font-normal text-[10px]">({tTrainName(b.route_trains, undefined, false)})</span>
                  </h4>
                  <span className="font-black text-xs text-amber-600 dark:text-amber-400">
                    +{b.avg_delay_min}m {t('avg')}
                  </span>
                </div>

                {/* Congestion Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.congestion_pct > 75 ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-amber-500 to-yellow-500'
                    }`}
                    style={{ width: `${b.congestion_pct}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{tDynamic(b.cause_summary)}</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">{b.congestion_pct}% {t('congestion_label')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Aggregated Recent Feedback */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-base font-black text-gray-900 dark:text-white">
            {t('live_passenger_delay_stream')}
          </h2>

          <div className="space-y-3">
            {data.recent_feedback.slice(0, 4).map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-gray-800 dark:text-gray-200">
                    #{f.train_no} {tTrainName(f.train_no, f.train_no, true)} · <span className="text-blue-600 dark:text-cyan-400 font-black">{t(f.cause_tag.toLowerCase().replace(' ', '_')) || f.cause_tag}</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    ✓ {f.confirmations} {t('confirmed')}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-[11px] font-medium truncate">
                  "{tDynamic(f.note)}"
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. SOS Emergency Alerts Panel (RPF / TT / Passenger Dispatch Feed) */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 relative overflow-hidden">
        {/* Accent Top Bar - Crimson to Rose to Amber Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-red-500 to-amber-500"></div>

        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                  {t('sos_alerts') || 'SOS Alerts'}
                </h2>
                {((data.sos_alerts?.filter((a) => a.status === 'active').length || 0) > 0) ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 mr-1.5 animate-ping"></span>
                    {data.sos_alerts?.filter((a) => a.status === 'active').length} {t('active_now') || 'Active'}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                    {t('all_resolved') || 'All Resolved'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                {t('sos_panel_subtitle') || 'Passenger emergency triggers routed to RPF control room, train conductors & nearby users'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-3 py-1.5 rounded-xl border border-rose-200/60 dark:border-rose-900/40 shrink-0">
            <Radio className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
            <span>{t('live_dispatch_channel') || 'RPF & TT Emergency Dispatch'}</span>
          </div>
        </div>

        {/* SOS Feed / List View */}
        {(!data.sos_alerts || data.sos_alerts.length === 0) ? (
          <div className="py-12 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-gray-900 dark:text-white">
              {t('no_active_sos_alerts') || 'No active SOS alerts'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              {t('sos_clear_desc') || 'All passenger safety corridors and emergency dispatch channels are currently clear.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.sos_alerts.map((alert) => {
              const isActive = alert.status === 'active';
              const isAck = alert.status === 'acknowledged';
              const isResolved = alert.status === 'resolved';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all shadow-2xs ${
                    isActive
                      ? 'bg-rose-50/50 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                      : isAck
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                      : 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800/80 opacity-85'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    
                    {/* Left: Core Alert Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-ping"></span>
                            {t('status_active') || 'ACTIVE SOS'}
                          </span>
                        )}
                        {isAck && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                            <Check className="w-3 h-3 mr-1" />
                            {t('status_acknowledged') || 'ACKNOWLEDGED'}
                          </span>
                        )}
                        {isResolved && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t('status_resolved') || 'RESOLVED'}
                          </span>
                        )}

                        {/* Train Name & Number */}
                        <span className="font-black text-xs text-gray-900 dark:text-white">
                          {alert.train_no && alert.train_no !== 'Unknown' ? (
                            <>
                              <span className="text-blue-600 dark:text-cyan-400 mr-1 font-bold">#{alert.train_no}</span>
                              {tTrainName(alert.train_name, alert.train_no, true)}
                            </>
                          ) : (
                            <span className="text-gray-500 italic">Unknown Train</span>
                          )}
                        </span>

                        {/* Coach Identifier */}
                        {alert.coach && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-gray-200/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200">
                            {alert.coach}
                          </span>
                        )}

                        {/* Relative Timestamp */}
                        <span className="text-[11px] text-gray-400 font-medium flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-gray-400 shrink-0" />
                          {alert.time_ago || 'Recently'}
                        </span>
                      </div>

                      {/* Location & Routing Breakdown */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                        {/* Location / GPS Coordinates with Map Pin Link */}
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          {alert.lat && alert.lon ? (
                            <a
                              href={`https://www.google.com/maps?q=${alert.lat},${alert.lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center space-x-0.5 font-bold"
                              title="View GPS coordinates on Google Maps"
                            >
                              <span>{alert.lat.toFixed(4)}°N, {alert.lon.toFixed(4)}°E</span>
                              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">GPS unavailable</span>
                          )}
                        </div>

                        {/* Destinations Notified */}
                        <div className="flex items-center space-x-1 text-[11px]">
                          <span className="font-bold text-gray-500 dark:text-gray-400">Notified:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200 bg-white/70 dark:bg-gray-900/60 px-2 py-0.5 rounded-md border border-gray-200/60 dark:border-gray-700/60">
                            {alert.notified_destinations}
                          </span>
                        </div>
                      </div>

                      {/* Official Handling Log */}
                      {(alert.acknowledged_by || alert.resolved_by) && (
                        <div className="text-[11px] font-medium pt-0.5">
                          {alert.resolved_by ? (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              ✓ Resolved by <span className="font-bold">{alert.resolved_by}</span>
                            </span>
                          ) : alert.acknowledged_by ? (
                            <span className="text-amber-700 dark:text-amber-400">
                              ✓ Acknowledged by <span className="font-bold">{alert.acknowledged_by}</span>
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions for Official */}
                    <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
                      {isActive && (
                        <>
                          <button
                            type="button"
                            disabled={updatingAlertId === alert.id}
                            onClick={() => handleUpdateSOSStatus(alert.id, 'acknowledged')}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('acknowledge_btn') || 'Acknowledge'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={updatingAlertId === alert.id}
                            onClick={() => handleUpdateSOSStatus(alert.id, 'resolved')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('mark_resolved_btn') || 'Resolve'}</span>
                          </button>
                        </>
                      )}

                      {isAck && (
                        <button
                          type="button"
                          disabled={updatingAlertId === alert.id}
                          onClick={() => handleUpdateSOSStatus(alert.id, 'resolved')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('mark_resolved_btn') || 'Resolve'}</span>
                        </button>
                      )}

                      {isResolved && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Resolved</span>
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
