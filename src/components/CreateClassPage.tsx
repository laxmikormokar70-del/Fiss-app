import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  Check, 
  Users, 
  X, 
  BookOpen,
  CalendarDays,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { TeacherProfile } from '../types';

interface CreateClassPageProps {
  teacherProfile: TeacherProfile | null;
  onBack: () => void;
  onSaveComplete: (savedClass?: any, customClasses?: string[], customBatches?: string[]) => void;
  editingClassData?: any;
  triggerNotification?: (message: string, type?: 'success' | 'error') => void;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface BatchSchedule {
  id: string;
  daysType: 'all' | 'custom';
  selectedDays: string[]; // ['Mon', 'Wed', 'Fri']
  startTime: string; // "05:00 PM"
  endTime: string; // "06:30 PM"
}

interface BatchConfig {
  id: string;
  name: string; // e.g. "Batch A"
  schedules: BatchSchedule[];
}

const PRESET_CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 
  'Class 11', 'Class 12', 'College'
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CreateClassPage({ teacherProfile, onBack, onSaveComplete, editingClassData, triggerNotification }: CreateClassPageProps) {
  const [className, setClassName] = useState('');
  const [customClassName, setCustomClassName] = useState('');
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [numBatches, setNumBatches] = useState('1');
  const [batchConfigs, setBatchConfigs] = useState<BatchConfig[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Time picker dialog state
  const [activePicker, setActivePicker] = useState<{
    batchIndex: number;
    schedIndex: number;
    type: 'start' | 'end';
  } | null>(null);

  const [pickerHour, setPickerHour] = useState('05');
  const [pickerMinute, setPickerMinute] = useState('00');
  const [pickerAmPm, setPickerAmPm] = useState<'AM' | 'PM'>('PM');
  const [pickerTab, setPickerTab] = useState<'hour' | 'minute'>('hour');

  useEffect(() => {
    if (editingClassData && !isInitialized) {
      if (!PRESET_CLASSES.includes(editingClassData.className)) {
        setIsCustomClass(true);
        setCustomClassName(editingClassData.className);
        setClassName('Custom');
      } else {
        setClassName(editingClassData.className);
      }
      setNumBatches(editingClassData.batches?.length.toString() || '1');
      setBatchConfigs(editingClassData.batches?.map((b: any, idx: number) => {
        const legacyTime = b.time || '05:00 PM';
        const legacyEndTime = b.endTime || '06:30 PM';
        const legacyDays = b.days || ['Mon', 'Wed', 'Fri'];
        
        const schedules = (b.schedules && b.schedules.length > 0)
          ? b.schedules.map((s: any, sIdx: number) => ({
              id: `sched-${Date.now()}-${idx}-${sIdx}`,
              daysType: s.daysType || 'custom',
              selectedDays: s.selectedDays || legacyDays,
              startTime: s.startTime || legacyTime,
              endTime: s.endTime || legacyEndTime
            }))
          : [
              {
                id: `sched-${Date.now()}-${idx}-0`,
                daysType: 'custom',
                selectedDays: legacyDays,
                startTime: legacyTime,
                endTime: legacyEndTime
              }
            ];

        return {
          id: `batch-${Date.now()}-${idx}`,
          name: b.name,
          schedules
        };
      }) || []);
      setIsInitialized(true);
    } else if (!editingClassData && !isInitialized) {
      setIsInitialized(true);
    }
  }, [editingClassData, isInitialized]);

  // Initialize batches configuration
  useEffect(() => {
    if (!isInitialized || (editingClassData && batchConfigs.length > 0 && numBatches === editingClassData.batches?.length.toString())) return;
    const count = Math.max(1, parseInt(numBatches) || 1);
    setBatchConfigs(prev => {
      const next = [...prev];
      if (next.length < count) {
        for (let i = next.length; i < count; i++) {
          const letter = String.fromCharCode(65 + i); // A, B, C...
          next.push({
            id: `batch-${Date.now()}-${i}`,
            name: `Batch ${letter}`,
            schedules: [
              {
                id: `sched-${Date.now()}-0`,
                daysType: 'custom',
                selectedDays: ['Mon', 'Wed', 'Fri'],
                startTime: '05:00 PM',
                endTime: '06:30 PM'
              }
            ]
          });
        }
      } else if (next.length > count) {
        next.splice(count);
      }
      return next;
    });
  }, [numBatches, isInitialized, editingClassData]);

  const handleAddSchedule = (batchIndex: number) => {
    setBatchConfigs(prev => {
      const newSched: BatchSchedule = {
        id: `sched-${Date.now()}-${prev[batchIndex].schedules.length}`,
        daysType: 'custom',
        selectedDays: ['Mon', 'Wed', 'Fri'],
        startTime: '05:00 PM',
        endTime: '06:30 PM'
      };
      
      return prev.map((batch, idx) => 
        idx === batchIndex 
          ? { ...batch, schedules: [...batch.schedules, newSched] }
          : batch
      );
    });
  };

  const handleRemoveSchedule = (batchIndex: number, schedIndex: number) => {
    setBatchConfigs(prev => {
      return prev.map((batch, idx) => 
        idx === batchIndex 
          ? { ...batch, schedules: batch.schedules.filter((_, sIdx) => sIdx !== schedIndex) }
          : batch
      );
    });
  };

  const handleBatchNameChange = (batchIndex: number, newName: string) => {
    setBatchConfigs(prev => {
      return prev.map((batch, idx) => 
        idx === batchIndex ? { ...batch, name: newName } : batch
      );
    });
  };

  const handleDaysTypeChange = (batchIndex: number, schedIndex: number, type: 'all' | 'custom') => {
    setBatchConfigs(prev => {
      return prev.map((batch, bIdx) => {
        if (bIdx !== batchIndex) return batch;
        
        const updatedSchedules = batch.schedules.map((sched, sIdx) => {
          if (sIdx !== schedIndex) return sched;
          
          return {
            ...sched,
            daysType: type,
            selectedDays: type === 'all' ? [...WEEKDAYS] : ['Mon', 'Wed', 'Fri']
          };
        });
        
        return { ...batch, schedules: updatedSchedules };
      });
    });
  };

  const toggleWeekday = (batchIndex: number, schedIndex: number, day: string) => {
    setBatchConfigs(prev => {
      const newConfigs = [...prev];
      const batch = { ...newConfigs[batchIndex] };
      const schedules = [...batch.schedules];
      const sched = { ...schedules[schedIndex] };
      
      let nextSelected = [...(sched.selectedDays || [])];
      if (nextSelected.includes(day)) {
        nextSelected = nextSelected.filter(d => d !== day);
      } else {
        nextSelected = [...nextSelected, day];
      }
      
      sched.selectedDays = nextSelected;
      schedules[schedIndex] = sched;
      batch.schedules = schedules;
      newConfigs[batchIndex] = batch;
      return newConfigs;
    });
  };

  const handleSelectAllDays = (batchIndex: number, schedIndex: number) => {
    setBatchConfigs(prev => {
      return prev.map((batch, bIdx) => {
        if (bIdx !== batchIndex) return batch;
        const updatedSchedules = batch.schedules.map((sched, sIdx) => {
          if (sIdx !== schedIndex) return sched;
          return { ...sched, selectedDays: [...WEEKDAYS] };
        });
        return { ...batch, schedules: updatedSchedules };
      });
    });
  };

  const handleClearAllDays = (batchIndex: number, schedIndex: number) => {
    setBatchConfigs(prev => {
      return prev.map((batch, bIdx) => {
        if (bIdx !== batchIndex) return batch;
        const updatedSchedules = batch.schedules.map((sched, sIdx) => {
          if (sIdx !== schedIndex) return sched;
          return { ...sched, selectedDays: [] };
        });
        return { ...batch, schedules: updatedSchedules };
      });
    });
  };

  // Open high-fidelity Time Picker dialog
  const openTimePicker = (batchIndex: number, schedIndex: number, type: 'start' | 'end') => {
    const currentVal = type === 'start' 
      ? batchConfigs[batchIndex].schedules[schedIndex].startTime 
      : batchConfigs[batchIndex].schedules[schedIndex].endTime;
    
    // Parse existing time "HH:MM AM/PM"
    try {
      const parts = currentVal.split(' ');
      const timeParts = parts[0].split(':');
      setPickerHour(timeParts[0]);
      setPickerMinute(timeParts[1]);
      setPickerAmPm(parts[1] as 'AM' | 'PM');
    } catch (e) {
      setPickerHour('05');
      setPickerMinute('00');
      setPickerAmPm('PM');
    }

    setPickerTab('hour');
    setActivePicker({ batchIndex, schedIndex, type });
  };

  const savePickedTime = () => {
    if (!activePicker) return;
    const { batchIndex, schedIndex, type } = activePicker;
    const formattedTime = `${pickerHour}:${pickerMinute} ${pickerAmPm}`;

    setBatchConfigs(prev => {
      const updated = [...prev];
      if (type === 'start') {
        updated[batchIndex].schedules[schedIndex].startTime = formattedTime;
      } else {
        updated[batchIndex].schedules[schedIndex].endTime = formattedTime;
      }
      return updated;
    });

    setActivePicker(null);
  };

  const validateAndSave = async () => {
    if (isSaving) return;

    const finalClassName = isCustomClass ? customClassName.trim() : className;
    if (!finalClassName) {
      setErrorMsg('Please select or enter a valid class name.');
      return;
    }

    if (batchConfigs.length === 0) {
      setErrorMsg('Please configure at least one batch.');
      return;
    }

    // Validate each batch
    for (let i = 0; i < batchConfigs.length; i++) {
      const batch = batchConfigs[i];
      if (!batch.name.trim()) {
        setErrorMsg(`Please specify a name for Batch ${i + 1}.`);
        return;
      }
      for (let j = 0; j < batch.schedules.length; j++) {
        const sched = batch.schedules[j];
        if (sched.daysType === 'custom' && sched.selectedDays.length === 0) {
          setErrorMsg(`Please select at least one day for ${batch.name} Schedule ${j + 1}.`);
          return;
        }
      }
    }

    setIsSaving(true);
    setErrorMsg('');

    let currentStep = 'saving class data';
    try {
      const isOfflineMode = typeof window !== 'undefined' && localStorage.getItem('edu_offline_mode') === 'true';

      if (isOfflineMode) {
        const teacherUid = 'offline-teacher';
        const classId = editingClassData && editingClassData.id ? editingClassData.id : `class-${Date.now()}`;

        const classData = {
          classId: classId,
          id: classId,
          teacherId: teacherUid,
          className: finalClassName,
          name: finalClassName,
          batches: batchConfigs.map((b, bIdx) => {
            const batchId = b.id || `batch-${Date.now()}-${bIdx}`;
            const firstSched = b.schedules[0] || { daysType: 'custom', selectedDays: [], startTime: '', endTime: '' };
            const days = firstSched.daysType === 'all' ? WEEKDAYS : (firstSched.selectedDays || []);
            const time = firstSched.startTime || '';
            const endTime = firstSched.endTime || '';

            return {
              id: batchId,
              batchId: batchId,
              name: (b.name || '').trim(),
              days,
              time,
              endTime,
              schedules: (b.schedules || []).map((s, sIdx) => ({
                id: s.id || `sched-${Date.now()}-${bIdx}-${sIdx}`,
                daysType: s.daysType || 'custom',
                selectedDays: s.selectedDays || [],
                startTime: s.startTime || '',
                endTime: s.endTime || ''
              }))
            };
          }),
          createdAt: editingClassData && editingClassData.createdAt ? editingClassData.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'Active'
        };

        // Save class
        const storedClasses = localStorage.getItem('edu_classes');
        let classesList = storedClasses ? JSON.parse(storedClasses) : [];
        if (editingClassData && editingClassData.id) {
          classesList = classesList.map((c: any) => c.id === editingClassData.id ? classData : c);
        } else {
          classesList.push(classData);
        }
        localStorage.setItem('edu_classes', JSON.stringify(classesList));

        // Update profile
        let updatedClasses = [finalClassName];
        let updatedBatches = batchConfigs.map(b => b.name.trim());

        const storedProfile = localStorage.getItem('edu_teacher_profile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          const existingClasses = profile.customClasses || [];
          const existingBatches = profile.customBatches || [];
          updatedClasses = Array.from(new Set([...existingClasses, finalClassName]));
          updatedBatches = Array.from(new Set([...existingBatches, ...updatedBatches]));
          
          profile.customClasses = updatedClasses;
          profile.customBatches = updatedBatches;
          localStorage.setItem('edu_teacher_profile', JSON.stringify(profile));
        }

        if (triggerNotification) {
          triggerNotification(editingClassData ? 'Class Updated Successfully' : 'Class Created Successfully', 'success');
        }

        setIsSaving(false);
        onSaveComplete(classData, updatedClasses, updatedBatches);
        return;
      }

      const teacherUid = auth.currentUser?.uid || teacherProfile?.uid;
      if (!teacherUid) {
        throw new Error('Teacher UID is not available. Please make sure you are logged in.');
      }

      const classDocRef = editingClassData && editingClassData.id 
        ? doc(db, 'classes', editingClassData.id) 
        : doc(collection(db, 'classes'));
      const classId = classDocRef.id;

      // 1. Save Class Schedule configuration document to Firestore
      const classData = {
        classId: classId,
        id: classId,
        teacherId: teacherUid,
        className: finalClassName,
        name: finalClassName,
        batches: batchConfigs.map((b, bIdx) => {
          const batchId = b.id || `batch-${Date.now()}-${bIdx}`;
          const firstSched = b.schedules[0] || { daysType: 'custom', selectedDays: [], startTime: '', endTime: '' };
          const days = firstSched.daysType === 'all' ? WEEKDAYS : (firstSched.selectedDays || []);
          const time = firstSched.startTime || '';
          const endTime = firstSched.endTime || '';

          return {
            id: batchId,
            batchId: batchId,
            name: (b.name || '').trim(),
            days,
            time,
            endTime,
            schedules: (b.schedules || []).map((s, sIdx) => ({
              id: s.id || `sched-${Date.now()}-${bIdx}-${sIdx}`,
              daysType: s.daysType || 'custom',
              selectedDays: s.selectedDays || [],
              startTime: s.startTime || '',
              endTime: s.endTime || ''
            }))
          };
        }),
        createdAt: editingClassData && editingClassData.createdAt ? editingClassData.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Active'
      };

      try {
        await setDoc(classDocRef, classData);
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.WRITE, `classes/${classId}`);
      }

      currentStep = 'updating teacher profile';
      // 2. Add class and batches to the TeacherProfile in Firestore to sync dropdown selectors
      const teacherRef = doc(db, 'users', teacherUid);
      
      // If teacherProfile is available, use its cache; otherwise, let's gracefully update what we can
      const existingClasses = teacherProfile?.customClasses || [];
      const existingBatches = teacherProfile?.customBatches || [];

      const updatedClasses = Array.from(new Set([...existingClasses, finalClassName]));
      const newBatchNames = batchConfigs.map(b => b.name.trim());
      const updatedBatches = Array.from(new Set([...existingBatches, ...newBatchNames]));

      try {
        await setDoc(teacherRef, {
          customClasses: updatedClasses,
          customBatches: updatedBatches
        }, { merge: true });
      } catch (profileErr) {
        console.warn("Failed to update teacher custom dropdown fields, skipping:", profileErr);
      }

      if (triggerNotification) {
        triggerNotification(editingClassData ? 'Class Updated Successfully' : 'Class Created Successfully', 'success');
      }

      onSaveComplete(classData, updatedClasses, updatedBatches);
    } catch (err: any) {
      console.error('Failed to save class config. Step:', err);
      setErrorMsg(`Error during ${currentStep}: ${err?.message || 'Permission denied.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-36 sm:pb-28">
      {/* Native-style MD3 App Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-[18px] font-black tracking-tight text-slate-900 leading-none">{editingClassData ? 'Edit Class' : 'Create Class'}</h1>
            <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Material Design 3 Portal</p>
          </div>
        </div>
        <button
          onClick={validateAndSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-black text-[13px] uppercase tracking-wider px-6 py-2.5 rounded-full transition-all shadow-md shadow-emerald-100 flex items-center gap-2 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{editingClassData ? 'Saving...' : 'Creating...'}</span>
            </>
          ) : (
            <span>{editingClassData ? 'Save Changes' : 'Create Class'}</span>
          )}
        </button>
      </div>

      <div className="max-w-md w-full mx-auto px-4 mt-5 space-y-5 flex-1">
        
        {/* Error Alert Box */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex gap-3 items-start"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
            <div className="text-xs font-bold leading-normal">{errorMsg}</div>
          </motion.div>
        )}

        {/* STEP 1: CLASS NAME */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-[15px] font-black text-slate-900">Step 1 — Class Information</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl">
              <button
                type="button"
                onClick={() => { setIsCustomClass(false); setClassName(''); }}
                className={`flex-1 py-2 text-center text-xs font-black rounded-lg transition-all ${
                  !isCustomClass 
                    ? 'bg-white text-emerald-600 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Preset List
              </button>
              <button
                type="button"
                onClick={() => { setIsCustomClass(true); setClassName(''); }}
                className={`flex-1 py-2 text-center text-xs font-black rounded-lg transition-all ${
                  isCustomClass 
                    ? 'bg-white text-emerald-600 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Type Manually
              </button>
            </div>

            {isCustomClass ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase px-1 tracking-wider">Class Name</label>
                <input
                  type="text"
                  value={customClassName}
                  onChange={(e) => setCustomClassName(e.target.value)}
                  placeholder="e.g. Class 10, Batch C"
                  className="w-full bg-slate-50 px-4 py-3.5 rounded-[18px] text-[14px] font-bold text-slate-800 outline-none border border-transparent focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase px-1 tracking-wider">Select Class</label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-3.5 rounded-[18px] text-[14px] font-bold text-slate-800 outline-none border border-transparent focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">-- Choose Class --</option>
                  {PRESET_CLASSES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: NUMBER OF BATCHES */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-[15px] font-black text-slate-900">Step 2 — Number of Batches</h2>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Enter how many batches exist for this class. We will automatically generate configuration cards for each batch.
            </p>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setNumBatches(prev => String(Math.max(1, (parseInt(prev) || 1) - 1)))}
                className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center font-black text-lg transition-all"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="10"
                value={numBatches}
                onChange={(e) => setNumBatches(e.target.value)}
                className="flex-1 text-center bg-slate-50 h-12 rounded-xl text-[16px] font-black text-slate-800 outline-none border border-transparent focus:border-emerald-500 focus:bg-white transition-all"
              />
              <button 
                type="button"
                onClick={() => setNumBatches(prev => String(Math.min(10, (parseInt(prev) || 1) + 1)))}
                className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center font-black text-lg transition-all"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* BATCH CONFIGURATIONS AND SCHEDULES */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[12px] font-black uppercase text-slate-400 tracking-wider">Batch Configurations ({batchConfigs.length})</h3>
          </div>

          <AnimatePresence initial={false}>
            {batchConfigs.map((batch, batchIdx) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-5 rounded-[26px] border border-slate-100 shadow-sm space-y-5"
              >
                {/* Batch Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-1 flex-1 pr-4">
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                      Active Batch {batchIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={batch.name}
                      onChange={(e) => handleBatchNameChange(batchIdx, e.target.value)}
                      placeholder="e.g. Batch A"
                      className="w-full text-[16px] font-black text-slate-900 border-none outline-none focus:ring-0 p-0 bg-transparent mt-1 leading-tight focus:text-emerald-600"
                    />
                  </div>
                </div>

                {/* Schedules list */}
                <div className="space-y-6">
                  {batch.schedules.map((sched, schedIdx) => (
                    <div key={sched.id} className="space-y-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          Schedule {schedIdx + 1}
                        </span>
                        {batch.schedules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSchedule(batchIdx, schedIdx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 active:scale-95 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Class Days Select Option */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase px-1 tracking-wider">Class Days</p>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100/50 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleDaysTypeChange(batchIdx, schedIdx, 'all')}
                            className={`py-1.5 text-center text-[11px] font-black rounded-lg transition-all ${
                              sched.daysType === 'all' 
                                ? 'bg-white text-emerald-600 shadow-xs' 
                                : 'text-slate-500'
                            }`}
                          >
                            Every Day
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDaysTypeChange(batchIdx, schedIdx, 'custom')}
                            className={`py-1.5 text-center text-[11px] font-black rounded-lg transition-all ${
                              sched.daysType === 'custom' 
                                ? 'bg-white text-emerald-600 shadow-xs' 
                                : 'text-slate-500'
                            }`}
                          >
                            Custom Days
                          </button>
                        </div>

                        {sched.daysType === 'custom' && (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Days</span>
                              <div className="flex gap-3">
                                <button 
                                  type="button" 
                                  onClick={() => handleSelectAllDays(batchIdx, schedIdx)}
                                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 cursor-pointer"
                                >
                                  Select All
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleClearAllDays(batchIdx, schedIdx)}
                                  className="text-[10px] font-black text-rose-600 hover:text-rose-700 cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {WEEKDAYS.map(day => {
                                const isSelected = (sched.selectedDays || []).includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleWeekday(batchIdx, schedIdx, day);
                                    }}
                                    className={`flex-1 min-w-[70px] h-12 rounded-xl text-[12px] font-black transition-all flex items-center justify-center border cursor-pointer ${
                                      isSelected 
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-105 z-10' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                            {(!sched.selectedDays || sched.selectedDays.length === 0) && (
                              <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 animate-pulse px-1">
                                <AlertCircle className="h-3 w-3" /> At least one day must be selected
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Schedule times */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase px-1 tracking-wider">Start Time</p>
                          <button
                            type="button"
                            onClick={() => openTimePicker(batchIdx, schedIdx, 'start')}
                            className="w-full bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-2 text-slate-800 hover:border-emerald-500 active:scale-98 transition-all text-left shadow-2xs"
                          >
                            <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-black leading-none">{sched.startTime}</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase px-1 tracking-wider">End Time</p>
                          <button
                            type="button"
                            onClick={() => openTimePicker(batchIdx, schedIdx, 'end')}
                            className="w-full bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-2 text-slate-800 hover:border-emerald-500 active:scale-98 transition-all text-left shadow-2xs"
                          >
                            <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-black leading-none">{sched.endTime}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Add Schedule Button */}
                <button
                  type="button"
                  onClick={() => handleAddSchedule(batchIdx)}
                  className="w-full py-3.5 border-2 border-dashed border-slate-200 hover:border-emerald-500 text-slate-500 hover:text-emerald-600 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Schedule
                </button>

              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom Primary Save Button */}
        <div className="pt-6 pb-4">
          <button
            type="button"
            onClick={validateAndSave}
            disabled={isSaving}
            className="w-full min-h-[52px] py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{editingClassData ? 'Saving Changes...' : 'Creating Class...'}</span>
              </>
            ) : (
              <span>{editingClassData ? 'Save Changes' : 'Save & Create Class'}</span>
            )}
          </button>
        </div>

      </div>

      {/* CLOCK-STYLE TIME PICKER DIALOG */}
      <AnimatePresence>
        {activePicker && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[28px] p-6 max-w-[320px] w-full shadow-2xl border border-slate-100 flex flex-col space-y-5"
            >
              {/* Header / Display */}
              <div className="text-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                  Select {activePicker.type === 'start' ? 'Start' : 'End'} Time
                </span>
                
                {/* Digit Displays */}
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPickerTab('hour')}
                    className={`text-[44px] font-black tracking-tight leading-none px-3.5 py-1 rounded-2xl transition-all ${
                      pickerTab === 'hour' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {pickerHour}
                  </button>
                  <span className="text-[44px] font-bold text-slate-400 select-none">:</span>
                  <button
                    type="button"
                    onClick={() => setPickerTab('minute')}
                    className={`text-[44px] font-black tracking-tight leading-none px-3.5 py-1 rounded-2xl transition-all ${
                      pickerTab === 'minute' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {pickerMinute}
                  </button>

                  <div className="flex flex-col gap-1 ml-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPickerAmPm('AM')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all border ${
                        pickerAmPm === 'AM'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerAmPm('PM')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all border ${
                        pickerAmPm === 'PM'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Selector */}
              <div className="h-44 flex items-center justify-center">
                {pickerTab === 'hour' ? (
                  /* Hour selector grid (3x4) */
                  <div className="grid grid-cols-4 gap-2 w-full max-w-[260px]">
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(hr => (
                      <button
                        key={hr}
                        type="button"
                        onClick={() => {
                          setPickerHour(hr);
                          setPickerTab('minute'); // Auto jump to minute
                        }}
                        className={`h-9 w-full rounded-xl text-xs font-bold transition-all ${
                          pickerHour === hr
                            ? 'bg-emerald-600 text-white font-black scale-105'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {parseInt(hr)}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Minute selector grid (5 min steps) */
                  <div className="grid grid-cols-4 gap-2 w-full max-w-[260px]">
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(min => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => setPickerMinute(min)}
                        className={`h-9 w-full rounded-xl text-xs font-bold transition-all ${
                          pickerMinute === min
                            ? 'bg-emerald-600 text-white font-black scale-105'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {min}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dialog Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePicker(null)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={savePickedTime}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-50 transition-all"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
