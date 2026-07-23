import React, { useState } from 'react';
import { TeacherProfile } from '../types';
import { 
  UserPlus, 
  Share2, 
  ScanFace, 
  Users, 
  FileText, 
  Volume2, 
  Settings, 
  User, 
  LogOut,
  Check,
  Copy,
  School,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

interface MoreTabProps {
  teacherProfile: TeacherProfile | null;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
  onTriggerFaceScan: () => void;
  onTriggerNotices: () => void;
  onTriggerAttendance: () => void;
}

export default function MoreTab({
  teacherProfile,
  onTabChange,
  onSignOut,
  onTriggerFaceScan,
  onTriggerNotices,
  onTriggerAttendance
}: MoreTabProps) {
  const [copied, setCopied] = useState(false);

  // Generate self registration link
  const registrationLink = teacherProfile
    ? `${window.location.origin}/register/${teacherProfile.uid}`
    : `${window.location.origin}/register/demo-teacher`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const menuItems = [
    {
      id: 'add-student',
      title: 'Add Student',
      description: 'Register student manually',
      icon: UserPlus,
      color: 'bg-emerald-50 text-emerald-600',
      action: () => onTabChange('students')
    },
    {
      id: 'attendance',
      title: 'Roll Call Attendance',
      description: 'Manual attendance log',
      icon: Check,
      color: 'bg-green-50 text-green-600',
      action: onTriggerAttendance
    },
    {
      id: 'face-scan',
      title: 'Biometric Face Scan',
      description: 'AI-assisted face check',
      icon: ScanFace,
      color: 'bg-amber-50 text-amber-600',
      action: onTriggerFaceScan
    },
    {
      id: 'student-list',
      title: 'Student List',
      description: 'Search academic records',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      action: () => onTabChange('students')
    },
    {
      id: 'reports',
      title: 'Reports & Export',
      description: 'Attendance & Fee statements',
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-600',
      action: () => onTabChange('reports')
    },
    {
      id: 'notices',
      title: 'Institute Notices',
      description: 'Broadcasting messages',
      icon: Volume2,
      color: 'bg-indigo-50 text-indigo-600',
      action: onTriggerNotices
    },
    {
      id: 'settings',
      title: 'Workspace Settings',
      description: 'Configuration & backups',
      icon: Settings,
      color: 'bg-slate-50 text-slate-600',
      action: () => onTabChange('settings')
    }
  ];

  return (
    <div className="bg-white min-h-[80vh] pb-12 font-sans text-[#111827] space-y-6">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] pb-4">
        <h2 className="text-[18px] font-bold text-[#111827]">Administrative Center</h2>
        <p className="text-xs text-gray-400 mt-0.5">Access advanced modules, integrations and tools.</p>
      </div>

      {/* Profile Summary Card */}
      <div 
        onClick={() => onTabChange('profile')}
        className="p-5 rounded-[22px] border border-[#E5E7EB] bg-slate-50/50 space-y-4 cursor-pointer hover:bg-slate-100 transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 bg-[#DCFCE7] text-[#16A34A] rounded-xl flex items-center justify-center font-bold text-sm uppercase shadow-xs">
            {teacherProfile?.name?.slice(0, 2) || 'TE'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827]">{teacherProfile?.name || 'Class Instructor'}</h3>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <School className="h-3 w-3" /> {teacherProfile?.schoolName || 'Coaching Academy'}
            </p>
          </div>
        </div>

        {/* KYC Badging */}
        {teacherProfile && (
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Approval Status</span>
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              teacherProfile.approvalStatus === 'approved' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {teacherProfile.approvalStatus === 'approved' ? '✓ Verified Account' : 'Pending Review'}
            </span>
          </div>
        )}

        {/* Quick Registration Section */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
              Register Link
            </span>
            <button
              onClick={handleCopyLink}
              className="text-xs font-bold text-[#16A34A] hover:text-[#15803d] flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
          <div className="bg-white px-3 py-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-[11px] font-mono text-gray-500 select-all overflow-x-auto whitespace-nowrap scrollbar-none">
            {registrationLink}
          </div>
        </div>
      </div>

      {/* Grid of actions */}
      <div className="grid grid-cols-2 gap-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="p-4 bg-white border border-[#E5E7EB] hover:border-[#16A34A] hover:shadow-md rounded-[20px] transition-all flex flex-col gap-3 text-left cursor-pointer group"
            >
              <div className={`h-9 w-9 ${item.color} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-xs`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#111827] leading-snug">{item.title}</h4>
                <p className="text-[11px] text-gray-400 font-medium leading-tight mt-1">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Actions: Sign Out */}
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={onSignOut}
          className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-colors text-center cursor-pointer flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out Workspace</span>
        </button>
      </div>
    </div>
  );
}
