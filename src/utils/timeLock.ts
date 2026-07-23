export interface BatchScheduleInfo {
  id?: string;
  daysType?: 'all' | 'custom';
  selectedDays?: string[]; // e.g. ['Mon', 'Wed', 'Fri'] or ['Monday', 'Wednesday']
  startTime?: string;     // e.g. "06:00 PM" or "18:00"
  endTime?: string;       // e.g. "07:30 PM" or "19:30"
}

export interface DeviceTimeInfo {
  dateStr: string;         // "YYYY-MM-DD" e.g. "2026-07-22"
  displayDate: string;     // "Jul 22, 2026"
  dayFullName: string;     // "Wednesday"
  dayShortName: string;    // "Wed"
  timeStr12: string;       // "06:15 PM"
  timeStr24: string;       // "18:15"
  now: Date;
}

export function getCurrentDeviceTime(): DeviceTimeInfo {
  const now = new Date();
  
  // YYYY-MM-DD in local time
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const dayFullName = daysFull[now.getDay()];
  const dayShortName = daysShort[now.getDay()];

  const displayDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const timeStr12 = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const hours24 = String(now.getHours()).padStart(2, '0');
  const mins24 = String(now.getMinutes()).padStart(2, '0');
  const timeStr24 = `${hours24}:${mins24}`;

  return {
    dateStr,
    displayDate,
    dayFullName,
    dayShortName,
    timeStr12,
    timeStr24,
    now
  };
}

