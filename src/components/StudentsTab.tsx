import React, { useState, useRef, useMemo } from 'react';
import { Student, Payment, TeacherProfile } from '../types';
import { auth, storage, db } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Plus, Search, Filter, Trash2, Edit, User, Phone, 
  Camera, Upload, X, Check, GraduationCap, Share2, 
  Clipboard, Clock, Archive, RefreshCw, Loader2, ArrowLeft, ArrowRight, School
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import CreateClassPage from './CreateClassPage';
import { saveLocalStudentImage, getLocalStudentImageSync } from '../utils/localImageStore';

interface StudentsTabProps {
  payments?: Payment[];
  students: Student[];
  classes?: any[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt' | 'teacherId'>) => Promise<void>;
  onEditStudent: (id: string, student: Partial<Omit<Student, 'id' | 'createdAt' | 'teacherId'>>) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  teacherProfile?: TeacherProfile | null;
  isOfflineMode?: boolean;
  onSaveClassState?: (savedClass: any, customClasses?: string[], customBatches?: string[]) => void;
  triggerNotification?: (message: string, type?: 'success' | 'error') => void;
}

export default function StudentsTab({ 
  students, 
  payments = [],
  onAddStudent, 
  onEditStudent, 
  onDeleteStudent, 
  classes = [],
  teacherProfile,
  isOfflineMode = false,
  onSaveClassState,
  triggerNotification
}: StudentsTabProps) {
  // Navigation & UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Dashboard Selections
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  
  // Update selections when classes load
  React.useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  React.useEffect(() => {
    const cls = classes.find(c => c.id === selectedClassId);
    const batches = (cls && cls.batches && cls.batches.length > 0) ? cls.batches : (cls ? [{ name: 'Batch A' }] : []);
    if (cls) {
      if (!batches.find((b:any) => b.name === selectedBatchId)) {
        setSelectedBatchId(batches[0].name);
      }
    } else {
      setSelectedBatchId('');
    }
  }, [selectedClassId, classes]);

  const activeClass = classes.find(c => c.id === selectedClassId);
  const activeBatches = (activeClass?.batches && activeClass.batches.length > 0) ? activeClass.batches : (activeClass ? [{ name: 'Batch A' }] : []);

  // Filters & Search
  const [filterType, setFilterType] = useState<'All' | 'Boy' | 'Girl' | 'Paid' | 'Due'>('All');
  const [searchRollQuery, setSearchRollQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Custom delete confirmation modal state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Form Fields
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showCreateClassPage, setShowCreateClassPage] = useState(false);
  const [name, setName] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formBatchId, setFormBatchId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [gender, setGender] = useState<'Boy' | 'Girl'>('Boy');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [motherMobile, setMotherMobile] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  
  // Other existing fields to keep
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('1000');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  // Camera
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Derived Students for Dashboard
  const dashboardStudents = useMemo(() => {
    if (!activeClass || !selectedBatchId) return [];
    return students.filter(s => 
      s.class === activeClass.className && 
      s.batch === selectedBatchId &&
      s.status !== 'Archived'
    );
  }, [students, activeClass, selectedBatchId]);

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const totalStudents = dashboardStudents.length;
  const boysCount = dashboardStudents.filter(s => s.gender === 'Boy').length;
  const girlsCount = dashboardStudents.filter(s => s.gender === 'Girl').length;

  const paidCount = useMemo(() => {
    return dashboardStudents.filter(student => {
      const p = payments.find(pay => pay.studentId === student.id && pay.month === currentMonth);
      return p && p.status === 'Paid';
    }).length;
  }, [dashboardStudents, payments, currentMonth]);

  const dueCount = totalStudents - paidCount;

  const filteredStudents = useMemo(() => {
    return dashboardStudents.filter(student => {
      // 1. Filter by search roll query
      if (searchRollQuery.trim()) {
        const rollMatch = student.rollNumber?.toLowerCase().includes(searchRollQuery.toLowerCase().trim());
        if (!rollMatch) return false;
      }
      
      // 2. Filter by selected statistic type
      if (filterType === 'Boy') {
        return student.gender === 'Boy';
      }
      if (filterType === 'Girl') {
        return student.gender === 'Girl';
      }
      if (filterType === 'Paid') {
        const p = payments.find(pay => pay.studentId === student.id && pay.month === currentMonth);
        return p && p.status === 'Paid';
      }
      if (filterType === 'Due') {
        const p = payments.find(pay => pay.studentId === student.id && pay.month === currentMonth);
        return !p || p.status !== 'Paid';
      }
      return true;
    });
  }, [dashboardStudents, filterType, searchRollQuery, payments, currentMonth]);

  // Photo handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Photo must be less than 5MB');
        return;
      }
      setFormError(null);
      setIsUploading(true);
      setUploadProgress(20);
      try {
        const downloadUrl = await uploadPhotoFile(file);
        setPhotoUrl(downloadUrl);
        setPhotoFile(null); // No need to keep local file anymore since it is already uploaded!
        if (triggerNotification) {
          triggerNotification("Photo uploaded successfully.", "success");
        }
      } catch (err: any) {
        console.error("Photo upload failed:", err);
        setFormError("Photo upload failed: " + (err.message || err));
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const startCamera = async () => {
    try {
      setFormError(null);
      setShowCamera(true);
      setTimeout(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300, facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        mediaStreamRef.current = stream;
      }, 300);
    } catch (err) {
      setFormError("Failed to access camera.");
      setShowCamera(false);
    }
  };

