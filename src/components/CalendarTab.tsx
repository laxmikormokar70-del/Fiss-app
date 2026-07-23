import React, { useState } from 'react';
import { Student, Payment, TeacherProfile } from '../types';
import { 
  Calendar, 
  MessageSquare, 
  BellRing, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  Check,
  Send,
  User,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface CalendarTabProps {
  students: Student[];
  payments: Payment[];
  teacherProfile: TeacherProfile | null;
}

export default function CalendarTab({ students, payments, teacherProfile }: CalendarTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const today = new Date();
  const currentMonthStr = today.toISOString().slice(0, 7); // "YYYY-MM"
  const currentDay = today.getDate();

  // Filter out active students
  const activeStudents = students.filter(s => s.status === 'Active');

  // Compute due date details for unpaid students
  const duesTimeline = activeStudents.map(student => {
    // Check if they paid for the current month
    const currentPayment = payments.find(p => p.studentId === student.id && p.month === currentMonthStr);
    
    // Parse admission day or default to 10th of the month
    let dueDay = 10;
    if (student.admissionDate) {
      const dateParts = student.admissionDate.split('-');
      if (dateParts.length === 3) {
        dueDay = parseInt(dateParts[2]) || 10;
      }
    }

    const isPaid = currentPayment?.status === 'Paid';
    const isPartial = currentPayment?.status === 'Partial';
    const amountOwed = isPaid ? 0 : isPartial ? currentPayment!.dueAmount : student.monthlyFee;
    
    // Calculate days remaining or overdue
    const daysDiff = dueDay - currentDay;
    const isOverdue = daysDiff < 0 && !isPaid;

    return {
      student,
      dueDay,
      isPaid,
      isPartial,
      amountOwed,
      daysDiff,
      isOverdue,
      paymentStatus: currentPayment?.status || 'Unpaid'
    };
  });

  // Sort: Overdue first, then pending soon, then paid
  const sortedTimeline = [...duesTimeline].sort((a, b) => {
    if (a.isPaid && !b.isPaid) return 1;
    if (!a.isPaid && b.isPaid) return -1;
    
    // Sort unpaid by days diff (overdue first)
    return a.daysDiff - b.daysDiff;
  });

  // Compose the reminder message
  const getReminderMessage = (item: typeof duesTimeline[0]) => {
    const school = teacherProfile?.schoolName || 'Coaching Institute';
    const teacher = teacherProfile?.name || 'Instructor';
    const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    if (item.paymentStatus === 'Partial') {
      return `Dear Guardian, this is a friendly reminder from ${school} regarding your child ${item.student.name}'s partial tuition fees for ${monthName}. Remaining due amount is $${item.amountOwed}. Please complete the payment at your earliest convenience. Thank you. - ${teacher}`;
    }
    
    return `Dear Guardian, this is a friendly reminder from ${school} regarding your child ${item.student.name}'s monthly tuition fees of $${item.student.monthlyFee} for ${monthName} which was due on the ${item.dueDay}th of this month. Current status is Unpaid. Please clear the pending dues. Thank you. - ${teacher}`;
  };

  const handleCopyMessage = (item: typeof duesTimeline[0]) => {
    const msg = getReminderMessage(item);
    navigator.clipboard.writeText(msg);
    setCopiedId(item.student.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendWhatsApp = (item: typeof duesTimeline[0]) => {
    const phone = item.student.mobileNumber.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(getReminderMessage(item));
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    } else {
      alert("No guardian mobile number provided for this student. Copied message to clipboard instead!");
      handleCopyMessage(item);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title Header */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 font-display flex items-center gap-2">
          <Calendar className="h-7 w-7 text-emerald-600" /> Due Dates & Reminders
        </h1>
        <p className="text-[13px] text-slate-500">Track monthly deadlines, identify delinquent payments, and dispatch parents WhatsApp reminders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Grid visualization */}
        <div className="bg-white rounded-[16px] border border-slate-100 p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-display">Deadlines Visualizer</h2>
              <p className="text-[13px] text-slate-500">Student fee due dates this month.</p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Simple custom calendar indicator list */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[13px] text-slate-500 flex items-center gap-2.5">
              <Sparkles className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <span>Due dates are calculated based on the day of student admission (e.g. admitted on the 15th means due on the 15th of every month).</span>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-red-50 border border-red-100 rounded-2xl">
                <span className="text-[10px] font-bold text-red-600 uppercase">Overdue</span>
                <p className="text-[18px] font-bold text-red-700 mt-1">
                  {duesTimeline.filter(item => item.isOverdue).length}
                </p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-600 uppercase">Due Soon</span>
                <p className="text-[18px] font-bold text-amber-700 mt-1">
                  {duesTimeline.filter(item => !item.isPaid && item.daysDiff >= 0 && item.daysDiff <= 5).length}
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-100 rounded-2xl">
                <span className="text-[10px] font-bold text-green-600 uppercase">Settled</span>
                <p className="text-[18px] font-bold text-green-700 mt-1">
                  {duesTimeline.filter(item => item.isPaid).length}
                </p>
              </div>
            </div>

            {/* Calendar list of days */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {sortedTimeline.map((item) => {
                const isUrgent = item.isOverdue || (item.daysDiff >= 0 && item.daysDiff <= 5);
                return (
                  <div 
                    key={item.student.id} 
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      item.isPaid 
                        ? 'bg-slate-50/55 border-slate-100 opacity-60' 
                        : item.isOverdue 
                        ? 'bg-red-50/50 border-red-100 hover:border-red-200' 
                        : isUrgent 
                        ? 'bg-amber-50/50 border-amber-100 hover:border-amber-200'
                        : 'bg-white border-slate-100 hover:border-emerald-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex flex-col items-center justify-center font-display ${
                        item.isPaid 
                          ? 'bg-slate-100 text-slate-500' 
                          : item.isOverdue 
                          ? 'bg-red-600 text-white shadow-md shadow-red-100' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <span className="text-[9px] uppercase font-bold leading-none">Due</span>
                        <span className="text-sm font-bold mt-0.5 leading-none">{item.dueDay}</span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          {item.student.name}
                          {item.isOverdue && <span className="h-2 w-2 rounded-full bg-red-500 inline-block animate-pulse"></span>}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Class {item.student.class} &bull; Monthly Fee: ${item.student.monthlyFee}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {item.isPaid ? (
                        <div className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-lg">
                          <CheckCircle className="h-3.5 w-3.5" /> Fully Paid
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-950 block">${item.amountOwed} Owed</span>
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md inline-block uppercase ${
                            item.isOverdue 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.isOverdue 
                              ? `${Math.abs(item.daysDiff)} Days Overdue` 
                              : `${item.daysDiff} Days Left`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reminders Dispatcher */}
        <div className="bg-white rounded-[16px] border border-slate-100 p-6 shadow-sm flex flex-col justify-between h-fit">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-display">Fast Dispatcher</h2>
                <p className="text-[13px] text-slate-500">Auto remind parents via messaging.</p>
              </div>
              <BellRing className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {duesTimeline.filter(item => !item.isPaid).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  All active students have fully cleared their fees for this period. No reminders pending!
                </div>
              ) : (
                duesTimeline.filter(item => !item.isPaid).map((item) => (
                  <div key={item.student.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{item.student.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Mobile: {item.student.mobileNumber || 'N/A'}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900">${item.amountOwed}</span>
                    </div>

                    <div className="text-[10px] bg-white p-2.5 rounded-xl text-slate-600 border border-slate-100 italic font-medium leading-relaxed line-clamp-3">
                      "{getReminderMessage(item)}"
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyMessage(item)}
                        className="flex-1 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        {copiedId === item.student.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedId === item.student.id ? 'Copied' : 'Copy Notice'}</span>
                      </button>
                      <button
                        onClick={() => handleSendWhatsApp(item)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
