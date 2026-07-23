import React, { useState, useMemo, useEffect } from 'react';
import { Student, Payment, TeacherProfile, Attendance } from '../types';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  Filter,
  Users,
  Search,
  MessageCircle,
  Phone,
  ChevronLeft,
  ArrowRight,
  Download,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Percent,
  Wallet,
  Coins,
  Clock,
  Sparkles,
  Share2,
  Printer,
  FileText,
  Info,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

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

interface ReportsTabProps {
  students: Student[];
  payments: Payment[];
  attendance?: Attendance[];
  teacherProfile?: TeacherProfile | null;
  classes?: any[];
}

export default function ReportsTab({ 
  students, 
  payments, 
  attendance = [], 
  teacherProfile, 
  classes = [] 
}: ReportsTabProps) {
  
  // Dynamic Initializers (Auto-load)
  const availableClasses = useMemo(() => {
    if (classes && classes.length > 0) {
      return classes.map(c => c.className);
    }
    return Array.from(new Set(students.map(s => s.class)));
  }, [classes, students]);

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  
  // Date and filter options
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [reportMonth, setReportMonth] = useState<string>(new Date().toISOString().slice(5, 7));
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear().toString());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [reportFilter, setReportFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Good' | 'Medium' | 'Low'>('All');
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);

  // Compute calculated target date
  const selectedMonth = useMemo(() => {
    return `${reportYear}-${reportMonth}`; // "YYYY-MM"
  }, [reportMonth, reportYear]);
  
  const targetDateStr = useMemo(() => {
     return new Date().toISOString().slice(0, 10);
  }, []);

  // Derived batches from students of the selected class
  const availableBatches = useMemo(() => {
    if (!selectedClass) return [];
    const classStudents = students.filter(s => s.class === selectedClass);
    const uniqueBatches = Array.from(new Set(classStudents.map(s => s.batch || s.batchName || 'Default Batch')));
    return uniqueBatches;
  }, [selectedClass, students]);

  // Set default class and batch automatically when mounted or lists load
  useEffect(() => {
    if (availableClasses.length > 0 && !selectedClass) {
      const defaultClass = availableClasses[0];
      setSelectedClass(defaultClass);
      
      const classStudents = students.filter(s => s.class === defaultClass);
      const uniqueBatches = Array.from(new Set(classStudents.map(s => s.batch || s.batchName || 'Default Batch')));
      if (uniqueBatches.length > 0) {
        setSelectedBatch(uniqueBatches[0]);
      }
    }
  }, [availableClasses, students, selectedClass]);

  // Handle class change (automatically update to first batch)
  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    const classStudents = students.filter(s => s.class === newClass);
    const uniqueBatches = Array.from(new Set(classStudents.map(s => s.batch || s.batchName || 'Default Batch')));
    if (uniqueBatches.length > 0) {
      setSelectedBatch(uniqueBatches[0]);
    } else {
      setSelectedBatch('');
    }
  };

  // 1. FILTER STUDENTS IN CLASS & BATCH
  const activeStudents = useMemo(() => {
    return students.filter(s => 
      s.status === 'Active' && 
      (selectedClass ? s.class === selectedClass : true) &&
      (selectedBatch ? (s.batch === selectedBatch || s.batchName === selectedBatch) : true)
    );
  }, [students, selectedClass, selectedBatch]);

  // 2. COMPUTE ATTENDANCE AND FINANCE ANALYTICS FOR SELECTED STUDENTS
  const billingAndAttendanceList = useMemo(() => {
    return activeStudents.map(student => {
      // Find payments for this student and month
      const payment = payments.find(p => p.studentId === student.id && p.month === selectedMonth);
      
      // Calculate attendance rate for this student
      const studentAttendanceRecords = attendance.filter(record => {
        // Attendance taken for this student's class
        const recordDate = record.date;
        const mark = record.attendanceMarks?.[student.id];
        return mark === 'present' || mark === 'absent';
      });

      const presents = studentAttendanceRecords.filter(r => r.attendanceMarks?.[student.id] === 'present').length;
      const totalAttendanceCount = studentAttendanceRecords.length;
      const attendanceRate = totalAttendanceCount > 0 
        ? Math.round((presents / totalAttendanceCount) * 100) 
        : 100; // default to 100% if no records exist

      // Get last payment date
      let lastPayDate = '-';
      if (payment && payment.paymentDate) {
        lastPayDate = new Date(payment.paymentDate).toLocaleDateString();
      } else {
        // Find latest payment across all months
        const allStudentPayments = payments
          .filter(p => p.studentId === student.id)
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        if (allStudentPayments.length > 0) {
          lastPayDate = new Date(allStudentPayments[0].paymentDate).toLocaleDateString();
        }
      }

      if (payment) {
        return {
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          class: student.class,
          batch: student.batch || student.batchName || 'Default',
          monthlyFee: student.monthlyFee,
          amountPaid: payment.amountPaid,
          dueAmount: payment.dueAmount,
          status: payment.status,
          date: lastPayDate,
          attendanceRate,
          gender: student.gender || 'Boy',
          mobile: student.mobileNumber || student.phone || student.phoneNumber || '',
          photoUrl: student.photoUrl,
          guardianName: student.guardianName,
          totalPresents: presents,
          totalAttendanceCount
        };
      } else {
        return {
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          class: student.class,
          batch: student.batch || student.batchName || 'Default',
          monthlyFee: student.monthlyFee,
          amountPaid: 0,
          dueAmount: student.monthlyFee,
          status: 'Unpaid' as const,
          date: lastPayDate,
          attendanceRate,
          gender: student.gender || 'Boy',
          mobile: student.mobileNumber || student.phone || student.phoneNumber || '',
          photoUrl: student.photoUrl,
          guardianName: student.guardianName,
          totalPresents: presents,
          totalAttendanceCount
        };
      }
    });
  }, [activeStudents, payments, selectedMonth, attendance]);

  // 3. STATS CALCULATIONS
  const stats = useMemo(() => {
    const totalStudents = billingAndAttendanceList.length;
    const boysCount = billingAndAttendanceList.filter(s => s.gender === 'Boy').length;
    const girlsCount = billingAndAttendanceList.filter(s => s.gender === 'Girl').length;
    const unspecifiedCount = totalStudents - boysCount - girlsCount;

    // Today's attendance
    const todayRecord = attendance.find(r => r.date === targetDateStr);
    let presentToday = 0;
    let absentToday = 0;
    if (todayRecord) {
      activeStudents.forEach(s => {
        const mark = todayRecord.attendanceMarks?.[s.id];
        if (mark === 'present') presentToday++;
        else if (mark === 'absent') absentToday++;
      });
    }

    const paidStudents = billingAndAttendanceList.filter(b => b.status === 'Paid').length;
    const dueStudents = billingAndAttendanceList.filter(b => b.status !== 'Paid').length;
    const totalCollection = billingAndAttendanceList.reduce((sum, b) => sum + b.amountPaid, 0);
    const totalDueAmount = billingAndAttendanceList.reduce((sum, b) => sum + b.dueAmount, 0);
    const totalInvoiced = billingAndAttendanceList.reduce((sum, b) => sum + b.monthlyFee, 0);
    const collectionPercentage = totalInvoiced > 0 ? Math.round((totalCollection / totalInvoiced) * 100) : 0;

    // Overall class attendance rate
    const totalAttendanceRatesSum = billingAndAttendanceList.reduce((sum, s) => sum + s.attendanceRate, 0);
    const averageAttendancePercent = totalStudents > 0 
      ? Math.round(totalAttendanceRatesSum / totalStudents) 
      : 100;

    // Today's collection
    const todayCollected = payments
      .filter(p => p.paymentDate && p.paymentDate.slice(0, 10) === targetDateStr)
      .reduce((sum, p) => sum + p.amountPaid, 0);

    // This Month total collection
    const thisMonthCollected = payments
      .filter(p => p.month === selectedMonth)
      .reduce((sum, p) => sum + p.amountPaid, 0);

    // Attendance breakdown counts
    const goodAttendance = billingAndAttendanceList.filter(s => s.attendanceRate >= 90).length;
    const mediumAttendance = billingAndAttendanceList.filter(s => s.attendanceRate >= 75 && s.attendanceRate < 90).length;
    const lowAttendance = billingAndAttendanceList.filter(s => s.attendanceRate < 75).length;

    return {
      totalStudents,
      boysCount,
      girlsCount,
      unspecifiedCount,
      presentToday,
      absentToday,
      paidStudents,
      dueStudents,
      totalCollection,
      totalDueAmount,
      totalInvoiced,
      collectionPercentage,
      averageAttendancePercent,
      todayCollected,
      thisMonthCollected,
      goodAttendance,
      mediumAttendance,
      lowAttendance
    };
  }, [billingAndAttendanceList, attendance, targetDateStr, payments, activeStudents, selectedMonth]);

  // 4. FILTERED LIST FOR ROSTER
  const filteredList = useMemo(() => {
    return billingAndAttendanceList.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = (() => {
        if (reportFilter === 'All') return true;
        if (reportFilter === 'Paid') return item.status === 'Paid';
        if (reportFilter === 'Unpaid') return item.status !== 'Paid';
        if (reportFilter === 'Good') return item.attendanceRate >= 90;
        if (reportFilter === 'Medium') return item.attendanceRate >= 75 && item.attendanceRate < 90;
        if (reportFilter === 'Low') return item.attendanceRate < 75;
        return true;
      })();

      return matchesSearch && matchesFilter;
    });
  }, [billingAndAttendanceList, searchQuery, reportFilter]);

  // 5. CHART DATA GENERATION
  const boysVsGirlsData = useMemo(() => {
    return [
      { name: 'Boys', value: stats.boysCount, color: '#3B82F6' },
      { name: 'Girls', value: stats.girlsCount, color: '#EC4899' }
    ].filter(item => item.value > 0);
  }, [stats.boysCount, stats.girlsCount]);

  const paidVsDueData = useMemo(() => {
    return [
      { name: 'Collected', value: stats.totalCollection, color: '#16A34A' },
      { name: 'Pending Due', value: stats.totalDueAmount, color: '#EF4444' }
    ];
  }, [stats.totalCollection, stats.totalDueAmount]);

  // Attendance Trend (Last 7 sessions)
  const attendanceTrendData = useMemo(() => {
    // Find all attendance records for selected class/batch
    const records = [...attendance]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    if (records.length === 0) {
      return [
        { date: 'Session 1', attendanceRate: 100 },
        { date: 'Session 2', attendanceRate: 95 },
        { date: 'Session 3', attendanceRate: 100 },
        { date: 'Session 4', attendanceRate: 98 },
        { date: 'Session 5', attendanceRate: 100 }
      ];
    }

    return records.map(record => {
      let present = 0;
      let total = 0;
      activeStudents.forEach(s => {
        const mark = record.attendanceMarks?.[s.id];
        if (mark === 'present') {
          present++;
          total++;
        } else if (mark === 'absent') {
          total++;
        }
      });
      const rate = total > 0 ? Math.round((present / total) * 100) : 100;
      return {
        date: new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        attendanceRate: rate
      };
    });
  }, [attendance, activeStudents]);

  // Fee Collection Trend (Grouped payments over last 4 months)
  const feeTrendData = useMemo(() => {
    const months = ['2026-04', '2026-05', '2026-06', '2026-07'];
    return months.map(m => {
      const classPayments = payments.filter(p => p.month === m);
      const collected = classPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const totalInvoiced = classPayments.reduce((sum, p) => sum + p.amountPaid + p.dueAmount, 0);
      const label = new Date(m + "-02").toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      return {
        month: label,
        Collected: collected,
        Expected: totalInvoiced || 5000 // default mock to keep chart alive if no payments
      };
    });
  }, [payments]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Name', 'Roll Number', 'Class', 'Batch', 'Attendance Rate', 'Fee Status', 'Paid Amount', 'Due Amount', 'Last Payment Date', 'Mobile'];
    const rows = filteredList.map(item => [
      `"${item.name}"`,
      item.rollNumber,
      `"${item.class}"`,
      `"${item.batch}"`,
      `"${item.attendanceRate}%"`,
      `"${item.status}"`,
      item.amountPaid,
      item.dueAmount,
      item.date,
      `"${item.mobile}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ERP_Report_${selectedClass}_${selectedBatch}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const shareText = `Coaching ERP Summary for Class: ${selectedClass} - ${selectedBatch}\nTotal Students: ${stats.totalStudents}\nAttendance: ${stats.averageAttendancePercent}%\nTotal Collected: ₹${stats.totalCollection}\nTotal Outstanding: ₹${stats.totalDueAmount}`;
    if (navigator.share) {
      navigator.share({
        title: 'ERP Dashboard Analytics',
        text: shareText
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Dashboard summary copied to clipboard!');
    }
  };

  // WhatsApp & Call helpers
  const handleWhatsAppReminder = (student: any) => {
    if (!student.mobile) return;
    const cleanMobile = student.mobile.replace(/\D/g, '');
    const message = `Dear Parent, This is a friendly reminder that tuition fee for ${student.name} for the period ${selectedMonth} is ₹${student.dueAmount}. Please settle the due amount at your earliest convenience. Thank you.`;
    const url = `https://wa.me/${cleanMobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCall = (mobile: string) => {
    if (!mobile) return;
    window.location.href = `tel:${mobile}`;
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-24 text-[#111827]" id="report-dashboard-print-area">
      
      {/* 1. PROFESSIONAL TOP HEADER SECTION (FULL WIDTH & CURVED) */}
      <div className="bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white shadow-xl w-full shrink-0 rounded-b-[40px] relative z-20 border-none pt-5 pb-5 px-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[14px] bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-sm shrink-0">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-xl font-black tracking-tight leading-none uppercase text-white font-display whitespace-nowrap">Report Dashboard</h1>
              </div>
              <p className="text-[9px] text-emerald-100 font-bold mt-1 uppercase tracking-[0.1em] flex items-center gap-1 opacity-90">
                <Sparkles className="h-2.5 w-2.5 text-emerald-300" /> Coaching ERP
              </p>
            </div>
          </div>

          {/* Compact Month & Year Selector inside the banner */}
          <div className="flex items-center gap-2 bg-black/15 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-inner w-fit self-start sm:self-auto">
            <Calendar className="h-3.5 w-3.5 text-emerald-100" />
            <span className="text-[9px] font-black uppercase text-emerald-100">Period:</span>
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="px-2.5 py-1 bg-white/15 border border-white/20 rounded-xl text-[11px] font-black text-white cursor-pointer focus:outline-none focus:bg-white/20"
            >
              {MONTHS_LIST.map(m => (
                <option key={m.value} value={m.value} className="text-[#111827]">{m.label}</option>
              ))}
            </select>
            <select
              value={reportYear}
              onChange={(e) => setReportYear(e.target.value)}
              className="px-2.5 py-1 bg-white/15 border border-white/20 rounded-xl text-[11px] font-black text-white cursor-pointer focus:outline-none focus:bg-white/20"
            >
              {Array.from({ length: 7 }, (_, i) => {
                const y = (2024 + i).toString();
                return <option key={y} value={y} className="text-[#111827]">{y}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* PRINT BANNER ONLY */}
      <div className="hidden print:block p-6 text-center border-b-2 border-slate-900">
        <h1 className="text-2xl font-black text-[#111827]">{teacherProfile?.schoolName || 'Coaching Center ERP Report'}</h1>
        <p className="text-sm font-bold text-[#6B7280]">Class: {selectedClass} | Batch: {selectedBatch} | Date: {targetDateStr}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-6 pb-32 sm:pb-24">

        {/* 2. AUTO-LOAD CLASS & BATCH FILTER BAR (Button layout like Student page) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 print:hidden">
          {/* Class Selection Row */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#16A34A] animate-pulse" />
              <span className="text-[11px] font-black uppercase text-[#6B7280] tracking-wider">Select Target Class:</span>
            </div>
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
              {availableClasses.map(cls => {
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    onClick={() => handleClassChange(cls)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-bold shrink-0 border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-md' 
                        : 'bg-white text-[#16A34A] border-emerald-100 hover:border-[#16A34A]'
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
              {availableClasses.length === 0 && <p className="text-xs text-[#6B7280]">No classes found.</p>}
            </div>
          </div>

          {/* Batch Selection Row */}
          {availableBatches.length > 0 && (
            <div className="space-y-2 border-t border-slate-50 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase text-[#6B7280] tracking-wider">Select Batch:</span>
              </div>
              <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
                {availableBatches.map(batch => {
                  const isSelected = selectedBatch === batch;
                  return (
                    <button
                      key={batch}
                      onClick={() => setSelectedBatch(batch)}
                      className={`px-4 py-1.5 rounded-lg text-[11px] font-bold shrink-0 border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50 text-[#16A34A] border-emerald-200' 
                          : 'bg-white text-[#16A34A] border-emerald-100 hover:border-[#16A34A]'
                      }`}
                    >
                      {batch}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. EXPORT ACTIONS (Export PDF, Excel, Print, Share) with equal sizes & green theme */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm print:hidden">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-[#6B7280] pl-1.5">
            <Info className="h-4 w-4 text-[#16A34A]" />
            Reporting Actions:
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              className="min-h-[48px] flex items-center justify-center gap-2 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <Download className="h-4.5 w-4.5 shrink-0" />
              <span>Export PDF</span>
            </button>
            <button 
              onClick={handleExportCSV}
              className="min-h-[48px] flex items-center justify-center gap-2 px-4 bg-white border-2 border-[#16A34A] text-[#16A34A] hover:bg-emerald-50 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="h-4.5 w-4.5 shrink-0" />
              <span>Excel</span>
            </button>
            <button 
              onClick={handlePrint}
              className="min-h-[48px] flex items-center justify-center gap-2 px-4 bg-white border-2 border-[#16A34A] text-[#16A34A] hover:bg-emerald-50 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              <Printer className="h-4.5 w-4.5 shrink-0" />
              <span>Print</span>
            </button>
            <button 
              onClick={handleShare}
              className="min-h-[48px] flex items-center justify-center gap-2 px-4 bg-white border-2 border-[#16A34A] text-[#16A34A] hover:bg-emerald-50 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              <Share2 className="h-4.5 w-4.5 shrink-0" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* 4. DASHBOARD SUMMARY - COMPACT COLORFUL CARDS (3 Per Row) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-3 bg-[#16A34A] rounded-full" />
            <h2 className="text-xs font-black uppercase text-[#111827] tracking-wider">Dashboard summary</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2.5 md:gap-4">
            {[
              { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'blue', desc: 'Active in batch' },
              { title: 'Boys', value: stats.boysCount, icon: Users, color: 'sky', desc: 'Male students' },
              { title: 'Girls', value: stats.girlsCount, icon: Users, color: 'pink', desc: 'Female students' },
              { title: 'Present Today', value: stats.presentToday, icon: CheckCircle2, color: 'emerald', desc: `On ${targetDateStr}` },
              { title: 'Absent Today', value: stats.absentToday, icon: XCircle, color: 'rose', desc: `On ${targetDateStr}` },
              { title: 'Paid Students', value: stats.paidStudents, icon: CheckCircle2, color: 'green', desc: 'Paid current month' },
              { title: 'Due Students', value: stats.dueStudents, icon: Clock, color: 'amber', desc: 'Pending current month' },
              { title: 'Total Collection', value: `₹${stats.totalCollection.toLocaleString()}`, icon: Wallet, color: 'purple', desc: 'Current collection' },
              { title: 'Total Due Amount', value: `₹${stats.totalDueAmount.toLocaleString()}`, icon: TrendingDown, color: 'red', desc: 'Pending dues' },
              { title: 'Collection %', value: `${stats.collectionPercentage}%`, icon: Percent, color: 'indigo', desc: 'Collection rate' },
              { title: 'Attendance Rate', value: `${stats.averageAttendancePercent}%`, icon: Percent, color: 'teal', desc: 'Avg attendance' },
              { title: 'Today\'s Classes', value: selectedClass ? 1 : 0, icon: CalendarDays, color: 'violet', desc: selectedClass || 'None' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.title}
                  className="bg-white p-2.5 md:p-4 rounded-2xl md:rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between min-h-[84px] md:min-h-[100px] transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1 md:p-1.5 rounded-full flex items-center justify-center shrink-0 ${
                      item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                      item.color === 'sky' ? 'bg-sky-50 text-sky-600' :
                      item.color === 'pink' ? 'bg-pink-50 text-pink-600' :
                      item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                      item.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                      item.color === 'green' ? 'bg-emerald-50 text-emerald-600' :
                      item.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                      item.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                      item.color === 'red' ? 'bg-rose-50 text-rose-600' :
                      item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                      item.color === 'teal' ? 'bg-teal-50 text-teal-600' :
                      'bg-violet-50 text-violet-600'
                    }`}>
                      <Icon className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                    </div>
                    <p className="text-[9px] md:text-xs text-[#111827] font-bold leading-none truncate">{item.title}</p>
                  </div>
                  <div className="flex flex-col mt-1.5 md:mt-2 pl-0.5">
                    <h4 className="text-sm md:text-lg font-black text-[#111827] leading-none truncate">{item.value}</h4>
                    <span className="text-[7px] md:text-[9px] font-medium text-[#111827] mt-0.5 md:mt-1 truncate">{item.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. FINANCIAL OVERVIEW */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-3 bg-purple-500 rounded-full" />
            <h2 className="text-xs font-black uppercase text-[#111827] tracking-wider">Financial Summary</h2>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { title: 'Expected Fees', value: `₹${stats.totalInvoiced.toLocaleString()}`, color: 'text-[#111827]', labelColor: 'bg-slate-100 text-[#111827]' },
                { title: 'Collected', value: `₹${stats.totalCollection.toLocaleString()}`, color: 'text-emerald-600', labelColor: 'bg-emerald-50 text-[#111827]' },
                { title: 'Pending Dues', value: `₹${stats.totalDueAmount.toLocaleString()}`, color: 'text-rose-600', labelColor: 'bg-rose-50 text-[#111827]' },
                { title: 'Today\'s Collect', value: `₹${stats.todayCollected.toLocaleString()}`, color: 'text-blue-600', labelColor: 'bg-blue-50 text-[#111827]' },
                { title: 'This Month Collect', value: `₹${stats.thisMonthCollected.toLocaleString()}`, color: 'text-purple-600', labelColor: 'bg-purple-50 text-[#111827]' },
                { title: 'Estimated Profit', value: `₹${stats.totalCollection.toLocaleString()}`, color: 'text-teal-600', labelColor: 'bg-teal-50 text-[#111827]' },
                { title: 'Outstanding Dues', value: `₹${stats.totalDueAmount.toLocaleString()}`, color: 'text-amber-600', labelColor: 'bg-amber-50 text-[#111827]' },
                { title: 'Fee Collect Rate', value: `${stats.collectionPercentage}%`, color: 'text-indigo-600', labelColor: 'bg-indigo-50 text-[#111827]' }
              ].map((item, index) => (
                <div key={index} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100/80">
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider self-start inline-block ${item.labelColor} mb-2`}>
                    {item.title}
                  </div>
                  <p className={`text-sm md:text-base font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. ATTENDANCE ANALYTICS & CIRCULAR PROGRESS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Circular Progress + Stats Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <div className="text-center">
              <h3 className="text-xs font-black uppercase text-[#111827] tracking-wider">Attendance Rate</h3>
              <p className="text-[10px] font-black text-[#16A34A] uppercase mt-0.5">Average Performance</p>
            </div>

            {/* Circular Progress SVG */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="64" 
                  cy="64" 
                  r="52" 
                  className="stroke-slate-100 fill-none" 
                  strokeWidth="8" 
                />
                <circle 
                  cx="64" 
                  cy="64" 
                  r="52" 
                  className="stroke-[#16A34A] fill-none transition-all duration-1000" 
                  strokeWidth="8" 
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - stats.averageAttendancePercent / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-[#111827] leading-none">{stats.averageAttendancePercent}%</span>
                <span className="text-[9px] font-black text-[#111827] uppercase tracking-widest mt-1">Average</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full pt-2">
              <div className="text-center p-2 bg-emerald-50 rounded-xl">
                <p className="text-[9px] font-black text-emerald-800 uppercase tracking-wide">Good (≥90%)</p>
                <p className="text-sm font-black text-emerald-700">{stats.goodAttendance}</p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-xl">
                <p className="text-[9px] font-black text-amber-800 uppercase tracking-wide">Medium</p>
                <p className="text-sm font-black text-amber-700">{stats.mediumAttendance}</p>
              </div>
              <div className="text-center p-2 bg-rose-50 rounded-xl">
                <p className="text-[9px] font-black text-rose-800 uppercase tracking-wide">Low (&lt;75%)</p>
                <p className="text-sm font-black text-rose-700">{stats.lowAttendance}</p>
              </div>
            </div>
          </div>

          {/* Attendance Trend Line Chart */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm md:col-span-2 space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase text-[#111827] tracking-wider">Attendance trend</h3>
              <p className="text-[10px] font-black text-[#111827]">Class Attendance % over last 7 sessions</p>
            </div>
            
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748B' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  <Area type="monotone" dataKey="attendanceRate" name="Attendance Rate %" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#attendanceColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 7. CHARTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Chart A: Monthly Fee Collection vs Target */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div>
              <h3 className="text-xs font-black uppercase text-[#6B7280] tracking-wider">Fee Collection Trend</h3>
              <p className="text-[10px] font-black text-[#6B7280]">Collected vs Total Invoiced Fees</p>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Bar dataKey="Collected" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expected" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart B: Boys vs Girls & Paid vs Due Pie Charts Side-by-Side */}
          <div className="grid grid-cols-2 gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            
            {/* Boys vs Girls */}
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <h4 className="text-[10px] font-black uppercase text-[#6B7280] tracking-wider">Boys vs Girls</h4>
              <div className="h-28 w-full flex items-center justify-center">
                {boysVsGirlsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={boysVsGirlsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {boysVsGirlsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} Students`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-[10px] font-bold text-[#6B7280]">No Data</div>
                )}
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black text-[#6B7280] flex-wrap justify-center">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Boys ({stats.boysCount})</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-pink-500" />Girls ({stats.girlsCount})</span>
              </div>
            </div>

            {/* Paid vs Due Fees */}
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <h4 className="text-[10px] font-black uppercase text-[#6B7280] tracking-wider">Collection vs Due</h4>
              <div className="h-28 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paidVsDueData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paidVsDueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black text-[#6B7280] flex-wrap justify-center">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />Paid ({stats.paidStudents})</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Due ({stats.dueStudents})</span>
              </div>
            </div>

          </div>
        </div>

        {/* 8. STUDENT PERFORMANCE FILTER */}
        <div className="space-y-4 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#16A34A]" />
              <h3 className="text-xs font-black uppercase text-[#111827] tracking-wider">Student Filters</h3>
            </div>

            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name or roll..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#16A34A] shadow-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: 'All Students', value: 'All' },
              { label: 'Paid Students', value: 'Paid' },
              { label: 'Due Students', value: 'Unpaid' },
              { label: 'Good Attendance (≥90%)', value: 'Good' },
              { label: 'Medium Attendance', value: 'Medium' },
              { label: 'Low Attendance (<75%)', value: 'Low' }
            ].map((chip) => {
              const isSelected = reportFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => setReportFilter(chip.value as any)}
                  className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                    isSelected 
                      ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-sm' 
                      : 'bg-white border-slate-200 text-[#111827] hover:bg-slate-50'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 9. STUDENT ROSTER LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-[#111827] tracking-wider">Student Roster ({filteredList.length})</h3>
            <span className="text-[10px] font-bold text-[#111827]">Class: {selectedClass}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredList.map((item) => (
              <motion.div 
                layout
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  {/* Photo or Initials */}
                  {item.photoUrl ? (
                    <img 
                      src={item.photoUrl} 
                      alt={item.name} 
                      className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border text-xs font-black ${
                      item.gender === 'Boy' 
                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                        : 'bg-pink-50 text-pink-600 border-pink-100'
                    }`}>
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-[#111827] truncate leading-snug">{item.name}</h4>
                    <p className="text-[10px] font-bold text-[#6B7280]">Roll: {item.rollNumber} | {item.class}</p>
                    
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        item.status === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {item.status === 'Paid' ? 'Paid' : 'Due'}
                      </span>
                      
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        item.attendanceRate >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        item.attendanceRate >= 75 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {item.attendanceRate}% Attd
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[8px] font-black text-[#6B7280] uppercase tracking-widest block">Dues</span>
                    <span className="text-xs font-black text-[#111827]">₹{item.dueAmount}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black text-[#6B7280] uppercase tracking-widest block">Last Paid</span>
                    <span className="text-xs font-bold text-[#6B7280]">{item.date}</span>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-50 flex items-center justify-between gap-1.5 print:hidden">
                  <button
                    onClick={() => setSelectedStudentForDetails(item)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-[#6B7280] font-black text-[9px] uppercase tracking-wider rounded-xl transition-all border border-slate-200 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Info className="h-3 w-3" />
                    Details
                  </button>

                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleCall(item.mobile)}
                      className="p-2 bg-slate-50 hover:bg-emerald-50 text-[#6B7280] hover:text-emerald-600 rounded-xl transition-all cursor-pointer border border-slate-100"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleWhatsAppReminder(item)}
                      className="flex items-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#16A34A] font-black text-[9px] uppercase tracking-wider rounded-xl transition-all border border-emerald-100 cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Remind
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredList.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
                  <Search className="h-6 w-6 text-[#6B7280]" />
                </div>
                <h4 className="text-sm font-black text-[#111827]">No matching students found</h4>
                <p className="text-xs font-bold text-[#6B7280]">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 10. STUDENT DETAILS MODAL */}
      <AnimatePresence>
        {selectedStudentForDetails && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedStudentForDetails(null)}
                className="absolute right-4 top-4 text-[#6B7280] hover:text-[#111827]"
              >
                <XCircle className="h-6 w-6" />
              </button>

              <div className="flex items-center gap-3.5 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center text-lg font-black">
                  {selectedStudentForDetails.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#111827]">{selectedStudentForDetails.name}</h3>
                  <p className="text-xs font-bold text-[#6B7280]">Roll Number: {selectedStudentForDetails.rollNumber}</p>
                  <p className="text-[10px] font-black text-[#16A34A] uppercase tracking-wider mt-0.5">{selectedStudentForDetails.class} - {selectedStudentForDetails.batch}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-[#111827] uppercase tracking-widest">Student Information Dossier</h4>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-[#111827] uppercase tracking-wider">Attendance Rate</span>
                    <p className="text-sm font-black text-[#111827]">{selectedStudentForDetails.attendanceRate}%</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-[#111827] uppercase tracking-wider">Fee Status</span>
                    <p className="text-sm font-black text-[#111827]">{selectedStudentForDetails.status}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-[#111827] uppercase tracking-wider">Monthly Fee</span>
                    <p className="text-sm font-black text-[#111827]">₹{selectedStudentForDetails.monthlyFee}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-[#111827] uppercase tracking-wider">Pending Dues</span>
                    <p className="text-sm font-black text-[#111827]">₹{selectedStudentForDetails.dueAmount}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[9px] font-black text-[#111827] uppercase tracking-wider block">Guardian Name</span>
                  <p className="text-xs font-bold text-[#111827]">{selectedStudentForDetails.guardianName || 'N/A'}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[9px] font-black text-[#111827] uppercase tracking-wider block">Contact Mobile</span>
                  <p className="text-xs font-bold text-[#111827]">{selectedStudentForDetails.mobile || 'N/A'}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[9px] font-black text-[#111827] uppercase tracking-wider block">Last Payment Registered</span>
                  <p className="text-xs font-bold text-[#111827]">{selectedStudentForDetails.date}</p>
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <button 
                    onClick={() => handleCall(selectedStudentForDetails.mobile)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-[#111827] font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </button>
                  <button 
                    onClick={() => handleWhatsAppReminder(selectedStudentForDetails)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
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
