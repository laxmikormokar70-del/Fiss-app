import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { safeFetch } from '../utils/api';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { TeacherProfile } from '../types';
import { 
  ShieldCheck, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Users, 
  Clock, 
  School, 
  Image as ImageIcon, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Lock, 
  AlertTriangle, 
  Slash,
  Eye,
  Info
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  adminProfile: TeacherProfile | null;
}

export default function AdminDashboard({ onLogout, adminProfile: propAdminProfile }: AdminDashboardProps) {
  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cached_admin_teachers');
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });
  const [adminProfile, setAdminProfile] = useState<TeacherProfile | null>(propAdminProfile);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cached_admin_teachers');
      return cached ? false : true;
    }
    return true;
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change state
  const [showPasswordForce, setShowPasswordForce] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // Modals for image previews
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  // Modal for rejection reason
  const [rejectTeacherId, setRejectTeacherId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Custom confirm dialogs
  const [suspendTeacherId, setSuspendTeacherId] = useState<string | null>(null);
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null);

  // Sync prop with state and check for forced password change
  useEffect(() => {
    if (propAdminProfile) {
      setAdminProfile(propAdminProfile);
      // Only force password change for generic admin, not the Super Admin
      if (!propAdminProfile.adminPasswordChanged && propAdminProfile.email !== 'laxmikormokar70@gmail.com') {
        setShowPasswordForce(true);
      } else {
        setShowPasswordForce(false);
      }
    }
  }, [propAdminProfile]);

  // Real-time listener for users collection
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: TeacherProfile[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as any;
          const mappedTeacher: TeacherProfile = {
            uid: doc.id,
            email: data.email || '',
            name: data.fullName || data.name || '',
            fullName: data.fullName || data.name || '',
            phone: data.phone || data.mobile || '',
            schoolName: data.coachingName || data.schoolName || data.instituteName || '',
            coachingName: data.coachingName || data.schoolName || data.instituteName || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            postalPinCode: data.pinCode || data.postalPinCode || '',
            pinCode: data.pinCode || '',
            profilePhoto: data.profilePhoto || '',
            bannerPhoto: data.bannerPhoto || '',
            approvalStatus: data.status || data.approvalStatus || 'pending',
            status: data.status || 'pending',
            rejectionReason: data.rejectionReason || '',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
            registrationDate: data.createdAt || data.registrationDate || '',
            role: data.role || 'teacher'
          };
          if (mappedTeacher.role !== 'admin' && mappedTeacher.email !== 'admin@edumanager.com' && mappedTeacher.email !== 'laxmikormokar70@gmail.com') {
            list.push(mappedTeacher);
          }
        });
        setTeachers(list);
        localStorage.setItem('cached_admin_teachers', JSON.stringify(list));
        setLoading(false);
      },
      (err) => {
        console.warn('Status (info) fetching users:', err);
        setError('Permission denied or network failure.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Change password handler
  const handleForcePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Update auth password
        await updatePassword(currentUser, newPassword);

        // Save changed flag in Firestore for both collections
        const adminTeacherRef = doc(db, 'users', currentUser.uid);
        await updateDoc(adminTeacherRef, {
          adminPasswordChanged: true
        });

        setSuccess('Password updated successfully!');
        setShowPasswordForce(false);
      }
    } catch (err: any) {
      console.error(err);
      setPwdError(err.message || 'Failed to update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleApprove = async (uid: string) => {
    setError('');
    setSuccess('');
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'approved',
        approvalStatus: 'approved',
        rejectionReason: '',
        updatedAt: new Date().toISOString()
      });
      setSuccess('Teacher account approved successfully.');

      // Dispatch SMTP approval notification email
      const teacher = teachers.find(t => t.uid === uid);
      if (teacher && teacher.email) {
        try {
          await safeFetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toEmail: teacher.email,
              type: 'account_approved',
              data: {
                name: teacher.name || teacher.fullName,
                schoolName: teacher.schoolName || teacher.coachingName
              }
            })
          });
        } catch (emailErr) {
          console.warn("Failed to send approval email:", emailErr);
        }
      }
    } catch (err: any) {
      setError('Failed to approve teacher: ' + err.message);
    }
  };

  const handleOpenRejectModal = (uid: string) => {
    setRejectTeacherId(uid);
    setRejectionReasonInput('');
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTeacherId) return;
    if (!rejectionReasonInput.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    setError('');
    setSuccess('');
    const currentRejectId = rejectTeacherId;
    const currentReason = rejectionReasonInput.trim();
    try {
      await updateDoc(doc(db, 'users', currentRejectId), {
        status: 'rejected',
        approvalStatus: 'rejected',
        rejectionReason: currentReason,
        updatedAt: new Date().toISOString()
      });
      setSuccess('Teacher application has been rejected.');
      setRejectTeacherId(null);

      // Dispatch SMTP rejection notification email
      const teacher = teachers.find(t => t.uid === currentRejectId);
      if (teacher && teacher.email) {
        try {
          await safeFetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toEmail: teacher.email,
              type: 'account_rejected',
              data: {
                name: teacher.name || teacher.fullName,
                schoolName: teacher.schoolName || teacher.coachingName,
                reason: currentReason
              }
            })
          });
        } catch (emailErr) {
          console.warn("Failed to send rejection email:", emailErr);
        }
      }
    } catch (err: any) {
      setError('Failed to reject teacher: ' + err.message);
    }
  };

  const handleSuspend = async (uid: string) => {
    setError('');
    setSuccess('');
    setSuspendTeacherId(uid);
  };

  const executeSuspend = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'suspended',
        approvalStatus: 'suspended',
        updatedAt: new Date().toISOString()
      });
      setSuccess('Teacher account suspended.');
    } catch (err: any) {
      setError('Failed to suspend teacher: ' + err.message);
    }
    setSuspendTeacherId(null);
  };

  const handleDelete = async (uid: string) => {
    setError('');
    setSuccess('');
    setDeleteTeacherId(uid);
  };

  const executeDelete = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setSuccess('Teacher workspace deleted permanently.');
    } catch (err: any) {
      setError('Failed to delete teacher: ' + err.message);
    }
    setDeleteTeacherId(null);
  };

  const totalTeachers = teachers.length;
  const pendingCount = teachers.filter((t) => t.approvalStatus === 'pending').length;
  const approvedCount = teachers.filter((t) => t.approvalStatus === 'approved').length;
  const rejectedCount = teachers.filter((t) => t.approvalStatus === 'rejected').length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 leading-tight">EduManager Super Admin</h1>
              <p className="text-[13px] text-slate-500">System Governance & KYC Control Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPasswordForce(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Change Password</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[14px]">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-[14px]">
            {success}
          </div>
        )}

        {/* Analytics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-[16px] border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] text-slate-500 font-medium">Total Registrations</p>
              <h3 className="text-[20px] font-bold text-slate-900">{totalTeachers}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[16px] border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] text-slate-500 font-medium">Pending Review</p>
              <h3 className="text-[20px] font-bold text-slate-900">{pendingCount}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[16px] border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] text-slate-500 font-medium">Approved Teachers</p>
              <h3 className="text-[20px] font-bold text-slate-900">{approvedCount}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[16px] border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] text-slate-500 font-medium">Rejected KYC</p>
              <h3 className="text-[20px] font-bold text-slate-900">{rejectedCount}</h3>
            </div>
          </div>
        </div>

        {/* Registered Teachers List */}
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-50 bg-slate-50/50">
            <h2 className="text-[16px] font-bold text-slate-800">Teacher Approvals & KYC Request Tracker</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading registered accounts...
            </div>
          ) : teachers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No registered teachers found in the database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[12px] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Teacher & Photo</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">Coaching & Photos</th>
                    <th className="p-4">Address Details</th>
                    <th className="p-4">Status & Reg Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((teacher) => (
                    <tr key={teacher.uid} className="hover:bg-slate-50/50 transition-colors text-[13px] text-slate-700">
                      {/* Teacher Profile */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shrink-0 relative group">
                            {teacher.profilePhoto ? (
                              <>
                                <img src={teacher.profilePhoto} alt={teacher.name} className="h-full w-full object-cover" />
                                <button
                                  onClick={() => setSelectedPhoto({ url: teacher.profilePhoto!, title: `${teacher.name} - Profile Photo` })}
                                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Eye className="h-4 w-4 text-white" />
                                </button>
                              </>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center font-bold text-blue-600 text-sm">
                                {teacher.name?.charAt(0) || 'T'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">{teacher.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 text-slate-400" /> {teacher.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-4 font-mono">
                        <span className="text-xs font-bold text-slate-700 block flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" /> {teacher.phone || 'N/A'}
                        </span>
                      </td>

                      {/* Coaching & Banner */}
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <p className="font-bold text-slate-900 leading-tight flex items-center gap-1">
                            <School className="h-3.5 w-3.5 text-blue-500" /> {teacher.schoolName}
                          </p>
                          <div className="flex gap-2">
                            {teacher.bannerPhoto && (
                              <button
                                onClick={() => setSelectedPhoto({ url: teacher.bannerPhoto!, title: `${teacher.schoolName} - Banner Image` })}
                                className="text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                              >
                                <ImageIcon className="h-3 w-3" /> Banner
                              </button>
                            )}
                            {teacher.institutePhoto && (
                              <button
                                onClick={() => setSelectedPhoto({ url: teacher.institutePhoto!, title: `${teacher.schoolName} - Location/Classroom Photo` })}
                                className="text-[11px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                              >
                                <ImageIcon className="h-3 w-3" /> Location
                              </button>
                            )}
                          </div>
                          {teacher.description && (
                            <p className="text-[11px] text-slate-500 italic max-w-xs line-clamp-1">"{teacher.description}"</p>
                          )}
                        </div>
                      </td>

                      {/* Address Details */}
                      <td className="p-4 text-[12px]">
                        <p className="font-semibold text-slate-800 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          {teacher.address}
                        </p>
                        <p className="text-slate-500 mt-0.5 pl-4">
                          {teacher.city}, {teacher.state} - <span className="font-bold text-slate-700">{teacher.postalPinCode}</span>
                        </p>
                        {teacher.gpsLocation && (
                          <p className="text-[10px] text-blue-600 font-mono pl-4 mt-0.5 font-bold">
                            🌐 GPS: {teacher.gpsLocation}
                          </p>
                        )}
                      </td>

                      {/* Status & Date */}
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            teacher.approvalStatus === 'approved'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : teacher.approvalStatus === 'rejected'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : teacher.approvalStatus === 'suspended'
                              ? 'bg-slate-50 text-slate-700 border border-slate-200'
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-200 animate-pulse'
                          }`}>
                            {teacher.approvalStatus?.toUpperCase() || 'PENDING'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {teacher.registrationDate ? new Date(teacher.registrationDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        {teacher.rejectionReason && (
                          <p className="text-[11px] text-red-600 mt-1 max-w-xs line-clamp-2 leading-tight">
                            Reason: {teacher.rejectionReason}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {teacher.approvalStatus !== 'approved' && (
                            <button
                              onClick={() => handleApprove(teacher.uid)}
                              className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors border border-green-200 cursor-pointer"
                              title="Approve KYC"
                            >
                              <CheckCircle className="h-4.5 w-4.5" />
                            </button>
                          )}
                          {teacher.approvalStatus !== 'rejected' && teacher.approvalStatus !== 'suspended' && (
                            <button
                              onClick={() => handleOpenRejectModal(teacher.uid)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200 cursor-pointer"
                              title="Reject KYC"
                            >
                              <XCircle className="h-4.5 w-4.5" />
                            </button>
                          )}
                          {teacher.approvalStatus === 'approved' && (
                            <button
                              onClick={() => handleSuspend(teacher.uid)}
                              className="p-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-lg transition-colors border border-yellow-200 cursor-pointer"
                              title="Suspend Account"
                            >
                              <Slash className="h-4.5 w-4.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(teacher.uid)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border border-red-100 cursor-pointer"
                            title="Delete Workspace"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Force Password Change Modal (NON-CLOSABLE ON INITIAL FORCE) */}
      {showPasswordForce && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] max-w-md w-full shadow-2xl border border-slate-100 p-8 space-y-4">
            <div className="h-12 w-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Force Password Change</h3>
              <p className="text-xs text-slate-500 mt-1">
                You are currently logged in with default credentials. For compliance and security, you must update your password immediately before proceeding.
              </p>
            </div>

            {pwdError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {pwdError}
              </div>
            )}

            <form onSubmit={handleForcePasswordChange} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  New Admin Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-sm transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-sm transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-100 cursor-pointer"
              >
                {pwdLoading ? 'Updating Password...' : 'Save and Continue'}
              </button>

              {/* Only let them cancel if they already had a secure password changed previously */}
              {adminProfile?.adminPasswordChanged && (
                <button
                  type="button"
                  onClick={() => setShowPasswordForce(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectTeacherId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRejectSubmit} className="bg-white rounded-[20px] max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
              <AlertTriangle className="text-red-500 h-5 w-5" />
              Specify Rejection Reason
            </h3>
            <p className="text-xs text-slate-500">
              Please state why this teacher KYC application is being rejected. The teacher will see this reason and will be allowed to fix their submission.
            </p>
            <textarea
              required
              rows={4}
              placeholder="e.g. The uploaded Coaching Banner Image is blurry. Please upload a clear banner photo showing your coaching center name."
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-sm transition-colors"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTeacherId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-xs cursor-pointer shadow-md shadow-red-100"
              >
                Reject KYC Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Asset Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] max-w-2xl w-full overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{selectedPhoto.title}</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-6 bg-slate-50 flex justify-center items-center">
              <img src={selectedPhoto.url} alt={selectedPhoto.title} className="max-w-full max-h-[500px] rounded-lg object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Custom Suspend Confirm Modal */}
      {suspendTeacherId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl border border-slate-100 text-center space-y-6">
            <div className="h-16 w-16 mx-auto bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Suspend Teacher Workspace?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to suspend this teacher workspace? They will lose access to their students database and records instantly.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => executeSuspend(suspendTeacherId)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                Suspend Account
              </button>
              <button
                onClick={() => setSuspendTeacherId(null)}
                className="w-full py-2.5 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Permanent Delete Confirm Modal */}
      {deleteTeacherId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl border border-slate-100 text-center space-y-6">
            <div className="h-16 w-16 mx-auto bg-red-50 text-red-600 rounded-2xl flex items-center justify-center animate-pulse">
              <Trash2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 text-red-600">CRITICAL ACTION: Permanently Delete Workspace?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete this teacher workspace? This deletes all associated student data, payments, and cannot be undone.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => executeDelete(deleteTeacherId)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                Permanently Delete
              </button>
              <button
                onClick={() => setDeleteTeacherId(null)}
                className="w-full py-2.5 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
