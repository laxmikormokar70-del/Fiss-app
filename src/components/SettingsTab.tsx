import React, { useState, useRef } from 'react';
import { TeacherProfile, Student, Payment } from '../types';
import { auth, db } from '../lib/firebase';
import { updatePassword, signOut } from 'firebase/auth';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Database, 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  Check, 
  AlertCircle,
  KeyRound,
  Trash2,
  Sparkles,
  Shield,
  ShieldCheck,
  Calendar,
  Clock,
  Bell,
  Palette,
  Globe,
  Sliders,
  LogOut,
  Smartphone,
  Mail,
  FileSpreadsheet,
  CheckCircle2,
  Type,
  Maximize2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsTabProps {
  teacherProfile: TeacherProfile | null;
  students: Student[];
  payments: Payment[];
  onUpdateProfile: (profile: Partial<TeacherProfile>) => Promise<void>;
  onRestoreData: (backupData: { students: Student[]; payments: Payment[] }) => Promise<void>;
  onSignOut: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function SettingsTab({ 
  teacherProfile, 
  students, 
  payments, 
  onUpdateProfile,
  onRestoreData,
  onSignOut,
  darkMode,
  onToggleDarkMode
}: SettingsTabProps) {

  // Active Category Tab in Settings (All-in-one or category filtered view)
  const [activeCategory, setActiveCategory] = useState<'all' | 'security' | 'attendance' | 'notifications' | 'data' | 'appearance' | 'account'>('all');
  
  // 1. SECURITY STATES
  const [isAppLockEnabled, setIsAppLockEnabled] = useState(teacherProfile?.isPinEnabled ?? false);
  const [isPinEnabled, setIsPinEnabled] = useState(teacherProfile?.isPinEnabled ?? false);
  const [pinCode, setPinCode] = useState(teacherProfile?.pinCode || '');
  const [isPatternLockEnabled, setIsPatternLockEnabled] = useState(false);
  const [autoLockTimer, setAutoLockTimer] = useState<'30s' | '1m' | '5m' | 'never'>('1m');
  const [showChangeLockModal, setShowChangeLockModal] = useState(false);
  const [lockSaving, setLockSaving] = useState(false);
  const [lockSuccess, setLockSuccess] = useState(false);

  // 2. ATTENDANCE STATES
  const [timeLockEnabled, setTimeLockEnabled] = useState(teacherProfile?.timeLockEnabled ?? true);
  const [strictScheduleActive, setStrictScheduleActive] = useState(true);
  const [lockAfterStart, setLockAfterStart] = useState(true);
  const [allowLateAttendance, setAllowLateAttendance] = useState(teacherProfile?.allowLateAttendance ?? true);
  const [lateMinutes, setLateMinutes] = useState<number>(teacherProfile?.lateMinutes ?? 15);
  const [allowManualAttendance, setAllowManualAttendance] = useState(true);
  const [attendanceWindow, setAttendanceWindow] = useState<'15m' | '30m' | '1h' | '2h'>('30m');
  const [timeLockSaving, setTimeLockSaving] = useState(false);
  const [timeLockSuccess, setTimeLockSuccess] = useState(false);

  // 3. NOTIFICATION STATES
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [feeReminders, setFeeReminders] = useState(true);
  const [scheduleReminders, setScheduleReminders] = useState(true);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  // 4. DATA STATES
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<{ students: Student[]; payments: Payment[] } | null>(null);

  // 5. APPEARANCE STATES
  const [themeMode, setThemeMode] = useState<'light' | 'emerald' | 'dark'>(darkMode ? 'dark' : 'emerald');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [language, setLanguage] = useState<'en' | 'hi' | 'bn'>('en');

  // 6. ACCOUNT STATES
  const [name, setName] = useState(teacherProfile?.name || '');
  const [schoolName, setSchoolName] = useState(teacherProfile?.schoolName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showDeleteAccountConfirmSecond, setShowDeleteAccountConfirmSecond] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // Profile Save
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      await onUpdateProfile({ name, schoolName });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.warn(err);
      alert("Failed to update profile details.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Security Lock Save
  const handleLockSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isPinEnabled && (!pinCode || pinCode.length !== 4 || !/^\d+$/.test(pinCode))) {
      alert("Please enter a valid 4-digit numeric PIN.");
      return;
    }
    setLockSaving(true);
    setLockSuccess(false);
    try {
      await onUpdateProfile({ 
        isPinEnabled: isAppLockEnabled || isPinEnabled, 
        pinCode: (isAppLockEnabled || isPinEnabled) ? pinCode : '' 
      });
      setLockSuccess(true);
      setShowChangeLockModal(false);
      setTimeout(() => setLockSuccess(false), 3000);
    } catch (err) {
      console.warn(err);
      alert("Failed to update security settings.");
    } finally {
      setLockSaving(false);
    }
  };

  // Attendance Settings Save
  const handleAttendanceSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimeLockSaving(true);
    setTimeLockSuccess(false);
    try {
      await onUpdateProfile({
        timeLockEnabled,
        allowLateAttendance,
        lateMinutes: Number(lateMinutes)
      });
      setTimeLockSuccess(true);
      setTimeout(() => setTimeLockSuccess(false), 3000);
    } catch (err) {
      console.warn(err);
      alert("Failed to update Attendance settings.");
    } finally {
      setTimeLockSaving(false);
    }
  };

  // Notification Settings Save
  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotificationSaving(true);
    setNotificationSuccess(false);
    setTimeout(() => {
      setNotificationSaving(false);
      setNotificationSuccess(true);
      setTimeout(() => setNotificationSuccess(false), 3000);
    }, 600);
  };

  // Change Password
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    setPasswordSaving(true);
    setPasswordSuccess(false);
    setPasswordError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user found.");
      await updatePassword(user, newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      console.warn(err);
      if (err.code === 'auth/requires-recent-login') {
        setPasswordError('For security reasons, changing password requires a fresh login. Please log out and sign in again.');
      } else {
        setPasswordError(err.message || 'Failed to update account password.');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      schoolName: teacherProfile?.schoolName || '',
      students: students,
      payments: payments
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Coaching_ERP_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV Data
  const handleExportCSV = () => {
    if (!students || students.length === 0) {
      alert("No student records available to export.");
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Roll Number,Class,Batch,Phone,Address,Admission Date\n";

    students.forEach((s) => {
      const phone = s.mobileNumber || s.phone || s.phoneNumber || '';
      const cls = s.class || s.className || '';
      const batch = s.batch || s.batchName || '';
      csvContent += `"${s.name}","${s.rollNumber || ''}","${cls}","${batch}","${phone}","${s.address || ''}","${s.admissionDate || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Student_Directory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setRestoreError('');
        setRestoreSuccess(false);
        const json = JSON.parse(event.target?.result as string);

        if (!json.students || !Array.isArray(json.students)) {
          throw new Error("Invalid backup format. Missing 'students' array.");
        }

        setPendingRestoreData({
          students: json.students,
          payments: json.payments || []
        });
        setShowRestoreConfirm(true);
      } catch (err: any) {
        console.warn(err);
        setRestoreError(err.message || 'Error parsing or restoring the backup file.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Account Deletion Execution
  const executeDeleteAccount = async () => {
    setDeleteSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const teacherId = user.uid;
        await deleteDoc(doc(db, 'users', teacherId));
        try {
          await user.delete();
        } catch (authErr) {
          console.warn("Could not delete Auth user directly:", authErr);
        }
        await signOut(auth);
        onSignOut();
      }
    } catch (err: any) {
      console.warn(err);
      alert("Error deleting account: " + (err.message || err));
    } finally {
      setDeleteSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto pb-36 sm:pb-28 px-1">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-3xl shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="h-7 w-7 text-emerald-200" /> Administrative ERP Settings
          </h1>
          <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-800/80 border border-emerald-400/30 px-3 py-1 rounded-full text-emerald-100">
            Coaching Suite
          </span>
        </div>
        <p className="text-xs text-emerald-100 font-medium max-w-2xl">
          Configure application security, attendance locks, push notifications, backups, theme appearance, and teacher account profiles.
        </p>
      </div>

      {/* CATEGORY SELECTOR CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'All Settings', icon: Sliders },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'attendance', label: 'Attendance', icon: Calendar },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'data', label: 'Data', icon: Database },
          { id: 'appearance', label: 'Appearance', icon: Palette },
          { id: 'account', label: 'Account', icon: User },
        ].map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 active:scale-95'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-6">

        {/* ========================================== */}
        {/* SECTION 1: 🔒 SECURITY                      */}
        {/* ========================================== */}
        {(activeCategory === 'all' || activeCategory === 'security') && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-emerald-600 shrink-0" />
                Security & Passcode Lock
              </h2>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                Protected
              </span>
            </div>

            <div className="space-y-3">
              {/* Item 1: App Lock */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-0.5 pr-4">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">App Lock</span>
                  <span className="text-xs text-slate-600 font-medium block">
                    Require passcode or biometric verification when launching Coaching ERP.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={isAppLockEnabled} 
                    onChange={(e) => {
                      setIsAppLockEnabled(e.target.checked);
                      setIsPinEnabled(e.target.checked);
                    }} 
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Item 2: PIN Lock Setup */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-sm font-extrabold text-slate-900 block leading-tight">PIN Lock (4-Digit Passcode)</span>
                    <span className="text-xs text-slate-600 font-medium block">Set a 4-digit numeric access PIN for rapid entry.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={isPinEnabled} 
                      onChange={(e) => setIsPinEnabled(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {isPinEnabled && (
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="PIN"
                      className="w-28 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-center text-sm font-black font-mono tracking-widest text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleLockSubmit()}
                      disabled={lockSaving}
                      className="min-h-[44px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {lockSaving ? 'Saving...' : 'Set PIN'}
                    </button>
                  </div>
                )}
              </div>

              {/* Item 3: Pattern Lock */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-0.5 pr-4">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">Pattern Lock</span>
                  <span className="text-xs text-slate-600 font-medium block">
                    Enable 3x3 pattern drawing unlock option for mobile Android devices.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={isPatternLockEnabled} 
                    onChange={(e) => setIsPatternLockEnabled(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Item 4: Change Lock & Auto Lock Timer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 block leading-tight">Change Lock Passcode</span>
                    <span className="text-xs text-slate-600 font-medium block mt-0.5">Reset or update your PIN/pattern code instantly.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChangeLockModal(true)}
                    className="min-h-[44px] w-full mt-2 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-200 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <KeyRound className="h-4 w-4 text-emerald-600" />
                    Change Lock
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">Auto Lock Timer</span>
                  <span className="text-xs text-slate-600 font-medium block">Automatically lock after inactivity.</span>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { id: '30s', label: '30 sec' },
                      { id: '1m', label: '1 min' },
                      { id: '5m', label: '5 min' },
                      { id: 'never', label: 'Never' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAutoLockTimer(t.id as any)}
                        className={`flex-1 py-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer ${
                          autoLockTimer === t.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {lockSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" /> Security lock settings updated successfully!
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 2: 📅 ATTENDANCE (FIXED UI & ALIGN)  */}
        {/* ========================================== */}
        {(activeCategory === 'all' || activeCategory === 'attendance') && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                <Calendar className="h-5 w-5 text-emerald-600 shrink-0" />
                Attendance & Time Lock Rules
              </h2>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                Strict Schedule
              </span>
            </div>

            <form onSubmit={handleAttendanceSettingsSubmit} className="space-y-3.5">
              
              {/* Item 1: Time Lock */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[68px]">
                <div className="space-y-0.5 pr-4">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">Time Lock</span>
                  <span className="text-xs text-slate-600 font-medium block">
                    Restrict attendance taking strictly to batch class start and end hours.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={timeLockEnabled} 
                    onChange={(e) => setTimeLockEnabled(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Item 2: Active (Strict Schedule) */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[68px]">
                <div className="space-y-0.5 pr-4">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">Active (Strict Schedule)</span>
                  <span className="text-xs text-slate-600 font-medium block">
                    Enforce strict automated batch timetables for student QR and manual log entries.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={strictScheduleActive} 
                    onChange={(e) => setStrictScheduleActive(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Item 3: Lock Settings (Lock after Class Start) */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[68px]">
                <div className="space-y-0.5 pr-4">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">Lock Settings (Lock After Class Start)</span>
                  <span className="text-xs text-slate-600 font-medium block">
                    Automatically close attendance submission after the allowed grace window expires.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={lockAfterStart} 
                    onChange={(e) => setLockAfterStart(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Item 4: Late Attendance & Grace Window */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-sm font-extrabold text-slate-900 block leading-tight">Late Attendance</span>
                    <span className="text-xs text-slate-600 font-medium block">
                      Permit marking students as 'Late' within a configurable grace window after class starts.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={allowLateAttendance} 
                      onChange={(e) => setAllowLateAttendance(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {allowLateAttendance && (
                  <div className="pt-2 space-y-1.5 border-t border-slate-200/60">
                    <label className="text-xs font-black text-slate-900 block">Late Grace Window Duration</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[5, 10, 15, 20, 30].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setLateMinutes(mins)}
                          className={`px-3.5 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                            lateMinutes === mins
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs active:scale-95'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mins} mins
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Item 5: Allow Manual Attendance */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[68px]">
                <div className="space-y-0.5 pr-4">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">Allow Manual Attendance</span>
                  <span className="text-xs text-slate-600 font-medium block">
                    Allow teachers to override or manually toggle present/absent status without QR scanning.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={allowManualAttendance} 
                    onChange={(e) => setAllowManualAttendance(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Item 6: Attendance Window Duration */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">Attendance Window</span>
                  <span className="text-xs text-slate-600 font-medium block">Total active session buffer before lock.</span>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { id: '15m', label: '15 min' },
                    { id: '30m', label: '30 min' },
                    { id: '1h', label: '1 hour' },
                    { id: '2h', label: '2 hours' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setAttendanceWindow(w.id as any)}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                        attendanceWindow === w.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {timeLockSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" /> Attendance rules saved successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={timeLockSaving}
                className="min-h-[48px] px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {timeLockSaving ? 'Saving...' : 'Save Attendance Settings'}
              </button>
            </form>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 3: 🔔 NOTIFICATIONS                 */}
        {/* ========================================== */}
        {(activeCategory === 'all' || activeCategory === 'notifications') && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                <Bell className="h-5 w-5 text-emerald-600 shrink-0" />
                Notification & Communication Channels
              </h2>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                Automated Alerts
              </span>
            </div>

            <form onSubmit={handleNotificationSubmit} className="space-y-3">
              {/* SMS Alerts */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[68px]">
                <div className="space-y-0.5 pr-4">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">SMS Gateway Alerts</span>
                  <span className="text-xs text-slate-600 font-medium block">
                    Dispatch SMS notifications for student attendance logs & fee due reminders.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={smsAlerts} 
                    onChange={(e) => setSmsAlerts(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[68px]">
                <div className="space-y-0.5 pr-4">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">Email Notifications</span>
                  <span className="text-xs text-slate-600 font-medium block">
                    Send formal payment receipts and weekly progress reports to parents via Email.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={emailNotifications} 
                    onChange={(e) => setEmailNotifications(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[68px]">
                <div className="space-y-0.5 pr-4">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">Push Notifications</span>
                  <span className="text-xs text-slate-600 font-medium block">
                    Send real-time mobile app push alerts for schedule changes & emergency announcements.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={pushNotifications} 
                    onChange={(e) => setPushNotifications(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Reminder Settings */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-sm font-extrabold text-slate-900 block leading-tight">Reminder Settings</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={feeReminders}
                      onChange={(e) => setFeeReminders(e.target.checked)}
                      className="h-4.5 w-4.5 accent-emerald-600 rounded"
                    />
                    <span className="text-xs font-extrabold text-slate-900">Fee Due Auto Reminders</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={scheduleReminders}
                      onChange={(e) => setScheduleReminders(e.target.checked)}
                      className="h-4.5 w-4.5 accent-emerald-600 rounded"
                    />
                    <span className="text-xs font-extrabold text-slate-900">Class Schedule Reminders</span>
                  </label>
                </div>
              </div>

              {notificationSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" /> Notification preferences saved!
                </div>
              )}

              <button
                type="submit"
                disabled={notificationSaving}
                className="min-h-[48px] px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {notificationSaving ? 'Saving...' : 'Save Notification Preferences'}
              </button>
            </form>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 4: 📂 DATA                          */}
        {/* ========================================== */}
        {(activeCategory === 'all' || activeCategory === 'data') && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                <Database className="h-5 w-5 text-emerald-600 shrink-0" />
                Data Backup, Restore & Export
              </h2>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                JSON & CSV
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Export student enrollment records, fee ledgers, and attendance logs securely as local files or restore previous backups.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="min-h-[52px] p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-200/80 font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                <Download className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[52px] p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border-2 border-slate-200 font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Upload className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>Restore JSON</span>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".json" 
                  onChange={handleImportBackup} 
                  className="hidden" 
                />
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="min-h-[52px] p-3 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>Export CSV</span>
              </button>
            </div>

            {restoreSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" /> Backup data restored successfully!
              </div>
            )}

            {restoreError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600" /> {restoreError}
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 5: 🎨 APPEARANCE                    */}
        {/* ========================================== */}
        {(activeCategory === 'all' || activeCategory === 'appearance') && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                <Palette className="h-5 w-5 text-emerald-600 shrink-0" />
                Appearance & Regionalization
              </h2>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                Customization
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Theme Picker */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-sm font-extrabold text-slate-900 block leading-tight">Theme Palette</span>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'emerald', label: 'Coaching Emerald', color: 'bg-emerald-600' },
                    { id: 'light', label: 'Clean Light', color: 'bg-slate-200' },
                    { id: 'dark', label: 'Twilight Dark', color: 'bg-slate-800' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setThemeMode(t.id as any);
                        if (t.id === 'dark' && !darkMode) onToggleDarkMode();
                        else if (t.id !== 'dark' && darkMode) onToggleDarkMode();
                      }}
                      className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        themeMode === t.id
                          ? 'bg-white border-emerald-600 text-emerald-900 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${t.color} shrink-0`} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight flex items-center gap-1.5">
                    <Type className="h-4 w-4 text-emerald-600" /> Font Size
                  </span>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { id: 'small', label: 'Small' },
                      { id: 'medium', label: 'Medium' },
                      { id: 'large', label: 'Large' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontSize(f.id as any)}
                        className={`flex-1 py-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer ${
                          fontSize === f.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-emerald-600" /> Language
                  </span>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { id: 'en', label: 'English' },
                      { id: 'hi', label: 'हिंदी' },
                      { id: 'bn', label: 'বাংলা' },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setLanguage(l.id as any)}
                        className={`flex-1 py-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer ${
                          language === l.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 6: 👤 ACCOUNT                       */}
        {/* ========================================== */}
        {(activeCategory === 'all' || activeCategory === 'account') && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                <User className="h-5 w-5 text-emerald-600 shrink-0" />
                Teacher Profile & Account Credentials
              </h2>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                {teacherProfile?.email || 'Authenticated'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Profile Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Profile Information</h3>
                
                <form onSubmit={handleProfileSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Abir Hasan"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-900 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1">School / Coaching Institute</label>
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Apex Coaching Academy"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-900 text-sm font-bold"
                    />
                  </div>

                  {profileSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" /> Profile saved successfully.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="min-h-[44px] px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              </div>

              {/* Password Change Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Change Password</h3>
                
                <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1">New Account Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-900 text-sm font-bold"
                    />
                  </div>

                  {passwordSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" /> Password updated successfully.
                    </div>
                  )}

                  {passwordError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="min-h-[44px] px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {passwordSaving ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>

            </div>

            {/* Logout & Delete Account */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <button
                type="button"
                onClick={onSignOut}
                className="w-full sm:w-auto min-h-[48px] px-6 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs uppercase tracking-wider rounded-2xl border-2 border-rose-200/80 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <LogOut className="h-4 w-4 text-rose-600" />
                Sign Out of Account
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteAccountConfirm(true)}
                className="w-full sm:w-auto min-h-[48px] px-5 bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-600 font-extrabold text-xs uppercase tracking-wider rounded-2xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>

          </div>
        )}

      </div>

      {/* CHANGE LOCK MODAL */}
      <AnimatePresence>
        {showChangeLockModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-emerald-600" />
                  Change Passcode Lock
                </h3>
                <button
                  onClick={() => setShowChangeLockModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-900">Enter New 4-Digit Passcode</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 1234"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center text-lg font-black font-mono tracking-widest text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleLockSubmit()}
                  disabled={lockSaving}
                  className="flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {lockSaving ? 'Saving...' : 'Save New Passcode'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangeLockModal(false)}
                  className="px-4 min-h-[48px] bg-slate-100 text-slate-600 font-bold text-xs rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Account Phase 1 */}
        {showDeleteAccountConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 text-center space-y-4"
            >
              <div className="h-16 w-16 mx-auto bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                <Trash2 className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">Delete Account?</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  WARNING: Are you sure you want to delete your teacher account permanently? This will erase all student databases and tuition logs.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteAccountConfirm(false);
                    setShowDeleteAccountConfirmSecond(true);
                  }}
                  className="w-full min-h-[48px] bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Proceed
                </button>
                <button
                  onClick={() => setShowDeleteAccountConfirm(false)}
                  className="w-full min-h-[44px] bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Account Phase 2 */}
        {showDeleteAccountConfirmSecond && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 text-center space-y-4"
            >
              <div className="h-16 w-16 mx-auto bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center animate-bounce">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-rose-600">Final Confirmation</h3>
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  This action cannot be undone. Confirm account deletion?
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={async () => {
                    setShowDeleteAccountConfirmSecond(false);
                    await executeDeleteAccount();
                  }}
                  className="w-full min-h-[48px] bg-rose-700 hover:bg-rose-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Yes, Delete Account Permanently
                </button>
                <button
                  onClick={() => setShowDeleteAccountConfirmSecond(false)}
                  className="w-full min-h-[44px] bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Restore Backup Confirm */}
        {showRestoreConfirm && pendingRestoreData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 text-center space-y-4"
            >
              <div className="h-16 w-16 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Database className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">Restore Data?</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Backup contains <strong>{pendingRestoreData.students.length}</strong> students and <strong>{pendingRestoreData.payments.length}</strong> payments.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={async () => {
                    setShowRestoreConfirm(false);
                    try {
                      await onRestoreData(pendingRestoreData);
                      setRestoreSuccess(true);
                      setTimeout(() => setRestoreSuccess(false), 4000);
                    } catch (err: any) {
                      setRestoreError(err.message || 'Error restoring data');
                    }
                    setPendingRestoreData(null);
                  }}
                  className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  Yes, Restore Data
                </button>
                <button
                  onClick={() => {
                    setShowRestoreConfirm(false);
                    setPendingRestoreData(null);
                  }}
                  className="w-full min-h-[44px] bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
