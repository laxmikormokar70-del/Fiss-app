import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, Attendance, TeacherProfile } from '../types';
import TodayScheduleCard from './TodayScheduleCard';
import AttendanceValidationModal from './AttendanceValidationModal';
import { validateAttendanceSchedule, getCurrentDeviceTime, ValidationFailureDetails } from '../utils/timeLock';
import { 
  X, 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Send,
  UserCheck,
  RefreshCw,
  Search,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Download,
  Share2,
  Printer,
  Trash2,
  Edit2,
  Plus,
  Check,
  Filter,
  CheckCircle2,
  ArrowLeft,
  Phone,
  MessageCircle,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { writeBatch, doc, deleteDoc, setDoc, updateDoc, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface AttendanceTabProps {
  students: Student[];
  attendance?: Attendance[];
  classes?: any[];
  payments?: any[];
  teacherProfile?: TeacherProfile | null;
  onSaveAttendance?: (date: string, marks: Record<string, 'present' | 'absent'>) => Promise<void>;
  onTabChange: (tab: string) => void;
  triggerNotification: (message: string, type: 'success' | 'error') => void;
  onEditClassSchedule?: (classId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'teacher' | 'system';
  text?: string;
  type?: 'text' | 'confirmation' | 'success';
  found?: { rollNumber: string; name: string; studentId: string }[];
  notFound?: string[];
  confirmed?: boolean;
  timestamp: string;
}

const EmptyState = ({ onGoToStudents }: { onGoToStudents: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-white border-2 border-emerald-500/20 rounded-[24px] shadow-sm text-center max-w-sm mx-auto my-8">
    <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
      <Users className="h-10 w-10 text-emerald-600" />
    </div>
    <h3 className="text-xl font-black text-slate-800 mb-2">No Students Found</h3>
    <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed px-2">
      No students have been added to this Class & Batch yet. Please add students before marking attendance.
    </p>
    <button
      onClick={onGoToStudents}
      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
    >
      Go to Students
    </button>
  </div>
);

export default function AttendanceTab({ 
  students, 
  attendance = [], 
  classes = [], 
  payments = [],
  teacherProfile,
  onSaveAttendance,
  onTabChange,
  triggerNotification,
  onEditClassSchedule
}: AttendanceTabProps) {
  // Validation Modal State
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationDetails, setValidationDetails] = useState<ValidationFailureDetails | null>(null);
  // Current Tab selection
  const [activeTab, setActiveTab] = useState<'quick' | 'reports'>(() => {
    const saved = localStorage.getItem('attendance_active_tab');
    return (saved === 'reports' ? 'reports' : 'quick');
  });
  const [isFullScreenChatActive, setIsFullScreenChatActive] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<Student | null>(null);

  // Shared state: Class and Batch Selector
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return localStorage.getItem('attendance_selected_class_id') || '';
  });
  const [selectedBatchId, setSelectedBatchId] = useState<string>(() => {
    return localStorage.getItem('attendance_selected_batch_id') || '';
  });

  // Performance Filter state
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'good' | 'medium' | 'low'>(() => {
    return (localStorage.getItem('attendance_performance_filter') as any) || 'all';
  });

  const [selectionError, setSelectionError] = useState("");

  // Clear error on selection changes
  useEffect(() => {
    if (selectedClassId && selectedBatchId) {
      setSelectionError("");
    }
  }, [selectedClassId, selectedBatchId]);

  // Persist selections
  useEffect(() => {
    localStorage.setItem('attendance_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('attendance_selected_class_id', selectedClassId);
  }, [selectedClassId]);

  useEffect(() => {
    localStorage.setItem('attendance_selected_batch_id', selectedBatchId);
  }, [selectedBatchId]);

  useEffect(() => {
    localStorage.setItem('attendance_performance_filter', performanceFilter);
  }, [performanceFilter]);

  // Live clock
  const [currentTime, setCurrentTime] = useState<string>('');

  // Chat interface state (Quick Attendance)
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [presentStudentIds, setPresentStudentIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [dbStudents, setDbStudents] = useState<Student[]>([]);
  // Use loading state if needed for UI feedback
  const [loadingDbStudents, setLoadingDbStudents] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Reports state
  const [reportDate, setReportDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [reportFilter, setReportFilter] = useState<'all' | 'present' | 'absent' | 'boys' | 'girls'>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [reportTime, setReportTime] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editingMarks, setEditingMarks] = useState<Record<string, 'present' | 'absent'>>({});
  const [isUpdatingPast, setIsUpdatingPast] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const reportDateInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Offline mode check
  const isOfflineMode = typeof window !== 'undefined' && localStorage.getItem('edu_offline_mode') === 'true';

  // Format today's date
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Update clock
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Prevent scroll when full-screen chat is active
  useEffect(() => {
    if (isFullScreenChatActive) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isFullScreenChatActive]);

  // Filter classes belonging to the logged-in teacher
  const filteredClasses = useMemo(() => {
    const teacherId = auth.currentUser?.uid || 'offline-teacher';
    return classes.filter(c => c.teacherId === teacherId);
  }, [classes]);

  // Set default class if available
  useEffect(() => {
    if (filteredClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(filteredClasses[0].id);
    }
  }, [filteredClasses, selectedClassId]);

  // Find currently active Class
  const activeClass = useMemo(() => {
    return filteredClasses.find(c => c.id === selectedClassId);
  }, [filteredClasses, selectedClassId]);

  // Find active batches for selected class
  const activeBatches = useMemo(() => {
    return activeClass?.batches || [];
  }, [activeClass]);

  // Auto-select first batch when class changes
  useEffect(() => {
    if (activeBatches.length > 0) {
      if (!activeBatches.some((b: any) => b.name === selectedBatchId)) {
        setSelectedBatchId(activeBatches[0].name);
      }
    } else {
      setSelectedBatchId('');
    }
  }, [activeClass, activeBatches, selectedBatchId]);

  // Selected batch object
  const selectedBatch = useMemo(() => {
    return activeBatches.find((b: any) => b.name === selectedBatchId);
  }, [activeBatches, selectedBatchId]);

  const checkScheduleValidity = (): { isValid: boolean; validation: ValidationFailureDetails | null } => {
    if (!selectedClassId || !selectedBatchId) {
      return { isValid: false, validation: null };
    }
    const sched = selectedBatch?.schedules?.[0] || {
      startTime: selectedBatch?.startTime || '06:00 PM',
      endTime: selectedBatch?.endTime || '07:30 PM',
      selectedDays: selectedBatch?.selectedDays || ['Mon', 'Wed', 'Fri'],
      daysType: selectedBatch?.daysType || 'custom'
    };

    const validation = validateAttendanceSchedule({
      selectedClassId,
      selectedBatchId,
      selectedDate: todayStr,
      schedule: sched,
      timeLockEnabled: teacherProfile?.timeLockEnabled ?? true,
      allowLateAttendance: teacherProfile?.allowLateAttendance ?? true,
      lateMinutes: teacherProfile?.lateMinutes ?? 15,
      existingAttendanceList: attendance
    });

    return { isValid: validation.isValid, validation };
  };

  // Derive active batch students from students prop for 100% real-time, zero-delay consistency
  const batchStudents = useMemo(() => {
    if (!activeClass || !selectedBatchId) return [];
    return students.filter(s => {
      const isClassMatch = s.class === activeClass.className;
      const isBatchMatch = s.batch === selectedBatchId;
      return isClassMatch && isBatchMatch && s.status === 'Active';
    });
  }, [students, activeClass, selectedBatchId]);

  // Compute 3-column statistics for real-time attendance dashboard
  const stats = useMemo(() => {
    const total = batchStudents.length;
    const present = batchStudents.filter(s => presentStudentIds.has(s.id)).length;
    const absent = total - present;
    return { total, present, absent };
  }, [batchStudents, presentStudentIds]);

  // Preload pre-existing attendance marks for today if any
  useEffect(() => {
    if (selectedClassId && selectedBatchId) {
      const todayRecord = attendance.find(a => 
        a.date === todayStr && 
        (a as any).classId === selectedClassId && 
        (a as any).batchId === selectedBatchId
      );

      const initialPresentSet = new Set<string>();
      if (todayRecord && todayRecord.attendanceMarks) {
        Object.entries(todayRecord.attendanceMarks).forEach(([sId, status]) => {
          if (status === 'present') {
            initialPresentSet.add(sId);
          }
        });
        setPresentStudentIds(initialPresentSet);

        setChatMessages([
          {
            id: 'welcome-record-exists',
            sender: 'system',
            text: `📝 **Attendance already recorded for today!**
Class: **${activeClass?.className}** &bull; **${selectedBatch?.name}**
Present: **${initialPresentSet.size}** students.

You can modify it here by typing additional rolls or confirm again to overwrite.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text'
          }
        ]);
      } else {
        setPresentStudentIds(new Set());
        setChatMessages([
          {
            id: 'welcome-new',
            sender: 'system',
            text: `👋 Hello! Let's mark attendance for **${activeClass?.className || 'Selected Class'} — ${selectedBatch?.name || 'Selected Batch'}**.

Type the roll numbers of students who are **Present**:
• Single Roll: \`5\`
• Comma-separated: \`1,2,5,12\`
• Continuous Range: \`1-20\`
• Mixed query: \`1-15, 18, 20-25\``,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text'
          }
        ]);
      }
    }
  }, [selectedClassId, selectedBatchId, attendance, todayStr]);

  // Roll number parser
  const parseRollNumbers = (input: string): number[] => {
    const rolls = new Set<number>();
    let normalized = input.replace(/\s+to\s+/gi, '-');
    normalized = normalized.replace(/(\d+)to(\d+)/gi, '$1-$2');
    
    const parts = normalized.split(/[\s,;]+/);
    
    for (const part of parts) {
      if (!part) continue;
      if (part.includes('-')) {
        const rangeParts = part.split('-');
        if (rangeParts.length === 2) {
          const start = parseInt(rangeParts[0], 10);
          const end = parseInt(rangeParts[1], 10);
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let i = start; i <= end; i++) {
              rolls.add(i);
            }
          }
        }
      } else {
        const roll = parseInt(part, 10);
        if (!isNaN(roll)) {
          rolls.add(roll);
        }
      }
    }
    return Array.from(rolls).sort((a, b) => a - b);
  };

  const handleSaveAttendanceRecordWithCustomSet = async (customPresentIds: Set<string>) => {
    if (batchStudents.length === 0) {
      triggerNotification("No students found in this batch. Please add students first.", "error");
      return;
    }

    // Schedule & Time Lock Verification
    const sched = selectedBatch?.schedules?.[0] || {
      startTime: selectedBatch?.startTime || '06:00 PM',
      endTime: selectedBatch?.endTime || '07:30 PM',
      selectedDays: selectedBatch?.selectedDays || ['Mon', 'Wed', 'Fri'],
      daysType: selectedBatch?.daysType || 'custom'
    };

    const validation = validateAttendanceSchedule({
      selectedClassId,
      selectedBatchId,
      selectedDate: todayStr,
      schedule: sched,
      timeLockEnabled: teacherProfile?.timeLockEnabled ?? true,
      allowLateAttendance: teacherProfile?.allowLateAttendance ?? true,
      lateMinutes: teacherProfile?.lateMinutes ?? 15,
      existingAttendanceList: attendance
    });

    if (!validation.isValid) {
      setValidationDetails(validation);
      setIsValidationModalOpen(true);
      return;
    }

    setIsSaving(true);

    try {
      const teacherId = auth.currentUser?.uid || 'offline-teacher';
      const classId = selectedClassId;
      const batchId = selectedBatchId;

      const timeInfo = getCurrentDeviceTime();
      const attendanceMarks: Record<string, 'present' | 'absent'> = {};
      const studentDetails: Record<string, { status: 'present' | 'absent'; timestamp: string }> = {};

      batchStudents.forEach(student => {
        const isPresent = customPresentIds.has(student.id);
        const status: 'present' | 'absent' = isPresent ? 'present' : 'absent';
        attendanceMarks[student.id] = status;
        studentDetails[student.id] = {
          status,
          timestamp: new Date().toISOString()
        };
      });

      const recordPayload = {
        teacherId,
        classId,
        className: activeClass?.className || '',
        batchId,
        batchName: selectedBatch?.name || '',
        date: todayStr,
        attendanceDate: todayStr,
        attendanceDay: timeInfo.dayFullName,
        attendanceTime: timeInfo.timeStr12,
        scheduleStart: sched.startTime || '06:00 PM',
        scheduleEnd: sched.endTime || '07:30 PM',
        lateMinutes: teacherProfile?.lateMinutes ?? 15,
        timeLockEnabled: teacherProfile?.timeLockEnabled ?? true,
        markedBy: teacherProfile?.name || 'Teacher',
        attendanceMarks,
        students: studentDetails,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isOfflineMode) {
        const docId = `offline-${teacherId}-${classId}-${batchId}-${todayStr}`;
        const offlineRecord = {
          id: docId,
          ...recordPayload
        };

        const stored = localStorage.getItem('edu_attendance') || '[]';
        let localList = JSON.parse(stored);
        localList = localList.filter((a: any) => !(a.date === todayStr && a.classId === classId && a.batchId === batchId));
        localList.push(offlineRecord);
        localStorage.setItem('edu_attendance', JSON.stringify(localList));

        if (onSaveAttendance) {
          await onSaveAttendance(todayStr, attendanceMarks);
        }
      } else {
        const batchObj = writeBatch(db);

        // 1. Nested write
        const nestedRef = doc(db, 'users', teacherId, 'classes', classId, 'batches', batchId, 'attendance', todayStr);
        batchObj.set(nestedRef, recordPayload, { merge: true });

        // 2. Top-level write
        const topLevelDocId = `${teacherId}-${classId}-${batchId}-${todayStr}`;
        const topLevelRef = doc(db, 'attendance', topLevelDocId);
        batchObj.set(topLevelRef, recordPayload, { merge: true });

        await batchObj.commit();

        if (onSaveAttendance) {
          await onSaveAttendance(todayStr, attendanceMarks);
        }
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);

      setSuccessMessage("Attendance updated successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Error saving attendance: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAttendanceRecord = async () => {
    await handleSaveAttendanceRecordWithCustomSet(presentStudentIds);
  };

  const handleToggleStudentAttendance = async (studentId: string) => {
    const newSet = new Set<string>(presentStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setPresentStudentIds(newSet);
    await handleSaveAttendanceRecordWithCustomSet(newSet);
  };


  const confirmAttendance = async (messageId: string) => {
    const msg = chatMessages.find(m => m.id === messageId);
    if (!msg || !msg.found || msg.confirmed) return;

    const newSet = new Set<string>(presentStudentIds);
    msg.found.forEach(f => newSet.add(f.studentId));
    
    setPresentStudentIds(newSet);
    await handleSaveAttendanceRecordWithCustomSet(newSet);

    setChatMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, confirmed: true } : m
    ));

    const successMsg: ChatMessage = {
      id: Date.now().toString() + '-succ',
      sender: 'system',
      type: 'success',
      text: 'Attendance completed successfully.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, successMsg]);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (batchStudents.length === 0) {
      triggerNotification("No students found in this batch. Please add students first.", "error");
      setChatInput('');
      return;
    }

    const validity = checkScheduleValidity();
    if (!validity.isValid && validity.validation?.statusType !== 'Already Taken') {
      setValidationDetails(validity.validation);
      setIsValidationModalOpen(true);
      setChatInput('');
      return;
    }

    const userInput = chatInput.trim();
    setChatInput('');

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add teacher message
    const teacherMsg: ChatMessage = {
      id: Date.now().toString() + '-t',
      sender: 'teacher',
      text: userInput,
      type: 'text',
      timestamp: now,
    };

    // Parse
    const parsedRolls = parseRollNumbers(userInput);
    if (parsedRolls.length === 0) {
      setChatMessages(prev => [...prev, teacherMsg, {
        id: Date.now().toString() + '-s',
        sender: 'system',
        type: 'text',
        text: 'No valid roll numbers parsed. Please type numbers (e.g. 1, 2, 5-10).',
        timestamp: now,
      }]);
      return;
    }

    const found: { rollNumber: string; name: string; studentId: string }[] = [];
    const notFound: string[] = [];

    parsedRolls.forEach(rollNum => {
      const rollStr = rollNum.toString();
      const matched = batchStudents.find(s => parseInt(s.rollNumber, 10) === rollNum);
      if (matched) {
        found.push({ rollNumber: matched.rollNumber, name: matched.name, studentId: matched.id });
      } else {
        notFound.push(rollStr.padStart(2, '0'));
      }
    });

    if (found.length === 1 && notFound.length === 0) {
      // Auto-confirm single roll number
      const newSet = new Set<string>(presentStudentIds);
      newSet.add(found[0].studentId);
      setPresentStudentIds(newSet);
      await handleSaveAttendanceRecordWithCustomSet(newSet);

      const successMsg: ChatMessage = {
        id: (Date.now() + 1).toString() + '-succ',
        sender: 'system',
        type: 'success',
        text: `Attendance marked for ${found[0].name} (#${found[0].rollNumber}).`,
        timestamp: now,
      };
      setChatMessages(prev => [...prev, teacherMsg, successMsg]);
      return;
    }

    const systemMsg: ChatMessage = {
      id: (Date.now() + 1).toString() + '-s',
      sender: 'system',
      type: found.length > 0 ? 'confirmation' : 'text',
      text: found.length === 0 ? 'None of the roll numbers were found in this batch.' : undefined,
      found: found.length > 0 ? found : undefined,
      notFound: notFound.length > 0 ? notFound : undefined,
      confirmed: false,
      timestamp: now,
    };

    setChatMessages(prev => [...prev, teacherMsg, systemMsg]);
  };



  // --- REPORTS & PAST HISTORY ---
  const currentReportRecord = useMemo(() => {
    return attendance.find(a => 
      a.date === reportDate && 
      (a as any).classId === selectedClassId && 
      (a as any).batchId === selectedBatchId
    );
  }, [attendance, reportDate, selectedClassId, selectedBatchId]);

  const reportStats = useMemo(() => {
    const total = batchStudents.length;
    const boys = batchStudents.filter(s => s.gender === 'Boy').length;
    const girls = batchStudents.filter(s => s.gender === 'Girl').length;

    let present = 0;
    let absent = 0;

    if (currentReportRecord && currentReportRecord.attendanceMarks) {
      batchStudents.forEach(student => {
        const mark = currentReportRecord.attendanceMarks[student.id];
        if (mark === 'present') present++;
        else absent++;
      });
    } else {
      absent = total;
    }

    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    // Payment stats for the report month
    const reportMonth = reportDate.slice(0, 7);
    const paid = batchStudents.filter(student => {
      return payments.some(p => p.studentId === student.id && p.month === reportMonth && p.status === 'Paid');
    }).length;
    const due = total - paid;

    return { total, boys, girls, present, absent, percentage, paid, due };
  }, [batchStudents, currentReportRecord, reportDate, payments]);

  const filteredReportStudents = useMemo(() => {
    // 1. Calculate historical attendance % for each student in this batch
    const records = attendance.filter(a => (a as any).classId === selectedClassId && (a as any).batchId === selectedBatchId);
    const totalRecords = records.length;

    return batchStudents.map(student => {
      const presentCount = records.filter(r => r.attendanceMarks?.[student.id] === 'present').length;
      const attendancePercent = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 100; // Default to 100 if no records
      return { ...student, attendancePercent };
    }).filter(student => {
      // 2. Apply performance filter
      if (performanceFilter === 'good' && student.attendancePercent < 90) return false;
      if (performanceFilter === 'medium' && (student.attendancePercent < 60 || student.attendancePercent >= 90)) return false;
      if (performanceFilter === 'low' && student.attendancePercent >= 60) return false;

      // 3. Apply search query
      const matchesSearch = student.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || 
                           student.rollNumber.toString().includes(reportSearchQuery);

      return matchesSearch;
    });
  }, [batchStudents, attendance, selectedClassId, selectedBatchId, performanceFilter, reportSearchQuery]);

  const batchHistory = useMemo(() => {
    return attendance
      .filter(a => (a as any).classId === selectedClassId && (a as any).batchId === selectedBatchId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, selectedClassId, selectedBatchId]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Roll No", "Name", "Gender", "Status"];
    const tableRows: any[] = [];

    filteredReportStudents.forEach(student => {
      const mark = currentReportRecord?.attendanceMarks?.[student.id] || 'absent';
      const studentData = [
        student.rollNumber,
        student.name,
        student.gender || 'N/A',
        mark === 'present' ? 'Present' : 'Absent'
      ];
      tableRows.push(studentData);
    });

    const title = `Attendance Report - ${activeClass?.className} - ${selectedBatchId}`;
    const dateStr = `Date: ${reportDate}`;

    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(11);
    doc.text(dateStr, 14, 30);
    doc.text(`Total: ${reportStats.total} | Present: ${reportStats.present} | Absent: ${reportStats.absent}`, 14, 36);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] }
    });

    doc.save(`Attendance_Report_${reportDate}.pdf`);
  };

  const exportToExcel = () => {
    const tableData = filteredReportStudents.map(student => ({
      "Roll No": student.rollNumber,
      "Name": student.name,
      "Gender": student.gender || 'N/A',
      "Status": (currentReportRecord?.attendanceMarks?.[student.id] || 'absent') === 'present' ? 'Present' : 'Absent',
      "Date": reportDate,
      "Class": activeClass?.className,
      "Batch": selectedBatchId
    }));

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_Report_${reportDate}.xlsx`);
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const rowsHtml = filteredReportStudents.map(student => {
      const status = currentReportRecord?.attendanceMarks?.[student.id] || 'absent';
      const isPresent = status === 'present';
      return `
        <tr>
          <td>#${student.rollNumber}</td>
          <td>${student.name}</td>
          <td><span class="badge ${isPresent ? 'present' : 'absent'}">${isPresent ? 'Present' : 'Absent'}</span></td>
          <td>${student.attendancePercent}%</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report - ${reportDate}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            h1 { font-size: 24px; font-weight: 800; color: #065f46; margin-bottom: 5px; }
            p { font-size: 14px; color: #64748b; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px 16px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: 700; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { font-weight: 700; font-size: 11px; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
            .present { background-color: #dcfce7; color: #15803d; }
            .absent { background-color: #fee2e2; color: #b91c1c; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; text-align: center; }
            .stat-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 5px; }
            .stat-lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h1>Attendance Report</h1>
          <p>Class: <strong>${activeClass?.className || 'N/A'}</strong> | Batch: <strong>${selectedBatchId || 'N/A'}</strong> | Date: <strong>${reportDate}</strong></p>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-lbl">Total Students</div>
              <div class="stat-val">${reportStats.total}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Present</div>
              <div class="stat-val">${reportStats.present}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Absent</div>
              <div class="stat-val">${reportStats.absent}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Attendance %</div>
              <div class="stat-val">${reportStats.percentage}%</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Status</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShareReport = async () => {
    const text = `Attendance Summary (${reportDate}):\nClass: ${activeClass?.className || 'N/A'}\nBatch: ${selectedBatchId || 'N/A'}\nTotal: ${reportStats.total}\nPresent: ${reportStats.present}\nAbsent: ${reportStats.absent}\nPercentage: ${reportStats.percentage}%`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Attendance Report - ${reportDate}`,
          text: text,
        });
      } catch (err) {
        console.log("Sharing failed, copying to clipboard instead", err);
        navigator.clipboard.writeText(text);
        alert('Attendance Summary copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Attendance Summary copied to clipboard!');
    }
  };

  const handleDeleteHistoryRecord = async (dateToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete the attendance record for ${dateToDelete}?`)) return;

    try {
      const teacherId = auth.currentUser?.uid || 'offline-teacher';
      
      if (isOfflineMode) {
        const stored = localStorage.getItem('edu_attendance') || '[]';
        let localList = JSON.parse(stored);
        localList = localList.filter((a: any) => !(a.date === dateToDelete && a.classId === selectedClassId && a.batchId === selectedBatchId));
        localStorage.setItem('edu_attendance', JSON.stringify(localList));
      } else {
        const nestedRef = doc(db, 'users', teacherId, 'classes', selectedClassId, 'batches', selectedBatchId, 'attendance', dateToDelete);
        const topLevelDocId = `${teacherId}-${selectedClassId}-${selectedBatchId}-${dateToDelete}`;
        const topLevelRef = doc(db, 'attendance', topLevelDocId);

        await deleteDoc(nestedRef);
        await deleteDoc(topLevelRef);
      }

      if (onSaveAttendance) {
        // Trigger a fresh sync by sending empty/removed data
        await onSaveAttendance(dateToDelete, {});
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete attendance record.');
    }
  };

  const startEditingHistory = (record: any) => {
    setEditingRecord(record);
    setEditingMarks(record.attendanceMarks || {});
  };

  const handleSaveEditedHistory = async () => {
    if (!editingRecord) return;
    setIsUpdatingPast(true);

    try {
      const teacherId = auth.currentUser?.uid || 'offline-teacher';
      const recordDate = editingRecord.date;

      const studentDetails: Record<string, { status: 'present' | 'absent'; timestamp: string }> = {};
      batchStudents.forEach(student => {
        const status = editingMarks[student.id] || 'absent';
        studentDetails[student.id] = {
          status,
          timestamp: new Date().toISOString()
        };
      });

      if (isOfflineMode) {
        const stored = localStorage.getItem('edu_attendance') || '[]';
        let localList = JSON.parse(stored);
        localList = localList.map((a: any) => {
          if (a.date === recordDate && a.classId === selectedClassId && a.batchId === selectedBatchId) {
            return {
              ...a,
              attendanceMarks: editingMarks,
              students: studentDetails,
              updatedAt: new Date().toISOString()
            };
          }
          return a;
        });
        localStorage.setItem('edu_attendance', JSON.stringify(localList));
      } else {
        const nestedRef = doc(db, 'users', teacherId, 'classes', selectedClassId, 'batches', selectedBatchId, 'attendance', recordDate);
        const topLevelDocId = `${teacherId}-${selectedClassId}-${selectedBatchId}-${recordDate}`;
        const topLevelRef = doc(db, 'attendance', topLevelDocId);

        await updateDoc(nestedRef, {
          attendanceMarks: editingMarks,
          students: studentDetails,
          updatedAt: new Date().toISOString()
        });

        await updateDoc(topLevelRef, {
          attendanceMarks: editingMarks,
          updatedAt: new Date().toISOString()
        });
      }

      if (onSaveAttendance) {
        await onSaveAttendance(recordDate, editingMarks);
      }

      setEditingRecord(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update attendance record.');
    } finally {
      setIsUpdatingPast(false);
    }
  };

  if (isFullScreenChatActive && selectedClassId && selectedBatchId) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#efeae2] h-screen w-screen overflow-hidden font-sans">
        {/* Style block to completely hide layout sidebars and any external margins */}
        <style>{`
          /* Hide parent layout sidebars and header in full screen */
          aside, nav, header, #bottomNavLine, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100vw !important;
            height: 100vh !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            z-index: 50 !important;
            background-color: #efeae2 !important;
          }
        `}</style>

        {/* Header */}
        <div className="bg-green-100 text-green-950 px-4 py-3.5 flex items-center justify-between border-b border-green-200 shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullScreenChatActive(false)}
              className="p-1 hover:bg-green-200/50 rounded-full transition-colors cursor-pointer text-green-950 flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 text-green-950" />
            </button>
            <h2 className="text-sm font-bold tracking-wide text-green-950">
              {activeClass?.className || 'Class'} • {selectedBatchId || 'Batch'}
            </h2>
          </div>
          <div className="text-[10px] font-bold bg-green-200/50 px-2 py-0.5 rounded-full text-green-900 flex items-center gap-1">
            <Clock className="h-3 w-3 text-green-800" />
            <span>{currentTime || 'Live'}</span>
          </div>
        </div>

        {/* Slim Real-Time Stats Bar (Top) */}
        <div className="bg-white/80 backdrop-blur-md border-b border-green-200 px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-500 font-bold shrink-0 shadow-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 bg-slate-400 rounded-full" />
            <span className="uppercase tracking-widest">Total: <span className="text-slate-900 font-black tabular-nums">{stats.total}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
            <span className="uppercase tracking-widest">Present: <span className="text-green-700 font-black tabular-nums">{stats.present}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 bg-rose-500 rounded-full" />
            <span className="uppercase tracking-widest">Absent: <span className="text-rose-600 font-black tabular-nums">{stats.absent}</span></span>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={chatScrollRef} 
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#efeae2] scroll-smooth"
        >
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-6">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 shadow-xs border border-emerald-200">
                <Send className="h-4 w-4 ml-0.5" />
              </div>
              <p className="text-[10px] font-black text-[#111111] uppercase tracking-wider">Attendance Chat Console</p>
              <p className="text-[9px] text-slate-500 max-w-[200px] mt-1">
                Enter roll numbers below to mark attendance. E.g. 5, 1-10, 15
              </p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'teacher' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-3 text-xs border shadow-sm ${
                  msg.sender === 'teacher' 
                    ? 'bg-[#d9fdd3] text-emerald-950 border-[#d9fdd3] rounded-tr-none' 
                    : 'bg-white border-slate-150 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.type === 'text' && <span className="font-bold whitespace-pre-wrap">{msg.text}</span>}
                  {msg.type === 'success' && (
                    <div className="flex items-center gap-1.5 font-black text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {msg.text}
                    </div>
                  )}
                  {msg.type === 'confirmation' && (
                    <div className="space-y-2 w-full min-w-[180px]">
                      {msg.found && msg.found.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[9px] font-black text-[#16A34A] uppercase tracking-widest mb-1.5">Verify Records</div>
                          {msg.found.map(f => (
                            <div key={f.studentId} className="flex items-center gap-2">
                              <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">#{f.rollNumber}</span>
                              <span className="font-black text-slate-800 text-[11px]">{f.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.notFound && msg.notFound.length > 0 && (
                        <div className="mt-1 pt-2 border-t border-slate-100">
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider">Invalid Rolls: {msg.notFound.join(', ')}</span>
                        </div>
                      )}
                       {!msg.confirmed ? (
                        <button
                          onClick={() => confirmAttendance(msg.id)}
                          className="mt-2.5 w-full py-2 bg-green-100 hover:bg-green-200 text-green-950 rounded-xl font-bold text-[11px] border border-green-300 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-800" />
                          {msg.found && msg.found.length > 1 ? 'Confirm All' : 'Confirm Record'}
                        </button>
                      ) : (
                        <div className="mt-2.5 text-center text-[10px] font-black text-emerald-600 bg-emerald-50 py-1.5 rounded-xl border border-emerald-100">
                          Marked Present ✓
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[8px] font-bold text-slate-400 mt-1 mb-1 px-1">
                  {msg.sender === 'teacher' ? 'You' : 'System'} • {msg.timestamp}
                </span>
              </motion.div>
            ))
          )}
        </div>

        {/* Bottom Input */}
        <div className="p-3 bg-[#f0f2f5] border-t border-slate-200/50 shrink-0 flex items-center gap-2 w-full pb-4 md:pb-3">
          <form onSubmit={handleSendChat} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Enter Roll Number..."
              disabled={!selectedBatchId}
              enterKeyHint="send"
              className="flex-1 h-11 bg-white border border-slate-200 focus:border-emerald-600 rounded-full px-4 text-xs font-bold text-black outline-none transition-all placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || !selectedBatchId}
              className="h-11 w-11 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-full disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-md active:scale-90"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col font-sans w-full overflow-hidden relative no-scrollbar">
      <div className="flex-1 w-full px-0 pt-0 pb-32 sm:pb-24 max-w-full mx-auto overflow-y-auto no-scrollbar flex flex-col">
        {/* 1. PROFESSIONAL TOP HEADER SECTION (FULL WIDTH & CURVED) */}
        <div className="bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white shadow-xl w-full shrink-0 rounded-b-[40px] relative z-20 border-none pb-2">
          <div className="w-full px-5 py-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-[16px] bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-sm shrink-0">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none uppercase text-white font-display">Attendance</h1>
                <p className="text-[10px] text-emerald-100 font-bold mt-1.5 uppercase tracking-[0.15em] flex items-center gap-1.5 opacity-90">
                  <Sparkles className="h-3 w-3 text-emerald-300" /> Professional ERP
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 text-[11px] font-black bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white shadow-sm tabular-nums tracking-wider">
                <Clock className="h-4 w-4 text-emerald-300" />
                <span>{currentTime || '...'}</span>
              </div>
            </div>
          </div>

          {/* 2. COMPACT ACTION BUTTONS (MODERN CARDS) */}
          <div className="w-full px-6 pb-6 mt-1">
            <div className="grid grid-cols-2 gap-3 w-full bg-black/10 backdrop-blur-md p-1.5 rounded-[24px] border border-white/10 shadow-inner">
              {[
                { id: 'quick', label: 'Quick Mark', icon: UserCheck },
                { id: 'reports', label: 'Reports', icon: Clock },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-300 cursor-pointer relative overflow-hidden active:scale-95 ${
                      isSelected 
                        ? 'bg-white text-green-950 shadow-md ring-1 ring-green-900/5' 
                        : 'bg-transparent text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-green-700' : 'text-white'}`} />
                    <span className="text-[12px] font-black tracking-tight">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-4 pt-3 flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full">
        <div className="bg-white flex flex-col space-y-4">
          {/* SELECTION SECTION: Class & Batch */}
          <div className="p-0 border-none shrink-0 space-y-4">
            {/* CLASS SECTION */}
            <div className="space-y-3 bg-white p-4 rounded-[20px] border border-green-200 shadow-md">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-4 bg-green-500 rounded-full" />
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Select Class</span>
                </div>
                <span className="text-[10px] font-black text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 shadow-xs tabular-nums">
                  {filteredClasses.length}
                </span>
              </div>
              
              <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 w-full px-1">
                {filteredClasses.length === 0 ? (
                  <div className="w-full p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 uppercase tracking-widest font-black">
                    No Classes Found
                  </div>
                ) : (
                  filteredClasses.map((c, idx) => {
                    const isSelected = selectedClassId === c.id;
                    return (
                      <button
                        key={c.id || `class-${idx}`}
                        onClick={() => setSelectedClassId(c.id)}
                        className={`py-[14px] px-[24px] rounded-[18px] text-[15px] font-semibold transition-all duration-300 cursor-pointer shrink-0 shadow-sm ${
                          isSelected
                            ? 'bg-[#16A34A] text-white border-none'
                            : 'bg-white border-2 border-[#BBF7D0] text-[#16A34A] hover:bg-green-50'
                        }`}
                      >
                        {c.className}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* BATCH SECTION */}
            <div className="space-y-3 bg-white p-4 rounded-[20px] border border-green-200 shadow-md">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-4 bg-green-500 rounded-full" />
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Select Batch</span>
                </div>
                <span className="text-[10px] font-black text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 shadow-xs tabular-nums">
                  {activeBatches.length}
                </span>
              </div>
              
              <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 w-full px-1">
                {activeBatches.length === 0 ? (
                  <div className="w-full p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 uppercase tracking-widest font-black">
                    {selectedClassId ? 'No Batches Found' : 'Select a Class First'}
                  </div>
                ) : (
                  activeBatches.map((batch, idx) => {
                    const isSelected = selectedBatchId === batch.name;
                    const count = students.filter(s => s.class === activeClass?.className && s.batch === batch.name && s.status === 'Active').length;
                    return (
                      <button
                        key={batch.id || `batch-${idx}`}
                        onClick={() => setSelectedBatchId(batch.name)}
                        className={`py-[14px] px-[24px] rounded-[18px] text-[15px] font-semibold transition-all duration-300 cursor-pointer shrink-0 flex items-center gap-3 shadow-sm ${
                          isSelected
                            ? 'bg-[#16A34A] text-white border-none'
                            : 'bg-white border-2 border-[#BBF7D0] text-[#16A34A] hover:bg-green-50'
                        }`}
                      >
                        <span>{batch.name}</span>
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-inner tabular-nums ${
                          isSelected ? 'bg-green-800 text-white' : 'bg-green-700 text-white'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {batchStudents.length === 0 && selectedClassId && selectedBatchId ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-12"
              >
                <EmptyState onGoToStudents={() => onTabChange('students')} />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white flex flex-col pt-1 space-y-4"
              >
                {/* TODAY'S SCHEDULE CARD */}
                {selectedClassId && selectedBatchId && (
                  <TodayScheduleCard
                    classNameStr={activeClass?.className || 'Class'}
                    batchName={selectedBatchId || 'Batch'}
                    schedule={selectedBatch?.schedules?.[0] || {
                      startTime: selectedBatch?.startTime || '06:00 PM',
                      endTime: selectedBatch?.endTime || '07:30 PM',
                      selectedDays: selectedBatch?.selectedDays || ['Mon', 'Wed', 'Fri'],
                      daysType: selectedBatch?.daysType || 'custom'
                    }}
                    timeLockEnabled={teacherProfile?.timeLockEnabled ?? true}
                    allowLateAttendance={teacherProfile?.allowLateAttendance ?? true}
                    lateMinutes={teacherProfile?.lateMinutes ?? 15}
                    onOpenSettings={() => onTabChange('settings')}
                    onEditSchedule={() => {
                      if (onEditClassSchedule && selectedClassId) {
                        onEditClassSchedule(selectedClassId);
                      } else {
                        onTabChange('dashboard');
                      }
                    }}
                    isAlreadyTakenToday={attendance.some(a => 
                      (a.date === todayStr || (a as any).attendanceDate === todayStr) && 
                      ((a as any).classId === selectedClassId || (a as any).className === activeClass?.className) && 
                      ((a as any).batchId === selectedBatchId || (a as any).batchName === selectedBatchId)
                    )}
                  />
                )}

                {/* Action Area */}
                <div className="space-y-3 pt-1">
                  {activeTab === 'quick' ? (
                    <button
                      onClick={() => {
                        if (!selectedClassId || !selectedBatchId) {
                          setSelectionError("It is not allowed and this page cannot be opened. Please select both Class and Batch properly.");
                        } else {
                          const validity = checkScheduleValidity();
                          if (!validity.isValid && validity.validation?.statusType !== 'Already Taken') {
                            setValidationDetails(validity.validation);
                            setIsValidationModalOpen(true);
                          } else {
                            setSelectionError("");
                            setIsFullScreenChatActive(true);
                          }
                        }
                      }}
                      className="w-full min-h-[52px] py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-2xl font-black text-[16px] shadow-lg shadow-emerald-600/20 border-none transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <UserCheck className="h-5.5 w-5.5 text-white" />
                      Quick Attendance
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!selectedClassId || !selectedBatchId) {
                          setSelectionError("It is not allowed and this page cannot be opened. Please select both Class and Batch properly.");
                        } else {
                          setSelectionError("");
                          setIsReportsOpen(true);
                        }
                      }}
                      className="w-full min-h-[52px] py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-2xl font-black text-[16px] shadow-lg shadow-emerald-600/20 border-none transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <Clock className="h-5.5 w-5.5 text-white" />
                      View Reports & Logs
                    </button>
                  )}

                  {selectionError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-2xl text-center shadow-xs">
                      {selectionError}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

      {/* FULL SCREEN OVERLAYS */}
      <AnimatePresence>
        {isReportsOpen && selectedClassId && selectedBatchId && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-0 z-[100] bg-slate-50 flex flex-col"
          >
            <div className="bg-gradient-to-r from-[#16A34A] via-green-600 to-emerald-700 text-white p-5 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsReportsOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white cursor-pointer transition-colors active:scale-90 flex items-center justify-center">
                  <ArrowLeft className="h-6 w-6 text-white" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Reports</h2>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white/50" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 sm:pb-24 no-scrollbar max-w-5xl mx-auto w-full">
              {/* Slim Context Bar (Replaces bulky selectors) */}
              <div className="bg-white rounded-2xl border border-green-200 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 divide-x divide-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Class</span>
                    <span className="text-[13px] font-bold text-slate-900">{activeClass?.className || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col pl-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Batch</span>
                    <span className="text-[13px] font-bold text-slate-900">{selectedBatchId || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col pl-4 relative cursor-pointer active:opacity-60 transition-opacity">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                    <span className="text-[13px] font-bold text-[#16A34A] hover:text-[#15803D] transition-colors tabular-nums underline decoration-dotted decoration-2 underline-offset-4">{reportDate}</span>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
                <div className="relative">
                  <button 
                    className="p-2 bg-green-50 text-green-700 rounded-lg border border-green-100 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <Filter className="h-4 w-4" />
                  </button>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>

              {/* Stats Card Section */}
              <div className="bg-white rounded-[20px] border border-[#22C55E] shadow-md p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex flex-col">
                    <h3 className="text-[14px] font-black text-[#111827] uppercase tracking-tight leading-none">Quick Analysis</h3>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-[70%]">
                    {[
                      { icon: Download, label: 'PDF', onClick: exportToPDF },
                      { icon: Printer, label: 'Print', onClick: handlePrintReport },
                      { icon: Share2, label: 'Share', onClick: handleShareReport }
                    ].map((btn, i) => (
                      <button 
                        key={i}
                        onClick={btn.onClick} 
                        className="h-8 min-w-[44px] px-2.5 bg-white text-green-700 border border-[#22C55E] rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 hover:bg-green-50" 
                      >
                        <btn.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="hidden sm:inline">{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { label: 'Total', value: reportStats.total, color: 'text-[#111827]', icon: Users, iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
                    { label: 'Present', value: reportStats.present, color: 'text-[#16A34A]', icon: CheckCircle2, iconBg: 'bg-green-50', iconColor: 'text-[#16A34A]' },
                    { label: 'Absent', value: reportStats.absent, color: 'text-[#DC2626]', icon: AlertCircle, iconBg: 'bg-red-50', iconColor: 'text-[#DC2626]' },
                    { label: 'Avg %', value: `${reportStats.percentage}%`, color: 'text-[#15803D]', icon: GraduationCap, iconBg: 'bg-emerald-50', iconColor: 'text-[#15803D]' }
                  ].map((card, i) => (
                    <div key={i} className="bg-white border border-green-200 rounded-[14px] p-3 flex items-center gap-3 shadow-xs">
                      <div className={`p-2 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                        <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                      </div>
                      <div className="flex flex-col text-left">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#374151] leading-none">
                          {card.label}
                        </p>
                        <h4 className={`text-[30px] font-black tabular-nums tracking-tighter ${card.color} mt-1 leading-none`}>
                          {card.value}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Logs */}
              <div className="bg-white rounded-[20px] border border-[#22C55E] shadow-md overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-black text-[#111827] uppercase tracking-tight leading-none">Student Logs</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search..."
                        value={reportSearchQuery}
                        onChange={(e) => setReportSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-semibold text-[#1F2937] outline-none w-full max-w-[120px] focus:ring-1 focus:ring-green-500/20"
                      />
                    </div>
                  </div>

                  {/* Performance Filter Row */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'good', label: 'Good (≥90%)' },
                      { id: 'medium', label: 'Medium (60-89%)' },
                      { id: 'low', label: 'Low (<60%)' }
                    ].map(chip => (
                      <button
                        key={chip.id}
                        onClick={() => setPerformanceFilter(chip.id as any)}
                        className={`h-[36px] px-4 rounded-full text-[14px] font-semibold whitespace-nowrap transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                          performanceFilter === chip.id 
                            ? 'text-white border-none' 
                            : 'bg-white border border-[#22C55E] text-[#111827] hover:bg-green-50/50'
                        }`}
                        style={{ background: performanceFilter === chip.id ? 'linear-gradient(135deg,#16A34A,#22C55E)' : undefined }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {filteredReportStudents.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center space-y-2">
                      <div className="h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Search className="h-7 w-7" />
                      </div>
                      <p className="text-[12px] font-black text-[#374151] uppercase tracking-widest">No Records Found</p>
                    </div>
                  ) : (
                    filteredReportStudents.map((s) => {
                      const status = currentReportRecord?.attendanceMarks?.[s.id] || 'absent';
                      const isPresent = status === 'present';
                      const perfColor = s.attendancePercent >= 90 ? '#16A34A' : s.attendancePercent >= 60 ? '#F59E0B' : '#DC2626';
                      
                      return (
                        <div key={s.id} className="p-3.5 flex flex-col gap-3 hover:bg-slate-50/50 transition-colors bg-white rounded-xl border border-slate-100 shadow-xs">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[#1F2937] shrink-0 font-black text-[12px] tabular-nums">
                                #{s.rollNumber}
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="text-[14px] font-black text-[#111827] leading-tight">{s.name}</h4>
                                <p className="text-[12px] font-bold text-[#374151]">Attendance: <span style={{ color: perfColor }}>{s.attendancePercent}%</span></p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                isPresent ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${isPresent ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`} />
                                {isPresent ? 'Present' : 'Absent'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${s.attendancePercent}%` }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: perfColor }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-0.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedProfileStudent(s)}
                                className="h-8 px-3 bg-white text-[#1F2937] border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
                              >
                                <User className="h-3 w-3" /> Profile
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`https://wa.me/${(s.whatsapp || s.phone || '').replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="h-8 w-8 bg-white text-[#16A34A] border border-[#22C55E] rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-xs"
                                title="WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                              <a
                                href={`tel:${s.phone || ''}`}
                                className="h-8 w-8 bg-white text-blue-600 border border-blue-200 rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-xs"
                                title="Call"
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* EDIT MODAL FOR HISTORIC RECORDS */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-slate-200 max-w-sm w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="bg-white px-5 py-4 border-b border-slate-150 flex items-center justify-between">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-800">
                    Edit Past Record Log
                  </h3>
                  <span className="text-[9px] font-bold capitalize text-slate-400 block mt-0.5">
                    Date: {editingRecord.date}
                  </span>
                </div>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="p-1 text-slate-400 hover:text-black hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable list inside modal */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {batchStudents.map((student) => {
                  const isPresent = editingMarks[student.id] === 'present';
                  return (
                    <div 
                      key={student.id}
                      className="flex items-center justify-between p-2.5 bg-white hover:bg-slate-50 border border-slate-150 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-5 w-5 rounded text-[9px] font-bold flex items-center justify-center tabular-nums ${
                          isPresent ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          #{student.rollNumber}
                        </span>
                        <span className="text-[11px] font-bold text-black">{student.name}</span>
                      </div>

                      {/* Tactile toggle switches */}
                      <button
                        onClick={() => {
                          setEditingMarks(prev => ({
                            ...prev,
                            [student.id]: isPresent ? 'absent' : 'present'
                          }));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold capitalize border transition-all cursor-pointer ${
                          isPresent
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-black'
                        }`}
                      >
                        {isPresent ? 'Present' : 'Absent'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-100 bg-white flex gap-2">
                <button
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-bold capitalize text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditedHistory}
                  disabled={isUpdatingPast}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold capitalize flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-50"
                >
                  {isUpdatingPast ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Save Updates</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STUDENT PROFILE MODAL */}
      <AnimatePresence>
        {selectedProfileStudent && (
          <div className="fixed inset-0 bg-black/40 z-[120] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[32px] border border-slate-200 max-w-sm w-full shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-[#16A34A] to-emerald-600 text-white p-6 relative">
                <button
                  onClick={() => setSelectedProfileStudent(null)}
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-4 mt-2">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
                    <span className="text-[9px] font-black uppercase text-emerald-100 tracking-wider">Roll</span>
                    <span className="text-2xl font-black tabular-nums">#{selectedProfileStudent.rollNumber}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black tracking-tight leading-tight">{selectedProfileStudent.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">{selectedProfileStudent.class} • {selectedProfileStudent.batch}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs font-bold text-slate-800 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Gender</span>
                    <span className="text-slate-800 font-bold">{selectedProfileStudent.gender || 'N/A'}</span>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Status</span>
                    <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-wider">{selectedProfileStudent.status || 'Active'}</span>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Mobile Contact</span>
                    <span className="text-slate-800 font-bold tabular-nums">{selectedProfileStudent.phone || 'N/A'}</span>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">WhatsApp Contact</span>
                    <span className="text-slate-800 font-bold tabular-nums">{selectedProfileStudent.whatsapp || 'N/A'}</span>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Guardians Name</span>
                    <span className="text-slate-800 font-bold">{selectedProfileStudent.guardianName || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4">
                  <a
                    href={`https://wa.me/${(selectedProfileStudent.whatsapp || selectedProfileStudent.phone || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-50 transition-all active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" /> Message
                  </a>
                  <a
                    href={`tel:${selectedProfileStudent.phone || ''}`}
                    className="flex-1 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-100 transition-all active:scale-95"
                  >
                    <Phone className="h-4 w-4" /> Call Phone
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attendance Validation / Time Lock Failure Popup Modal */}
      <AttendanceValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        validationDetails={validationDetails}
        onOpenSettings={() => {
          setIsValidationModalOpen(false);
          onTabChange('settings');
        }}
        onEditSchedule={() => {
          setIsValidationModalOpen(false);
          if (onEditClassSchedule && selectedClassId) {
            onEditClassSchedule(selectedClassId);
          } else {
            onTabChange('dashboard');
          }
        }}
        batchName={selectedBatchId}
        classNameStr={activeClass?.className}
      />
    </div>
  );
}
