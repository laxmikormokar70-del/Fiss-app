import React from 'react';
import { TeacherProfile } from '../types';
import { motion } from 'motion/react';
import { Clock, School, User, Phone, MapPin, LogOut, CheckCircle, ShieldAlert } from 'lucide-react';

interface PendingApprovalPageProps {
  teacherProfile: TeacherProfile | null;
  onLogout: () => void;
}

export default function PendingApprovalPage({ teacherProfile, onLogout }: PendingApprovalPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-[28px] shadow-xl border border-slate-100 dark:border-slate-700/50 max-w-lg w-full overflow-hidden"
      >
        {/* State Visual Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-8 text-white relative text-center">
          <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
            <Clock className="h-8 w-8 text-white animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <h1 className="text-xl font-black tracking-tight">KYC Verification Pending</h1>
          <p className="text-xs text-amber-100 mt-1">
            Your coaching workspace is undergoing standard safety & compliance audit.
          </p>
        </div>

        {/* Info Area */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 animate-pulse">
                ● Review Status: PENDING_APPROVAL
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center max-w-sm mx-auto">
              Welcome, Coach! Our Super Admin checks all registrations manually to ensure clean, high-performance database workspaces. This generally takes a few minutes.
            </p>
          </div>

          {/* Submitted Information Overview Card */}
          {teacherProfile && (
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200/40 dark:border-slate-800 pb-1.5 mb-2">
                Submitted Workspace Details
              </h3>

              <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#16A34A] shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-white">{teacherProfile.name || teacherProfile.fullName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#16A34A] shrink-0" />
                  <span className="font-mono">{teacherProfile.phone || teacherProfile.mobile}</span>
                </div>

                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-[#16A34A] shrink-0" />
                  <span>{teacherProfile.schoolName || teacherProfile.instituteName}</span>
                </div>

                <div className="flex items-start gap-2 pt-0.5">
                  <MapPin className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white leading-tight">{teacherProfile.address}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{teacherProfile.city}, {teacherProfile.state} - {teacherProfile.postalPinCode}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Area */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>Checking live verification database...</span>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400" />
              <span>Sign Out & Check Other Workspace</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
