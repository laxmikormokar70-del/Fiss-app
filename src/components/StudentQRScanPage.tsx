import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  UserCheck, 
  Clock, 
  Calendar, 
  BookOpen, 
  Hash, 
  AlertTriangle 
} from 'lucide-react';

interface StudentQRScanPageProps {
  teacherId: string;
  classId: string;
  batchId: string;
}

export default function StudentQRScanPage({ teacherId, classId, batchId }: StudentQRScanPageProps) {
  const [rollNumber, setRollNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{
    studentName: string;
    rollNumber: string;
    className: string;
    batchName: string;
    time: string;
  } | null>(null);

  const [classDetails, setClassDetails] = useState<any>(null);
  const [teacherDetails, setTeacherDetails] = useState<any>(null);
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [isValidatingBatch, setIsValidatingBatch] = useState(true);
  const [isTimeActive, setIsTimeActive] = useState(false);

  // Parse time (e.g. "05:00 PM") to compare
  const parseTimeString = (timeStr: string) => {
    if (!timeStr) return null;
    const clean = timeStr.trim().toUpperCase();
    const match12 = clean.match(/^(\d+):(\d+)\s*(AM|PM)$/);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = parseInt(match12[2], 10);
      const ampm = match12[3];
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return { hours, minutes };
    }
    const match24 = clean.match(/^(\d+):(\d+)$/);
    if (match24) {
      const hours = parseInt(match24[1], 10);
      const minutes = parseInt(match24[2], 10);
      return { hours, minutes };
    }
    return null;
  };

  const checkScheduleValidity = (batches: any[]) => {
    const selectedBatch = batches?.find((b: any) => b.id === batchId || b.name === batchId || b.batchId === batchId);
    if (!selectedBatch) {
      setErrorMessage('No matching batch found for this QR Code.');
      setIsTimeActive(false);
      return null;
    }
    setBatchDetails(selectedBatch);
    setIsTimeActive(true); // Manually allowed at all times per user request
    return selectedBatch;
  };

  useEffect(() => {
    async function loadQRParams() {
      try {
        setIsValidatingBatch(true);
        // Load class
        const classDocRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classDocRef);
        if (!classSnap.exists()) {
          setErrorMessage('Class not found. The QR code may be outdated.');
          setIsValidatingBatch(false);
          return;
        }
        const classData = classSnap.data();
        setClassDetails(classData);

        // Load teacher details
        const teacherDocRef = doc(db, 'users', teacherId);
        const teacherSnap = await getDoc(teacherDocRef);
        if (teacherSnap.exists()) {
          setTeacherDetails(teacherSnap.data());
        }

        // Validate Schedule
        checkScheduleValidity(classData.batches || []);
      } catch (err) {
        console.error('Error loading QR params:', err);
        setErrorMessage('Failed to connect to school server.');
      } finally {
        setIsValidatingBatch(false);
      }
    }

    loadQRParams();
  }, [teacherId, classId, batchId]);

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      // Recheck active batch time just in case of stale pages
      if (!isTimeActive) {
        setStatus('error');
        setErrorMessage('This batch is currently not active. QR Code has expired or schedule is inactive.');
        return;
      }

      // 1. Fetch students of this class and batch to find the matching roll number
      const studentsCollRef = collection(db, 'users', teacherId, 'classes', classId, 'batches', batchId, 'students');
      const studentsSnapshot = await getDocs(studentsCollRef);
      
      let matchedStudent: any = null;
      studentsSnapshot.forEach((doc) => {
        const data = doc.data();
        // Loose/robust comparison of roll number (parseInt "07" matches "7" etc)
        const sRollInt = parseInt(data.rollNumber, 10);
        const inputRollInt = parseInt(rollNumber.trim(), 10);
        
        if (
          data.status === 'Active' && 
          (!isNaN(sRollInt) && !isNaN(inputRollInt) ? sRollInt === inputRollInt : data.rollNumber.trim().toLowerCase() === rollNumber.trim().toLowerCase())
        ) {
          matchedStudent = { id: doc.id, ...data };
        }
      });

      if (!matchedStudent) {
        setStatus('error');
        setErrorMessage(`Roll Number ${rollNumber} not found in this batch. Please verify and try again.`);
        return;
      }

      // 2. Mark attendance
      const todayStr = new Date().toISOString().split('T')[0];
      const topLevelDocId = `${teacherId}-${classId}-${batchId}-${todayStr}`;
      
      const topLevelRef = doc(db, 'attendance', topLevelDocId);
      const nestedRef = doc(db, 'users', teacherId, 'classes', classId, 'batches', batchId, 'attendance', todayStr);

      const attendancePayload = {
        teacherId,
        classId,
        batchId,
        date: todayStr,
        updatedAt: new Date().toISOString()
      };

      // Top level save/merge
      const topLevelSnap = await getDoc(topLevelRef);
      if (!topLevelSnap.exists()) {
        await setDoc(topLevelRef, {
          ...attendancePayload,
          attendanceMarks: { [matchedStudent.id]: 'present' },
          createdAt: new Date().toISOString()
        });
      } else {
        await updateDoc(topLevelRef, {
          [`attendanceMarks.${matchedStudent.id}`]: 'present',
          updatedAt: new Date().toISOString()
        });
      }

      // Nested save/merge
      const nestedSnap = await getDoc(nestedRef);
      if (!nestedSnap.exists()) {
        await setDoc(nestedRef, {
          ...attendancePayload,
          attendanceMarks: { [matchedStudent.id]: 'present' },
          students: {
            [matchedStudent.id]: {
              status: 'present',
              timestamp: new Date().toISOString()
            }
          },
          createdAt: new Date().toISOString()
        });
      } else {
        await updateDoc(nestedRef, {
          [`attendanceMarks.${matchedStudent.id}`]: 'present',
          [`students.${matchedStudent.id}`]: {
            status: 'present',
            timestamp: new Date().toISOString()
          },
          updatedAt: new Date().toISOString()
        });
      }

      // 3. Complete success flow
      setSuccessData({
        studentName: matchedStudent.name,
        rollNumber: matchedStudent.rollNumber,
        className: classDetails?.className || 'Class',
        batchName: batchDetails?.name || batchId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setStatus('success');
    } catch (err: any) {
      console.error('Attendance write error:', err);
      setStatus('error');
      setErrorMessage(err?.message || 'Server error occurred while marking attendance.');
    }
  };

  if (isValidatingBatch) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white px-8 py-10 rounded-[32px] border border-slate-150 shadow-xl max-w-md w-full flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
          <h3 className="text-lg font-black text-slate-800">Connecting to ERP Server...</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Validating Live Attendance Session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-5 font-sans">
      <div className="max-w-md w-full">
        {/* Logo and school info */}
        <div className="text-center mb-6 space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-emerald-100">
            {teacherDetails?.schoolName?.slice(0, 1) || 'E'}
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-850 leading-tight">{teacherDetails?.schoolName || 'Coaching ERP'}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Teacher: {teacherDetails?.name || 'Academic Mentor'}</p>
          </div>
        </div>

        {/* Main interactive screen */}
        <div className="bg-white rounded-[32px] border border-slate-150 shadow-2xl overflow-hidden">
          {/* Header indicator */}
          <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-emerald-600" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Class {classDetails?.className} &bull; {batchDetails?.name}
              </span>
            </div>
            {isTimeActive ? (
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Now
              </span>
            ) : (
              <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                Inactive
              </span>
            )}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* IF QR IS EXPIRED OR NOT ACTIVE */}
              {!isTimeActive && status !== 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-4"
                >
                  <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-black text-slate-800">No Active Batch Found</h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                      This QR Code is only active during the scheduled session time. 
                    </p>
                  </div>

                  {batchDetails?.schedules?.[0] && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-w-xs mx-auto text-left space-y-2.5">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Scheduled Batch Time</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        <span>{batchDetails.schedules[0].startTime} - {batchDetails.schedules[0].endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                        <span>{batchDetails.schedules[0].selectedDays?.join(', ') || 'Scheduled days'}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">QR Code Expired / Not Active</p>
                  </div>
                </motion.div>
              )}

              {/* ACTIVE CHECK-IN INPUT VIEW */}
              {isTimeActive && status !== 'success' && (
                <motion.div 
                  key="checkin-form"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-1">
                    <h2 className="text-md font-black text-slate-800">Scan Attendance Verified</h2>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Enter your Roll Number to claim your seat</p>
                  </div>

                  {errorMessage && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-3.5 flex gap-3 text-red-700 text-xs font-semibold leading-relaxed">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitAttendance} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">Roll Number</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          required
                          pattern="[A-Za-z0-9-]+"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          placeholder="Example: 12"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 text-slate-800 font-extrabold text-[15px] pl-12 pr-5 py-3.5 rounded-2xl outline-none transition-all placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'loading' || !rollNumber.trim()}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-[14px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-50 active:scale-98 transition-all"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          <span>Checking Database...</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4.5 w-4.5" />
                          <span>Claim Attendance</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* SUCCESS STATE */}
              {status === 'success' && successData && (
                <motion.div 
                  key="success-screen"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-6"
                >
                  <div className="h-20 w-20 bg-emerald-50 text-[#16A34A] rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="h-12 w-12" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-slate-800">Attendance Marked Successfully</h2>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Real-time Cloud Sync Completed</p>
                  </div>

                  {/* Receipt Box */}
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-left divide-y divide-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold py-1">
                      <span className="text-slate-400 uppercase tracking-wider text-[10px]">Student Name</span>
                      <span className="text-slate-800 font-black">{successData.studentName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold pt-2.5">
                      <span className="text-slate-400 uppercase tracking-wider text-[10px]">Roll Number</span>
                      <span className="text-slate-800 font-black">Roll #{successData.rollNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold pt-2.5">
                      <span className="text-slate-400 uppercase tracking-wider text-[10px]">Class & Batch</span>
                      <span className="text-slate-800 font-black">{successData.className} &bull; {successData.batchName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold pt-2.5">
                      <span className="text-slate-400 uppercase tracking-wider text-[10px]">Checked-In Time</span>
                      <span className="text-slate-800 font-black flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-emerald-600" />
                        {successData.time}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setStatus('idle');
                      setRollNumber('');
                      setSuccessData(null);
                    }}
                    className="w-full bg-slate-150 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-98 transition-all"
                  >
                    Mark Another Student
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-6">
          Powered by Coaching Management ERP System
        </p>
      </div>
    </div>
  );
}
