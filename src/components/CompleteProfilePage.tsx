import React, { useState } from 'react';
import imageCompression from "browser-image-compression";
import { db, storage, auth } from '../lib/firebase';
import { safeFetch } from '../utils/api';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from 'firebase/storage';


import { TeacherProfile } from '../types';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Camera, 
  Image as ImageIcon, 
  School, 
  User, 
  Phone, 
  MapPin, 
  Send, 
  LogOut, 
  Loader2, 
  Building, 
  Map, 
  Hash,
  CheckSquare
} from 'lucide-react';

interface CompleteProfilePageProps {
  teacherProfile: TeacherProfile | null;
  onComplete: () => void;
  onLogout: () => void;
}

export default function CompleteProfilePage({ teacherProfile, onComplete, onLogout }: CompleteProfilePageProps) {
  const [fullName, setFullName] = useState(teacherProfile?.name || teacherProfile?.fullName || '');
  const [phone, setPhone] = useState(teacherProfile?.phone || teacherProfile?.mobile || '');
  const [instituteName, setInstituteName] = useState(teacherProfile?.schoolName || teacherProfile?.instituteName || '');
  const [address, setAddress] = useState(teacherProfile?.address || '');
  const [city, setCity] = useState(teacherProfile?.city || '');
  const [state, setState] = useState(teacherProfile?.state || '');
  const [pinCode, setPinCode] = useState(teacherProfile?.postalPinCode || teacherProfile?.pinCode || '');

  // File states
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [bannerPhotoFile, setBannerPhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(teacherProfile?.profilePhoto || '');
  const [bannerPhotoPreview, setBannerPhotoPreview] = useState(teacherProfile?.bannerPhoto || teacherProfile?.bannerImage || '');

  // Drag states
  const [dragProfileActive, setDragProfileActive] = useState(false);
  const [dragBannerActive, setDragBannerActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Drag Events for Profile Photo
  const handleProfileDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragProfileActive(true);
    } else if (e.type === "dragleave") {
      setDragProfileActive(false);
    }
  };

  const handleProfileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragProfileActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], setProfilePhotoFile, setProfilePhotoPreview);
    }
  };

  // Handle Drag Events for Banner Photo
  const handleBannerDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragBannerActive(true);
    } else if (e.type === "dragleave") {
      setDragBannerActive(false);
    }
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragBannerActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], setBannerPhotoFile, setBannerPhotoPreview);
    }
  };

  // Helper to read and process image file with basic size validation
  const processFile = (
    file: File, 
    setFile: (val: File | null) => void, 
    setPreview: (val: string) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      setError('Selected file must be an image.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) { // Limit to 8MB
      setError('Image must be less than 8MB.');
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (val: File | null) => void,
    setPreview: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, setFile, setPreview);
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const options = {
      maxSizeMB: 0.1, // Reduced to 100KB to ensure base64 fallback easily fits in Firestore 1MB document limit
      maxWidthOrHeight: 800,
      useWebWorker: true
    };
    
    let compressedFile = file;
    try {
      compressedFile = await imageCompression(file, options);
    } catch (err) {
      console.warn('Image compression error:', err);
    }

    try {
      const storageRef = ref(storage, `users/${path}`);
      await uploadBytes(storageRef, compressedFile);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (err: any) {
      console.warn(`Firebase upload failed (${err.message}). Falling back to base64 string representation.`);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Unable to upload images. Please check your internet connection and try again.'));
        reader.readAsDataURL(compressedFile);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !phone.trim() || !instituteName.trim() || !address.trim() || !city.trim() || !state.trim() || !pinCode.trim()) {
      setError('Please fill in all requested fields.');
      return;
    }
    if (!profilePhotoPreview) {
      setError('Please upload or drag-and-drop a Profile Photo.');
      return;
    }
    if (!bannerPhotoPreview) {
      setError('Please upload or drag-and-drop an Institute Banner Image.');
      return;
    }

    setLoading(true);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('No authenticated user session found.');
      setLoading(false);
      return;
    }

    // Capture states before navigating away
    const finalFullName = fullName.trim();
    const finalPhone = phone.trim();
    const finalInstituteName = instituteName.trim();
    const finalAddress = address.trim();
    const finalCity = city.trim();
    const finalState = state.trim();
    const finalPinCode = pinCode.trim();
    const finalProfilePhotoFile = profilePhotoFile;
    const finalBannerPhotoFile = bannerPhotoFile;
    const finalProfilePhotoPreview = profilePhotoPreview;
    const finalBannerPhotoPreview = bannerPhotoPreview;

    // Async task to upload images and save to Firestore
    const runAsyncSave = async () => {
      try {
        let finalProfilePhotoUrl = finalProfilePhotoPreview;
        let finalBannerPhotoUrl = finalBannerPhotoPreview;

        const uploadPromises: Promise<any>[] = [];

        if (finalProfilePhotoFile) {
          uploadPromises.push(
            uploadImage(finalProfilePhotoFile, `profile_${currentUser.uid}.jpg`).then(url => {
              finalProfilePhotoUrl = url;
            })
          );
        }

        if (finalBannerPhotoFile) {
          uploadPromises.push(
            uploadImage(finalBannerPhotoFile, `banner_${currentUser.uid}.jpg`).then(url => {
              finalBannerPhotoUrl = url;
            })
          );
        }

        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }

        const userData = {
          uid: currentUser.uid,
          email: currentUser.email!,
          fullName: finalFullName,
          phone: finalPhone,
          address: finalAddress,
          city: finalCity,
          state: finalState,
          pinCode: finalPinCode,
          coachingName: finalInstituteName,
          profilePhoto: finalProfilePhotoUrl,
          bannerPhoto: finalBannerPhotoUrl,
          status: 'pending',
          rejectionReason: '',
          profileCompleted: true,
          createdAt: teacherProfile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const userRef = doc(db, 'users', currentUser.uid);

        await setDoc(userRef, userData, { merge: true });

        console.log('Async setup completed successfully in background.');
      } catch (err: any) {
        console.error('Background setup error:', err);
        // Throw simple readable error for handling
        throw new Error('Unable to upload images. Please check your internet connection and try again.');
      }
    };

    // Start process and wait for completion
    try {
      await runAsyncSave();

      // Dispatch SMTP profile completed under review email
      try {
        await safeFetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: currentUser.email,
            type: 'profile_completed',
            data: {
              name: finalFullName,
              schoolName: finalInstituteName
            }
          })
        });
      } catch (emailErr) {
        console.warn("Failed to send profile completion email:", emailErr);
      }

      setLoading(false);
      setSuccess('Profile submitted successfully! Redirecting...');
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Unable to upload images. Please check your internet connection and try again.');
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans overflow-x-hidden w-full flex flex-col">
      {/* Full-screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center gap-4 animate-in fade-in duration-300"
          >
            <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 animate-bounce">
              <Sparkles className="h-8 w-8 text-[#16A34A]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Setting Up Your Workspace</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                We're configuring your coaching database and preparing your dashboards. This will take just a moment.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#16A34A] text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-full mt-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Optimizing Assets...</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Top Full Width Premium Green Banner with curved bottom edge */}
      <div className="w-full bg-gradient-to-r from-[#16A34A] to-emerald-600 pt-16 pb-28 px-6 sm:px-12 md:px-16 text-white relative rounded-b-[32px] shrink-0 shadow-md">
        {/* Top-Right Logout Button */}
        <div className="absolute top-6 right-6 sm:right-12">
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold rounded-xl text-xs transition-all cursor-pointer border border-white/25 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Complete Profile Setup</h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-xl leading-relaxed">
              Welcome to your Fise App workspace. Please provide your official institutional details below to establish your customized dashboard review.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Content overlapping the curved banner */}
      <div className="w-full px-5 sm:px-8 max-w-3xl mx-auto -mt-12 relative z-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] border border-slate-200 shadow-md shadow-slate-100/70 p-5 sm:p-8 space-y-8"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              <span>{success}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Visual Media & Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="h-6 w-6 bg-[#DCFCE7] text-[#16A34A] rounded-md flex items-center justify-center shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Media & Branding</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Profile Photo Drag Box */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Profile Photo <span className="text-red-500">*</span>
                  </label>
                  <label 
                    htmlFor="profile-photo-input"
                    onDragEnter={handleProfileDrag}
                    onDragOver={handleProfileDrag}
                    onDragLeave={handleProfileDrag}
                    onDrop={handleProfileDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center min-h-[160px] cursor-pointer bg-white relative ${
                      dragProfileActive 
                        ? 'border-[#16A34A] bg-emerald-50/10' 
                        : 'border-slate-200 hover:border-[#16A34A]/50 shadow-xs'
                    }`}
                  >
                    <div className="mb-3">
                      {profilePhotoPreview ? (
                        <div className="relative group h-16 w-16 rounded-full overflow-hidden border border-slate-200 shadow-sm mx-auto">
                          <img src={profilePhotoPreview} alt="Profile" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-11 w-11 bg-[#DCFCE7] text-[#16A34A] rounded-full flex items-center justify-center shadow-sm mx-auto">
                          <Camera className="h-5.5 w-5.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-slate-800 text-xs font-semibold leading-normal">
                      <span className="text-[#16A34A] hover:underline">Click to upload</span> or drag files
                    </p>
                    <p className="text-slate-400 text-[10px] mt-1 font-medium">JPG, PNG format up to 8MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileInputChange(e, setProfilePhotoFile, setProfilePhotoPreview)}
                      className="hidden"
                      id="profile-photo-input"
                    />
                  </label>
                </div>

                {/* Banner Photo Drag Box */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Institute Banner Photo <span className="text-red-500">*</span>
                  </label>
                  <label 
                    htmlFor="banner-photo-input"
                    onDragEnter={handleBannerDrag}
                    onDragOver={handleBannerDrag}
                    onDragLeave={handleBannerDrag}
                    onDrop={handleBannerDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center min-h-[160px] cursor-pointer bg-white relative ${
                      dragBannerActive 
                        ? 'border-[#16A34A] bg-emerald-50/10' 
                        : 'border-slate-200 hover:border-[#16A34A]/50 shadow-xs'
                    }`}
                  >
                    <div className="mb-3">
                      {bannerPhotoPreview ? (
                        <div className="relative group h-16 w-28 rounded-lg overflow-hidden border border-slate-200 shadow-sm mx-auto">
                          <img src={bannerPhotoPreview} alt="Banner" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-11 w-11 bg-[#DCFCE7] text-[#16A34A] rounded-full flex items-center justify-center shadow-sm mx-auto">
                          <ImageIcon className="h-5.5 w-5.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-slate-800 text-xs font-semibold leading-normal">
                      <span className="text-[#16A34A] hover:underline">Click to upload</span> or drag files
                    </p>
                    <p className="text-slate-400 text-[10px] mt-1 font-medium">Landscape header image up to 8MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileInputChange(e, setBannerPhotoFile, setBannerPhotoPreview)}
                      className="hidden"
                      id="banner-photo-input"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 2. Core Teacher Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="h-6 w-6 bg-[#DCFCE7] text-[#16A34A] rounded-md flex items-center justify-center shrink-0">
                  <School className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Institutional Identification</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Al-Amin Hossein"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-900 placeholder-slate-400 text-sm transition-all"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +880 1712-345678"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-900 placeholder-slate-400 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Institute Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-[#16A34A]" />
                  <span>Coaching / School Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="e.g. Apex Science Coaching Center"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-900 placeholder-slate-400 text-sm transition-all"
                />
              </div>
            </div>

            {/* 3. Geographical Address details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="h-6 w-6 bg-[#DCFCE7] text-[#16A34A] rounded-md flex items-center justify-center shrink-0">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Physical Location</h2>
              </div>

              {/* Full Physical Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                  <span>Full Address</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot 42, Floor 3, Lake View Commercial, Sector 1"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-900 placeholder-slate-400 text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* City */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>City</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Dhaka"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-900 placeholder-slate-400 text-sm transition-all"
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Map className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>State</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Dhaka Division"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-900 placeholder-slate-400 text-sm transition-all"
                  />
                </div>

                {/* PIN Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>PIN Code</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="e.g. 1230"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-900 placeholder-slate-400 text-sm transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submission Submit button */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <p className="text-[11px] text-slate-400 leading-normal max-w-sm font-medium">
                By submitting this form, you certify that all information is correct and valid for auditing reviews.
              </p>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-bold rounded-[16px] text-sm transition-all shadow-md shadow-emerald-100/50 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Processing Setup...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 text-white" />
                    <span>Submit to Admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
