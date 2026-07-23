import React, { useState } from 'react';
import { TeacherProfile } from '../types';
import { motion } from 'motion/react';
import { XCircle, AlertTriangle, Edit3, LogOut, ArrowRight } from 'lucide-react';
import CompleteProfilePage from './CompleteProfilePage';

interface RejectedPageProps {
  teacherProfile: TeacherProfile | null;
  onLogout: () => void;
  onResubmitted: () => void;
}

export default function RejectedPage({ teacherProfile, onLogout, onResubmitted }: RejectedPageProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <CompleteProfilePage 
        teacherProfile={teacherProfile} 
        onComplete={() => {
          setIsEditing(false);
          onResubmitted();
        }} 
        onLogout={onLogout} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-[28px] shadow-xl border border-slate-100 dark:border-slate-700/50 max-w-lg w-full overflow-hidden"
      >
        {/* Rejected Alert Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-8 text-white relative text-center">
          <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
            <XCircle className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h1 className="text-xl font-black tracking-tight">KYC Verification Rejected</h1>
          <p className="text-xs text-red-100 mt-1">
            Your application did not pass our safety criteria. You can edit and resubmit.
          </p>
        </div>

        {/* Reason Description */}
        <div className="p-8 space-y-6">
          <div className="space-y-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-2xl p-5">
            <h3 className="text-xs font-black text-red-800 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="h-4.5 w-4.5 text-red-600 dark:text-red-500 shrink-0" />
              <span>Admin FeedBack / Reason</span>
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 font-semibold leading-relaxed">
              "{teacherProfile?.rejectionReason || 'No detailed reason provided. Please ensure all uploaded photos are high-quality and readable.'}"
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center">
              Don't worry! You can easily update your submitted documents or coaching info. Click <strong>Update Profile Details</strong> below to check and correct your submission.
            </p>

            {/* Actions */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-emerald-100 dark:shadow-none"
              >
                <Edit3 className="h-4 w-4" />
                <span>Update Profile Details</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-400" />
                <span>Sign Out & Log In to Another Account</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