  const captureImage = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL('image/jpeg');
        stopCamera();
        
        setIsUploading(true);
        setUploadProgress(20);
        try {
          const file = dataURLtoFile(dataUrl, `captured_${Date.now()}.jpg`);
          const downloadUrl = await uploadPhotoFile(file);
          setPhotoUrl(downloadUrl);
          if (triggerNotification) {
            triggerNotification("Photo captured & uploaded successfully.", "success");
          }
        } catch (err: any) {
          console.error("Photo capture failed:", err);
          setFormError("Photo capture failed: " + (err.message || err));
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    mediaStreamRef.current = null;
    setShowCamera(false);
  };

  const resetForm = () => {
    setEditingStudent(null);
    setName('');
    setRollNumber('');
    setMobileNumber('');
    setGuardianName('');
    setGender('Boy');
    setPhotoUrl('');
    setPhotoFile(null);
    setFatherName('');
    setMotherName('');
    setMotherMobile('');
    setAddress('');
    setDob('');
    setMonthlyFee('1000');
    setAdmissionDate(new Date().toISOString().slice(0, 10));
    setFormError(null);
    
    const initialClassId = selectedClassId || (classes[0]?.id || '');
    const cls = classes.find(c => c.id === initialClassId);
    const batches = (cls && cls.batches && cls.batches.length > 0) ? cls.batches : (cls ? [{ name: 'Batch A' }] : []);
    const initialBatchId = selectedBatchId || (batches[0]?.name || '');

    setFormClassId(initialClassId);
    setFormBatchId(initialBatchId);
    setWizardStep(1);
    setTime('');
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const uploadPhotoFile = async (file: File): Promise<string> => {
    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 500, useWebWorker: false };
    let compressedFile = file;
    try { 
      compressedFile = await imageCompression(file, options); 
    } catch (e) {
      console.warn("Compression failed, using original", e);
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(compressedFile);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formClassId) {
      setFormError("Please select a class before continuing.");
      return;
    }

    if (!formBatchId) {
      setFormError("Please select a batch before continuing.");
      return;
    }
    
    if (!name.trim() || !mobileNumber.trim() || !fatherName.trim() || !motherName.trim() || !address.trim()) {
      setFormError("Please fill all required fields: Name, Father's Name, Mother's Name, Father's Mobile, and Full Address.");
      return;
    }

    try {
      setIsUploading(true);
      let rawPhotoUrl = photoUrl;
      
      if (photoFile) {
        rawPhotoUrl = await uploadPhotoFile(photoFile);
      } else if (photoUrl && photoUrl.startsWith('data:')) {
        rawPhotoUrl = await uploadPhotoFile(dataURLtoFile(photoUrl, `captured_${Date.now()}.jpg`));
      }

      // Save student image in browser IndexedDB/localStorage only
      const tempStudentId = editingStudent ? editingStudent.id : `student-${Date.now()}`;
      let localPhotoRef = '';
      if (rawPhotoUrl) {
        localPhotoRef = await saveLocalStudentImage(tempStudentId, rawPhotoUrl);
      }

      const cls = classes.find(c => c.id === formClassId);
      if (!cls) throw new Error("Selected class is invalid.");
      const batches = (cls.batches && cls.batches.length > 0) ? cls.batches : [{ name: 'Batch A', id: 'batch-a' }];
      const batchObj = batches.find((b:any) => (b.id || b.name) === formBatchId) || batches[0];
      if (!batchObj) throw new Error("Selected batch is invalid.");

      // Handle Roll Number Generation/Validation
      let finalRoll = '';
      if (editingStudent && editingStudent.classId === formClassId && editingStudent.batchId === formBatchId) {
        finalRoll = editingStudent.rollNumber;
      } else {
        // Auto-generate roll number sequence (unique per Class and Batch, no duplicates, continue numbering)
        const existingInBatch = students.filter(s => s.class === cls.className && s.batch === batchObj.name);
        const maxExistingRoll = Math.max(0, ...existingInBatch.map(s => parseInt(s.rollNumber) || 0));
        const nextRollNum = Math.max(maxExistingRoll, batchObj.lastRollNumber || 0) + 1;
        finalRoll = String(nextRollNum);

        // Save lastRollNumber to class document to ensure we never reuse old Roll Numbers
        if (isOfflineMode) {
          const storedClasses = localStorage.getItem('edu_classes');
          if (storedClasses) {
            const classesList = JSON.parse(storedClasses);
            const updatedClasses = classesList.map((c: any) => {
              if (c.id === formClassId) {
                return {
                  ...c,
                  batches: (c.batches || [{ name: 'Batch A' }]).map((b: any) => {
                    if (b.name === formBatchId) {
                      return { ...b, lastRollNumber: nextRollNum };
                    }
                    return b;
                  })
                };
              }
              return c;
            });
            localStorage.setItem('edu_classes', JSON.stringify(updatedClasses));
          }
        } else {
          const classRef = doc(db, 'classes', formClassId);
          const updatedBatches = batches.map((b: any) => {
            if (b.name === formBatchId) {
              return { ...b, lastRollNumber: nextRollNum };
            }
            return b;
          });
          updateDoc(classRef, { batches: updatedBatches }).catch(e => console.warn("Failed to update class lastRollNumber", e));
        }
      }

      const timestamp = new Date().toISOString();
      const payload: Omit<Student, 'id' | 'createdAt' | 'teacherId'> & { motherMobile?: string; address?: string; dob?: string; feeStatus?: string; createdTimestamp?: string } = {
        name: name.trim(),
        rollNumber: finalRoll,
        classId: formClassId,
        class: cls.className,
        batchId: formBatchId,
        batch: batchObj.name,
        time: time.trim() || (batchObj.schedules?.[0]?.startTime || ''),
        mobileNumber: mobileNumber.trim(),
        guardianName: fatherName.trim() || motherName.trim() || 'Parent', // Backwards compatibility
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        motherMobile: motherMobile.trim(),
        address: address.trim(),
        monthlyFee: parseFloat(monthlyFee) || 1000,
        admissionDate,
        status: editingStudent ? editingStudent.status : 'Active',
        photoUrl: localPhotoRef || '',
        gender: gender,
        dob: dob.trim(),
        feeStatus: 'Due',
        createdTimestamp: timestamp
      };

      // FAST UI UPDATE: Return to list immediately while App.tsx handles optimistic state
      if (editingStudent) {
        await onEditStudent(editingStudent.id, payload);
      } else {
        await onAddStudent(payload);
      }
      
      setShowAddForm(false);
      resetForm();
    } catch (err: any) {
      console.error("Student registration error:", err);
      setFormError(err.message || "An unexpected error occurred while saving student data.");
    } finally {
      setIsUploading(false);
    }
  };

