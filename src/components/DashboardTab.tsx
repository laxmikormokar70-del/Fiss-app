import { UserCircle, Wallet, CalendarCheck, BarChart3, MoreHorizontal, TrendingDown } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, Payment, TeacherProfile, Attendance } from '../types';
import DynamicText from './DynamicText';
import { getLocalStudentImageSync } from '../utils/localImageStore';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  TrendingUp, 
  DollarSign, 
  CalendarDays,
  Sparkles,
  School,
  Search,
  Bell,
  BookOpen,
  Layers,
  Activity,
  UserPlus,
  CheckSquare,
  ClipboardCheck,
  QrCode,
  ClipboardList,
  FileText,
  Megaphone,
  IdCard,
  Settings,
  ChevronRight,
  ArrowRight,
  Trash2,
  X,
  Check,
  Calendar,
  Clock,
  Lock,
  User,
  LogOut,
  Sparkle,
  GraduationCap,
  CreditCard,
  Loader2,
  MessageCircle,
  MessageSquare
} from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { IDCardModule } from './IDCardModule';
import { ExportPDFModule } from './ExportPDFModule';
import { SendNoticeModule } from './SendNoticeModule';
import { ManualAttendanceModule } from './ManualAttendanceModule';
import { BulkSMSModule } from './BulkSMSModule';
import CreateClassPage from './CreateClassPage';

interface DashboardTabProps {
  students: Student[];
  payments: Payment[];
  attendance?: Attendance[];
  teacherProfile: TeacherProfile | null;
  classes: any[];
  onTabChange: (tab: string) => void;
  onSelectStudent: (studentId: string) => void;
  onTriggerAuth: (mode: 'login' | 'register' | 'resubmit') => void;
  onDeleteClass?: (classId: string) => Promise<void>;
  onSaveClassState?: (savedClass: any, customClasses?: string[], customBatches?: string[]) => void;
  triggerNotification?: (message: string, type?: 'success' | 'error') => void;
  onInitiateQuickPay?: (studentId: string, className: string, batchName: string, rollNumber: string) => void;
  initialView?: 'dashboard' | 'create-class' | 'edit-class';
  initialEditingClassId?: string | null;
  onViewChange?: (view: 'dashboard' | 'create-class' | 'edit-class') => void;
  onEditingClassIdChange?: (id: string | null) => void;
}

const CLASSES_LIST = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
];

const BATCH_SUGGESTIONS = [
  'Morning Batch', 'Day Batch', 'Evening Batch', 'Night Batch', 'Friday Special', 'Weekend Batch'
];

const CircularProgress = ({ value, label, color }: { value: number, label: string, color: string }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black text-slate-800">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
};

