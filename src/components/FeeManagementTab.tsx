import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, Payment, TeacherProfile } from '../types';
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Users, 
  Clock, 
  Send, 
  Search, 
  Filter, 
  CheckSquare, 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown,
  Percent,
  Coins, 
  Check, 
  ArrowRight,
  ArrowLeft,
  UserCheck,
  AlertCircle,
  X,
  MessageSquare,
  Sparkles,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Mail,
  Calculator,
  Sliders,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLocalStudentImageSync } from '../utils/localImageStore';

const MONTHS_LIST = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

interface FeeManagementTabProps {
  students: Student[];
  payments: Payment[];
  teacherProfile: TeacherProfile | null;
  onSavePayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  onEditStudent: (id: string, payload: Partial<Omit<Student, 'id' | 'createdAt' | 'teacherId'>>) => Promise<void>;
  classes?: any[];
  onTabChange: (tab: string) => void;
  triggerNotification: (message: string, type: 'success' | 'error') => void;
  quickPayState?: { studentId: string; class: string; batch: string; rollNumber: string; fromTab: string } | null;
  onClearQuickPayState?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'teacher' | 'system';
  text?: string;
  type?: 'text' | 'confirmation' | 'success' | 'error';
  student?: Student;
  paymentMode?: 'Cash' | 'Online';
  confirmed?: boolean;
  timestamp: string;
}