/**
 * Converts "06:00 PM", "6:00 PM", "18:00", etc. to total minutes from midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const str = timeStr.trim().toUpperCase();
  
  const isPM = str.includes('PM');
  const isAM = str.includes('AM');
  
  // Clean string to get digits HH:MM
  const cleanStr = str.replace(/(AM|PM)/g, '').trim();
  const parts = cleanStr.split(':');
  
  if (parts.length < 2) return 0;
  
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  
  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
}

export function formatMinutesTo12h(totalMins: number): string {
  let mins = totalMins % (24 * 60);
  if (mins < 0) mins += 24 * 60;
  let hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

export function isDayMatching(todayShort: string, todayFull: string, selectedDays?: string[], daysType?: string): boolean {
  if (daysType === 'all') return true;
  if (!selectedDays || selectedDays.length === 0) return true; // Default open if no day set

  const normalizedSelected = selectedDays.map(d => d.trim().toLowerCase());
  const tShort = todayShort.toLowerCase();
  const tFull = todayFull.toLowerCase();

  return normalizedSelected.some(d => 
    d === tShort || 
    d === tFull || 
    (tShort === 'mon' && (d === 'm' || d === 'mon' || d === 'monday')) ||
    (tShort === 'tue' && (d === 't' || d === 'tue' || d === 'tuesday')) ||
    (tShort === 'wed' && (d === 'w' || d === 'wed' || d === 'wednesday')) ||
    (tShort === 'thu' && (d === 'th' || d === 'thu' || d === 'thursday')) ||
    (tShort === 'fri' && (d === 'f' || d === 'fri' || d === 'friday')) ||
    (tShort === 'sat' && (d === 'sa' || d === 'sat' || d === 'saturday')) ||
    (tShort === 'sun' && (d === 'su' || d === 'sun' || d === 'sunday'))
  );
}

export interface ValidationFailureDetails {
  isValid: boolean;
  reasons: string[];
  statusType: 'Success' | 'Wrong Day' | 'Wrong Time' | 'Already Taken' | 'Window Closed';
  isLate: boolean;
  scheduleStart: string;
  scheduleEnd: string;
  attendanceDay: string;
  attendanceTime: string;
  attendanceDate: string;
}

export interface ValidateAttendanceParams {
  selectedClassId: string;
  selectedBatchId: string;
  selectedDate: string; // "YYYY-MM-DD"
  schedule?: BatchScheduleInfo;
  timeLockEnabled: boolean;
  allowLateAttendance: boolean;
  lateMinutes: number; // e.g. 15
  existingAttendanceList?: any[]; // existing Attendance documents
}

export function validateAttendanceSchedule(params: ValidateAttendanceParams): ValidationFailureDetails {
  const timeInfo = getCurrentDeviceTime();
  const reasons: string[] = [];

  const scheduleStart = params.schedule?.startTime || '08:00 AM';
  const scheduleEnd = params.schedule?.endTime || '08:00 PM';

  // Default output
  const result: ValidationFailureDetails = {
    isValid: true,
    reasons: [],
    statusType: 'Success',
    isLate: false,
    scheduleStart,
    scheduleEnd,
    attendanceDay: timeInfo.dayFullName,
    attendanceTime: timeInfo.timeStr12,
    attendanceDate: params.selectedDate || timeInfo.dateStr
  };

  // 1. Always check duplicate attendance for the same day/class/batch
  const isAlreadyTaken = params.existingAttendanceList?.some(record => {
    const rDate = record.attendanceDate || record.date;
    const rClass = record.classId || record.className;
    const rBatch = record.batchId || record.batchName;

    // Compare date
    const dateMatches = rDate === params.selectedDate || rDate === timeInfo.dateStr;
    
    // Compare class & batch if provided
    let scopeMatches = true;
    if (params.selectedClassId && (record.classId || record.className)) {
      scopeMatches = (record.classId === params.selectedClassId || record.className === params.selectedClassId);
    }
    if (scopeMatches && params.selectedBatchId && (record.batchId || record.batchName)) {
      scopeMatches = (record.batchId === params.selectedBatchId || record.batchName === params.selectedBatchId);
    }

    return dateMatches && scopeMatches;
  });

  if (isAlreadyTaken) {
    result.isValid = false;
    result.statusType = 'Already Taken';
    result.reasons.push('Attendance has already been submitted today.');
    return result; // Immediate return for duplicate
  }

  // If Time Lock is OFF, pass validation!
  if (!params.timeLockEnabled) {
    result.isValid = true;
    result.statusType = 'Success';
    return result;
  }

  // 2. Validate Selected Date is Today
  if (params.selectedDate && params.selectedDate !== timeInfo.dateStr) {
    reasons.push(`Selected date (${params.selectedDate}) is not today (${timeInfo.dateStr}).`);
  }

  // 3. Validate Day of Week
  const isDayValid = isDayMatching(
    timeInfo.dayShortName,
    timeInfo.dayFullName,
    params.schedule?.selectedDays,
    params.schedule?.daysType
  );

  if (!isDayValid) {
    const allowedDaysStr = params.schedule?.selectedDays?.join(', ') || 'Scheduled days';
    reasons.push(`Today (${timeInfo.dayFullName}) is not the scheduled class day (${allowedDaysStr}).`);
  }

  // 4. Validate Time Window
  const startMins = parseTimeToMinutes(scheduleStart);
  const endMins = parseTimeToMinutes(scheduleEnd);
  const currentMins = timeInfo.now.getHours() * 60 + timeInfo.now.getMinutes();

  let isTimeValid = false;
  let isLate = false;

  // Grace buffer: Allow taking attendance 15 mins before start time
  const bufferStartMins = Math.max(0, startMins - 15);

  if (params.allowLateAttendance) {
    // If late attendance is enabled:
    // On-time window: startMins - 15 to startMins + lateMinutes
    // Late window: up to startMins + lateMinutes OR endMins
    const lateCutoffMins = Math.max(startMins + (params.lateMinutes || 15), endMins);
    
    if (currentMins >= bufferStartMins && currentMins <= lateCutoffMins) {
      isTimeValid = true;
      if (currentMins > startMins) {
        isLate = true;
      }
    } else {
      isTimeValid = false;
    }
  } else {
    // Normal window: startMins - 15 to endMins
    if (currentMins >= bufferStartMins && currentMins <= endMins) {
      isTimeValid = true;
    } else {
      isTimeValid = false;
    }
  }

  if (!isTimeValid) {
    if (currentMins > endMins) {
      reasons.push(`Attendance window closed. Class ended at ${scheduleEnd}.`);
    } else if (currentMins < bufferStartMins) {
      reasons.push(`Class has not started yet. Schedule is ${scheduleStart} - ${scheduleEnd}.`);
    } else {
      reasons.push(`Current time (${timeInfo.timeStr12}) is outside the attendance window (${scheduleStart} - ${scheduleEnd}).`);
    }
  }

  if (reasons.length > 0) {
    result.isValid = false;
    if (!isDayValid) {
      result.statusType = 'Wrong Day';
    } else if (!isTimeValid) {
      result.statusType = currentMins > endMins ? 'Window Closed' : 'Wrong Time';
    } else {
      result.statusType = 'Wrong Time';
    }
    result.reasons = reasons;
  } else {
    result.isValid = true;
    result.isLate = isLate;
    result.statusType = 'Success';
  }

  return result;
}
