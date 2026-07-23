import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XCircle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  X, 
  Settings as SettingsIcon,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { ValidationFailureDetails, getCurrentDeviceTime } from '../utils/timeLock';

interface AttendanceValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationDetails: ValidationFailureDetails | null;
  onOpenSettings?: () => void;
  onEditSchedule?: () => void;
  batchName?: string;
  classNameStr?: string;
}

export default function AttendanceValidationModal({
  isOpen,
  onClose,
  validationDetails,
  onOpenSettings,
  onEditSchedule,
  batchName,
  classNameStr
}: AttendanceValidationModalProps) {
  if (!isOpen || !validationDetails) return null;

  const deviceTime = getCurrentDeviceTime();
  const { isValid, reasons, statusType, scheduleStart, scheduleEnd } = validationDetails;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden"
        >
          {/* Modal Header */}
          <div className={`p-6 text-white text-center relative ${
            isValid ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-rose-600 to-red-700'
          }`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto h-16 w-16 bg-white/15 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md border border-white/20">
              {isValid ? (
                <CheckCircle2 className="h-10 w-10 text-white" />
              ) : (
                <XCircle className="h-10 w-10 text-white animate-bounce" />
              )}
            </div>

            <h3 className="text-xl font-black tracking-tight">
              {isValid ? '✅ Attendance Successful' : '❌ Attendance Closed'}
            </h3>
            <p className="text-xs text-white/90 font-medium mt-1">
              {isValid 
                ? 'Attendance verification completed successfully.' 
                : 'This batch is not active at the current time.'}
            </p>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5">
            {/* Status Badge */}
            <div className="flex items-center justify-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border flex items-center gap-1.5 ${
                isValid 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {isValid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                {statusType || (isValid ? 'Verified' : 'Blocked')}
              </span>
            </div>

            {/* Failure Reasons list */}
            {!isValid && reasons && reasons.length > 0 && (
              <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-100">
                <p className="text-xs font-extrabold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  Reason for Failure:
                </p>
                <ul className="space-y-1.5">
                  {reasons.map((reason, idx) => (
                    <li key={idx} className="text-xs font-semibold text-rose-700 flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Schedule Verification Context Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-200/60 pb-2.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  Target Class & Batch
                </span>
                <span className="text-slate-900 font-black">
                  {classNameStr || 'Class'} &bull; {batchName || 'Batch'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Device Local Time</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5">{deviceTime.timeStr12}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{deviceTime.dayFullName}</p>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Batch Schedule</p>
                  <p className="text-xs font-black text-emerald-700 mt-0.5">{scheduleStart} - {scheduleEnd}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Scheduled Window</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-1">
              {!isValid && (
                <div className="flex flex-col sm:flex-row gap-2">
                  {onEditSchedule && (
                    <button
                      onClick={() => {
                        onClose();
                        onEditSchedule();
                      }}
                      className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5 text-slate-600" />
                      Edit Schedule
                    </button>
                  )}

                  {onOpenSettings && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSettings();
                      }}
                      className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <SettingsIcon className="h-3.5 w-3.5 text-slate-600" />
                      Time Lock Settings
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className={`w-full py-3 px-4 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
                  isValid
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                }`}
              >
                {isValid ? 'Done' : 'I Understand'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
