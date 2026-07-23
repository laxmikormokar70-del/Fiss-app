import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Unlock, 
  Settings as SettingsIcon, 
  Edit3, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { getCurrentDeviceTime, parseTimeToMinutes, isDayMatching } from '../utils/timeLock';

interface TodayScheduleCardProps {
  classNameStr?: string;
  batchName?: string;
  schedule?: {
    daysType?: 'all' | 'custom';
    selectedDays?: string[];
    startTime?: string;
    endTime?: string;
  };
  timeLockEnabled: boolean;
  allowLateAttendance: boolean;
  lateMinutes: number;
  onOpenSettings?: () => void;
  onEditSchedule?: () => void;
  isAlreadyTakenToday?: boolean;
}

export default function TodayScheduleCard({
  classNameStr = 'Class 9',
  batchName = 'Batch A',
  schedule,
  timeLockEnabled,
  allowLateAttendance,
  lateMinutes,
  onOpenSettings,
  onEditSchedule,
  isAlreadyTakenToday = false
}: TodayScheduleCardProps) {
  const [deviceTime, setDeviceTime] = useState(getCurrentDeviceTime());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setDeviceTime(getCurrentDeviceTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scheduleStart = schedule?.startTime || '06:00 PM';
  const scheduleEnd = schedule?.endTime || '07:30 PM';
  const selectedDays = schedule?.selectedDays || ['Mon', 'Wed', 'Fri'];
  const daysType = schedule?.daysType || 'custom';

  // Compute live open/closed status
  const isDayValid = isDayMatching(deviceTime.dayShortName, deviceTime.dayFullName, selectedDays, daysType);

  const startMins = parseTimeToMinutes(scheduleStart);
  const endMins = parseTimeToMinutes(scheduleEnd);
  const currentMins = deviceTime.now.getHours() * 60 + deviceTime.now.getMinutes();
  const bufferStartMins = Math.max(0, startMins - 15);

  let isTimeOpen = false;
  let isLateWindow = false;

  if (allowLateAttendance) {
    const lateCutoffMins = Math.max(startMins + (lateMinutes || 15), endMins);
    if (currentMins >= bufferStartMins && currentMins <= lateCutoffMins) {
      isTimeOpen = true;
      if (currentMins > startMins) isLateWindow = true;
    }
  } else {
    if (currentMins >= bufferStartMins && currentMins <= endMins) {
      isTimeOpen = true;
    }
  }

  const isFullyOpen = !timeLockEnabled || (isDayValid && isTimeOpen && !isAlreadyTakenToday);

  const getCountdownMessage = () => {
    if (!isDayValid) {
      return "Attendance Closed";
    }

    const currentSecs = deviceTime.now.getHours() * 3600 + deviceTime.now.getMinutes() * 60 + deviceTime.now.getSeconds();
    const startSecs = startMins * 60;
    const endSecs = endMins * 60;

    if (currentSecs < startSecs) {
      const diffSecs = startSecs - currentSecs;
      const h = Math.floor(diffSecs / 3600);
      const m = Math.floor((diffSecs % 3600) / 60);
      const s = diffSecs % 60;
      
      const parts = [];
      if (h > 0) parts.push(`${h} Hour${h > 1 ? 's' : ''}`);
      if (m > 0) parts.push(`${m} Minute${m > 1 ? 's' : ''}`);
      if (parts.length === 0 || s > 0) parts.push(`${s} Second${s > 1 ? 's' : ''}`);
      
      return `Class starts in: ${parts.join(' ')}`;
    } else if (currentSecs <= endSecs) {
      const diffSecs = endSecs - currentSecs;
      const h = Math.floor(diffSecs / 3600);
      const m = Math.floor((diffSecs % 3600) / 60);
      const s = diffSecs % 60;

      const parts = [];
      if (h > 0) parts.push(`${h} Hour${h > 1 ? 's' : ''}`);
      if (m > 0) parts.push(`${m} Minute${m > 1 ? 's' : ''}`);
      parts.push(`${s} Second${s > 1 ? 's' : ''}`);

      return `Class ends in: ${parts.join(' ')}`;
    } else {
      return "Attendance Closed";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100/80 text-emerald-600 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-slate-900">Today's Schedule</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                {deviceTime.dayFullName}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {deviceTime.displayDate} &bull; <span className="font-bold text-slate-700">{deviceTime.timeStr12}</span>
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex flex-col items-end gap-1.5 self-start sm:self-center shrink-0">
          {isAlreadyTakenToday ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              Already Taken Today
            </span>
          ) : !timeLockEnabled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              <Unlock className="h-3.5 w-3.5 text-blue-600 animate-spin" />
              Time Lock: OFF (Open)
            </span>
          ) : isFullyOpen ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              🟢 ACTIVE NOW (Attendance Open)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              🔴 CLOSED (Attendance Locked)
            </span>
          )}
          
          {/* Live countdown timer text */}
          <p className="text-[11px] font-black tracking-tight text-slate-700 mt-0.5 uppercase flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-500 animate-pulse" />
            <span>{getCountdownMessage()}</span>
          </p>
        </div>
      </div>

      {/* Schedule Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scope</p>
          <p className="text-xs font-extrabold text-slate-900 mt-0.5">{classNameStr} - {batchName}</p>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Window</p>
          <p className="text-xs font-extrabold text-emerald-700 mt-0.5">{scheduleStart} - {scheduleEnd}</p>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Days</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
            {daysType === 'all' ? 'Everyday' : selectedDays.join(', ') || 'Mon, Wed, Fri'}
          </p>
        </div>
      </div>

      {/* Action footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 shrink-0">
          <Lock className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="whitespace-nowrap">Time Lock:</span> <strong className={`${timeLockEnabled ? 'text-emerald-700' : 'text-slate-600'} whitespace-nowrap`}>{timeLockEnabled ? 'Active (Strict Schedule)' : 'Disabled'}</strong>
        </span>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {onEditSchedule && (
            <button
              onClick={onEditSchedule}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer text-[11px] whitespace-nowrap"
            >
              <Edit3 className="h-3 w-3 shrink-0" />
              Edit Schedule
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer text-[11px] whitespace-nowrap"
            >
              <SettingsIcon className="h-3 w-3 shrink-0" />
              Lock Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
