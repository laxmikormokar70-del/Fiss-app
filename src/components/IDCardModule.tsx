import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Download, Printer, Share2, CreditCard, ChevronLeft, ChevronRight, User, School, MapPin, Phone, Hash } from 'lucide-react';
import { Student, TeacherProfile } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface IDCardModuleProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teacherProfile: TeacherProfile | null;
}

export const IDCardModule: React.FC<IDCardModuleProps> = ({ isOpen, onClose, students, teacherProfile }) => {
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const classesList = useMemo(() => Array.from(new Set(['All', ...students.map(s => s.class)])), [students]);
  const batchesList = useMemo(() => Array.from(new Set(['All', ...students.map(s => s.batch)])), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = selectedClass === 'All' || s.class === selectedClass;
      const matchBatch = selectedBatch === 'All' || s.batch === selectedBatch;
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.rollNumber.includes(searchQuery) ||
                          s.studentId.includes(searchQuery);
      return matchClass && matchBatch && matchSearch;
    });
  }, [students, selectedClass, selectedBatch, searchQuery]);

  const downloadPDF = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${selectedStudent?.name}_ID_Card.pdf`);
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
          <h2 className="text-[18px] font-black text-slate-800">Generate ID Card</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-5 space-y-6 max-w-lg mx-auto">
          {/* Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search Student (Name, ID, Roll)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-11 pr-4 py-3.5 rounded-[20px] text-[15px] font-bold text-slate-800 placeholder:text-slate-400 border border-slate-100 shadow-sm outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-[12px] font-bold text-slate-400 px-1">Class</p>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-white px-4 py-3 rounded-[16px] text-[14px] font-bold text-slate-800 border border-slate-100 shadow-sm outline-none"
                >
                  {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[12px] font-bold text-slate-400 px-1">Batch</p>
                <select 
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full bg-white px-4 py-3 rounded-[16px] text-[14px] font-bold text-slate-800 border border-slate-100 shadow-sm outline-none"
                >
                  {batchesList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Student Selector */}
          <div className="space-y-3">
            <p className="text-[13px] font-bold text-slate-500 px-1">Select Student ({filteredStudents.length})</p>
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none">
              {filteredStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`flex flex-col items-center p-3 rounded-[24px] min-w-[100px] transition-all border ${
                    selectedStudent?.id === student.id 
                      ? 'bg-emerald-50 border-emerald-200 shadow-md shadow-emerald-50' 
                      : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="h-14 w-14 rounded-full bg-slate-100 overflow-hidden mb-2 border-2 border-white shadow-sm">
                    {student.profilePhoto ? (
                      <img src={student.profilePhoto} alt={student.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-50">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-black text-slate-800 line-clamp-1">{student.name}</p>
                  <p className="text-[9px] font-bold text-slate-400">ID: {student.studentId}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Area */}
          <AnimatePresence mode="wait">
            {selectedStudent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-6 pb-20"
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[16px] font-bold text-slate-800">Card Preview</h3>
                  <div className="flex gap-2">
                    <button onClick={downloadPDF} className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 active:scale-95 transition-transform">
                      <Download className="h-5 w-5" />
                    </button>
                    <button className="p-2.5 bg-white text-slate-600 border border-slate-100 rounded-xl shadow-sm active:scale-95 transition-transform">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* ID Card Front */}
                <div ref={cardRef} className="bg-white rounded-[24px] overflow-hidden shadow-xl border border-slate-100 mx-auto w-full max-w-[320px] aspect-[1/1.6] flex flex-col relative group">
                  {/* Header Background */}
                  <div className="h-28 bg-emerald-600 relative flex items-center px-4 gap-3">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                      {teacherProfile?.logoUrl ? (
                        <img src={teacherProfile.logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                      ) : (
                        <School className="h-7 w-7 text-emerald-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white font-black text-[14px] leading-tight line-clamp-2 uppercase">
                        {teacherProfile?.schoolName || 'Institute Name'}
                      </h4>
                      <p className="text-emerald-100 text-[9px] font-bold tracking-widest mt-0.5">STUDENT ID CARD</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex flex-col items-center pt-8 px-6 text-center">
                    <div className="relative mb-4">
                      <div className="h-32 w-32 rounded-[32px] border-4 border-white shadow-lg overflow-hidden bg-slate-50">
                        {selectedStudent.profilePhoto ? (
                          <img src={selectedStudent.profilePhoto} alt={selectedStudent.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-300">
                            <User className="h-16 w-16" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 right-2 h-8 w-8 bg-emerald-500 rounded-xl border-2 border-white flex items-center justify-center shadow-md">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    <h3 className="text-[20px] font-black text-slate-900 leading-tight mb-1">{selectedStudent.name}</h3>
                    <p className="text-[13px] font-bold text-emerald-600 mb-6 uppercase tracking-wider">Class {selectedStudent.class}</p>

                    <div className="w-full space-y-3.5">
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                          <Hash className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">Student ID</p>
                          <p className="text-[12px] font-black text-slate-800">{selectedStudent.studentId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">Father's Name</p>
                          <p className="text-[12px] font-black text-slate-800">{selectedStudent.fatherName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                          <Phone className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">Phone Number</p>
                          <p className="text-[12px] font-black text-slate-800">{selectedStudent.phoneNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="h-10 bg-slate-50 border-t border-slate-100 flex items-center justify-center px-6">
                    <p className="text-[10px] font-bold text-slate-400">SESSION: 2024 - 2025</p>
                  </div>
                </div>

                <div className="h-10"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {!selectedStudent && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 bg-emerald-50 rounded-[30px] flex items-center justify-center mb-4">
                <CreditCard className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="text-[17px] font-black text-slate-800 mb-1">Live Card Preview</h3>
              <p className="text-[13px] text-slate-400 font-bold max-w-[200px]">Select a student to generate and preview their ID card</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
