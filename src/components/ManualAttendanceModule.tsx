import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Calendar, 
  Clock, 
  Save, 
  Filter, 
  ChevronRight, 
  History,
  ClipboardCheck,
  MoreVertical,
  Check,
  AlertCircle
} from 'lucide-react';
import { Student, Attendance } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore';

interface ManualAttendanceModuleProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

export const ManualAttendanceModule: React.FC<ManualAttendanceModuleProps> = ({ isOpen, onClose, students }) => {
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent'>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const classesList = useMemo(() => Array.from(new Set(['All', ...students.map(s => s.class)])), [students]);
  const batchesList = useMemo(() => Array.from(new Set(['All', ...students.map(s => s.batch)])), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = selectedClass === 'All' || s.class === selectedClass;
      const matchBatch = selectedBatch === 'All' || s.batch === selectedBatch;
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.rollNumber.includes(searchQuery);
      return matchClass && matchBatch && matchSearch;
    });
  }, [students, selectedClass, selectedBatch, searchQuery]);

  const handleMarkAll = (status: 'present' | 'absent') => {
    const newRecords = { ...attendanceRecords };
    filteredStudents.forEach(s => {
      newRecords[s.id] = status;
    });
    setAttendanceRecords(newRecords);
  };

  const toggleAttendance = (studentId: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const saveAttendance = async () => {
    if (Object.keys(attendanceRecords).length === 0) return;
    
    setIsSaving(true);
    try {
      const attendanceRef = collection(db, 'attendance');
      
      // Check for existing attendance for this date and these students
      // For simplicity, we'll mark all selected students. 
      // In a real app, you might want to query first, but here we'll just process the batch.
      
      const batchPromises = filteredStudents.map(async (student) => {
        const status = attendanceRecords[student.id] || 'absent';
        
        // Quick check for existing record for this student on this date
        const q = query(
          attendanceRef, 
          where('teacherId', '==', student.teacherId),
          where('studentId', '==', student.id), 
          where('date', '==', attendanceDate)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Update existing or skip? Let's skip or we could update.
          // The user said "Prevent duplicate", so we skip if exists.
          return null;
        }

        return addDoc(attendanceRef, {
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          class: student.class,
          batch: student.batch,
          date: attendanceDate,
          status: status,
          timestamp: serverTimestamp(),
          markedAt: new Date().toLocaleTimeString(),
          teacherId: student.teacherId // Good practice to include teacherId
        });
      });

      const results = await Promise.all(batchPromises);
      const savedCount = results.filter(r => r !== null).length;

      if (savedCount === 0) {
        alert("Attendance already marked for these students on this date.");
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-white flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-600 active:bg-slate-50 rounded-full">
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-[18px] font-black text-slate-800">Manual Attend</h2>
        </div>
        <button className="h-10 w-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
          <History className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-5 space-y-6 max-w-lg mx-auto">
          {/* Top Config Card */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">Select Class</p>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-3 rounded-[16px] text-[13px] font-bold text-slate-800 border border-transparent focus:border-emerald-500 outline-none"
                >
                  {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">Select Batch</p>
                <select 
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-3 rounded-[16px] text-[13px] font-bold text-slate-800 border border-transparent focus:border-emerald-500 outline-none"
                >
                  {batchesList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">Attendance Date</p>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600" />
                <input 
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full bg-slate-50 pl-12 pr-4 py-3 rounded-[18px] text-[14px] font-bold text-slate-800 outline-none border border-transparent focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Search & Bulk Actions */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search Student Name or Roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-11 pr-4 py-3 rounded-[20px] text-[14px] font-bold text-slate-800 border border-slate-100 shadow-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleMarkAll('present')}
                className="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-[16px] text-[11px] font-black uppercase tracking-wider border border-emerald-100 active:scale-95 transition-all"
              >
                All Present
              </button>
              <button 
                onClick={() => handleMarkAll('absent')}
                className="flex-1 bg-rose-50 text-rose-600 py-3 rounded-[16px] text-[11px] font-black uppercase tracking-wider border border-rose-100 active:scale-95 transition-all"
              >
                All Absent
              </button>
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[13px] font-black text-slate-800">Students List</p>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredStudents.length} Found</span>
            </div>
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id}
                  onClick={() => toggleAttendance(student.id)}
                  className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-11 w-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 font-black text-[15px] shrink-0">
                      {student.rollNumber}
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <h4 className="text-[14px] font-black text-slate-800 leading-none mb-1.5 truncate">{student.name}</h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Roll {student.rollNumber}</span>
                        <span className="text-[9px] font-bold text-slate-400">Class {student.class}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${
                      attendanceRecords[student.id] === 'present' 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                        : 'bg-white border-slate-100 text-slate-200'
                    }`}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${
                      attendanceRecords[student.id] === 'absent' 
                        ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100' 
                        : 'bg-white border-slate-100 text-slate-200'
                    }`}>
                      <XCircle className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}

              {filteredStudents.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-slate-100 rounded-[24px] flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-800">No Students Found</h3>
                  <p className="text-[12px] text-slate-400 font-medium">Try changing class or search query</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-24"></div>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white to-transparent">
        <button 
          onClick={saveAttendance}
          disabled={isSaving || filteredStudents.length === 0}
          className="w-full bg-emerald-600 disabled:opacity-50 text-white py-4.5 rounded-[24px] font-black text-[17px] flex items-center justify-center gap-3 shadow-2xl shadow-emerald-200 active:scale-[0.98] transition-all"
        >
          {isSaving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Clock className="h-6 w-6" />
            </motion.div>
          ) : (
            <>
              <Save className="h-6 w-6" /> Save Attendance
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-5 bottom-10 z-[70] bg-emerald-600 text-white p-5 rounded-[28px] shadow-2xl flex items-center gap-4"
          >
            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Check className="h-7 w-7" />
            </div>
            <div>
              <h4 className="text-[16px] font-black">Attendance Saved!</h4>
              <p className="text-[13px] text-emerald-50 font-bold">Records updated in database securely.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