  const getRegistrationLink = () => {
    const teacherId = auth.currentUser?.uid || '';
    if (!activeClass || !selectedBatchId) return '';
    return `${window.location.origin}/register/${teacherId}?classId=${activeClass.id}&batchId=${encodeURIComponent(selectedBatchId)}`;
  };

  const handleShare = async (method: 'whatsapp' | 'telegram' | 'gmail' | 'sms' | 'native') => {
    const link = getRegistrationLink();
    if (!link) return;
    const text = `Hello! Please register for ${activeClass?.className} - ${selectedBatchId} using this link: ${link}`;
    
    if (method === 'native' && navigator.share) {
      try {
        await navigator.share({ title: 'Student Registration', text, url: link });
      } catch (err) { console.log(err); }
    } else if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    } else if (method === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Please register here:')}`);
    } else if (method === 'gmail') {
      window.open(`mailto:?subject=Student Registration&body=${encodeURIComponent(text)}`);
    } else if (method === 'sms') {
      window.open(`sms:?&body=${encodeURIComponent(text)}`);
    }
  };

  return (
    <div className="space-y-5 font-sans pb-32 sm:pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-6.5 w-6.5 text-[#16A34A]" /> Student Directory
          </h1>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              if (!activeClass || !selectedBatchId) {
                alert("Please select a class and batch first.");
                return;
              }
              setShowShareModal(true);
            }}
            className="flex-1 sm:flex-none min-h-[48px] px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black rounded-2xl text-xs transition-all border-2 border-emerald-200/80 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Share2 className="h-4 w-4 text-emerald-600" />
            Register Link
          </button>
          <button
            id="add-student-toggle-btn"
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="flex-1 sm:flex-none min-h-[48px] px-5 bg-[#16A34A] hover:bg-[#15803D] text-white font-black rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
            {showAddForm ? 'Cancel' : 'Add Student'}
          </button>
        </div>
      </div>

      {/* Manual Add Student Flow */}
      {showAddForm ? (
        classes.length === 0 ? (
          showCreateClassPage ? (
            <CreateClassPage
              teacherProfile={teacherProfile}
              onBack={() => setShowCreateClassPage(false)}
              onSaveComplete={(savedClass, customClasses, customBatches) => {
                if (onSaveClassState) {
                  onSaveClassState(savedClass, customClasses, customBatches);
                }
                setShowCreateClassPage(false);
              }}
              triggerNotification={triggerNotification}
            />
          ) : (
            <div className="bg-white rounded-[32px] border border-slate-150 p-8 text-center space-y-6 shadow-xl shadow-slate-100/30">
              <div className="h-20 w-20 mx-auto rounded-[24px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <School className="h-10 w-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-[20px] font-black text-slate-900">No Class & Batch Available</h2>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Please create a Class and Batch first before admitting students.
                </p>
              </div>
              <button
                onClick={() => setShowCreateClassPage(true)}
                className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Create Class
              </button>
            </div>
          )
        ) : (
          <div className="bg-white rounded-[24px] border border-slate-150 shadow-md p-6 space-y-6">
            {wizardStep === 1 ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">Step 1 of 2</p>
                    <h3 className="text-lg font-black text-slate-900">Select Class & Batch</h3>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-2 w-8 rounded-full bg-emerald-600" />
                    <div className="h-2 w-8 rounded-full bg-slate-100" />
                  </div>
                </div>

                {formError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold animate-shake">
                    ⚠️ {formError}
                  </div>
                )}

                {/* Class Selection */}
                <div className="space-y-3">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Select Class</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {classes.map(cls => {
                      const isSelected = formClassId === cls.id;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setFormClassId(cls.id);
                            setFormBatchId('');
                          }}
                          className={`py-3 px-4 rounded-xl text-xs font-black border-2 transition-all cursor-pointer text-center ${
                            isSelected 
                              ? 'border-[#16A34A] bg-[#16A34A] text-white' 
                              : 'bg-white border-emerald-100 text-[#16A34A] hover:border-[#16A34A]'
                          }`}
                        >
                          {cls.className}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Batch Selection */}
                {formClassId && (
                  <div className="space-y-3 pt-3 border-t border-slate-50">
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Select Batch</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(() => {
                        const cls = classes.find(c => c.id === formClassId);
                        const batches = (cls?.batches && cls.batches.length > 0) ? cls.batches : [{ name: 'Batch A', id: 'batch-a' }];
                        return batches.map((b: any) => {
                          const batchId = b.id || b.name;
                          const isSelected = formBatchId === batchId;
                          const sched = b.schedules?.[0];
                          const schedTime = sched ? `${sched.startTime} – ${sched.endTime}` : 'No Class Time';
                          const schedDays = sched?.selectedDays ? sched.selectedDays.join(' • ') : 'Mon • Wed • Fri';
                          const studentCount = students.filter(s => s.class === cls?.className && s.batch === b.name && s.status !== 'Archived').length;

                          return (
                            <button
                              key={batchId}
                              type="button"
                              onClick={() => setFormBatchId(batchId)}
                              className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between h-32 ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm'
                                  : 'border-slate-100 hover:border-slate-200 bg-white text-slate-700'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <div>
                                  <h4 className="text-sm font-black text-slate-900">{b.name}</h4>
                                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                                    <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    <span>{schedTime}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                    {schedDays}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="h-5 w-5 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                              <div className="border-t border-slate-100/80 pt-2 mt-2 flex justify-between items-center w-full">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Enrolled</span>
                                <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">{studentCount} Students</span>
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  {(!formClassId || !formBatchId) && (
                    <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200/80 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{!formClassId ? 'Please select a Class before continuing.' : 'Please select a Batch before continuing.'}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!formClassId || !formBatchId}
                    onClick={() => {
                      if (!formClassId) {
                        setFormError("Please select a class before continuing.");
                        return;
                      }
                      if (!formBatchId) {
                        setFormError("Please select a batch before continuing.");
                        return;
                      }
                      setFormError(null);
                      setWizardStep(2);
                    }}
                    className="w-full sm:w-auto px-8 min-h-[52px] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 ml-auto active:scale-95"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setWizardStep(1)} className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer animate-pulse" disabled={isUploading}>
                      <ArrowLeft className="h-4.5 w-4.5" />
                    </button>
                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">Step 2 of 2</p>
                      <h3 className="text-lg font-black text-slate-900">Student Information</h3>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-2 w-8 rounded-full bg-slate-200" />
                    <div className="h-2 w-8 rounded-full bg-emerald-600" />
                  </div>
                </div>

                {formError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold animate-pulse">
                    ⚠️ {formError}
                  </div>
                )}

                {isUploading && (
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress || 30}%` }}
                      className="bg-emerald-600 h-full"
                    />
                  </div>
                )}

                {/* Photo Section */}
                <div className="flex flex-col items-center p-5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <div className="relative h-24 w-24 bg-white rounded-full border border-slate-200 overflow-hidden flex items-center justify-center mb-3 shadow-inner">
                    {photoUrl ? <img src={photoUrl} className="h-full w-full object-cover animate-scaleUp" /> : <User className="h-10 w-10 text-slate-300" />}
                    {photoUrl && <button type="button" onClick={() => setPhotoUrl('')} className="absolute top-1 right-1 h-5 w-5 bg-rose-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-sm"><X className="h-3.5 w-3.5"/></button>}
                  </div>
                  
                  {showCamera ? (
                    <div className="flex flex-col items-center gap-3">
                      <video ref={videoRef} className="rounded-2xl h-40 w-40 object-cover bg-black shadow-md border border-slate-200"></video>
                      <div className="flex gap-2">
                        <button type="button" onClick={captureImage} className="px-4 py-2 bg-emerald-600 text-white text-[11px] font-black rounded-xl cursor-pointer shadow-sm">Capture</button>
                        <button type="button" onClick={stopCamera} className="px-4 py-2 bg-slate-500 text-white text-[11px] font-black rounded-xl cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={startCamera} className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[11px] font-black rounded-xl border border-emerald-100 flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100/50 transition-all"><Camera className="h-4 w-4"/> Use Camera</button>
                      <label className="px-4 py-2 bg-slate-100 text-slate-600 text-[11px] font-black rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer hover:bg-slate-200/50 transition-all">
                        <Upload className="h-4 w-4"/> Upload Photo
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Student Name *</label>
                    <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-none transition-all" placeholder="Enter student's full name" />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Father's Name *</label>
                    <input required value={fatherName} onChange={e=>setFatherName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-none transition-all" placeholder="Enter father's name" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Mother's Name *</label>
                    <input required value={motherName} onChange={e=>setMotherName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-none transition-all" placeholder="Enter mother's name" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Father's Mobile Number *</label>
                    <input required type="tel" value={mobileNumber} onChange={e=>setMobileNumber(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-none transition-all" placeholder="e.g. +880 1XXXXXXXXX" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Mother's Mobile Number</label>
                    <input type="tel" value={motherMobile} onChange={e=>setMotherMobile(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-none transition-all" placeholder="Optional" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Gender</label>
                    <div className="flex gap-2.5">
                      <button type="button" onClick={()=>setGender('Boy')} className={`flex-1 py-3 text-xs font-black rounded-xl border-2 transition-all cursor-pointer ${gender === 'Boy' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-100 text-slate-500'}`}>Boy</button>
                      <button type="button" onClick={()=>setGender('Girl')} className={`flex-1 py-3 text-xs font-black rounded-xl border-2 transition-all cursor-pointer ${gender === 'Girl' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-100 text-slate-500'}`}>Girl</button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Date of Birth (Optional)</label>
                    <input type="date" value={dob} onChange={e=>setDob(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Monthly Fee ($)</label>
                    <input type="number" required value={monthlyFee} onChange={e=>setMonthlyFee(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-none transition-all" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Full Address *</label>
                    <textarea required value={address} onChange={e=>setAddress(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-none transition-all resize-none" placeholder="Enter full address" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setWizardStep(1)} 
                    className="px-6 min-h-[52px] py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs cursor-pointer transition-all"
                    disabled={isUploading}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={isUploading} 
                    className="px-8 min-h-[52px] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : 'Submit Admission'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )
      ) : (
        <>
          {/* Dashboard Top Section */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-4 shadow-sm space-y-4">
            {/* Classes Horizontal */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold shrink-0 border transition-all cursor-pointer ${
                    selectedClassId === cls.id ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-md' : 'bg-white text-[#16A34A] border-emerald-100 hover:border-[#16A34A]'
                  }`}
                >
                  {cls.className}
                </button>
              ))}
              {classes.length === 0 && <p className="text-xs text-slate-400 p-2">No classes created yet.</p>}
            </div>

            {/* Batches Horizontal */}
            {activeBatches.length > 0 && (
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-t border-slate-50 pt-4">
                {activeBatches.map((b:any) => (
                  <button
                    key={b.name}
                    onClick={() => setSelectedBatchId(b.name)}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold shrink-0 border transition-all cursor-pointer ${
                      selectedBatchId === b.name ? 'bg-emerald-50 text-[#16A34A] border-emerald-200' : 'bg-white text-[#16A34A] border-emerald-100 hover:border-[#16A34A]'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Horizontal Statistics Row (Six Small professional chips) */}
          {activeClass && selectedBatchId && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {/* Total Students */}
              <button
                type="button"
                onClick={() => setFilterType('All')}
                className={`border rounded-[12px] h-[44px] px-3 flex items-center gap-2 shadow-xs transition-all text-left cursor-pointer ${
                  filterType === 'All' 
                    ? 'border-[#16A34A] bg-[#DCFCE7]/30' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                <User className="h-4 w-4 text-[#16A34A] shrink-0" />
                <div className="flex flex-col justify-center leading-none">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Total</span>
                  <span className="text-xs font-black text-[#111111] mt-0.5">{totalStudents}</span>
                </div>
              </button>

              {/* Boys */}
              <button
                type="button"
                onClick={() => setFilterType('Boy')}
                className={`border rounded-[12px] h-[44px] px-3 flex items-center gap-2 shadow-xs transition-all text-left cursor-pointer ${
                  filterType === 'Boy' 
                    ? 'border-[#16A34A] bg-[#DCFCE7]/30' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="text-sm font-bold text-[#16A34A] leading-none shrink-0">♂</span>
                <div className="flex flex-col justify-center leading-none">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Boys</span>
                  <span className="text-xs font-black text-[#111111] mt-0.5">{boysCount}</span>
                </div>
              </button>

              {/* Girls */}
              <button
                type="button"
                onClick={() => setFilterType('Girl')}
                className={`border rounded-[12px] h-[44px] px-3 flex items-center gap-2 shadow-xs transition-all text-left cursor-pointer ${
                  filterType === 'Girl' 
                    ? 'border-[#16A34A] bg-[#DCFCE7]/30' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="text-sm font-bold text-[#16A34A] leading-none shrink-0">♀</span>
                <div className="flex flex-col justify-center leading-none">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Girls</span>
                  <span className="text-xs font-black text-[#111111] mt-0.5">{girlsCount}</span>
                </div>
              </button>

              {/* Paid */}
              <button
                type="button"
                onClick={() => setFilterType('Paid')}
                className={`border rounded-[12px] h-[44px] px-3 flex items-center gap-2 shadow-xs transition-all text-left cursor-pointer ${
                  filterType === 'Paid' 
                    ? 'border-[#16A34A] bg-[#DCFCE7]/30' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="text-sm font-bold text-[#16A34A] leading-none shrink-0">$</span>
                <div className="flex flex-col justify-center leading-none">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Paid</span>
                  <span className="text-xs font-black text-[#111111] mt-0.5">{paidCount}</span>
                </div>
              </button>

              {/* Due */}
              <button
                type="button"
                onClick={() => setFilterType('Due')}
                className={`border rounded-[12px] h-[44px] px-3 flex items-center gap-2 shadow-xs transition-all text-left cursor-pointer ${
                  filterType === 'Due' 
                    ? 'border-[#16A34A] bg-[#DCFCE7]/30' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="text-sm font-bold text-[#16A34A] leading-none shrink-0">$</span>
                <div className="flex flex-col justify-center leading-none">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Due</span>
                  <span className="text-xs font-black text-[#111111] mt-0.5">{dueCount}</span>
                </div>
              </button>

              {/* Roll Search Button */}
              <button
                type="button"
                onClick={() => {
                  searchInputRef.current?.focus();
                }}
                className="border border-slate-200 bg-white rounded-[12px] h-[44px] px-3 flex items-center gap-2 shadow-xs hover:border-[#16A34A] transition-all text-left cursor-pointer"
              >
                <Search className="h-4 w-4 text-[#16A34A] shrink-0" />
                <div className="flex flex-col justify-center leading-none">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Roll No</span>
                  <span className="text-[11px] font-black text-[#111111] mt-0.5">Search</span>
                </div>
              </button>
            </div>
          )}

          {/* Full-width Professional Search Field */}
          {activeClass && selectedBatchId && (
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search Student by Roll Number..."
                value={searchRollQuery}
                onChange={(e) => setSearchRollQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] transition-all shadow-xs"
              />
            </div>
          )}

          {/* Student List */}
          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="bg-white p-8 rounded-[20px] border border-slate-100 text-center shadow-sm">
                <User className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No Students Found</h3>
                <p className="text-xs text-slate-400 mt-1">Add students to this batch or adjust your filters.</p>
              </div>
            ) : (
              filteredStudents.map(student => {
                const isPaid = payments.some(pay => pay.studentId === student.id && pay.month === currentMonth && pay.status === 'Paid');

                return (
                  <div 
                    key={student.id} 
                    className="bg-white p-3 rounded-[16px] border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="h-11 w-11 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-[#16A34A]" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-black">{student.name}</h4>
                          <span className="px-2 py-0.5 bg-[#16A34A] text-white rounded-full text-[10px] font-bold">
                            Roll {student.rollNumber}
                          </span>
                        </div>
                        
                        {student.fatherName && (
                          <p className="text-[11px] font-medium text-slate-500">
                            Father: <span className="font-bold text-slate-600">{student.fatherName}</span>
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <span className="text-black font-semibold">{student.mobileNumber}</span>
                            <a href={`tel:${student.mobileNumber}`} className="p-1 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors">
                              <Phone className="h-3 w-3 text-emerald-600" />
                            </a>
                          </div>
                          <span className="text-slate-300">•</span>
                          <span className="font-bold flex items-center gap-0.5 text-black">
                            {student.gender === 'Boy' ? '♂ Boy' : '♀ Girl'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right action block */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0 shrink-0">
                      {/* Fee Status Chip */}
                      {isPaid ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10.5px] font-bold border border-emerald-100 flex items-center gap-1 shrink-0">
                          <Check className="h-3.5 w-3.5 text-emerald-700" /> Paid
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-[10.5px] font-bold flex items-center gap-1 shrink-0">
                          <Clock className="h-3.5 w-3.5 text-white" /> Due
                        </span>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            setName(student.name);
                            setRollNumber(student.rollNumber || '');
                            setMobileNumber(student.mobileNumber || '');
                            setGuardianName(student.guardianName || '');
                            setGender(student.gender || 'Boy');
                            setPhotoUrl(student.photoUrl || '');
                            setFatherName(student.fatherName || '');
                            setMotherName(student.motherName || '');
                            setMotherMobile((student as any).motherMobile || '');
                            setAddress((student as any).address || '');
                            setDob((student as any).dob || '');
                            setMonthlyFee(String(student.monthlyFee || 0));
                            setAdmissionDate(student.admissionDate || new Date().toISOString().slice(0, 10));
                            setFormClassId(student.classId || '');
                            setFormBatchId(student.batchId || '');
                            setTime(student.time || '');
                            setWizardStep(2);
                            setShowAddForm(true);
                          }}
                          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 hover:text-[#16A34A] rounded-lg transition-colors cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setStudentToDelete(student);
                          }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                          title="Delete Student"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[16px] text-slate-900">Register Link</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 mb-5">
              <span className="flex-1 truncate text-[11px] text-slate-600 font-mono">{getRegistrationLink()}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(getRegistrationLink());
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }} 
                className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-lg cursor-pointer"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Clipboard className="h-3.5 w-3.5 text-slate-600" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleShare('whatsapp')} className="py-2 bg-[#25D366] text-white font-bold text-xs rounded-xl cursor-pointer">WhatsApp</button>
              <button onClick={() => handleShare('telegram')} className="py-2 bg-[#0088cc] text-white font-bold text-xs rounded-xl cursor-pointer">Telegram</button>
              <button onClick={() => handleShare('gmail')} className="py-2 bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer">Gmail</button>
              <button onClick={() => handleShare('sms')} className="py-2 bg-sky-500 text-white font-bold text-xs rounded-xl cursor-pointer">SMS</button>
            </div>
            {navigator.share && (
              <button onClick={() => handleShare('native')} className="w-full mt-2 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer">More Options...</button>
            )}
          </div>
        </div>
      )}

      {/* Custom Delete Student Confirmation Modal */}
      <AnimatePresence>
        {studentToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <div className="p-8 text-center space-y-6">
                <div className="h-20 w-20 mx-auto rounded-3xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shadow-lg shadow-red-100 dark:shadow-none animate-pulse">
                  <Trash2 className="h-10 w-10" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Delete Student</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    Are you sure you want to delete student <strong>"{studentToDelete.name}"</strong>?<br />
                    This will permanently remove their profile, payments, and attendance records. This action is irreversible.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={async () => {
                      if (studentToDelete && onDeleteStudent) {
                        try {
                          await onDeleteStudent(studentToDelete.id);
                        } catch (err) {
                          console.error(err);
                        }
                      }
                      setStudentToDelete(null);
                    }}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-[13px] shadow-lg shadow-red-100 dark:shadow-none active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Delete Permanently
                  </button>
                  <button
                    onClick={() => setStudentToDelete(null)}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 font-bold rounded-2xl text-[13px] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