const EmptyState = ({ onGoToStudents }: { onGoToStudents: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-white border-2 border-emerald-500/20 rounded-[24px] shadow-sm text-center max-w-sm mx-auto my-8">
    <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
      <Users className="h-10 w-10 text-emerald-600" />
    </div>
    <h3 className="text-xl font-black text-slate-800 mb-2">No Students Available</h3>
    <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed px-2">
      There are no students available for fee collection. Please add students first.
    </p>
    <button
      onClick={onGoToStudents}
      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
    >
      Go to Students
    </button>
  </div>
);

export default function FeeManagementTab({
  students,
  payments,
  teacherProfile,
  onSavePayment,
  onEditStudent,
  classes = [],
  onTabChange,
  triggerNotification,
  quickPayState,
  onClearQuickPayState
}: FeeManagementTabProps) {
  // Inner Main Tabs
  const [activeInnerTab, setActiveInnerTab] = useState<'payment' | 'calculator' | 'reports'>('payment');

  // Shared state: Class and Batch Selectors
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // Fee Calculator States
  const [calcClassId, setCalcClassId] = useState<string>('all');
  const [calcBatchName, setCalcBatchName] = useState<string>('all');
  const [calcDiscountPercent, setCalcDiscountPercent] = useState<number>(0);

  // Date, Month, Year selection states (user editable)
  const [selDay, setSelDay] = useState<string>('all'); // 'all' or '01'-'31'
  const [selMonth, setSelMonth] = useState<string>(() => new Date().toISOString().slice(5, 7)); // '01'-'12'
  const [selYear, setSelYear] = useState<string>(() => new Date().getFullYear().toString()); // '2024'-'2030'

  // Month Selector (tracks fee month) - Default to current month "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7);
  });

  // Sync editable selectors with internal selectedMonth & reportDate states
  useEffect(() => {
    setSelectedMonth(`${selYear}-${selMonth}`);
    if (selDay === 'all') {
      setReportDate('');
    } else {
      setReportDate(`${selYear}-${selMonth}-${selDay.padStart(2, '0')}`);
    }
  }, [selDay, selMonth, selYear]);

  // Live clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullScreenChatActive, setIsFullScreenChatActive] = useState(false);

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

  // Chat interface state (Automatic Payment Tab)
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Reports filters & search state
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [reportClassId, setReportClassId] = useState<string>('all');
  const [reportBatchName, setReportBatchName] = useState<string>('all');
  const [reportPaymentMode, setReportPaymentMode] = useState<string>('all');
  const [reportPaymentStatus, setReportPaymentStatus] = useState<string>('all');
  const [reportDate, setReportDate] = useState<string>('');

  // SMS Reminder States
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsSelectedStudentIds, setSmsSelectedStudentIds] = useState<Set<string>>(new Set());
  const [smsTemplate, setSmsTemplate] = useState<string>(
    'Dear Guardian, this is a gentle reminder regarding the unpaid tuition fee of {name} for the month of {month}. Please clear the payment of ₹{fee} soon. Thank you!'
  );
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSentCount, setSmsSentCount] = useState(0);

  // Update clock
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Automate Quick Payment selection and setup when quickPayState is triggered
  useEffect(() => {
    if (quickPayState) {
      // Find class that matches the name in quickPayState.class
      const matchedClass = classes.find(c => c.className === quickPayState.class || c.id === quickPayState.class);
      if (matchedClass) {
        setSelectedClassId(matchedClass.id);
        setSelectedBatchId(quickPayState.batch);
        setActiveInnerTab('payment');
        setIsFullScreenChatActive(true);
        // Prefill the roll number in the chat input
        setChatInput(quickPayState.rollNumber);
      }
    }
  }, [quickPayState, classes]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Derive class lists (mirroring AttendanceTab logic)
  const filteredClasses = useMemo(() => {
    const teacherId = teacherProfile?.uid || 'offline-teacher';
    const activeFromProp = classes.filter(c => c.teacherId === teacherId);
    if (activeFromProp.length > 0) return activeFromProp;

    // Fallback: build custom classes structure from students list
    const profileClasses = teacherProfile?.customClasses || [];
    const studentClasses = Array.from(new Set(students.map(s => s.class).filter(Boolean)));
    const mergedClasses = Array.from(new Set([...profileClasses, ...studentClasses]));

    return mergedClasses.map((clsName, idx) => {
      const classStudents = students.filter(s => s.class === clsName);
      const studentBatches = Array.from(new Set(classStudents.map(s => s.batch).filter(Boolean)));
      const profileBatches = teacherProfile?.customBatches || [];
      const mergedBatches = Array.from(new Set([...profileBatches, ...studentBatches]));

      return {
        id: `class-fallback-${idx}`,
        className: clsName,
        teacherId,
        batches: mergedBatches.length > 0 
          ? mergedBatches.map(b => ({ name: b, time: '' }))
          : [{ name: 'Batch A', time: '' }]
      };
    });
  }, [classes, teacherProfile, students]);

  // Set default class on load
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

  // Auto-initialize default Class and Batch for Reports
  useEffect(() => {
    if (filteredClasses.length > 0) {
      if (reportClassId === 'all' || !filteredClasses.some(c => c.id === reportClassId)) {
        const firstClass = filteredClasses[0];
        setReportClassId(firstClass.id);
        
        // Find first batch of this class
        const classStudents = students.filter(s => s.class === firstClass.className);
        const uniqueBatches = Array.from(new Set(classStudents.map(s => s.batch || s.batchName || 'Default Batch')));
        if (uniqueBatches.length > 0) {
          setReportBatchName(uniqueBatches[0]);
        } else if (firstClass.batches && firstClass.batches.length > 0) {
          setReportBatchName(firstClass.batches[0].name || firstClass.batches[0]);
        } else {
          setReportBatchName('Default Batch');
        }
      }
    }
  }, [filteredClasses, reportClassId, students]);

  // Handle report class change to auto-select first batch of new class
  const handleReportClassChange = (classId: string) => {
    setReportClassId(classId);
    const targetClass = filteredClasses.find(c => c.id === classId);
    if (targetClass) {
      const classStudents = students.filter(s => s.class === targetClass.className);
      const uniqueBatches = Array.from(new Set(classStudents.map(s => s.batch || s.batchName || 'Default Batch')));
      if (uniqueBatches.length > 0) {
        setReportBatchName(uniqueBatches[0]);
      } else if (targetClass.batches && targetClass.batches.length > 0) {
        setReportBatchName(targetClass.batches[0].name || targetClass.batches[0]);
      } else {
        setReportBatchName('Default Batch');
      }
    }
  };

  // Active student list for selected class & batch
  const batchStudents = useMemo(() => {
    if (!activeClass || !selectedBatchId) return [];
    return students.filter(s => {
      const isClassMatch = s.class === activeClass.className;
      const isBatchMatch = s.batch === selectedBatchId;
      return isClassMatch && isBatchMatch && s.status === 'Active';
    });
  }, [students, activeClass, selectedBatchId]);

  // Generate statistics for the active batch in the selected month
  const stats = useMemo(() => {
    const total = batchStudents.length;
    
    // Find payments for these students in selected month
    const monthPayments = payments.filter(p => p.month === selectedMonth);
    const paidStudentIds = new Set(
      monthPayments.filter(p => p.status === 'Paid').map(p => p.studentId)
    );

    const paid = batchStudents.filter(s => paidStudentIds.has(s.id)).length;
    const due = total - paid;

    return { total, paid, due };
  }, [batchStudents, payments, selectedMonth]);

  // Reset chat welcome card when Class or Batch changes
  useEffect(() => {
    if (activeClass && selectedBatchId) {
      setChatMessages([
        {
          id: 'payment-welcome',
          sender: 'system',
          text: `👋 Hello! Let's collect fees for **${activeClass.className} — ${selectedBatchId}**.\n\nSelect a payment mode below (**Cash** or **Online**), then type the student's **Roll Number** to confirm and complete their tuition payment.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        }
      ]);
    }
  }, [selectedClassId, selectedBatchId]);

  // Handle Send Chat in Payment Console
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedClassId || !selectedBatchId) return;

    if (batchStudents.length === 0) {
      triggerNotification("No students found in this batch. Please add students first.", "error");
      setChatInput('');
      return;
    }

    const rollNum = chatInput.trim();
    setChatInput('');

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add teacher's roll message
    const teacherMsg: ChatMessage = {
      id: Date.now().toString() + '-t',
      sender: 'teacher',
      text: rollNum,
      type: 'text',
      timestamp: now,
    };

    // Find student in current Class + Batch matching roll number
    const matchedStudent = batchStudents.find(
      s => s.rollNumber.trim() === rollNum || parseInt(s.rollNumber, 10) === parseInt(rollNum, 10)
    );

    if (matchedStudent) {
      // Create confirmation card
      const confirmMsg: ChatMessage = {
        id: (Date.now() + 1).toString() + '-s',
        sender: 'system',
        type: 'confirmation',
        student: matchedStudent,
        paymentMode: selectedPaymentMode,
        timestamp: now,
      };
      setChatMessages(prev => [...prev, teacherMsg, confirmMsg]);
    } else {
      // Student not found error
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString() + '-s',
        sender: 'system',
        type: 'error',
        text: `❌ Student not found with Roll Number #${rollNum} in this batch.`,
        timestamp: now,
      };
      setChatMessages(prev => [...prev, teacherMsg, errorMsg]);
    }
  };

  // Confirm and Record Payment
  const handleConfirmPayment = async (msgId: string, student: Student, mode: 'Cash' | 'Online') => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const paymentPayload: Omit<Payment, 'id'> = {
      teacherId: student.teacherId || teacherProfile?.uid || 'offline-teacher',
      studentId: student.id,
      studentName: student.name,
      studentRoll: student.rollNumber,
      studentClass: student.class,
      month: selectedMonth,
      paymentDate: dateStr,
      paymentTime: timeStr,
      amountPaid: student.monthlyFee,
      dueAmount: 0,
      advanceAmount: 0,
      status: 'Paid',
      paymentMode: mode,
      notes: `Paid via ${mode} (Automatic Payment Console)`
    };

    try {
      await onSavePayment(paymentPayload);

      // Update chat messages to confirm this message
      setChatMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return { ...m, confirmed: true };
        }
        return m;
      }));

      // Add success notification message
      const successMsg: ChatMessage = {
        id: Date.now().toString() + '-succ',
        sender: 'system',
        type: 'success',
        text: `✅ Payment Successful for ${student.name} (#${student.rollNumber}).`,
        timestamp: timeStr
      };

      setChatMessages(prev => [...prev, successMsg]);

      if (quickPayState) {
        setTimeout(() => {
          setIsFullScreenChatActive(false);
          if (onTabChange) {
            onTabChange(quickPayState.fromTab || 'reports');
          }
          if (onClearQuickPayState) {
            onClearQuickPayState();
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error("Payment registration failed:", err);
      alert("Error saving payment: " + err.message);
    }
  };

  // Cancel Payment action
  const handleCancelPayment = (msgId: string) => {
    setChatMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return { ...m, confirmed: false, type: 'text', text: '❌ Payment Cancelled.' };
      }
      return m;
    }));
  };

  // ------------------ FEE CALCULATOR COMPUTATIONS ------------------
  const calculatorData = useMemo(() => {
    let list = students.filter(s => s.status === 'Active' && (!teacherProfile || s.teacherId === teacherProfile.uid));

    if (calcClassId !== 'all') {
      const targetClass = filteredClasses.find(c => c.id === calcClassId);
      if (targetClass) {
        list = list.filter(s => s.class === targetClass.className);
      }
    }

    if (calcBatchName !== 'all') {
      list = list.filter(s => s.batch === calcBatchName);
    }

    const items = list.map(student => {
      const payment = payments.find(p => p.studentId === student.id && p.month === selectedMonth);
      const isPaid = payment?.status === 'Paid';
      const originalFee = Number(student.monthlyFee) || 0;
      const discountAmount = Math.round((originalFee * calcDiscountPercent) / 100);
      const finalFee = Math.max(0, originalFee - discountAmount);
      const amountPaid = isPaid ? (payment?.amountPaid || originalFee) : (payment?.amountPaid || 0);
      const dueAmount = isPaid ? 0 : Math.max(0, finalFee - amountPaid);

      return {
        student,
        originalFee,
        discountAmount,
        finalFee,
        amountPaid,
        dueAmount,
        isPaid,
        paymentRecord: payment || null
      };
    });

    const totalStudents = items.length;
    const paidCount = items.filter(i => i.isPaid).length;
    const dueCount = totalStudents - paidCount;

    const totalProjectedFees = items.reduce((sum, i) => sum + i.originalFee, 0);
    const totalDiscounts = items.reduce((sum, i) => sum + i.discountAmount, 0);
    const finalNetExpected = Math.max(0, totalProjectedFees - totalDiscounts);
    const totalCollected = items.reduce((sum, i) => sum + i.amountPaid, 0);
    const totalPending = items.reduce((sum, i) => sum + i.dueAmount, 0);

    const collectionPercentage = finalNetExpected > 0
      ? Math.round((totalCollected / finalNetExpected) * 100)
      : 0;

    return {
      items,
      totalStudents,
      paidCount,
      dueCount,
      totalProjectedFees,
      totalDiscounts,
      finalNetExpected,
      totalCollected,
      totalPending,
      collectionPercentage
    };
  }, [students, payments, selectedMonth, calcClassId, calcBatchName, calcDiscountPercent, filteredClasses, teacherProfile]);

  // ------------------ REPORTS COMPUTATIONS ------------------
  // Filter students and enrich with payment record if exists
  const reportsData = useMemo(() => {
    // 1. Start with all active students
    let list = students.filter(s => s.status === 'Active' && (!teacherProfile || s.teacherId === teacherProfile.uid));

    // Filter by Class (if not 'all')
    if (reportClassId !== 'all') {
      const targetClass = filteredClasses.find(c => c.id === reportClassId);
      if (targetClass) {
        list = list.filter(s => s.class === targetClass.className);
      }
    }

    // Filter by Batch (if not 'all')
    if (reportBatchName !== 'all') {
      list = list.filter(s => s.batch === reportBatchName);
    }

    // Apply Search Filter (Name or Roll) - Pre-filtering list for performance
    if (reportSearchQuery.trim()) {
      const q = reportSearchQuery.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q)
      );
    }

    // Enrich students with payment info for selected month
    const enriched = list.map(student => {
      const payment = payments.find(p => p.studentId === student.id && p.month === selectedMonth);
      const isPaid = payment?.status === 'Paid';
      
      return {
        student,
        isPaid,
        paymentRecord: payment || null
      };
    });

    // Apply Payment Status Filter (All / Paid / Due)
    let filtered = enriched;
    if (reportPaymentStatus === 'paid') {
      filtered = filtered.filter(item => item.isPaid);
    } else if (reportPaymentStatus === 'due') {
      filtered = filtered.filter(item => !item.isPaid);
    }

    // Apply Payment Mode Filter (All / Cash / Online)
    if (reportPaymentMode !== 'all') {
      filtered = filtered.filter(item => {
        if (!item.isPaid || !item.paymentRecord) return false;
        const mode = item.paymentRecord.paymentMode || 'Cash';
        return mode.toLowerCase() === reportPaymentMode.toLowerCase();
      });
    }

    // Apply Payment Date Filter
    if (reportDate) {
      filtered = filtered.filter(item => {
        if (!item.isPaid || !item.paymentRecord) return false;
        return item.paymentRecord.paymentDate === reportDate;
      });
    }

    return filtered;
  }, [students, payments, selectedMonth, reportClassId, reportBatchName, reportPaymentMode, reportPaymentStatus, reportDate, reportSearchQuery, filteredClasses, teacherProfile]);

  // Compute Reports summary statistics
  const reportsStats = useMemo(() => {
    const totalStudents = reportsData.length;
    const paidStudents = reportsData.filter(item => item.isPaid).length;
    const dueStudents = totalStudents - paidStudents;

    // Filter payments specifically for this filtered dataset
    const validPayments = reportsData
      .map(item => item.paymentRecord)
      .filter((p): p is Payment => p !== null);

    const cashPayments = validPayments.filter(p => (p.paymentMode || 'Cash') === 'Cash');
    const onlinePayments = validPayments.filter(p => p.paymentMode === 'Online');

    const cashAmount = cashPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const onlineAmount = onlinePayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalCollected = validPayments.reduce((sum, p) => sum + p.amountPaid, 0);

    // Estimate total due amount
    const totalDueAmount = reportsData.reduce((acc, item) => {
      if (!item.isPaid) {
        return acc + (Number(item.student.monthlyFee) || 0);
      }
      return acc;
    }, 0);

    const collectionPercentage = totalStudents > 0 
      ? Math.round((paidStudents / totalStudents) * 100) 
      : 0;

    return {
      totalStudents,
      paidStudents,
      dueStudents,
      cashCount: cashPayments.length,
      cashAmount,
      onlineCount: onlinePayments.length,
      onlineAmount,
      totalCollected,
      totalDueAmount,
      collectionPercentage
    };
  }, [reportsData]);

  // List of students who have unpaid fees based on the current filtered dataset
  const dueStudentsForReports = useMemo(() => {
    return reportsData
      .filter(item => !item.isPaid)
      .map(item => item.student);
  }, [reportsData]);

  // Build batches dynamically for reports filter based on selected class
  const reportBatchesList = useMemo(() => {
    if (reportClassId === 'all') return [];
    const targetClass = filteredClasses.find(c => c.id === reportClassId);
    if (!targetClass) return [];
    
    const classStudents = students.filter(s => s.class === targetClass.className);
    const uniqueBatches = Array.from(new Set(classStudents.map(s => s.batch || s.batchName).filter(Boolean)));
    if (uniqueBatches.length > 0) return uniqueBatches.sort();

    if (targetClass.batches) {
      return targetClass.batches.map((b: any) => b.name || b).sort();
    }
    return ['Default Batch'];
  }, [reportClassId, filteredClasses, students]);

  if (isFullScreenChatActive && selectedClassId && selectedBatchId && activeInnerTab === 'payment') {
    const activeClassName = activeClass?.className || '';
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
        <div className="bg-[#16A34A] text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullScreenChatActive(false)}
              className="hover:bg-emerald-700/50 p-1.5 rounded-full transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-black tracking-tight">{activeClassName} • {selectedBatchId}</span>
              </div>
              <p className="text-[10px] text-emerald-100 font-bold leading-none mt-0.5">Automatic Payment Chat Console</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-white bg-emerald-700/40 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {currentTime}
          </span>
        </div>

        {/* Messages Body */}
        <div 
          ref={chatScrollRef} 
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] scroll-smooth"
          style={{
            backgroundImage: "radial-gradient(#dfdcd6 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        >
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-6">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 shadow-xs border border-emerald-200">
                <Send className="h-4 w-4 ml-0.5" />
              </div>
              <p className="text-xs font-black text-[#111111] uppercase tracking-wider">Automatic Payment Chat Console</p>
              <p className="text-[10px] text-slate-500 max-w-[200px] mt-1">
                Enter student's roll number below. E.g. 1, 5, 12
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
                <span className="text-[9px] font-bold text-slate-500 mb-0.5 px-1 uppercase tracking-tight">
                  {msg.sender === 'teacher' ? 'You' : 'System'} • {msg.timestamp}
                </span>
                <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] border shadow-sm ${
                  msg.sender === 'teacher' 
                    ? 'bg-[#E1F3D4] text-[#1E3A1E] border-[#C3E8A7] rounded-tr-none' 
                    : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.type === 'text' && <span className="font-bold whitespace-pre-wrap">{msg.text}</span>}
                  {msg.type === 'error' && <span className="font-bold text-rose-600 whitespace-pre-wrap">{msg.text}</span>}
                  {msg.type === 'success' && (
                    <div className="flex items-center gap-1.5 font-black text-emerald-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {msg.text}
                    </div>
                  )}
                  {msg.type === 'confirmation' && msg.student && (
                    <div className="space-y-2 w-full min-w-[210px]">
                      <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100">
                        <div className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1.5">Student Found</div>
                        <div className="space-y-1 text-slate-800 text-[10px]">
                          <p><span className="font-bold text-slate-500">Name:</span> <strong className="text-slate-900 font-bold">{msg.student.name}</strong></p>
                          <p><span className="font-bold text-slate-500">Roll:</span> <strong className="text-slate-900 font-bold">#{msg.student.rollNumber}</strong></p>
                          <p><span className="font-bold text-slate-500">Class:</span> <strong className="text-slate-900 font-bold">{msg.student.class}</strong></p>
                          <p><span className="font-bold text-slate-500">Batch:</span> <strong className="text-slate-900 font-bold">{msg.student.batch}</strong></p>
                          <p><span className="font-bold text-slate-500">Monthly Fee:</span> <strong className="text-emerald-700 font-black">₹{msg.student.monthlyFee}</strong></p>
                          <p><span className="font-bold text-slate-500">Payment Mode:</span> <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black uppercase text-[8px] tracking-wide">{msg.paymentMode}</span></p>
                        </div>
                      </div>
                      
                      {!msg.confirmed ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleConfirmPayment(msg.id, msg.student!, msg.paymentMode!)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[9px] uppercase tracking-wide flex items-center justify-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" /> Confirm Payment
                          </button>
                          <button
                            onClick={() => handleCancelPayment(msg.id)}
                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-[9px] uppercase tracking-wide transition-all active:scale-95 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-[10px] font-black text-emerald-600 bg-emerald-50 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-wider">
                          Confirmed Paid ✓
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Input Form Controls */}
        <div className="bg-[#f0f0f0] border-t border-slate-200 p-3 shrink-0 space-y-2.5">
          {/* Payment Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-1">Payment Mode:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSelectedPaymentMode('Cash')}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all active:scale-95 cursor-pointer ${
                  selectedPaymentMode === 'Cash'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                💵 Cash
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentMode('Online')}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all active:scale-95 cursor-pointer ${
                  selectedPaymentMode === 'Online'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                📱 Online
              </button>
            </div>
          </div>

          <form onSubmit={handleSendChat} className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type Student's Roll Number..."
              disabled={!selectedBatchId}
              enterKeyHint="send"
              className="flex-1 h-12 bg-white border border-slate-200 focus:border-emerald-600 rounded-2xl px-4 text-[12px] font-bold text-black outline-none transition-all placeholder-slate-400 shadow-inner"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || !selectedBatchId}
              className="h-12 w-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-md active:scale-90"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // SMS helper formatting
  const formatSmsNumber = (phone: string) => {
    if (!phone) return '';
    // Strip non-digits
    return phone.replace(/\D/g, '');
  };

  const triggerSmsSend = (studentsList: Student[], bodyTemplate: string) => {
    if (studentsList.length === 0) return;
    
    // For bulk or individual, let's trigger the native SMS client
    const phoneNumbers = studentsList
      .map(s => s.mobileNumber || s.phone || s.phoneNumber)
      .filter(Boolean)
      .map(n => formatSmsNumber(n!))
      .join(',');

    if (!phoneNumbers) {
      alert("No valid phone numbers found for the selected student(s).");
      return;
    }

    // Replace placeholders for the first student if it is an individual, or generic if bulk
    let message = bodyTemplate;
    if (studentsList.length === 1) {
      const s = studentsList[0];
      message = message
        .replace(/{name}/g, s.name)
        .replace(/{month}/g, selectedMonth)
        .replace(/{fee}/g, s.monthlyFee.toString());
    } else {
      message = message
        .replace(/{name}/g, 'your child')
        .replace(/{month}/g, selectedMonth)
        .replace(/{fee}/g, 'the tuition');
    }

    // Open sms protocol
    window.open(`sms:${phoneNumbers}?body=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSendBulkSms = async () => {
    const selectedStudentsList = reportsData
      .map(item => item.student)
      .filter(s => smsSelectedStudentIds.has(s.id));

    if (selectedStudentsList.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    setIsSendingSms(true);
    // Simulate SMS dispatching delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSendingSms(false);
    
    triggerSmsSend(selectedStudentsList, smsTemplate);
    
    setSmsSentCount(selectedStudentsList.length);
    setIsSmsModalOpen(false);
    alert(`Successfully launched SMS reminders to native SMS client for ${selectedStudentsList.length} students/guardians.`);
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans w-full overflow-y-auto pb-32">
      {/* 1. PROFESSIONAL TOP HEADER SECTION (FULL WIDTH & CURVED) */}
      <div className="bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white shadow-xl w-full shrink-0 rounded-b-[40px] relative z-20 border-none pb-2">
        <div className="max-w-5xl mx-auto px-5 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-[16px] bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-sm shrink-0">
              <Wallet className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-2xl font-black tracking-tight leading-none uppercase text-white font-display whitespace-nowrap">Fees Manage</h1>
              </div>
              <p className="text-[10px] text-emerald-100 font-bold mt-1.5 uppercase tracking-[0.15em] flex items-center gap-1.5 opacity-90">
                <Sparkles className="h-3 w-3 text-emerald-300" /> Coaching ERP Module
              </p>
            </div>
          </div>
        </div>

        {/* 2. COMPACT ACTION BUTTONS (MODERN CARDS) */}
        <div className="max-w-5xl mx-auto px-6 pb-6 mt-1">
          <div className="grid grid-cols-2 gap-2 w-full bg-black/10 backdrop-blur-md p-1.5 rounded-[24px] border border-white/10 shadow-inner">
            {[
              { id: 'payment', label: 'Quick Payment', icon: Wallet },
              { id: 'reports', label: 'Reports', icon: FileSpreadsheet }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeInnerTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveInnerTab(tab.id as any);
                    if (tab.id === 'reports') {
                      setSelDay('all');
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl transition-all duration-300 cursor-pointer relative overflow-hidden active:scale-95 ${
                    isSelected 
                      ? 'bg-white text-emerald-950 shadow-md ring-1 ring-emerald-900/5' 
                      : 'bg-transparent text-white/90 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-white'}`} />
                  <span className={`text-[11px] sm:text-[12px] font-black uppercase tracking-tight ${isSelected ? 'text-emerald-950' : 'text-white'}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full px-2 sm:px-4 pt-4 pb-32 sm:pb-24 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* MODULE 1: AUTOMATIC PAYMENT */}
          {activeInnerTab === 'payment' && (
            <motion.div
              key="payment-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Class & Batch Selection Section */}
              <div className="space-y-6">
                {/* CLASS SELECTION */}
                <div className="space-y-4 bg-white p-5 rounded-[20px] border border-green-200 shadow-md">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-4 bg-green-500 rounded-full" />
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Select Class</span>
                    </div>
                    <span className="text-[10px] font-black text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 shadow-xs tabular-nums">
                      {filteredClasses.length} Created
                    </span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full px-1">
                    {filteredClasses.length === 0 ? (
                      <span className="text-xs text-slate-400 p-1">No custom classes found.</span>
                    ) : (
                      filteredClasses.map((cls) => {
                        const isSelected = selectedClassId === cls.id;
                        return (
                          <button
                            key={cls.id}
                            onClick={() => setSelectedClassId(cls.id)}
                            className={`py-[14px] px-[24px] rounded-[18px] text-[15px] font-semibold transition-all duration-300 cursor-pointer shrink-0 shadow-sm snap-center ${
                              isSelected
                                ? 'bg-[#16A34A] text-white border-none'
                                : 'bg-white border-2 border-[#BBF7D0] text-[#16A34A] hover:bg-green-50'
                            }`}
                          >
                            {cls.className}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Batches Selector */}
                <div className="space-y-4 bg-white p-5 rounded-[20px] border border-green-200 shadow-md">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-4 bg-green-500 rounded-full" />
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Select Batch</span>
                    </div>
                    <span className="text-[10px] font-black text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 shadow-xs tabular-nums">
                      {activeBatches.length} Available
                    </span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full px-1">
                    {activeBatches.length === 0 ? (
                      <span className="text-xs text-slate-400 p-1">Select class first or configure batch in settings.</span>
                    ) : (
                      activeBatches.map((b: any) => {
                        const count = students.filter(s => s.class === activeClass?.className && s.batch === b.name && s.status === 'Active').length;
                        const isSelected = selectedBatchId === b.name;
                        return (
                          <button
                            key={b.name}
                            onClick={() => setSelectedBatchId(b.name)}
                            className={`py-[14px] px-[24px] rounded-[18px] text-[15px] font-semibold transition-all duration-300 cursor-pointer shrink-0 flex items-center gap-3 shadow-sm snap-center ${
                              isSelected
                                ? 'bg-[#16A34A] text-white border-none'
                                : 'bg-white border-2 border-[#BBF7D0] text-[#16A34A] hover:bg-green-50'
                            }`}
                          >
                            <span>{b.name}</span>
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

              {/* Launcher Card block */}
              <div className="flex-1 flex flex-col justify-center items-center py-6 px-4 bg-white">
                <AnimatePresence mode="wait">
                  {batchStudents.length === 0 && selectedClassId && selectedBatchId ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full"
                    >
                      <EmptyState onGoToStudents={() => onTabChange('students')} />
                    </motion.div>
                  ) : selectedClassId && selectedBatchId ? (
                    <motion.div
                      key="launcher"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full"
                    >
                      <button
                        onClick={() => setIsFullScreenChatActive(true)}
                        className="w-full min-h-[52px] py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-2xl font-black text-[16px] shadow-lg shadow-emerald-600/20 border-none transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <Wallet className="h-5.5 w-5.5 text-white" />
                        Quick Payment
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-selection"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full py-4 px-6 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center text-center space-y-2"
                    >
                      <div className="h-10 w-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-700">Select Class & Batch</h3>
                        <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs">
                          Please select Class and Batch from the selectors above to enable payment collection.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* MODULE 2: FEE CALCULATOR */}
          {activeInnerTab === 'calculator' && (
            <motion.div
              key="calculator-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header & Controls */}
              <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-emerald-600" />
                      Smart Fee Calculator & Revenue Forecaster
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Realtime fee calculation, discount adjustments & batch collection analysis
                    </p>
                  </div>

                  {/* Month Picker */}
                  <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/60 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                    <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                    <select
                      value={selMonth}
                      onChange={(e) => setSelMonth(e.target.value)}
                      className="bg-transparent text-xs font-black text-emerald-950 outline-none cursor-pointer"
                    >
                      {MONTHS_LIST.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <select
                      value={selYear}
                      onChange={(e) => setSelYear(e.target.value)}
                      className="bg-transparent text-xs font-black text-emerald-950 outline-none cursor-pointer"
                    >
                      {Array.from({ length: 7 }, (_, i) => {
                        const y = (2024 + i).toString();
                        return <option key={y} value={y}>{y}</option>;
                      })}
                    </select>
                  </div>
                </div>

                {/* Filter Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Filter Class</label>
                    <select
                      value={calcClassId}
                      onChange={(e) => {
                        setCalcClassId(e.target.value);
                        setCalcBatchName('all');
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 transition-all cursor-pointer"
                    >
                      <option value="all">All Classes ({students.filter(s => s.status === 'Active').length} Students)</option>
                      {filteredClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.className}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Filter Batch</label>
                    <select
                      value={calcBatchName}
                      onChange={(e) => setCalcBatchName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 transition-all cursor-pointer"
                    >
                      <option value="all">All Batches</option>
                      {calcClassId !== 'all' && (filteredClasses.find(c => c.id === calcClassId)?.batches || []).map((b: any) => (
                        <option key={b.id || b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Global Batch Discount Slider */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-emerald-600" />
                      Global Batch Concession / Discount Rate:
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                      {calcDiscountPercent}% OFF
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={calcDiscountPercent}
                    onChange={(e) => setCalcDiscountPercent(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>0% (Full Fee)</span>
                    <span>25% (Scholarship)</span>
                    <span>50% (Max Waiver)</span>
                  </div>
                </div>
              </div>

              {/* 6 MODERN SUMMARY CARDS GRID (Material 3 + Glassmorphism) */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                {/* 1. Total Projected Fees */}
                <div className="bg-white p-4.5 rounded-[22px] border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Projected</span>
                    <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                      <Coins className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 tracking-tight">
                    ₹{calculatorData.totalProjectedFees.toLocaleString()}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">
                    Gross standard fees for {calculatorData.totalStudents} active students
                  </p>
                </div>

                {/* 2. Total Collected */}
                <div className="bg-emerald-600 text-white p-4.5 rounded-[22px] shadow-md shadow-emerald-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Total Collected</span>
                    <div className="h-8 w-8 bg-white/20 text-white rounded-xl flex items-center justify-center border border-white/20">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-white tracking-tight">
                    ₹{calculatorData.totalCollected.toLocaleString()}
                  </div>
                  <p className="text-[10px] font-extrabold text-emerald-100">
                    {calculatorData.paidCount} Students Paid
                  </p>
                </div>

                {/* 3. Total Pending */}
                <div className="bg-white p-4.5 rounded-[22px] border border-rose-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Total Pending</span>
                    <div className="h-8 w-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-rose-600 tracking-tight">
                    ₹{calculatorData.totalPending.toLocaleString()}
                  </div>
                  <p className="text-[10px] font-bold text-rose-700">
                    {calculatorData.dueCount} Students Outstanding
                  </p>
                </div>

                {/* 4. Total Discount / Waiver */}
                <div className="bg-white p-4.5 rounded-[22px] border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Total Discount</span>
                    <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                      <Percent className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 tracking-tight">
                    ₹{calculatorData.totalDiscounts.toLocaleString()}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">
                    {calcDiscountPercent}% global rate applied
                  </p>
                </div>

                {/* 5. Final Net Receivable */}
                <div className="bg-white p-4.5 rounded-[22px] border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Net Receivable</span>
                    <div className="h-8 w-8 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center border border-emerald-100">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-emerald-800 tracking-tight">
                    ₹{calculatorData.finalNetExpected.toLocaleString()}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">
                    Net target revenue for scope
                  </p>
                </div>

                {/* 6. Collection Progress Bar */}
                <div className="bg-white p-4.5 rounded-[22px] border border-slate-200/80 shadow-xs space-y-2 col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Collection Rate</span>
                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {calculatorData.collectionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, calculatorData.collectionPercentage)}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full bg-emerald-600 rounded-full"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">
                    ₹{calculatorData.totalCollected.toLocaleString()} of ₹{calculatorData.finalNetExpected.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* STUDENT BREAKDOWN TABLE */}
              <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-xs overflow-hidden p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Student Calculation Breakdown ({calculatorData.items.length})
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    Scope: {calcClassId === 'all' ? 'All Classes' : filteredClasses.find(c => c.id === calcClassId)?.className}
                  </span>
                </div>

                {calculatorData.items.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-slate-400">
                    No active students found in selected class/batch filters.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 space-y-2">
                    {calculatorData.items.map(({ student, originalFee, discountAmount, finalFee, amountPaid, dueAmount, isPaid }) => {
                      const localPhoto = getLocalStudentImageSync(student.id);
                      const photoSrc = localPhoto || student.photoUrl;

                      return (
                        <div key={student.id} className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all">
                          <div className="flex items-center gap-3">
                            {photoSrc ? (
                              <img src={photoSrc} alt={student.name} className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-10 w-10 bg-emerald-100 text-emerald-800 font-black text-xs rounded-xl flex items-center justify-center border border-emerald-200 shrink-0 select-none">
                                {student.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h4 className="text-xs font-black text-slate-900">{student.name}</h4>
                              <p className="text-[11px] font-bold text-slate-700">
                                Roll No {student.rollNumber} | Class {student.class} | {student.batch || 'Batch A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                            <div className="text-left sm:text-right space-y-0.5">
                              <div className="text-xs font-black text-slate-900">
                                Net: ₹{finalFee} <span className="text-[10px] text-slate-400 line-through">₹{originalFee}</span>
                              </div>
                              <div className="text-[10px] font-bold flex items-center gap-1 sm:justify-end">
                                {isPaid ? (
                                  <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md">Paid ✓</span>
                                ) : (
                                  <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md">Due ₹{dueAmount}</span>
                                )}
                              </div>
                            </div>

                            {!isPaid && (
                              <button
                                onClick={() => {
                                  setSelectedClassId(classes.find(c => c.className === student.class || c.id === student.class)?.id || '');
                                  setSelectedBatchId(student.batch || 'Batch A');
                                  setActiveInnerTab('payment');
                                  setIsFullScreenChatActive(true);
                                  setChatInput(student.rollNumber);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* MODULE 3: REPORTS */}
          {activeInnerTab === 'reports' && (
            <motion.div
              key="reports-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Report Selectors (Same as Attendance Selectors) */}
              <div className="space-y-4">
                {/* Compact Month & Year Selector */}
                <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-100 shadow-sm inline-flex">
                  <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-[10px] font-black uppercase text-slate-400 mr-1.5">Period:</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selMonth}
                      onChange={(e) => setSelMonth(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 cursor-pointer focus:outline-none focus:border-[#16A34A]"
                    >
                      {MONTHS_LIST.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <select
                      value={selYear}
                      onChange={(e) => setSelYear(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 cursor-pointer focus:outline-none focus:border-[#16A34A]"
                    >
                      {Array.from({ length: 7 }, (_, i) => {
                        const y = (2024 + i).toString();
                        return <option key={y} value={y}>{y}</option>;
                      })}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col space-y-3">
                  {/* Class Selection Buttons */}
                  <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-1">
                    {filteredClasses.map(cls => {
                      const isSelected = reportClassId === cls.id;
                      return (
                        <button
                          key={cls.id}
                          onClick={() => handleReportClassChange(cls.id)}
                          className={`px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-wider transition-all duration-200 border-2 whitespace-nowrap cursor-pointer shrink-0 ${
                            isSelected 
                              ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-md shadow-emerald-100' 
                              : 'bg-white border-[#16A34A] text-[#1F2937] hover:bg-emerald-50/50'
                          }`}
                        >
                          {cls.className}
                        </button>
                      );
                    })}
                  </div>

                  {/* Batch Selection Buttons */}
                  <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-1">
                    {reportBatchesList.map(batch => {
                      const isSelected = reportBatchName === batch;
                      return (
                        <button
                          key={batch}
                          onClick={() => setReportBatchName(batch)}
                          className={`px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-wider transition-all duration-200 border-2 whitespace-nowrap cursor-pointer shrink-0 ${
                            isSelected 
                              ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-md shadow-emerald-100' 
                              : 'bg-white border-[#16A34A] text-[#1F2937] hover:bg-emerald-50/50'
                          }`}
                        >
                          {batch}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Cards Grid (3 per row) */}
                <div className="grid grid-cols-3 gap-2.5 md:gap-4">
                  {[
                    { title: 'All Students', value: reportsStats.totalStudents, icon: Users, color: 'blue' },
                    { title: 'Paid Students', value: reportsStats.paidStudents, icon: CheckCircle2, color: 'emerald' },
                    { title: 'Due Students', value: reportsStats.dueStudents, icon: Clock, color: 'amber' },
                    { title: 'Total Collection', value: `₹${reportsStats.totalCollected.toLocaleString()}`, icon: Wallet, color: 'purple' },
                    { title: 'Total Due', value: `₹${reportsStats.totalDueAmount.toLocaleString()}`, icon: TrendingDown, color: 'rose' },
                    { title: 'Collection %', value: `${reportsStats.collectionPercentage}%`, icon: Percent, color: 'indigo' },
                  ].map((item, idx) => (
                    <div 
                      key={item.title}
                      className={`p-3 rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[76px] md:min-h-[84px] transition-all border ${
                        item.color === 'blue' ? 'bg-blue-50/40 border-blue-100' :
                        item.color === 'emerald' ? 'bg-emerald-50/40 border-emerald-100' :
                        item.color === 'amber' ? 'bg-amber-50/40 border-amber-100' :
                        item.color === 'purple' ? 'bg-purple-50/40 border-purple-100' :
                        item.color === 'rose' ? 'bg-rose-50/40 border-rose-100' :
                        'bg-indigo-50/40 border-indigo-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <item.icon className={`h-4 w-4 shrink-0 ${
                          item.color === 'blue' ? 'text-blue-500' :
                          item.color === 'emerald' ? 'text-emerald-500' :
                          item.color === 'amber' ? 'text-amber-500' :
                          item.color === 'purple' ? 'text-purple-500' :
                          item.color === 'rose' ? 'text-rose-500' :
                          'text-indigo-500'
                        }`} />
                        <p className="text-[10px] md:text-[11px] text-[#374151] font-bold leading-none truncate">{item.title}</p>
                      </div>
                      <div className="flex flex-col">
                        <h4 className={`text-[14px] md:text-[18px] font-black leading-none truncate ${
                          item.color === 'blue' ? 'text-blue-600' :
                          item.color === 'emerald' ? 'text-emerald-600' :
                          item.color === 'amber' ? 'text-amber-600' :
                          item.color === 'purple' ? 'text-purple-600' :
                          item.color === 'rose' ? 'text-rose-600' :
                          'text-indigo-600'
                        }`}>{item.value}</h4>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filter & Search Bar */}
                <div className="space-y-4 pt-2">
                  <div className="flex overflow-x-auto no-scrollbar gap-2.5 py-1">
                    {[
                      { id: 'all', label: 'All Students' },
                      { id: 'paid', label: 'Paid Students' },
                      { id: 'due', label: 'Due Students' },
                      { id: 'cash', label: 'Cash Only' },
                      { id: 'online', label: 'Online Only' }
                    ].map(filter => {
                      const isActive = filter.id === 'cash' || filter.id === 'online' 
                        ? reportPaymentMode === filter.id 
                        : reportPaymentStatus === filter.id;
                      
                      return (
                        <button
                          key={filter.id}
                          onClick={() => {
                            if (filter.id === 'cash' || filter.id === 'online') {
                              setReportPaymentMode(filter.id);
                              setReportPaymentStatus('all');
                            } else {
                              setReportPaymentStatus(filter.id as any);
                              setReportPaymentMode('all');
                            }
                          }}
                          className={`px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-wider transition-all duration-200 border-2 whitespace-nowrap cursor-pointer shrink-0 ${
                            isActive
                              ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-md shadow-emerald-100'
                              : 'bg-white border-[#16A34A] text-[#1F2937] hover:bg-emerald-50/50'
                          }`}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#374151]" />
                    <input
                      type="text"
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                      placeholder="Search name or roll number..."
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[12px] font-bold text-[#1F2937] focus:outline-none focus:border-[#16A34A] shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Student Cards List */}
              <div className="space-y-3 pb-4">
                {reportsData.length === 0 ? (
                  <div className="py-12">
                    <EmptyState onGoToStudents={() => onTabChange('students')} />
                  </div>
                ) : (
                  reportsData.map((item) => {
                    const s = item.student;
                    const phone = s.mobileNumber || s.phone || s.phoneNumber;
                    
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#374151] font-black text-xs border border-slate-100">
                              #{s.rollNumber.padStart(2, '0')}
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-[#111827] leading-none">{s.name}</h3>
                              <p className="text-[10px] text-[#374151] font-bold mt-1 uppercase tracking-tight">
                                {s.class} • {s.batch}
                              </p>
                            </div>
                          </div>
                          
                          {item.isPaid ? (
                            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3" />
                              <span className="text-[9px] font-black tracking-wider">Paid</span>
                            </div>
                          ) : (
                            <div className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-100 flex items-center gap-1.5">
                              <AlertCircle className="h-3 w-3" />
                              <span className="text-[9px] font-black tracking-wider">Due</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                            <p className="text-[8px] font-black text-[#374151] tracking-tight mb-0.5">Payment Details</p>
                            <div className="flex items-center gap-1.5">
                              {item.isPaid ? (
                                <>
                                  <span className="text-[10px] font-black text-[#1F2937]">{item.paymentRecord?.paymentMode || 'Cash'}</span>
                                  <span className="text-slate-300 text-[10px]">•</span>
                                  <span className="text-[10px] font-black text-[#374151]">{item.paymentRecord?.paymentDate}</span>
                                </>
                              ) : (
                                <span className="text-[10px] font-black text-rose-500 italic">Not Paid Yet</span>
                              )}
                            </div>
                          </div>
                          <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                            <p className="text-[8px] font-black text-[#374151] tracking-tight mb-0.5">Amount Status</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-emerald-700">₹{item.isPaid ? item.paymentRecord?.amountPaid : 0}</span>
                              <span className="text-slate-300 text-[10px]">/</span>
                              <span className="text-[10px] font-black text-[#374151]">₹{s.monthlyFee || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            {phone && (
                              <>
                                <a 
                                  href={`tel:${phone}`}
                                  className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                >
                                  <Phone className="h-4 w-4" />
                                </a>
                                <a 
                                  href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </a>
                              </>
                            )}
                            <button className="h-8 w-8 rounded-lg bg-slate-50 text-[#374151] flex items-center justify-center hover:bg-slate-100 transition-colors">
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {!item.isPaid ? (
                            <button 
                              onClick={() => {
                                // Pre-fill student in chat or go to payment tab
                                setChatInput(s.rollNumber);
                                setActiveInnerTab('payment');
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              Collect Fee <ChevronRight className="h-3 w-3" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-[10px] font-black">Completed</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SMS CAMPAIGN MODAL */}
      <AnimatePresence>
        {isSmsModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSmsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 animate-pulse">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">Send SMS Fee Reminders</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SMS Campaign Portal</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSmsModalOpen(false)}
                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Message Template Editor */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                    <span>Message Template</span>
                    <span className="text-[8px] text-emerald-600 normal-case font-bold">Use tags: {"{name}"}, {"{month}"}, {"{fee}"}</span>
                  </label>
                  <textarea
                    value={smsTemplate}
                    onChange={(e) => setSmsTemplate(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl outline-none font-bold text-[11px] text-slate-700 leading-relaxed transition-all shadow-inner resize-none"
                    placeholder="Enter your custom SMS template here..."
                  />
                  <div className="text-[9px] text-slate-400 font-bold flex justify-between items-center px-1">
                    <span>Character Count: {smsTemplate.length}</span>
                    <span>Approx. {Math.ceil(smsTemplate.length / 160)} SMS Part(s)</span>
                  </div>
                </div>

                {/* Target Students Checklist */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                    <span>Target Students ({smsSelectedStudentIds.size})</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = reportsData
                          .filter(item => !item.isPaid)
                          .map(item => item.student.id);
                        if (smsSelectedStudentIds.size === allSelected.length) {
                          setSmsSelectedStudentIds(new Set());
                        } else {
                          setSmsSelectedStudentIds(new Set(allSelected));
                        }
                      }}
                      className="text-[9px] text-rose-500 hover:underline normal-case font-black border-none bg-transparent cursor-pointer"
                    >
                      {smsSelectedStudentIds.size === reportsData.filter(item => !item.isPaid).length ? 'Deselect All' : 'Select All'}
                    </button>
                  </label>
                  
                  <div className="border border-slate-100 rounded-2xl max-h-40 overflow-y-auto divide-y divide-slate-50 bg-slate-50/20">
                    {reportsData
                      .filter(item => !item.isPaid)
                      .map((item) => {
                        const s = item.student;
                        const isChecked = smsSelectedStudentIds.has(s.id);
                        const displayPhone = s.mobileNumber || s.phone || s.phoneNumber || 'No phone number';
                        return (
                          <label
                            key={s.id}
                            className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-[11px]"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const updated = new Set(smsSelectedStudentIds);
                                  if (isChecked) {
                                    updated.delete(s.id);
                                  } else {
                                    updated.add(s.id);
                                  }
                                  setSmsSelectedStudentIds(updated);
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                              />
                              <div>
                                <span className="font-extrabold text-slate-800">{s.name}</span>
                                <span className="text-[9px] text-slate-400 font-bold ml-1.5">#{s.rollNumber} • {s.class}</span>
                              </div>
                            </div>
                            <span className="font-mono text-slate-500 font-bold text-[10px] bg-white border px-2 py-0.5 rounded-lg shadow-2xs">
                              {displayPhone}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSmsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendBulkSms}
                  disabled={isSendingSms || smsSelectedStudentIds.size === 0}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5 border-none"
                >
                  {isSendingSms ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Reminders ({smsSelectedStudentIds.size})</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
