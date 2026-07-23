import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, FileText, Download, Printer, Share2, Calendar, Users, Wallet, ClipboardCheck, LayoutGrid, ChevronRight, Filter } from 'lucide-react';
import { Student, Payment, Attendance, TeacherProfile } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportPDFModuleProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  payments: Payment[];
  attendance: Attendance[];
  teacherProfile: TeacherProfile | null;
}

type ReportType = 'students' | 'attendance' | 'fees' | 'monthly' | 'dues';

export const ExportPDFModule: React.FC<ExportPDFModuleProps> = ({ isOpen, onClose, students, payments, attendance, teacherProfile }) => {
  const [reportType, setReportType] = useState<ReportType>('students');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));

  const classesList = Array.from(new Set(['All', ...students.map(s => s.class)]));
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const generatePDF = () => {
    const doc = new jsPDF();
    const title = `${reportType.toUpperCase()} REPORT - ${selectedClass === 'All' ? 'ALL CLASSES' : 'CLASS ' + selectedClass}`;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(22, 163, 74);
    doc.text(teacherProfile?.schoolName || 'Institute Management System', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(title, 105, 25, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 32, { align: 'center' });

    let tableData: any[][] = [];
    let tableHeaders: string[] = [];

    if (reportType === 'students') {
      tableHeaders = ['Roll', 'Photo', 'Name', 'Father\'s Name', 'Mother\'s Name', 'Mobile', 'Class', 'Batch', 'Fee Status', 'Admission Date'];
      const filtered = selectedClass === 'All' ? students : students.filter(s => s.class === selectedClass);
      const currentMonth = new Date().toISOString().slice(0, 7);
      tableData = filtered.map(s => {
        const isPaid = payments.some(pay => pay.studentId === s.id && pay.month === currentMonth && pay.status === 'Paid');
        return [
          s.rollNumber || 'N/A',
          s.photoUrl ? '[Photo]' : 'No Photo',
          s.name,
          s.fatherName || 'N/A',
          s.motherName || 'N/A',
          s.mobileNumber || s.phone || 'N/A',
          s.class,
          s.batch,
          isPaid ? 'Paid' : 'Due',
          s.admissionDate || 'N/A'
        ];
      });
    } else if (reportType === 'fees') {
      tableHeaders = ['Name', 'Class', 'Amount', 'Status', 'Date'];
      const filtered = payments.filter(p => selectedClass === 'All' || students.find(s => s.id === p.studentId)?.class === selectedClass);
      tableData = filtered.map(p => {
        const student = students.find(s => s.id === p.studentId);
        return [student?.name || p.studentName, student?.class || p.studentClass, `Rs. ${p.amountPaid ?? p.amount ?? 0}`, p.status, p.paymentDate || p.date || 'N/A'];
      });
    }

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 40,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save(`${reportType}_report.pdf`);
  };

  if (!isOpen) return null;

  const reportOptions = [
    { id: 'students', title: 'Student List', icon: Users, color: 'emerald', desc: 'Full list with details' },
    { id: 'attendance', title: 'Attendance Report', icon: ClipboardCheck, color: 'blue', desc: 'Daily/Monthly records' },
    { id: 'fees', title: 'Fee Collection', icon: Wallet, color: 'indigo', desc: 'Payment history logs' },
    { id: 'dues', title: 'Due Students', icon: FileText, color: 'rose', desc: 'Unpaid fee summary' },
    { id: 'monthly', title: 'Monthly Report', icon: LayoutGrid, color: 'amber', desc: 'Performance overview' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-white flex flex-col"
    >
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-600 active:bg-slate-50 rounded-full">
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-[18px] font-black text-slate-800">Export PDF Center</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-5 space-y-6 max-w-lg mx-auto">
          {/* Report Type Selector */}
          <div className="space-y-3">
            <p className="text-[13px] font-bold text-slate-500 px-1">Select Report Type</p>
            <div className="grid grid-cols-1 gap-3">
              {reportOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setReportType(opt.id as ReportType)}
                  className={`flex items-center gap-4 p-4 rounded-[24px] border transition-all ${
                    reportType === opt.id 
                      ? 'bg-emerald-50 border-emerald-200 shadow-md shadow-emerald-50' 
                      : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    reportType === opt.id ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <opt.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-[15px] font-black ${reportType === opt.id ? 'text-emerald-900' : 'text-slate-800'}`}>{opt.title}</p>
                    <p className="text-[12px] font-bold text-slate-400">{opt.desc}</p>
                  </div>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${reportType === opt.id ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300'}`}>
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-5 w-5 text-emerald-600" />
              <h3 className="text-[16px] font-black text-slate-800">Export Filters</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-[12px] font-bold text-slate-400">Class Filter</p>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-3 rounded-[16px] text-[14px] font-bold text-slate-800 border border-transparent focus:border-emerald-500 outline-none"
                >
                  {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[12px] font-bold text-slate-400">Month Filter</p>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-3 rounded-[16px] text-[14px] font-bold text-slate-800 border border-transparent focus:border-emerald-500 outline-none"
                >
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={generatePDF}
              className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-[20px] font-black text-[16px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all"
            >
              <Download className="h-6 w-6" /> Generate PDF Report
            </button>
            <button className="bg-white border border-slate-100 text-slate-800 py-3.5 rounded-[20px] font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all">
              <Printer className="h-5 w-5" /> Print
            </button>
            <button className="bg-white border border-slate-100 text-slate-800 py-3.5 rounded-[20px] font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all">
              <Share2 className="h-5 w-5" /> Share
            </button>
          </div>
          
          <div className="h-10"></div>
        </div>
      </div>
    </motion.div>
  );
};
