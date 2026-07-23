import React, { useState, useMemo } from 'react';
import { Student, Payment, TeacherProfile } from '../types';
import DynamicText from './DynamicText';
import { 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Printer, 
  FileDown, 
  Search,
  Filter,
  X,
  Sparkles,
  School,
  FileText,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeesTabProps {
  students: Student[];
  payments: Payment[];
  teacherProfile: TeacherProfile | null;
  onSavePayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  classes?: any[];
}

export default function FeesTab({ 
  students, 
  payments, 
  teacherProfile, 
  onSavePayment,
  classes = []
}: FeesTabProps) {
  // Filters
  const [selectedClass, setSelectedClass] = useState(() => classes[0]?.className || 'Class 5');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [collectFeeStudent, setCollectFeeStudent] = useState<Student | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);

  const classesList = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'HSC 1st Year', 'HSC 2nd Year'];

  // Filter students by selected class and search
  const classStudents = students.filter(student => {
    const matchesClass = student.class === selectedClass;
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch && student.status === 'Active';
  });

  // Check payment status for a specific student and month
  const getStudentPaymentInfo = (studentId: string) => {
    const payment = payments.find(p => p.studentId === studentId && p.month === selectedMonth);
    return payment || null;
  };

  // Handle Collecting Fee
  const handleOpenCollectModal = (student: Student) => {
    setCollectFeeStudent(student);
    setCollectAmount(student.monthlyFee.toString());
  };

  const handleConfirmCollection = async () => {
    if (!collectFeeStudent) return;
    
    const amountToPay = parseFloat(collectAmount) || 0;
    const payload: Omit<Payment, 'id'> = {
      teacherId: collectFeeStudent.teacherId,
      studentId: collectFeeStudent.id,
      studentName: collectFeeStudent.name,
      studentRoll: collectFeeStudent.rollNumber,
      studentClass: collectFeeStudent.class,
      month: selectedMonth,
      paymentDate: new Date().toISOString().slice(0, 10),
      amountPaid: amountToPay,
      dueAmount: Math.max(0, collectFeeStudent.monthlyFee - amountToPay),
      advanceAmount: Math.max(0, amountToPay - collectFeeStudent.monthlyFee),
      status: amountToPay >= collectFeeStudent.monthlyFee ? 'Paid' : amountToPay > 0 ? 'Partial' : 'Unpaid',
      notes: 'Paid at counter'
    };

    try {
      await onSavePayment(payload);
      
      // Auto open receipt after collection
      const mockReceipt: Payment = {
        ...payload,
        id: collectFeeStudent.id + '-' + selectedMonth
      };
      setActiveReceipt(mockReceipt);
      setCollectFeeStudent(null);
    } catch (err) {
      console.warn(err);
      alert('Error recording payment. Please try again.');
    }
  };

  // Print & Save PDF helper
  const handlePrintReceipt = (receipt: Payment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download or print files.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Tuition Payment Receipt - ${receipt.studentName}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; text-align: center; }
            .card { border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; max-width: 450px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .badge { display: inline-block; background-color: #dcfce7; color: #16a34a; font-weight: bold; font-size: 13px; padding: 4px 12px; rounded-full; border-radius: 9999px; text-transform: uppercase; margin-top: 10px; }
            .school-title { font-size: 20px; font-weight: 800; color: #1e3a8a; margin: 0; }
            .teacher-title { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 500; }
            .divider { border-bottom: 2px solid #e2e8f0; margin: 15px 0; }
            .item-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px dashed #f1f5f9; font-size: 14px; }
            .label { color: #64748b; font-weight: 600; }
            .value { color: #0f172a; font-weight: bold; }
            .amount { font-size: 22px; font-weight: 800; color: #16a34a; margin-top: 15px; }
            .footer-note { font-size: 11px; color: #94a3b8; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 12px; }
            @media print {
              body { padding: 0; }
              .card { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="school-title">${teacherProfile?.schoolName || 'Coaching Center'}</h1>
            <p class="teacher-title">Teacher: ${teacherProfile?.name || 'Instructor'}</p>
            <span class="badge">PAID RECEIPT</span>
            <div class="divider"></div>
            <div class="item-row"><span class="label">Student Name</span><span class="value">${receipt.studentName}</span></div>
            <div class="item-row"><span class="label">Roll Number</span><span class="value">${receipt.studentRoll}</span></div>
            <div class="item-row"><span class="label">Class Grade</span><span class="value">${receipt.studentClass}</span></div>
            <div class="item-row"><span class="label">Tuition Month</span><span class="value">${receipt.month}</span></div>
            <div class="item-row"><span class="label">Payment Date</span><span class="value">${receipt.paymentDate}</span></div>
            <div class="amount">${receipt.amountPaid}$</div>
            <div class="footer-note">This is a system generated valid receipt card. Thank you!</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Get students with unpaid fees for the selected month
  const unpaidStudentsForMonth = useMemo(() => {
    return classStudents.filter(student => {
      const payment = payments.find(p => p.studentId === student.id && p.month === selectedMonth);
      return !payment || payment.status !== 'Paid';
    });
  }, [classStudents, payments, selectedMonth]);

  // Formats Bangladeshi numbers properly for WhatsApp by prepending '88' if necessary
  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('01')) {
      return '88' + cleaned;
    }
    return cleaned;
  };

  const handleBulkReminder = () => {
    if (unpaidStudentsForMonth.length === 0) return;
    const phoneNumbers = unpaidStudentsForMonth
      .map(s => s.mobileNumber)
      .filter(n => n && n.length > 5)
      .map(n => formatWhatsAppNumber(n))
      .join(',');
    
    if (!phoneNumbers) {
      alert("No valid phone numbers found for unpaid students.");
      return;
    }
    
    const message = `Dear Guardian, this is a gentle reminder regarding the tuition fee for the month of ${selectedMonth}. Please clear the payment soon. Thank you!`;
    window.open(`sms:${phoneNumbers}?body=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="h-screen bg-white font-sans w-full overflow-y-auto pb-36 sm:pb-28">
      {/* 1. PROFESSIONAL TOP HEADER SECTION (FULL WIDTH & CURVED) */}
      <div className="bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white shadow-xl w-full shrink-0 rounded-b-[40px] relative z-20 border-none pb-8">
        <div className="w-full px-5 py-7 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-[16px] bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-sm shrink-0">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none uppercase text-white font-display">Fee Collections</h1>
              <p className="text-[10px] text-emerald-100 font-bold mt-1.5 uppercase tracking-[0.15em] flex items-center gap-1.5 opacity-90">
                <Sparkles className="h-3 w-3 text-emerald-300" /> Revenue Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {unpaidStudentsForMonth.length > 0 && (
              <button 
                onClick={handleBulkReminder}
                className="hidden sm:flex items-center gap-2 text-[10px] font-black bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md px-3 py-2 rounded-full border border-red-500/30 text-red-100 shadow-sm transition-all active:scale-95 uppercase tracking-wider cursor-pointer mr-1"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Remind ({unpaidStudentsForMonth.length})</span>
              </button>
            )}
            <button 
              onClick={() => {
                if (payments.length > 0) handlePrintReceipt(payments[0]);
                else alert('No payments recorded for this month to print.');
              }}
              className="flex items-center gap-2 text-[10px] font-black bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white shadow-sm transition-all active:scale-95 uppercase tracking-wider cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Header Description & Month Selector */}
        <div className="px-6 mt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <p className="text-[13px] text-emerald-50/80 max-w-sm font-medium leading-relaxed">
              Monitor student payment statuses, collect monthly dues, and generate professional receipts.
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0">
             <div className="flex items-center gap-3 bg-black/15 backdrop-blur-md px-4 py-2.5 rounded-[18px] border border-white/10 shadow-inner">
                <Calendar className="h-4 w-4 text-emerald-300" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300/70">Selected Month</span>
                  <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="bg-transparent border-none text-[12px] font-black text-white focus:outline-none cursor-pointer uppercase tracking-widest"
                  />
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 -mt-4 relative z-30">

      {/* Class & Month Selectors Panel */}
      <div className="space-y-6">
        {/* CLASS SELECTION */}
        <div className="space-y-4 bg-white p-5 rounded-[20px] border border-green-200 shadow-md">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-4 bg-green-500 rounded-full" />
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Select Class</span>
            </div>
            <span className="text-[10px] font-black text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 shadow-xs tabular-nums">
              {classes.length}
            </span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 w-full px-1">
            {classes.length === 0 ? (
              <div className="w-full p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 uppercase tracking-widest font-black">
                No Classes Found
              </div>
            ) : (
              classes.map((c, idx) => {
                const isSelected = selectedClass === c.className;
                return (
                  <button
                    key={c.id || `class-fee-${idx}`}
                    onClick={() => setSelectedClass(c.className)}
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

        <div className="bg-white rounded-[20px] border border-green-200 p-5 shadow-md">
          {/* Name Search filter */}
          <div className="w-full">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 ml-1">Search student</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-[16px] focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/10 transition-all">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by student name..."
                className="w-full bg-transparent border-none text-[15px] text-slate-700 focus:outline-none placeholder-slate-400 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Student List Grid */}
      <div className="bg-white rounded-[16px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
          <h3 className="text-[14px] font-bold text-slate-800">
            {selectedClass} Student Billing Roster - {selectedMonth}
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {classStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold">No active students found</p>
              <p className="text-xs mt-0.5">Admit students to {selectedClass} to see them here.</p>
            </div>
          ) : (
            classStudents.map((student) => {
              const paymentInfo = getStudentPaymentInfo(student.id);
              const isPaid = paymentInfo?.status === 'Paid';

              return (
                <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/20 transition-colors">
                  {/* Left: Student meta */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt="Photo" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-bold text-xs text-blue-600 uppercase">{student.name.slice(0, 2)}</span>
                      )}
                    </div>
                    <div className="overflow-hidden max-w-[150px] sm:max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <DynamicText value={student.name} className="text-[15px] font-bold text-slate-800" />
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md shrink-0">
                          Roll: {student.rollNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold">{student.mobileNumber || 'No Phone'}</p>
                    </div>
                  </div>

                  {/* Right: Contact & Action Triggers */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {/* Status Badge */}
                    <div className="shrink-0 sm:mr-3">
                      {isPaid ? (
                        <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                          <CheckCircle className="h-3.5 w-3.5" /> PAID
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                          <AlertCircle className="h-3.5 w-3.5" /> DUE
                        </span>
                      )}
                    </div>

                    {/* Quick Contacts */}
                    <div className="flex gap-1.5 mr-1.5">
                      <a
                        href={`tel:${student.mobileNumber}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors border border-slate-200"
                        title="Call Guardian"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                      <a
                        href={`https://wa.me/${formatWhatsAppNumber(student.mobileNumber)}?text=Dear%20Guardian,%20this%20is%20to%20notify%20you%20regarding%20the%20coaching%20tuition%20fee%20of%20${encodeURIComponent(student.name)}%20for%20the%20month%20of%20${selectedMonth}.%20Please%20clear%20the%20payment%20of%20${student.monthlyFee}$%20soon.%20Thank%20you!`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20b958] text-white rounded-xl transition-colors font-semibold text-xs flex items-center justify-center gap-1 text-center"
                        title="Send WhatsApp Reminder"
                      >
                        WhatsApp
                      </a>
                    </div>

                    {/* Collect vs. Receipt Action */}
                    <div className="shrink-0 min-w-[125px]">
                      {!isPaid ? (
                        <button
                          onClick={() => handleOpenCollectModal(student)}
                          className="w-full py-2 px-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer text-center"
                        >
                          Collect Fee
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveReceipt(paymentInfo)}
                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1 text-center"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Voucher Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>

      {/* Collect Fee Dialog Popup */}
      <AnimatePresence>
        {collectFeeStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[16px] p-5 shadow-xl max-w-sm w-full border border-slate-100 font-sans"
            >
              <div className="flex justify-between items-center border-b border-slate-50 pb-2 mb-4">
                <h3 className="font-bold text-[16px] text-slate-800">Collect Tuition Fee</h3>
                <button onClick={() => setCollectFeeStudent(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Student Name</label>
                  <p className="font-bold text-slate-800 text-[16px]">{collectFeeStudent.name}</p>
                  <p className="text-xs text-slate-500">Roll: {collectFeeStudent.rollNumber} &bull; Class: {collectFeeStudent.class}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tuition Fee ($)</label>
                  <input
                    type="number"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-bold font-mono text-[16px]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setCollectFeeStudent(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCollection}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-green-100"
                  >
                    Collect Fee
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Received Receipt Modal Popup */}
      <AnimatePresence>
        {activeReceipt && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[16px] max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100 font-sans"
            >
              {/* Receipt Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> PAYMENT RECEIPT
                </span>
                <button onClick={() => setActiveReceipt(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {/* Receipt Body Card */}
              <div className="p-6 space-y-4 bg-white">
                <div className="text-center pb-3 border-b border-slate-100">
                  <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto font-bold text-sm mb-1.5 uppercase">
                    {teacherProfile?.schoolName ? teacherProfile.schoolName.slice(0, 2) : 'CF'}
                  </div>
                  <h3 className="font-bold text-[16px] text-slate-900 uppercase">
                    {teacherProfile?.schoolName || 'Coaching Center'}
                  </h3>
                  <p className="text-xs text-slate-400">Teacher: {teacherProfile?.name}</p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500 font-bold">STUDENT</span>
                    <span className="font-bold text-slate-800">{activeReceipt.studentName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500 font-bold">ROLL NO</span>
                    <span className="font-bold text-slate-800">{activeReceipt.studentRoll}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500 font-bold">CLASS</span>
                    <span className="font-bold text-slate-800">{activeReceipt.studentClass}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500 font-bold font-display">TUITION MONTH</span>
                    <span className="font-bold text-slate-800">{activeReceipt.month}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-bold">PAYMENT DATE</span>
                    <span className="font-bold text-slate-850">{activeReceipt.paymentDate}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-800 font-bold">PAID AMOUNT</span>
                    <span className="text-[20px] font-bold text-green-600 font-mono">{activeReceipt.amountPaid}$</span>
                  </div>
                </div>
              </div>

              {/* Receipt Footer Controls */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => handlePrintReceipt(activeReceipt)}
                  className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1 border border-blue-200 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => handlePrintReceipt(activeReceipt)}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow-md"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
