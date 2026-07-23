import React, { useState, useRef, useMemo } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  Users, 
  Layers, 
  BookOpen, 
  DollarSign, 
  Edit3, 
  Camera, 
  Image as ImageIcon,
  ChevronRight,
  Bell,
  Settings,
  HelpCircle,
  FileLock2,
  LogOut,
  ArrowLeft,
  Check,
  X,
  Loader2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TeacherProfile, Student, Payment } from '../types';

interface ProfilePageProps {
  teacherProfile: TeacherProfile | null;
  students: Student[];
  payments: Payment[];
  classes: any[];
  onBack: () => void;
  onUpdateProfile: (profile: Partial<TeacherProfile>) => Promise<void>;
  onSignOut: () => void;
  onTabChange: (tab: string) => void;
}

export default function ProfilePage({ 
  teacherProfile, 
  students, 
  payments, 
  classes,
  onBack, 
  onUpdateProfile,
  onSignOut,
  onTabChange
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit states
  const [editName, setEditName] = useState(teacherProfile?.name || '');
  const [editPhone, setEditPhone] = useState(teacherProfile?.phone || '');
  const [editSchoolName, setEditSchoolName] = useState(teacherProfile?.schoolName || '');
  const [editAddress, setEditAddress] = useState(teacherProfile?.address || '');
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const totalStudents = students.length;
  const totalClasses = classes.length;
  const totalBatches = useMemo(() => {
    return classes.reduce((acc, cls) => acc + (cls.batches?.length || 0), 0);
  }, [classes]);
  const totalCollection = useMemo(() => {
    return payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
  }, [payments]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (type === 'profile') {
        await onUpdateProfile({ profilePhoto: base64 });
      } else {
        await onUpdateProfile({ bannerPhoto: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await onUpdateProfile({
        name: editName,
        phone: editPhone,
        schoolName: editSchoolName,
        address: editAddress
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'support', label: 'Support Ticket', icon: HelpCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', action: () => onTabChange('support') },
    { id: 'privacy', label: 'Privacy Policy', icon: FileLock2, color: 'text-amber-500', bg: 'bg-amber-50', action: () => onTabChange('privacy') },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center gap-4 border-b border-slate-100">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-slate-700" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Teacher Profile</h1>
      </div>

      <div className="w-full max-w-full px-4 mt-4 space-y-6">
        {/* Account Status Card */}
        <div className={`rounded-3xl p-6 border shadow-sm flex flex-col sm:flex-row items-center gap-6 transition-all ${
          teacherProfile?.approvalStatus === 'approved' 
            ? 'bg-emerald-50 border-emerald-100' 
            : teacherProfile?.approvalStatus === 'rejected'
              ? 'bg-red-50 border-red-100'
              : 'bg-amber-50 border-amber-100'
        }`}>
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
            teacherProfile?.approvalStatus === 'approved' 
              ? 'bg-emerald-500 text-white' 
              : teacherProfile?.approvalStatus === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-amber-500 text-white'
          }`}>
            {teacherProfile?.approvalStatus === 'approved' ? (
              <ShieldCheck className="h-8 w-8" />
            ) : teacherProfile?.approvalStatus === 'rejected' ? (
              <X className="h-8 w-8" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin-slow" />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h3 className="text-lg font-black text-slate-900">
              {teacherProfile?.approvalStatus === 'approved' 
                ? 'Verified Teacher Account' 
                : teacherProfile?.approvalStatus === 'rejected'
                  ? 'Verification Rejected'
                  : 'Pending Admin Approval'}
            </h3>
            <p className="text-sm font-bold text-slate-600 leading-relaxed">
              {teacherProfile?.approvalStatus === 'approved' 
                ? 'Your account is fully verified. All management features are now unlocked.' 
                : teacherProfile?.approvalStatus === 'rejected'
                  ? `Your verification was rejected. Reason: ${teacherProfile?.rejectionReason || 'Documents mismatch'}`
                  : 'Your documents are being reviewed by the administrator. This usually takes 24-48 hours.'}
            </p>
            {teacherProfile?.approvalStatus === 'rejected' && (
              <button 
                onClick={() => onTabChange('resubmit')}
                className="mt-3 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-red-100"
              >
                Resubmit KYC Form
              </button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Banner */}
          <div className="relative h-40 bg-emerald-600">
            {teacherProfile?.bannerPhoto ? (
              <img 
                src={teacherProfile.bannerPhoto} 
                alt="Banner" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <School className="h-20 w-20 text-white" />
              </div>
            )}
            <button 
              onClick={() => bannerInputRef.current?.click()}
              className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/50 transition-colors"
            >
              <Camera className="h-5 w-5" />
            </button>
            <input 
              ref={bannerInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleFileChange(e, 'banner')}
            />
          </div>

          {/* Profile Info Section */}
          <div className="px-6 pb-6 relative">
            {/* Avatar */}
            <div className="relative -mt-12 mb-4">
              <div className="h-24 w-24 rounded-2xl bg-white p-1.5 shadow-lg relative z-10">
                <div className="h-full w-full rounded-xl bg-slate-100 overflow-hidden relative group">
                  {teacherProfile?.profilePhoto ? (
                    <img 
                      src={teacherProfile.profilePhoto} 
                      alt="Profile" 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                      <User className="h-10 w-10" />
                    </div>
                  )}
                  <button 
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <input 
                ref={profileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleFileChange(e, 'profile')}
              />
            </div>

            {/* Header Content */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900 leading-none">
                    {teacherProfile?.name || 'Teacher Name'}
                  </h2>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    teacherProfile?.approvalStatus === 'approved' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : teacherProfile?.approvalStatus === 'pending'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {teacherProfile?.approvalStatus === 'approved' ? <ShieldCheck className="h-3 w-3" /> : null}
                    {teacherProfile?.approvalStatus || 'Pending'}
                  </div>
                </div>
                <p className="text-slate-500 font-bold text-sm">{teacherProfile?.email}</p>
              </div>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <Edit3 className="h-5 w-5" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Details List */}
            <div className="mt-8 space-y-4">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                      <input 
                        type="tel" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institute Name</label>
                      <input 
                        type="text" 
                        value={editSchoolName}
                        onChange={(e) => setEditSchoolName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institute Address</label>
                      <textarea 
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-900 h-24 resize-none"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                        <p className="text-sm font-bold text-slate-800">{teacherProfile?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                        <School className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institute</p>
                        <p className="text-sm font-bold text-slate-800">{teacherProfile?.schoolName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
                        <p className="text-sm font-bold text-slate-800">{teacherProfile?.address || 'No address set'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member Since</p>
                        <p className="text-sm font-bold text-slate-800">
                          {teacherProfile?.registrationDate 
                            ? new Date(teacherProfile.registrationDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Premium KYC Status Banner */}
        <div className="bg-[#16A34A] rounded-[20px] shadow-lg shadow-emerald-100 overflow-hidden p-6 text-white relative border border-emerald-400/20">
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/80 mb-1">Account Verification</p>
                <div className="flex items-center gap-2">
                   <div className={`h-2.5 w-2.5 rounded-full ${teacherProfile?.approvalStatus === 'approved' ? 'bg-white' : 'bg-white animate-pulse'}`} />
                   <h2 className="text-xl font-bold capitalize">{teacherProfile?.approvalStatus || 'Pending Approval'}</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2.5 pt-1">
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-emerald-50/90">
                  <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                    <ShieldCheck className="h-3 w-3" />
                  </div>
                  <span>KYC Submitted: {teacherProfile?.registrationDate ? new Date(teacherProfile.registrationDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-emerald-50/90">
                  <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Registry: {teacherProfile?.schoolName}</span>
                </div>
              </div>
            </div>
            
            <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
               <ShieldCheck className="h-8 w-8 text-white opacity-80" />
            </div>
          </div>
          
          {/* Decorative background shape */}
          <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -top-10 -left-10 h-24 w-24 bg-emerald-400/20 rounded-full blur-2xl" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Classes', value: totalClasses, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Batches', value: totalBatches, icon: Layers, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'Students', value: totalStudents, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Collection', value: `₹${totalCollection}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
              <div className={`h-10 w-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 leading-none">{stat.value}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {menuItems.map((item, idx) => (
              <button 
                key={item.id}
                onClick={item.action}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center transition-transform group-active:scale-95`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
            <button 
              onClick={onSignOut}
              className="w-full flex items-center justify-between p-5 hover:bg-red-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center transition-transform group-active:scale-95">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-red-600">Logout</span>
              </div>
              <ChevronRight className="h-5 w-5 text-red-200 group-hover:text-red-300 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
