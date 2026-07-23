import imageCompression from "browser-image-compression";
import React, { useState } from 'react';
import { db, storage } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { TeacherProfile } from '../types';
import { Sparkles, Camera, Image as ImageIcon, School, User } from 'lucide-react';
import { motion } from 'motion/react';

interface CompleteProfileModalProps {
  teacherProfile: TeacherProfile;
  onComplete: (updated: Partial<TeacherProfile>) => void;
}

export default function CompleteProfileModal({ teacherProfile, onComplete }: CompleteProfileModalProps) {
  const [name, setName] = useState(teacherProfile.name || '');
  const [schoolName, setSchoolName] = useState(teacherProfile.schoolName || '');
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [bannerPhotoFile, setBannerPhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(teacherProfile.profilePhoto || '');
  const [bannerPhotoPreview, setBannerPhotoPreview] = useState(teacherProfile.bannerPhoto || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to read file for preview
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setFile: (val: File | null) => void, 
    setPreview: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Limit to 5MB
        setError('Image must be less than 5MB');
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    // 1. Compress Image
    const options = {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 800,
      useWebWorker: true
    };
    let compressedFile = file;
    try {
      compressedFile = await imageCompression(file, options);
    } catch (error) {
      console.error('Compression error:', error);
    }

    // Check if storage bucket is configured or if we're in offline/mock mode
    if (!storage.app.options.storageBucket || storage.app.options.storageBucket.includes('remixed')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
    }

    try {
      const storageRef = ref(storage, path);
      const uploadTask = await uploadBytesResumable(storageRef, compressedFile);
      return getDownloadURL(uploadTask.ref);
    } catch (err) {
      console.warn("Firebase storage upload failed, falling back to base64 data URL", err);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim() || !schoolName.trim()) {
      setError('Please fill in your name and coaching name.');
      return;
    }
    if (!profilePhotoPreview) {
      setError('Please upload a Profile Photo.');
      return;
    }
    if (!bannerPhotoPreview) {
      setError('Please upload a Coaching Banner Photo.');
      return;
    }

    setLoading(true);
    try {
      let finalProfilePhotoUrl = profilePhotoPreview;
      let finalBannerPhotoUrl = bannerPhotoPreview;

      // Upload if new files are selected
      if (profilePhotoFile) {
        finalProfilePhotoUrl = await uploadFile(profilePhotoFile, `users/profile/${teacherProfile.uid}_${Date.now()}`);
      }
      
      if (bannerPhotoFile) {
        finalBannerPhotoUrl = await uploadFile(bannerPhotoFile, `users/banner/${teacherProfile.uid}_${Date.now()}`);
      }

      const updateData = {
        name: name.trim(),
        schoolName: schoolName.trim(),
        profilePhoto: finalProfilePhotoUrl,
        bannerPhoto: finalBannerPhotoUrl,
        isProfileComplete: true,
        // Status remains pending until admin approves
      };

      const teacherRef = doc(db, 'users', teacherProfile.uid);
      await updateDoc(teacherRef, updateData);
      
      onComplete(updateData);
    } catch (err: any) {
      console.error(err);
      setError('Failed to update profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[16px] max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden font-sans my-auto"
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white text-center">
          <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-[20px] font-bold">Profile Setup</h2>
          <p className="text-[13px] text-blue-100 mt-1">
            Welcome! Please complete your profile to submit for admin approval.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anisur Rahman"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <School className="h-4 w-4 text-slate-400" />
              <span>Coaching/School Name</span>
            </label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. Apex Science Coaching"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1">
              Profile Photo
            </label>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {profilePhotoPreview ? (
                  <img src={profilePhotoPreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <label className="flex-1 flex justify-center px-4 py-2 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setProfilePhotoFile, setProfilePhotoPreview)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1">
              Coaching/School Banner Photo
            </label>
            <div className="flex items-center gap-3">
              <div className="h-12 w-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {bannerPhotoPreview ? (
                  <img src={bannerPhotoPreview} alt="Banner" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <label className="flex-1 flex justify-center px-4 py-2 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> Upload Banner</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setBannerPhotoFile, setBannerPhotoPreview)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-[16px] font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-100 mt-2 cursor-pointer"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Submit for Approval'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