export default function DashboardTab({ 
  students, 
  payments, 
  attendance = [],
  teacherProfile, 
  classes: createdClasses,
  onTabChange, 
  onSelectStudent,
  onTriggerAuth,
  onDeleteClass,
  onSaveClassState,
  triggerNotification,
  onInitiateQuickPay,
  initialView,
  initialEditingClassId,
  onViewChange,
  onEditingClassIdChange
}: DashboardTabProps) {
  const isLoggedIn = !!teacherProfile;
  const activeStudents = useMemo(() => students.filter(s => s.status === 'Active'), [students]);

  // Welcome state for new teachers (0 students)
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newBatchName, setNewBatchName] = useState('');

  // Class Management states
  const [currentView, setCurrentView] = useState<'dashboard' | 'create-class' | 'edit-class'>('dashboard');
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Sync with outer initial state
  useEffect(() => {
    if (initialView !== undefined) {
      setCurrentView(initialView);
    }
  }, [initialView]);

  useEffect(() => {
    if (initialEditingClassId !== undefined) {
      setEditingClassId(initialEditingClassId);
    }
  }, [initialEditingClassId]);

  const updateCurrentView = (view: 'dashboard' | 'create-class' | 'edit-class') => {
    setCurrentView(view);
    if (onViewChange) onViewChange(view);
  };

  const updateEditingClassId = (id: string | null) => {
    setEditingClassId(id);
    if (onEditingClassIdChange) onEditingClassIdChange(id);
  };
  
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeBatchName, setActiveBatchName] = useState<string | null>(null);

  // Custom delete confirmation modal state
  const [showDeleteClassConfirm, setShowDeleteClassConfirm] = useState(false);

  // Set default selected class
  useEffect(() => {
    if (createdClasses.length > 0 && !activeClassId) {
      setActiveClassId(createdClasses[0].id);
      setSelectedClass(createdClasses[0].className);
    }
  }, [createdClasses, activeClassId]);

  // UI state for search & notices
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const isRestricted = teacherProfile?.approvalStatus !== 'approved';

  const handleRestrictedAction = (action: () => void) => {
    if (isRestricted) {
      setShowApprovalDialog(true);
    } else {
      action();
    }
  };

  // Quick Action Modules state
  const [showIDCardModule, setShowIDCardModule] = useState(false);
  const [showExportPDFModule, setShowExportPDFModule] = useState(false);
  const [showSendNoticeModule, setShowSendNoticeModule] = useState(false);
  const [showManualAttendanceModule, setShowManualAttendanceModule] = useState(false);
  const [showBulkSMSModule, setShowBulkSMSModule] = useState(false);

  // Dynamic filter selections (Google Classroom / Material Design 3 style)
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [showFabMenu, setShowFabMenu] = useState<boolean>(false);

  // Class & batch suggestions state
  const classSuggestions = useMemo(() => {
    if (!newClassName) return CLASSES_LIST;
    return CLASSES_LIST.filter(c => c.toLowerCase().includes(newClassName.toLowerCase()));
  }, [newClassName]);

  const batchSuggestions = useMemo(() => {
    const defaultSuggestions = BATCH_SUGGESTIONS;
    if (!newClassName) return defaultSuggestions;
    const prefix = newClassName.trim();
    const contextual = [
      `${prefix} Morning`,
      `${prefix} Evening`,
      `${prefix} Batch`,
      ...defaultSuggestions
    ];
    if (!newBatchName) return contextual;
    return contextual.filter(b => b.toLowerCase().includes(newBatchName.toLowerCase()));
  }, [newClassName, newBatchName]);

  // Current billing month configuration
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  // AUTOMATED UNPAID FEES LOGIC
  const unpaidStudents = useMemo(() => {
    return activeStudents.filter(student => {
      const payment = payments.find(p => p.studentId === student.id && p.month === currentMonthStr);
      return !payment || payment.status === 'Unpaid' || payment.status === 'Partial';
    });
  }, [activeStudents, payments, currentMonthStr]);

  // Filter students dynamically based on class & batch choices
  const filteredStudents = useMemo(() => {
    let result = activeStudents;
    if (selectedClass !== 'All') {
      result = result.filter(s => s.class === selectedClass);
    }
    if (selectedBatch !== 'All') {
      result = result.filter(s => s.batch === selectedBatch);
    }
    return result;
  }, [activeStudents, selectedClass, selectedBatch]);

  // Reset batch filter if selected class changes
  useEffect(() => {
    setSelectedBatch('All');
  }, [selectedClass]);

  // Set default selected batch when active class changes
  useEffect(() => {
    if (activeClassId) {
      const selectedClassObj = createdClasses.find(c => c.id === activeClassId);
      if (selectedClassObj && selectedClassObj.batches && selectedClassObj.batches.length > 0) {
        setActiveBatchName(selectedClassObj.batches[0].name);
        setSelectedBatch(selectedClassObj.batches[0].name);
      } else {
        setActiveBatchName(null);
        setSelectedBatch('All');
      }
    }
  }, [activeClassId, createdClasses]);

  // NEW: Batch Statistics Calculation for the interactive "Your Classes" section
  const batchStats = useMemo(() => {
    if (!activeClassId || !activeBatchName) return null;
    
    const selectedClassObj = createdClasses.find(c => c.id === activeClassId);
    if (!selectedClassObj) return null;
    
    const batchStudents = activeStudents.filter(s => 
      s.class === selectedClassObj.className && s.batch === activeBatchName
    );
    
    if (batchStudents.length === 0) {
      return {
        totalStudents: 0,
        boys: 0,
        girls: 0,
        paidCount: 0,
        dueCount: 0,
        totalPaid: 0,
        totalDue: 0,
        attendanceRate: 0,
        feeCollectionRate: 0
      };
    }
    
    const boys = batchStudents.filter(s => s.gender === 'Boy').length;
    const girls = batchStudents.length - boys;
    
    let totalPaid = 0;
    let totalDue = 0;
    let paidCount = 0;
    let dueCount = 0;
    
    batchStudents.forEach(s => {
      const payment = payments.find(p => p.studentId === s.id && p.month === currentMonthStr);
      if (payment) {
        totalPaid += payment.amountPaid || 0;
        totalDue += payment.dueAmount || 0;
        if (payment.status === 'Paid') paidCount++;
        else dueCount++;
      } else {
        totalDue += s.monthlyFee || 0;
        dueCount++;
      }
    });
    
    // Attendance Calculation
    let totalPossible = 0;
    let totalPresent = 0;
    attendance.forEach(record => {
      batchStudents.forEach(s => {
        if (record.attendanceMarks[s.id]) {
          totalPossible++;
          if (record.attendanceMarks[s.id] === 'present') totalPresent++;
        }
      });
    });
    const attendanceRate = totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0;
    const feeCollectionRate = (totalPaid + totalDue) > 0 ? (totalPaid / (totalPaid + totalDue)) * 100 : 0;
    
    return {
      totalStudents: batchStudents.length,
      boys,
      girls,
      paidCount,
      dueCount,
      totalPaid,
      totalDue,
      attendanceRate,
      feeCollectionRate
    };
  }, [activeClassId, activeBatchName, createdClasses, activeStudents, payments, attendance, currentMonthStr]);

  // Statistics Calculation over filtered list
  const stats = useMemo(() => {
    const totalStudents = filteredStudents.length;

    // Deterministic Boy/Girl fallback if not assigned
    const boysCount = filteredStudents.filter(s => {
      if (s.gender) return s.gender === 'Boy';
      return (s.name.charCodeAt(0) + s.name.length) % 2 === 0;
    }).length;
    const girlsCount = totalStudents - boysCount;

    // Financial totals
    let paidSum = 0;
    let dueSum = 0;
    let paidStudentsCount = 0;
    let dueStudentsCount = 0;

    filteredStudents.forEach(student => {
      const payment = payments.find(p => p.studentId === student.id && p.month === currentMonthStr);
      if (payment) {
        paidSum += payment.amountPaid || 0;
        dueSum += payment.dueAmount || 0;
        if (payment.status === 'Paid') {
          paidStudentsCount++;
        } else if (payment.status === 'Partial') {
          paidStudentsCount++;
          dueStudentsCount++;
        } else {
          dueStudentsCount++;
        }
      } else {
        dueSum += student.monthlyFee || 0;
        dueStudentsCount++;
      }
    });

    return {
      totalStudents,
      boysCount,
      girlsCount,
      paidSum,
      dueSum,
      paidStudentsCount,
      dueStudentsCount,
      overallProfit: paidSum,
      overallLoss: dueSum
    };
  }, [filteredStudents, payments, currentMonthStr]);

  // Dynamic notification generation with the automated unpaid system
  const notificationsList = useMemo(() => {
    const list = [
      { id: 'n-sys-1', title: 'Portal Activated', body: 'Workspace fully synchronized with secure storage rules.', time: 'Just now', type: 'system' }
    ];
    if (unpaidStudents.length > 0) {
      list.unshift({
        id: 'n-unpaid-alert',
        title: 'Pending Fees Alert',
        body: `${unpaidStudents.length} students have unpaid/due fees for ${currentMonthName}. View summary to send reminders.`,
        time: 'Active Alert',
        type: 'warning'
      });
    }
    return list;
  }, [unpaidStudents, currentMonthName]);

  // Quick summary numbers
  const classes = useMemo(() => {
    const profileClasses = teacherProfile?.customClasses || [];
    const studentClasses = Array.from(new Set(students.map(s => s.class).filter(Boolean)));
    return Array.from(new Set([...profileClasses, ...studentClasses]));
  }, [teacherProfile, students]);

  const batches = useMemo(() => {
    const profileBatches = teacherProfile?.customBatches || [];
    const studentBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)));
    return Array.from(new Set([...profileBatches, ...studentBatches]));
  }, [teacherProfile, students]);

  const latestBatch = useMemo(() => {
    if (batches.length === 0) return 'None';
    return batches[batches.length - 1];
  }, [batches]);

  const recentlyAddedStudent = useMemo(() => {
    if (activeStudents.length === 0) return 'None';
    const sorted = [...activeStudents].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    return sorted[0].name;
  }, [activeStudents]);

  const lastUpdatedTime = useMemo(() => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }, []);

  // DYNAMIC RECHARTS GENERATION FROM DATABASE
  const studentGrowthTrend = useMemo(() => {
    const months: Record<string, number> = {};
    activeStudents.forEach(s => {
      const dateStr = s.admissionDate || s.createdAt;
      if (!dateStr) return;
      const m = dateStr.slice(0, 7); // "YYYY-MM"
      months[m] = (months[m] || 0) + 1;
    });
    const sortedMonths = Object.keys(months).sort();
    let cumulative = 0;
    return sortedMonths.map(month => {
      cumulative += months[month];
      const d = new Date(month + "-02");
      const name = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      return { name, 'Enrolled': cumulative };
    });
  }, [activeStudents]);

  const monthlyFeeCollection = useMemo(() => {
    const monthSums: Record<string, number> = {};
    payments.forEach(p => {
      if (!p.month) return;
      monthSums[p.month] = (monthSums[p.month] || 0) + (p.amountPaid || 0);
    });
    const sortedMonths = Object.keys(monthSums).sort();
    return sortedMonths.map(month => {
      const d = new Date(month + "-02");
      const name = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      return { name, 'Collected': monthSums[month] };
    });
  }, [payments]);

  const feePaidVsDue = useMemo(() => {
    return [
      { name: 'Paid', value: stats.paidSum },
      { name: 'Due', value: stats.dueSum }
    ];
  }, [stats]);

  const classWiseDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    activeStudents.forEach(s => {
      if (!s.class) return;
      counts[s.class] = (counts[s.class] || 0) + 1;
    });
    return Object.keys(counts).map(cls => ({ name: cls, 'Students': counts[cls] }));
  }, [activeStudents]);

  const batchWiseDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    activeStudents.forEach(s => {
      if (!s.batch) return;
      counts[s.batch] = (counts[s.batch] || 0) + 1;
    });
    return Object.keys(counts).map(b => ({ name: b, 'Students': counts[b] }));
  }, [activeStudents]);

  const monthlyAdmissions = useMemo(() => {
    const counts: Record<string, number> = {};
    activeStudents.forEach(s => {
      const dateStr = s.admissionDate || s.createdAt;
      if (!dateStr) return;
      const m = dateStr.slice(0, 7);
      counts[m] = (counts[m] || 0) + 1;
    });
    const sortedMonths = Object.keys(counts).sort();
    return sortedMonths.map(month => {
      const d = new Date(month + "-02");
      const name = d.toLocaleString('en-US', { month: 'short' });
      return { name, 'Admissions': counts[month] };
    });
  }, [activeStudents]);

  const attendanceTrend = useMemo(() => {
    if (!attendance || attendance.length === 0) return [];
    const sorted = [...attendance].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map(record => {
      const marks = Object.values(record.attendanceMarks);
      if (marks.length === 0) return { name: record.date, 'Attendance Rate': 100 };
      const presentCount = marks.filter(m => m === 'present').length;
      const rate = Math.round((presentCount / marks.length) * 100);
      const d = new Date(record.date);
      const name = d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      return { name, 'Attendance Rate': rate };
    });
  }, [attendance]);

  // Check if any real analytics data exists (no fake data!)
  const hasAnalyticsData = useMemo(() => {
    return activeStudents.length > 0;
  }, [activeStudents]);

  // DYNAMIC ACTIVITIES GENERATION
  const studentActivities = useMemo(() => {
    return [...activeStudents]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3)
      .map(s => ({
        id: `add-${s.id}`,
        type: 'student_added',
        title: 'New Student Admitted',
        description: `${s.name} was successfully enrolled into ${s.class} (${s.batch || 'Morning'}).`,
        time: s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
        rawTime: s.createdAt ? new Date(s.createdAt).getTime() : 0
      }));
  }, [activeStudents]);

  // let's write correct sorting for paymentActivities
  const sortedPaymentActivities = useMemo(() => {
    return [...payments]
      .sort((a, b) => {
        const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3)
      .map(p => ({
        id: `pay-${p.id}`,
        type: 'fee_collected',
        title: 'Fee Payment Received',
        description: `Received ₹${p.amountPaid} from ${p.studentName} for the month of ${p.month}.`,
        time: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
        rawTime: p.paymentDate ? new Date(p.paymentDate).getTime() : 0
      }));
  }, [payments]);

  const attendanceActivities = useMemo(() => {
    return [...attendance]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .map(a => {
        const marks = Object.values(a.attendanceMarks);
        const presentCount = marks.filter(m => m === 'present').length;
        const absentCount = marks.length - presentCount;
        return {
          id: `att-${a.id}`,
          type: 'attendance_recorded',
          title: 'Daily Attendance Confirmed',
          description: `Roll call completed for date ${a.date} (${presentCount} Present, ${absentCount} Absent).`,
          time: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rawTime: new Date(a.date).getTime()
        };
      });
  }, [attendance]);

  const recentActivities = useMemo(() => {
    const all = [...studentActivities, ...sortedPaymentActivities, ...attendanceActivities];
    return all.sort((a, b) => b.rawTime - a.rawTime).slice(0, 5);
  }, [studentActivities, sortedPaymentActivities, attendanceActivities]);

  // Search filter
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery) return [];
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.includes(searchQuery) ||
      (s.class && s.class.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, students]);

  // Form submit handler
  const handleCreateClassBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newBatchName) return;
    try {
      if (teacherProfile) {
        const teacherRef = doc(db, 'users', teacherProfile.uid);
        const classesList = teacherProfile.customClasses || [];
        const batchesList = teacherProfile.customBatches || [];
        const updatedClasses = Array.from(new Set([...classesList, newClassName]));
        const updatedBatches = Array.from(new Set([...batchesList, newBatchName]));
        await updateDoc(teacherRef, {
          customClasses: updatedClasses,
          customBatches: updatedBatches
        });
      }
      setShowCreateClassModal(false);
      setNewClassName('');
      setNewBatchName('');
    } catch (err) {
      console.warn('Error saving class preference', err);
      setShowCreateClassModal(false);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '🌅 Good Morning';
    if (hour >= 12 && hour < 17) return '☀️ Good Afternoon';
    if (hour >= 17 && hour < 21) return '🌇 Good Evening';
    return '🌙 Good Night';
  }, []);

  const todaysClasses = useMemo(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const parseTime = (timeStr: string) => {
      if (!timeStr) return 0;
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const classesForToday: any[] = [];
    createdClasses.forEach(cls => {
        cls.batches?.forEach((batch: any) => {
            batch.schedules?.forEach((sched: any) => {
                const isToday = sched.daysType === 'all' || sched.selectedDays?.includes(weekday);
                if (isToday) {
                    const startMins = parseTime(sched.startTime);
                    const endMins = parseTime(sched.endTime);
                    let status = 'Upcoming';
                    if (nowMins >= startMins && nowMins <= endMins) status = 'Ongoing';
                    else if (nowMins > endMins) status = 'Completed';
                    
                    const studentCount = activeStudents.filter(s => s.class === cls.className && s.batch === batch.name).length;

                    classesForToday.push({
                        className: cls.className,
                        batchName: batch.name,
                        startTime: sched.startTime,
                        endTime: sched.endTime,
                        totalStudents: studentCount,
                        status,
                        startMins
                    });
                }
            });
        });
    });
    return classesForToday.sort((a, b) => a.startMins - b.startMins);
  }, [createdClasses, activeStudents]);

  const classesList = useMemo(() => {
    const defaultClasses = ['All', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
    const profileClasses = teacherProfile?.customClasses || [];
    return Array.from(new Set([...defaultClasses, ...profileClasses]));
  }, [teacherProfile]);

  const studentsInClass = useMemo(() => {
    if (selectedClass === 'All') return activeStudents;
    return activeStudents.filter(s => s.class === selectedClass);
  }, [activeStudents, selectedClass]);

  const classBatches = useMemo(() => {
    const studentBatches = Array.from(new Set(studentsInClass.map(s => s.batch).filter(Boolean)));
    const profileBatches = teacherProfile?.customBatches || [];
    const all = Array.from(new Set([...studentBatches, ...profileBatches]));
    return all;
  }, [studentsInClass, teacherProfile]);

  const getBatchDetails = (batchName: string) => {
    // Look up in custom created classes list for active schedule times
    for (const cls of createdClasses) {
      const b = cls.batches?.find((bt: any) => bt.name === batchName);
      if (b && b.schedules && b.schedules.length > 0) {
        const sched = b.schedules[0];
        const days = sched.daysType === 'all' ? 'Daily' : sched.selectedDays?.join(', ');
        return { 
          time: `${sched.startTime} - ${sched.endTime}`, 
          schedule: days || 'Custom'
        };
      }
    }

    const nameLower = batchName.toLowerCase();
    if (nameLower.includes('morning')) {
      return { time: '08:00 AM - 10:00 AM', schedule: 'Mon, Wed, Fri' };
    } else if (nameLower.includes('evening') || nameLower.includes('day')) {
      return { time: '04:00 PM - 06:00 PM', schedule: 'Daily (Mon-Sat)' };
    } else if (nameLower.includes('weekend') || nameLower.includes('crash')) {
      return { time: '10:00 AM - 01:00 PM', schedule: 'Sat, Sun' };
    } else if (nameLower.includes('night')) {
      return { time: '07:00 PM - 08:30 PM', schedule: 'Mon to Thu' };
    }
    return { time: '11:00 AM - 12:30 PM', schedule: 'Mon, Tue, Wed' };
  };

  const getBatchStudentCount = (batchName: string) => {
    return studentsInClass.filter(s => s.batch === batchName).length;
  };

  const summaryStudents = useMemo(() => {
    let result = activeStudents;
    if (selectedClass !== 'All') {
      result = result.filter(s => s.class === selectedClass);
    }
    if (selectedBatch !== 'All') {
      result = result.filter(s => s.batch === selectedBatch);
    }
    return result;
  }, [activeStudents, selectedClass, selectedBatch]);

  const summaryPaidCount = useMemo(() => {
    return summaryStudents.filter(student => {
      const payment = payments.find(p => p.studentId === student.id && p.month === currentMonthStr);
      return payment && payment.status === 'Paid';
    }).length;
  }, [summaryStudents, payments, currentMonthStr]);

  const summaryDueCount = summaryStudents.length - summaryPaidCount;

  const summaryUnpaidStudents = useMemo(() => {
    return summaryStudents.filter(student => {
      const payment = payments.find(p => p.studentId === student.id && p.month === currentMonthStr);
      return !payment || payment.status === 'Unpaid' || payment.status === 'Partial';
    });
  }, [summaryStudents, payments, currentMonthStr]);

  const getDueDetails = (student: Student) => {
    const payment = payments.find(p => p.studentId === student.id && p.month === currentMonthStr);
    if (payment) {
      return {
        amount: payment.dueAmount || 0,
        status: 'Partial'
      };
    }
    return {
      amount: student.monthlyFee || 0,
      status: 'Unpaid'
    };
  };

  const last5StudentsAdded = useMemo(() => {
    const sorted = [...summaryStudents].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    return sorted.slice(0, 5);
  }, [summaryStudents]);

  const top5PerformingStudents = useMemo(() => {
    const studentsWithMetrics = summaryStudents.map(student => {
      const studentAttendanceRecords = attendance.filter(record => {
        const mark = record.attendanceMarks?.[student.id];
        return mark === 'present' || mark === 'absent';
      });
      const presents = studentAttendanceRecords.filter(r => r.attendanceMarks?.[student.id] === 'present').length;
      const totalAttendanceCount = studentAttendanceRecords.length;
      const attendanceRate = totalAttendanceCount > 0 
        ? Math.round((presents / totalAttendanceCount) * 100) 
        : 0;

      const payment = payments.find(p => p.studentId === student.id && p.month === currentMonthStr);
      const isPaid = payment?.status === 'Paid';
      const dueAmount = payment ? (payment.dueAmount || 0) : student.monthlyFee;

      return {
        student,
        attendanceRate,
        isPaid,
        dueAmount,
        presents,
        totalAttendanceCount
      };
    });

    // Show students with good attendance (>= 60% or highest attendance rate)
    const withAttendance = studentsWithMetrics.filter(s => s.totalAttendanceCount > 0);
    const poolToUse = withAttendance.length > 0 ? withAttendance : studentsWithMetrics;

    const sorted = [...poolToUse].sort((a, b) => {
      // 1. Highest Attendance %
      if (b.attendanceRate !== a.attendanceRate) {
        return b.attendanceRate - a.attendanceRate;
      }
      // 2. Total presents
      if (b.presents !== a.presents) {
        return b.presents - a.presents;
      }
      // 3. Fees Paid
      if (b.isPaid !== a.isPaid) {
        return b.isPaid ? 1 : -1;
      }
      return 0;
    });

    return sorted.slice(0, 5);
  }, [summaryStudents, attendance, payments, currentMonthStr]);

  const pendingFeeStudents = useMemo(() => {
    return summaryStudents.map(student => {
      const payment = payments.find(p => p.studentId === student.id && p.month === currentMonthStr);
      const dueAmount = payment ? (payment.dueAmount || 0) : student.monthlyFee;
      return {
        student,
        dueAmount
      };
    }).filter(item => item.dueAmount > 0);
  }, [summaryStudents, payments, currentMonthStr]);

  const handleWhatsAppAppreciation = (student: Student, attendanceRate: number) => {
    const phone = student.mobileNumber || student.phone || student.phoneNumber || '';
    if (!phone) {
      if (triggerNotification) {
        triggerNotification('Student mobile number is missing.', 'error');
      } else {
        alert('Student mobile number is missing.');
      }
      return;
    }
    const cleanMobile = phone.replace(/\D/g, '');
    const instituteName = teacherProfile?.schoolName || 'Coaching Center';
    const message = `Hello ${student.name},

Excellent work!
Your attendance is outstanding and your fee payments are always on time.

Keep maintaining this excellent performance.
We are proud of your consistency.

— ${instituteName}`;

    const url = `https://wa.me/${cleanMobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppReminder = (student: Student, dueAmount: number) => {
    const phone = student.mobileNumber || student.phone || student.phoneNumber || '';
    if (!phone) {
      if (triggerNotification) {
        triggerNotification('Student mobile number is missing.', 'error');
      } else {
        alert('Student mobile number is missing.');
      }
      return;
    }
    const cleanMobile = phone.replace(/\D/g, '');
    const instituteName = teacherProfile?.schoolName || 'Coaching Center';
    
    const message = `Hello ${student.name},

This is a reminder that your fee for ${currentMonthName} is still pending.

Amount Due: ₹${dueAmount}

Please complete the payment as soon as possible.
Thank you.

— ${instituteName}`;

    const url = `https://wa.me/${cleanMobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (currentView === 'create-class' || currentView === 'edit-class') {
    const editingData = currentView === 'edit-class' 
      ? createdClasses.find(c => c.id === editingClassId) 
      : undefined;

    return (
      <CreateClassPage
        teacherProfile={teacherProfile}
        onBack={() => {
          updateCurrentView('dashboard');
          updateEditingClassId(null);
        }}
        onSaveComplete={(savedClass, customClasses, customBatches) => {
          if (onSaveClassState) {
            onSaveClassState(savedClass, customClasses, customBatches);
          }
          updateCurrentView('dashboard');
          updateEditingClassId(null);
        }}
        editingClassData={editingData}
        triggerNotification={triggerNotification}
      />
    );
  }

  return (
    <div className="bg-[#F8FAFC] font-sans text-[#111827] flex flex-col h-screen relative w-full min-w-0 overflow-hidden selection:bg-emerald-100">
      
      {/* 2. SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-none">
        
        {/* 1. TOP APP BAR (SCROLLABLE) */}
        <div className="relative z-30 bg-gradient-to-r from-[#16A34A] to-[#15803D] px-5 py-4 flex items-center justify-between shadow-lg shrink-0 border-none">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-md text-white rounded-[14px] flex items-center justify-center shadow-sm shrink-0 border border-white/30">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-[17px] md:text-[19px] font-extrabold text-white tracking-tight leading-tight line-clamp-1">
                {teacherProfile?.schoolName || 'EduManager Portal'}
              </h1>
              <span className="text-[9px] text-emerald-100 font-mono flex items-center gap-1 font-black uppercase tracking-widest mt-1 leading-none">
                <Sparkles className="h-3 w-3 text-emerald-300 animate-pulse" /> coaching erp
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Status Badge */}
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider mr-2 ${
                  teacherProfile?.approvalStatus === 'approved'
                    ? 'bg-white/10 border-white/20 text-white'
                    : teacherProfile?.approvalStatus === 'rejected'
                      ? 'bg-red-500/20 border-red-500/30 text-white'
                      : 'bg-amber-500/20 border-amber-500/30 text-white'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    teacherProfile?.approvalStatus === 'approved' ? 'bg-white animate-pulse' : teacherProfile?.approvalStatus === 'rejected' ? 'bg-red-300' : 'bg-amber-300 animate-pulse'
                  }`} />
                  {teacherProfile?.approvalStatus || 'Pending'}
                </div>

                <button 
                  onClick={() => setShowNotificationDrawer(true)}
                  className="relative p-2.5 text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-colors"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-2 right-2 h-4 w-4 bg-red-500 rounded-full border-2 border-[#16A34A] flex items-center justify-center text-[8px] font-extrabold text-white">
                    3
                  </span>
                </button>
                <button 
                  onClick={() => onTabChange('profile')}
                  className="h-9 w-9 rounded-full bg-slate-50 overflow-hidden border border-slate-100 shadow-sm relative shrink-0 cursor-pointer active:scale-95 transition-transform"
                >
                  {teacherProfile?.profilePhoto || teacherProfile?.logoUrl ? (
                    <img 
                      src={teacherProfile.profilePhoto || teacherProfile.logoUrl} 
                      alt="Profile" 
                      className="h-full w-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <img 
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80" 
                      alt="Profile" 
                      className="h-full w-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-1.5 border-white"></div>
                </button>
              </>
            ) : (
              <button
                onClick={() => onTriggerAuth('login')}
                className="px-4 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* COMBINED HEADER & WELCOME SECTION */}
        <div className={`relative bg-white rounded-b-[32px] px-5 pt-2 ${isLoggedIn && createdClasses.length === 0 ? 'pb-8' : 'pb-5'} shrink-0 shadow-sm w-full max-w-full overflow-hidden mt-2`}>
          {/* Decorative background image overlay */}
          {teacherProfile?.bannerPhoto && (
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
              <img 
                src={teacherProfile.bannerPhoto} 
                alt="Banner Background" 
                className="absolute inset-0 w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Welcome Section */}
          {isLoggedIn ? (
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-900 mb-0">Welcome Back,</p>
                <h2 className="text-[24px] sm:text-[28px] font-black text-slate-900 leading-tight mb-1 flex items-center gap-2">
                  <span className="truncate">{teacherProfile?.name || 'Authorized Teacher'}</span>
                  <span className="text-[18px] sm:text-[22px] shrink-0">👋</span>
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-[13px] font-bold text-emerald-600 flex items-center gap-1">
                    {greeting} ☀️
                  </p>
                  <span className="text-[10px] font-black text-slate-300">|</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    teacherProfile?.approvalStatus === 'approved' ? 'text-emerald-500' : teacherProfile?.approvalStatus === 'rejected' ? 'text-red-500' : 'text-amber-500'
                  }`}>
                    {teacherProfile?.approvalStatus || 'Pending'}
                  </span>
                </div>

                {createdClasses.length === 0 && (
                  <button
                    onClick={() => handleRestrictedAction(() => setShowCreateClassModal(true))}
                    className="bg-[#00A859] hover:bg-[#008F4C] text-white px-5 py-2 rounded-xl font-bold text-[13px] flex items-center gap-1.5 transition-all hover:scale-[0.98] active:scale-95 shadow-lg shadow-emerald-100"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create First Class
                  </button>
                )}
              </div>
              
              {/* School Illustration */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 relative flex items-center justify-center">
                <img 
                  src="/src/assets/images/school_illustration_1784197454693.jpg" 
                  alt="School Illustration" 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                     (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/2602/2602414.png';
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="relative z-10 pb-6">
              <h2 className="text-[22px] font-black text-slate-900 leading-tight mb-2">
                Manage your coaching<br/>with EduManager AI
              </h2>
              <p className="text-slate-800 text-[13px] mb-5 font-medium">
                The complete ERP solution for modern institutes.
              </p>
              <button
                onClick={() => onTriggerAuth('register')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-[13px] flex items-center gap-2 shadow-lg shadow-emerald-50"
              >
                Get Started for Free
              </button>
            </div>
          )}
        </div>

        <div className={`w-full max-w-7xl mx-auto px-4 pt-4 pb-32 sm:pb-24 space-y-5 transition-all duration-500 ${!isLoggedIn ? 'blur-md pointer-events-none' : ''}`}>
          {isLoggedIn && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  {teacherProfile?.approvalStatus === 'approved' ? (
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0 border border-emerald-100">
                      <span className="text-xl">🟢</span>
                    </div>
                  ) : teacherProfile?.approvalStatus === 'rejected' ? (
                    <div className="h-10 w-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center shrink-0 border border-red-100">
                      <span className="text-xl">🔴</span>
                    </div>
                  ) : (
                    <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0 border border-amber-100">
                      <span className="text-xl animate-pulse">🟡</span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {teacherProfile?.approvalStatus === 'approved' ? (
                        <span>Approved</span>
                      ) : teacherProfile?.approvalStatus === 'rejected' ? (
                        <span>Rejected</span>
                      ) : (
                        <span>Pending Verification</span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      {teacherProfile?.approvalStatus === 'approved' ? (
                        <span>Your workspace is fully verified and active.</span>
                      ) : teacherProfile?.approvalStatus === 'rejected' ? (
                        <span>Your KYC application was rejected by the administrator.</span>
                      ) : (
                        <span>We are reviewing your profile. Verification usually takes less than 24 hours.</span>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Right side status pill */}
                <div className="shrink-0">
                  {teacherProfile?.approvalStatus === 'approved' ? (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 shadow-2xs">Active</span>
                  ) : teacherProfile?.approvalStatus === 'rejected' ? (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-100 shadow-2xs">Action Required</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100 animate-pulse shadow-2xs">Processing</span>
                  )}
                </div>
              </div>

              {/* If Rejected, show rejection reason & Update Details button */}
              {teacherProfile?.approvalStatus === 'rejected' && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="p-4 bg-red-50/60 border border-red-100/50 rounded-2xl">
                    <p className="text-[10px] font-black text-red-800 uppercase tracking-wider leading-none mb-1.5">Reason for Rejection:</p>
                    <p className="text-xs font-semibold text-red-700 leading-relaxed">
                      {teacherProfile?.rejectionReason || "Please verify your uploaded documents and submit valid coaching credentials."}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!teacherProfile?.uid) return;
                      try {
                        const docRef1 = doc(db, 'users', teacherProfile.uid);
                        const docRef2 = doc(db, 'users', teacherProfile.uid);
                        await updateDoc(docRef1, { isProfileComplete: false, profileCompleted: false });
                        await updateDoc(docRef2, { isProfileComplete: false, profileCompleted: false });
                        if (triggerNotification) {
                          triggerNotification("Please update and resubmit your profile details.", "success");
                        }
                      } catch (err: any) {
                        console.error("Error setting profile state for update:", err);
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer border-none outline-none"
                  >
                    <span>Update Details</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {isLoggedIn && (
            <div className="space-y-4">
              {/* A. OVERVIEW CARDS (MATERIAL DESIGN 3 GRID) */}
              <div className="space-y-3 transition-all">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">Overview</h3>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full border border-emerald-100/50">
                    Monthly Summary
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { title: 'Students', value: stats.totalStudents, icon: Users, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                    { title: 'Boys', value: stats.boysCount, icon: User, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                    { title: 'Girls', value: stats.girlsCount, icon: UserCircle, bg: 'bg-rose-50', text: 'text-rose-600' },
                    { title: 'Paid List', value: stats.paidStudentsCount, icon: CheckCircle2, bg: 'bg-indigo-50', text: 'text-indigo-600' },
                    { title: 'Due List', value: stats.dueStudentsCount, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600' },
                    { title: 'Paid $', value: `$${stats.paidSum}`, icon: Wallet, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                    { title: 'Due $', value: `$${stats.dueSum}`, icon: Wallet, bg: 'bg-rose-50', text: 'text-rose-600' },
                    { title: 'Profit', value: `$${stats.overallProfit}`, icon: TrendingUp, bg: 'bg-emerald-100', text: 'text-emerald-700', subtitle: 'Net' },
                    { title: 'Loss', value: `$${stats.overallLoss}`, icon: TrendingDown, bg: 'bg-rose-100', text: 'text-rose-700', subtitle: 'Miss' },
                  ].map((item, idx) => (
                    <motion.div 
                      key={item.title}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.02, duration: 0.3 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleRestrictedAction(() => {})}
                      className={`bg-white p-2.5 rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col justify-between min-h-[72px] relative overflow-hidden active:bg-slate-50 transition-colors ${isRestricted ? 'cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`h-6 w-6 ${item.bg} rounded-full flex items-center justify-center shrink-0`}>
                          <item.icon className={`h-3.5 w-3.5 ${item.text}`} />
                        </div>
                        <p className="text-[10px] text-slate-900 font-bold leading-none truncate">{item.title}</p>
                      </div>
                      <div className="flex flex-col pl-0.5 w-full overflow-hidden">
                        <DynamicText value={item.value?.toString() || ''} className="text-[16px] font-black text-slate-900 leading-none" />
                        {item.subtitle && (
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter mt-1">{item.subtitle}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* QUICK ACTIONS SECTION (Material Design 3 - Premium Grid) */}
              <div className="space-y-4 pt-2 transition-all">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[17px] font-black text-slate-800 tracking-tight">Quick Actions</h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">Premium</span>
                </div>
                
                <div className="grid grid-cols-4 gap-y-5 gap-x-1 px-0.5">
                  {[
                    { id: 'student', title: 'Add Student', icon: UserPlus, text: 'text-emerald-600', action: () => { onTabChange('students'); setTimeout(() => { const btn = document.getElementById('add-student-toggle-btn'); if(btn) btn.click(); }, 100); } },
                    { id: 'class', title: 'Create Class', icon: Users, text: 'text-emerald-600', action: () => updateCurrentView('create-class') },
                    { id: 'attendance', title: 'Attendance', icon: ClipboardCheck, text: 'text-emerald-600', action: () => onTabChange('attendance') },
                    { id: 'fees', title: 'Fees', icon: Wallet, text: 'text-emerald-600', action: () => onTabChange('fee-management') },
                    { id: 'sms', title: 'SMS', icon: MessageSquare, text: 'text-emerald-600', action: () => setShowBulkSMSModule(true) },
                    { id: 'settings', title: 'Settings', icon: Settings, text: 'text-emerald-600', action: () => onTabChange('settings') },
                    { id: 'export', title: 'Export PDF', icon: FileText, text: 'text-emerald-600', action: () => setShowExportPDFModule(true) },
                    { id: 'notice', title: 'Send Notice', icon: Megaphone, text: 'text-emerald-600', action: () => setShowSendNoticeModule(true) },
                  ].map((btn, idx) => (
                    <motion.button 
                      key={btn.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleRestrictedAction(btn.action)}
                      className="flex flex-col items-center justify-start gap-2 bg-transparent p-0 transition-all border-none outline-none group w-full"
                    >
                      <div className="h-14 w-14 bg-white flex items-center justify-center rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-50 transition-all group-active:shadow-inner group-active:bg-slate-50/50">
                        <btn.icon className={`h-7 w-7 ${btn.text}`} strokeWidth={1.5} />
                      </div>
                      <span className="text-[10px] xs:text-[10.5px] sm:text-xs font-semibold text-slate-700 tracking-tight leading-none text-center whitespace-nowrap w-full block overflow-hidden text-ellipsis px-0.5">{btn.title}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* YOUR CLASSES SECTION */}
              <div className="space-y-4 pt-4 transition-all">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[17px] font-black text-slate-800 tracking-tight">Your Classes</h3>
                  {createdClasses.length > 0 && (
                    <button 
                      onClick={() => handleRestrictedAction(() => updateCurrentView('create-class'))}
                      className="text-[12px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-transparent border-none outline-none cursor-pointer"
                    >
                      ➕ Add Class
                    </button>
                  )}
                </div>
                
                {createdClasses.length === 0 ? (
                  <div className="bg-white rounded-[18px] p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-slate-50/50 flex flex-col items-center justify-center text-center space-y-4.5 py-8">
                    {/* Beautiful Empty State Vector Illustration */}
                    <div className="h-28 w-28 bg-emerald-50/40 rounded-full flex items-center justify-center text-[44px] animate-pulse">
                      🏫
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[16px] font-black text-slate-900 leading-none">No Classes Created Yet</h4>
                      <p className="text-[12px] text-slate-400 font-bold leading-normal">Get started by setting up your school's class schedules</p>
                    </div>
                    <button 
                      onClick={() => handleRestrictedAction(() => updateCurrentView('create-class'))}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full text-[13px] font-black flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-100"
                    >
                      ➕ Create First Class
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Horizontal Class Cards */}
                    <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-none snap-x touch-pan-x px-1">
                      {createdClasses.map((cls) => (
                        <motion.div
                          key={cls.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRestrictedAction(() => {
                            const newId = cls.id === activeClassId ? null : cls.id;
                            setActiveClassId(newId);
                            setSelectedClass(newId ? cls.className : 'All');
                          })}
                          className={`min-w-[140px] snap-start p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-3 ${
                            activeClassId === cls.id 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' 
                              : 'bg-white border-slate-100 text-slate-800 shadow-sm hover:shadow-md'
                          }`}
                        >
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${activeClassId === cls.id ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-black truncate w-full text-center">{cls.className}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Batch List and Stats */}
                    <AnimatePresence mode="wait">
                      {activeClassId && (
                        <motion.div
                          key={`batches-container-${activeClassId}`}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="space-y-6"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                              <h4 className="text-[14px] font-black text-slate-800">Active Batches</h4>
                              <div className="flex items-center gap-2">
                                {activeClassId && (
                                  <button
                                    onClick={() => handleRestrictedAction(() => {
                                      updateEditingClassId(activeClassId);
                                      updateCurrentView('edit-class');
                                    })}
                                    className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-[10px] font-black uppercase cursor-pointer"
                                  >
                                    <Clock className="h-3 w-3" />
                                    Edit Class
                                  </button>
                                )}
                                {onDeleteClass && activeClassId && (
                                  <button
                                    onClick={() => {
                                      setShowDeleteClassConfirm(true);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-[10px] font-black uppercase cursor-pointer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete Class
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x touch-pan-x px-1">
                              {createdClasses.find(c => c.id === activeClassId)?.batches?.map((batch: any) => {
                                const count = students.filter(s => s.class === createdClasses.find(c => c.id === activeClassId)?.className && s.batch === batch.name).length;
                                return (
                                  <motion.div
                                    key={batch.name}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleRestrictedAction(() => {
                                      const newBatch = activeBatchName === batch.name ? null : batch.name;
                                      setActiveBatchName(newBatch);
                                      setSelectedBatch(newBatch || 'All');
                                    })}
                                    className={`min-w-[120px] snap-start p-3 rounded-xl border transition-all cursor-pointer ${
                                      activeBatchName === batch.name
                                        ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                                        : 'bg-white border-slate-100 hover:border-emerald-200'
                                    }`}
                                  >
                                    <p className="text-xs font-black text-slate-900 truncate">{batch.name}</p>
                                    <p className="text-[10px] font-bold text-slate-500 mt-1">{count} Students</p>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Batch Statistics */}
                          <AnimatePresence mode="wait">
                            {activeBatchName && batchStats && (
                              <motion.div
                                key={`stats-${activeBatchName}`}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6"
                              >
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                                  {[
                                    { label: 'Total Students', value: batchStats.totalStudents, icon: Users, color: 'bg-emerald-50 text-[#16A34A]' },
                                    { label: 'Total Boys', value: batchStats.boys, icon: User, color: 'bg-emerald-50 text-[#16A34A]' },
                                    { label: 'Total Girls', value: batchStats.girls, icon: User, color: 'bg-rose-50 text-rose-600' },
                                    { label: 'Paid Students', value: batchStats.paidCount, icon: CheckCircle2, color: 'bg-emerald-50 text-[#16A34A]' },
                                    { label: 'Due Students', value: batchStats.dueCount, icon: Clock, color: 'bg-amber-50 text-amber-600' },
                                    { label: 'Total Paid', value: `₹${batchStats.totalPaid}`, icon: Wallet, color: 'bg-emerald-50 text-[#16A34A]' },
                                    { label: 'Total Due', value: `₹${batchStats.totalDue}`, icon: Wallet, color: 'bg-rose-50 text-rose-600' },
                                  ].map((stat) => (
                                    <div key={stat.label} className="space-y-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <div className={`h-6 w-6 ${stat.color} rounded-full flex items-center justify-center`}>
                                          <stat.icon className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{stat.label}</span>
                                      </div>
                                      <p className="text-[16px] font-black text-[#111111] pl-7">{stat.value}</p>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex justify-around pt-6 border-t border-slate-50">
                                  <CircularProgress 
                                    value={batchStats.attendanceRate} 
                                    label="Attendance" 
                                    color="text-emerald-500" 
                                  />
                                  <CircularProgress 
                                    value={batchStats.feeCollectionRate} 
                                    label="Fee Collect" 
                                    color="text-emerald-500" 
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>


              {/* PENDING PAYMENTS ALERT CARD */}
              {unpaidStudents.length > 0 && (
                <div className="pt-4 transition-all">
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-between shadow-[0_2px_12px_rgba(220,38,38,0.06)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-red-100 rounded-full blur-3xl opacity-50 -translate-y-10 translate-x-10 pointer-events-none"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="h-11 w-11 bg-white text-red-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-red-50">
                        <AlertCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-black text-red-950 leading-tight flex items-center gap-1.5">
                          {unpaidStudents.length} Pending {unpaidStudents.length === 1 ? 'Payment' : 'Payments'}
                        </h4>
                        <p className="text-[11px] font-bold text-red-700/80 mt-0.5 uppercase tracking-wider">For {currentMonthName}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRestrictedAction(() => onTabChange('fees'))}
                      className="relative z-10 bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2 rounded-xl text-[12px] font-black transition-all shadow-md shadow-red-200"
                    >
                      Collect Now
                    </button>
                  </div>
                </div>
              )}


              <div className="h-2"></div>
            </div>
          )}

          {/* E. TODAY'S SUMMARY SECTION (MD3 CARD COMPONENT) */}
          {isLoggedIn && (
            <div className="space-y-3 px-4">
              <h3 className="text-sm font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
                Today's Summary
              </h3>

              {/* TODAY'S CLASSES DASHBOARD */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[17px] font-black text-slate-800 tracking-tight">Today's Classes</h3>
                </div>

                {/* Today Overview Summary Card */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Total', count: todaysClasses.length, color: 'bg-slate-100 text-slate-900' },
                    { label: 'Upcoming', count: todaysClasses.filter(c => c.status === 'Upcoming').length, color: 'bg-amber-100 text-amber-900' },
                    { label: 'Ongoing', count: todaysClasses.filter(c => c.status === 'Ongoing').length, color: 'bg-emerald-100 text-emerald-900' },
                    { label: 'Completed', count: todaysClasses.filter(c => c.status === 'Completed').length, color: 'bg-emerald-100 text-emerald-900' },
                  ].map(item => (
                    <div key={item.label} className={`rounded-2xl p-3 text-center ${item.color}`}>
                      <div className="text-[18px] font-black">{item.count}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider">{item.label}</div>
                    </div>
                  ))}
                </div>

                {todaysClasses.length === 0 ? (
                  <div className="bg-white rounded-[24px] p-6 border border-slate-100 text-center space-y-2">
                    <div className="text-[40px]">📅</div>
                    <h4 className="text-[14px] font-black text-slate-900">No Classes Scheduled Today</h4>
                    <p className="text-[12px] text-slate-500 font-bold">Enjoy your day!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysClasses.map((cls, idx) => (
                      <div key={idx} className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                          cls.status === 'Upcoming' ? 'bg-amber-50 text-amber-500' :
                          cls.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-500' :
                          'bg-emerald-50 text-emerald-500'
                        }`}>
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14px] font-black text-slate-900 truncate">{cls.className}</h4>
                          <p className="text-[12px] font-bold text-slate-500 truncate">{cls.batchName}</p>
                          <p className="text-[11px] font-semibold text-slate-400">{cls.startTime} - {cls.endTime}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                            cls.status === 'Upcoming' ? 'bg-amber-100 text-amber-700' :
                            cls.status === 'Ongoing' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {cls.status}
                          </div>
                          <p className="text-[11px] font-bold text-slate-600 mt-1">{cls.totalStudents} Students</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ⭐ TOP PERFORMING STUDENTS */}
          {isLoggedIn && (
            <div className="space-y-3 px-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#111827] tracking-tight flex items-center gap-1.5">
                  <span className="text-amber-500 text-base">⭐</span>
                  Top Performing Students
                </h3>
                <button
                  onClick={() => onTabChange('students')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-white rounded-[22px] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] overflow-hidden">
                {top5PerformingStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 font-medium">
                    No students with top attendance records found yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {top5PerformingStudents.map(({ student, attendanceRate }) => {
                      const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      const clsDisplay = student.class?.toLowerCase().startsWith('class') ? student.class : `Class ${student.class}`;
                      return (
                        <div 
                          key={student.id} 
                          className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {student.photoUrl ? (
                              <img 
                                src={student.photoUrl} 
                                alt={student.name} 
                                className="h-10 w-10 rounded-full object-cover border border-slate-200"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs border border-emerald-200/60 select-none">
                                {initials}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-bold text-slate-900">{student.name}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-slate-500 font-medium">
                                <span>Roll No: {student.rollNumber}</span>
                                <span>&bull;</span>
                                <span>{clsDisplay} ({student.batch || 'General'})</span>
                                <span>&bull;</span>
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-xs">
                                  Attendance: {attendanceRate}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleWhatsAppAppreciation(student, attendanceRate)}
                            className="p-2 sm:px-3 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 rounded-lg transition-all border border-emerald-200/60 flex items-center gap-1.5 font-bold text-xs cursor-pointer shadow-xs"
                            title="Send Appreciation message to WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span className="hidden sm:inline">Appreciate</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

              {/* PENDING FEE COLLECTION SECTION */}
              {isLoggedIn && (
                <div className="space-y-3 px-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                        <Wallet className="h-4.5 w-4.5" />
                      </div>
                      Pending Fee Collection
                    </h3>
                    <button
                      onClick={() => onTabChange('fee-management')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-emerald-200/60"
                    >
                      View All
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="bg-white rounded-[24px] border border-slate-150 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden p-2">
                    {pendingFeeStudents.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 font-semibold bg-emerald-50/50 rounded-2xl border border-emerald-100/60">
                        🎉 All active students in this scope have completed their payments for {currentMonthName}!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pendingFeeStudents.map(({ student, dueAmount }) => {
                          const clsDisplay = student.class?.toLowerCase().startsWith('class') ? student.class : `Class ${student.class}`;
                          const batchDisplay = student.batch || 'Batch A';
                          const localPhoto = getLocalStudentImageSync(student.id);
                          const photoSrc = localPhoto || student.photoUrl;

                          return (
                            <div 
                              key={student.id} 
                              className="p-3.5 sm:p-4 bg-slate-50/60 hover:bg-emerald-50/30 rounded-2xl border border-slate-100/80 transition-all flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {photoSrc ? (
                                  <img 
                                    src={photoSrc} 
                                    alt={student.name} 
                                    className="h-11 w-11 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="h-11 w-11 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-black text-sm border border-emerald-200/80 shrink-0 select-none">
                                    {student.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}

                                <div className="min-w-0 space-y-1">
                                  <h4 className="text-sm font-black text-slate-900 truncate tracking-tight group-hover:text-emerald-700 transition-colors">
                                    {student.name}
                                  </h4>
                                  <p className="text-xs font-bold text-slate-800 truncate leading-none">
                                    Roll No {student.rollNumber} | {clsDisplay} | {batchDisplay}
                                  </p>
                                  <p className="text-xs font-black text-rose-600 flex items-center gap-1">
                                    <span>Due ₹{dueAmount}</span>
                                    <span className="text-slate-400 font-normal">| {currentMonthName}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleWhatsAppReminder(student, dueAmount)}
                                  className="p-2.5 bg-white hover:bg-emerald-100/80 text-emerald-700 rounded-xl transition-all border border-slate-200 cursor-pointer shadow-2xs"
                                  title="Send WhatsApp Reminder"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (onInitiateQuickPay) {
                                      onInitiateQuickPay(student.id, student.class, student.batch || 'Batch A', student.rollNumber);
                                    } else if (onSelectStudent) {
                                      onSelectStudent(student.id);
                                    }
                                  }}
                                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-200/80 cursor-pointer flex items-center gap-1"
                                >
                                  Pay
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

          {/* F. ANALYTICS (Charts display dynamically only when data exists) */}
          {isLoggedIn && (
            <div className="px-4 space-y-4">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Analytical Insights</h3>
              
              {!hasAnalyticsData ? (
                // Professional empty state illustration
                <div className="bg-white p-12 rounded-[22px] border border-gray-200 text-center shadow-xs max-w-lg mx-auto">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <h3 className="text-[#111827] font-bold text-sm">No analytics available yet</h3>
                  <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
                    Data will appear automatically after adding students and attendance records.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* 1. Student Growth Trend */}
                  <div className="bg-white p-5 rounded-[22px] border border-[#E5E7EB] shadow-xs space-y-3.5">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#111827]">Cumulative Student Enrollment</h4>
                      <p className="text-[11px] text-gray-400">Total active student growth curve by admission month</p>
                    </div>
                    <div className="h-48 w-full">
                      {studentGrowthTrend.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-gray-400 font-semibold uppercase tracking-wider">No Enrollment Data</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={studentGrowthTrend} margin={{ top: 5, right: 15, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '11px' }} />
                            <Line type="monotone" dataKey="Enrolled" stroke="#16A34A" strokeWidth={2.5} activeDot={{ r: 5 }} dot={{ strokeWidth: 1.5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* 2. Monthly Fee Collection */}
                  <div className="bg-white p-5 rounded-[22px] border border-[#E5E7EB] shadow-xs space-y-3.5">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#111827]">Monthly Fee Collection</h4>
                      <p className="text-[11px] text-gray-400">Aggregate school-wide fee payments sum by period</p>
                    </div>
                    <div className="h-48 w-full">
                      {monthlyFeeCollection.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-gray-400 font-semibold uppercase tracking-wider">No Collection Data Yet</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyFeeCollection} margin={{ top: 5, right: 15, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '11px' }} />
                            <Bar dataKey="Collected" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* 3. Fee Paid vs Due (Current Month) */}
                  <div className="bg-white p-5 rounded-[22px] border border-[#E5E7EB] shadow-xs space-y-3.5">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#111827]">Fee Paid vs Due (Current Month)</h4>
                      <p className="text-[11px] text-gray-400">Comparing total collected vs total remaining amount</p>
                    </div>
                    <div className="h-48 w-full flex items-center justify-center">
                      {stats.paidSum === 0 && stats.dueSum === 0 ? (
                        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">No Financial Data</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={feePaidVsDue}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              <Cell fill="#10B981" />
                              <Cell fill="#EF4444" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* 4. Class-wise Student Distribution */}
                  <div className="bg-white p-5 rounded-[22px] border border-[#E5E7EB] shadow-xs space-y-3.5">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#111827]">Class-wise Distribution</h4>
                      <p className="text-[11px] text-gray-400">Total active scholastic students grouped by Class</p>
                    </div>
                    <div className="h-48 w-full">
                      {classWiseDistribution.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-gray-400 font-semibold uppercase tracking-wider">No Class-wise Data</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={classWiseDistribution} margin={{ top: 5, right: 15, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="Students" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* 5. Batch-wise Student Distribution */}
                  <div className="bg-white p-5 rounded-[22px] border border-[#E5E7EB] shadow-xs space-y-3.5">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#111827]">Batch-wise Student Distribution</h4>
                      <p className="text-[11px] text-gray-400">Total active students grouped by class batches</p>
                    </div>
                    <div className="h-48 w-full">
                      {batchWiseDistribution.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-gray-400 font-semibold uppercase tracking-wider">No Batch-wise Data</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={batchWiseDistribution} margin={{ top: 5, right: 15, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="Students" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* 6. Monthly Admissions */}
                  <div className="bg-white p-5 rounded-[22px] border border-[#E5E7EB] shadow-xs space-y-3.5">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#111827]">Admissions by Month</h4>
                      <p className="text-[11px] text-gray-400">Admitted student counts per monthly timeframe</p>
                    </div>
                    <div className="h-48 w-full">
                      {monthlyAdmissions.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-gray-400 font-semibold uppercase tracking-wider">No Monthly Data</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyAdmissions} margin={{ top: 5, right: 15, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="Admissions" fill="#EC4899" radius={[6, 6, 0, 0]} maxBarSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* 7. Attendance Trend (only when attendance data exists) */}
                  {attendanceTrend.length > 0 && (
                    <div className="bg-white p-5 rounded-[22px] border border-[#E5E7EB] shadow-xs col-span-1 md:col-span-2 space-y-3.5">
                      <div>
                        <h4 className="text-[14px] font-bold text-[#111827]">Roll Call Attendance Trend</h4>
                        <p className="text-[11px] text-gray-400">Class stability percentage recorded over daily sessions</p>
                      </div>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={attendanceTrend} margin={{ top: 5, right: 15, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="dbTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="Attendance Rate" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#dbTrendGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* G. RECENT ACTIVITIES SECTION (Dynamic newest first) */}
          {isLoggedIn && (
            <div className="px-4 space-y-3">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Recent Activities</h3>
              
              <div className="bg-white p-5 rounded-[22px] border border-[#E5E7EB] shadow-xs space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400 font-medium">
                    No recent activities recorded yet. Admitting students, collecting fees or taking attendance will trigger real-time actions here.
                  </div>
                ) : (
                  <div className="space-y-4 pt-1 border-l border-dashed border-gray-150 pl-4 ml-2.5">
                    {recentActivities.map(activity => (
                      <div key={activity.id} className="relative">
                        <div className={`absolute -left-[21.5px] top-1 h-3 w-3 rounded-full border-2 border-white ring-2 ${
                          activity.type === 'student_added' 
                            ? 'bg-sky-500 ring-sky-100' 
                            : activity.type === 'fee_collected' 
                            ? 'bg-emerald-500 ring-emerald-100' 
                            : 'bg-[#16A34A] ring-emerald-100'
                        }`}></div>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h5 className="text-xs font-bold text-[#111827]">{activity.title}</h5>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">{activity.description}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium shrink-0">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}


        </div>
      </div>
      {/* ================================== MODALS & DRAWERS ================================== */}

      {/* 1. CREATE CLASS & BATCH MODAL */}
      <AnimatePresence>
        {showCreateClassModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h3 className="text-[16px] font-bold text-[#111827] flex items-center gap-1.5">
                  <PlusCircle className="h-5 w-5 text-[#16A34A]" /> Create Class & Batch
                </h3>
                <button 
                  onClick={() => setShowCreateClassModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClassBatch} className="space-y-4">
                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Class Name</label>
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g. Class 10"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] font-semibold"
                  />
                  {newClassName && classSuggestions.length > 0 && classSuggestions[0] !== newClassName && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-150 rounded-xl max-h-32 overflow-y-auto z-50 shadow-lg p-1.5 space-y-1">
                      {classSuggestions.map(cls => (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setNewClassName(cls)}
                          className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer"
                        >
                          {cls}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Batch Name</label>
                  <input
                    type="text"
                    required
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    placeholder="e.g. Morning Batch"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] font-semibold"
                  />
                  {newBatchName !== batchSuggestions[0] && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-150 rounded-xl max-h-32 overflow-y-auto z-50 shadow-lg p-1.5 space-y-1">
                      {batchSuggestions.slice(0, 5).map(batch => (
                        <button
                          key={batch}
                          type="button"
                          onClick={() => setNewBatchName(batch)}
                          className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer"
                        >
                          {batch}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateClassModal(false)}
                    className="py-2.5 px-4 border border-[#E5E7EB] hover:bg-gray-50 text-gray-500 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-4 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm"
                  >
                    Add Standard
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. SEARCH MODAL OVERLAY */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h3 className="text-[16px] font-bold text-[#111827]">Search Database</h3>
                <button 
                  onClick={() => {
                    setShowSearchModal(false);
                    setSearchQuery('');
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter student name, class or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchQuery ? (
                  filteredSearchResults.length === 0 ? (
                    <div className="py-8 text-center text-[12px] text-gray-400">No matching records found.</div>
                  ) : (
                    filteredSearchResults.map(student => (
                      <button
                        key={student.id}
                        onClick={() => {
                          setShowSearchModal(false);
                          setSearchQuery('');
                          onSelectStudent(student.id);
                          onTabChange('students');
                        }}
                        className="w-full p-3 hover:bg-gray-50 border border-gray-100 rounded-xl text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <h4 className="text-[13px] font-bold text-[#111827] group-hover:text-[#16A34A] transition-colors">{student.name}</h4>
                          <p className="text-[11px] text-gray-400">Class {student.class} &bull; Roll {student.rollNumber}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#16A34A]" />
                      </button>
                    ))
                  )
                ) : (
                  <div className="py-6 text-center text-[11px] text-gray-400 font-medium">Type to query the live coaching records.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. NOTIFICATION DRAWER OVERLAY (WITH AUTOMATED UNPAID STUDENTS REMINDERS) */}
      <AnimatePresence>
        {showNotificationDrawer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between"
            >
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-[#16A34A]" />
                    <h3 className="text-[16px] font-bold text-[#111827]">Notification Panel</h3>
                  </div>
                  <button 
                    onClick={() => setShowNotificationDrawer(false)}
                    className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3.5">
                  {/* Automated alert banner */}
                  {unpaidStudents.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                        <AlertCircle className="h-4.5 w-4.5" />
                        <span>Month Unpaid Fee Reminders ({unpaidStudents.length})</span>
                      </h4>
                      <p className="text-[11px] text-red-600 leading-normal">
                        Select a student to log payment or send reminder notifications directly:
                      </p>
                      
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {unpaidStudents.map(student => (
                          <div 
                            key={student.id} 
                            className="bg-white border border-red-100 hover:border-red-300 p-2.5 rounded-xl flex items-center justify-between text-[11px] text-gray-700 transition-colors"
                          >
                            <div>
                              <p className="font-bold text-[#111827]">{student.name}</p>
                              <p className="text-[9px] text-gray-400 uppercase font-semibold">Class {student.class} &bull; {student.batch}</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <p className="font-bold text-red-600">₹{student.monthlyFee}</p>
                                <p className="text-[8px] text-gray-400">Unpaid</p>
                              </div>
                              <button
                                onClick={() => {
                                  setShowNotificationDrawer(false);
                                  onSelectStudent(student.id);
                                  onTabChange('fees');
                                }}
                                className="px-2 py-1 bg-emerald-600 text-white font-bold text-[9px] rounded hover:bg-emerald-700 transition-colors cursor-pointer"
                              >
                                Pay
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General notifications list */}
                  {notificationsList.filter(n => n.id !== 'n-unpaid-alert').map(n => (
                    <div key={n.id} className="p-3 bg-slate-50 border border-gray-150 rounded-xl">
                      <h4 className="text-[12px] font-bold text-[#111827]">{n.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                      <span className="text-[10px] text-gray-400 block mt-1.5">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowNotificationDrawer(false)}
                className="w-full py-3 bg-[#16A34A] text-white hover:bg-[#15803d] font-bold text-xs rounded-xl transition-colors cursor-pointer text-center mt-4"
              >
                Close Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* QUICK ACTION MODULES (MODALS) */}
      <IDCardModule 
        isOpen={showIDCardModule} 
        onClose={() => setShowIDCardModule(false)} 
        students={students} 
        teacherProfile={teacherProfile}
      />
      <ExportPDFModule 
        isOpen={showExportPDFModule} 
        onClose={() => setShowExportPDFModule(false)} 
        students={students} 
        payments={payments} 
        attendance={attendance} 
        teacherProfile={teacherProfile}
      />
      <SendNoticeModule 
        isOpen={showSendNoticeModule} 
        onClose={() => setShowSendNoticeModule(false)} 
        students={students} 
        teacherProfile={teacherProfile}
      />
      <ManualAttendanceModule 
        isOpen={showManualAttendanceModule} 
        onClose={() => setShowManualAttendanceModule(false)} 
        students={students} 
      />
      <BulkSMSModule
        isOpen={showBulkSMSModule}
        onClose={() => setShowBulkSMSModule(false)}
        students={students}
        classes={createdClasses}
        teacherProfile={teacherProfile}
        triggerNotification={triggerNotification}
      />

      {/* Account Approval Required Dialog */}
      <AnimatePresence>
        {showApprovalDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center space-y-6">
                <div className={`h-20 w-20 mx-auto rounded-3xl flex items-center justify-center shadow-lg ${
                  teacherProfile?.approvalStatus === 'rejected' ? 'bg-red-500 text-white shadow-red-200' : 'bg-amber-500 text-white shadow-amber-200'
                }`}>
                  {teacherProfile?.approvalStatus === 'rejected' ? <X className="h-10 w-10" /> : <Loader2 className="h-10 w-10 animate-spin" />}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">
                    {teacherProfile?.approvalStatus === 'rejected' ? 'KYC Verification Rejected' : 'KYC Verification Pending'}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    {teacherProfile?.approvalStatus === 'rejected' 
                      ? 'Your KYC verification was rejected. Please update your details under the Status Card on the Home page to resubmit.'
                      : 'KYC verification is pending. Your workspace will be activated after Admin approval.'}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl flex flex-col items-center gap-1 ${
                  teacherProfile?.approvalStatus === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Current Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      teacherProfile?.approvalStatus === 'rejected' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                    }`} />
                    <span className="text-sm font-black uppercase">
                      {teacherProfile?.approvalStatus === 'rejected' ? 'Rejected' : 'Pending Approval'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowApprovalDialog(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-[13px] shadow-lg shadow-slate-200 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Check Status Card
                  </button>
                  <button
                    onClick={() => setShowApprovalDialog(false)}
                    className="w-full py-3 bg-white text-slate-400 font-bold rounded-2xl text-[13px] active:scale-[0.98] transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteClassConfirm && (
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
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Delete Class</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    Are you sure you want to delete <strong>"{createdClasses.find(c => c.id === activeClassId)?.className}"</strong>?<br />
                    All students and their records in this class will be permanently removed. This action cannot be undone.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={async () => {
                      if (activeClassId && onDeleteClass) {
                        try {
                          await onDeleteClass(activeClassId);
                          setActiveClassId(null);
                          setActiveBatchName(null);
                        } catch (err) {
                          console.error(err);
                        }
                      }
                      setShowDeleteClassConfirm(false);
                    }}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-[13px] shadow-lg shadow-red-100 dark:shadow-none active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Delete Permanently
                  </button>
                  <button
                    onClick={() => setShowDeleteClassConfirm(false)}
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
