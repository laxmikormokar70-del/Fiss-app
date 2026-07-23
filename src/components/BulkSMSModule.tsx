import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Users, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  CheckSquare, 
  Square, 
  Phone, 
  Eye, 
  Save, 
  RotateCcw, 
  Smartphone, 
  Mail, 
  AlertCircle, 
  Loader2, 
  Trash2,
  Share2
} from 'lucide-react';
import { Student, TeacherProfile } from '../types';
import { messagingService, AttachmentFile, MessagingRecipient, MessagingChannel } from '../services/messagingService';

interface BulkSMSModuleProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: any[];
  teacherProfile: TeacherProfile | null;
  triggerNotification?: (message: string, type?: 'success' | 'error') => void;
}

export const BulkSMSModule: React.FC<BulkSMSModuleProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  teacherProfile,
  triggerNotification
}) => {
  // Step 1 & 2: Class & Batch Selection
  const classList = useMemo(() => {
    const list = new Set<string>();
    classes?.forEach((c) => {
      if (c.className) list.add(c.className);
    });
    students?.forEach((s) => {
      if (s.className) list.add(s.className);
    });
    return Array.from(list).sort();
  }, [classes, students]);

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');

  // Auto-set initial class & batch if available
  React.useEffect(() => {
    if (classList.length > 0 && !selectedClass) {
      setSelectedClass(classList[0]);
    }
  }, [classList, selectedClass]);

  // Derived batches for selected class
  const batchList = useMemo(() => {
    if (!selectedClass) return [];
    const set = new Set<string>();
    classes
      ?.filter((c) => c.className === selectedClass)
      .forEach((c) => {
        if (c.batches && Array.isArray(c.batches)) {
          c.batches.forEach((b: any) => set.add(typeof b === 'string' ? b : b.batchName));
        }
      });
    students
      ?.filter((s) => s.className === selectedClass && s.batchName)
      .forEach((s) => set.add(s.batchName));
    return Array.from(set).sort();
  }, [selectedClass, classes, students]);

  React.useEffect(() => {
    if (batchList.length > 0) {
      setSelectedBatch(batchList[0]);
    } else {
      setSelectedBatch('');
    }
  }, [batchList, selectedClass]);

  // Step 3: Filter students by selected Class & Batch
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter((s) => {
      const matchClass = s.className === selectedClass;
      const matchBatch = !selectedBatch || s.batchName === selectedBatch;
      return matchClass && matchBatch;
    });
  }, [students, selectedClass, selectedBatch]);

  // Selected Student IDs state (Default: ALL selected)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Update selected IDs whenever filteredStudents changes
  React.useEffect(() => {
    setSelectedStudentIds(filteredStudents.map((s) => s.id));
  }, [filteredStudents]);

  // Select / Deselect handlers
  const isAllSelected = filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Composer States
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<MessagingChannel>('sms');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search filter inside student list
  const [searchQuery, setSearchQuery] = useState('');
  const displayedStudentsInList = useMemo(() => {
    if (!searchQuery.trim()) return filteredStudents;
    const q = searchQuery.toLowerCase();
    return filteredStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q) ||
        s.mobileNumber?.includes(q) ||
        s.phone?.includes(q)
    );
  }, [filteredStudents, searchQuery]);

  // Sending / Status state
  const [isSending, setIsSending] = useState(false);
  const [sendStatusLogs, setSendStatusLogs] = useState<string[] | null>(null);

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    const newAttachments: AttachmentFile[] = fileList.map((f: File) => {
      let type: 'image' | 'pdf' | 'document' = 'document';
      if (f.type.startsWith('image/')) type = 'image';
      else if (f.type === 'application/pdf') type = 'pdf';

      return {
        name: f.name,
        type,
        size: `${(f.size / 1024).toFixed(1)} KB`,
        fileObject: f
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Merge Tag Inserter
  const insertTag = (tag: string) => {
    setMessage((prev) => prev + ` ${tag} `);
  };

  // Clear Form
  const handleClear = () => {
    setSubject('');
    setMessage('');
    setAttachments([]);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!subject.trim() && !message.trim()) {
      if (triggerNotification) triggerNotification('Please enter subject or message to save draft.', 'error');
      return;
    }
    await messagingService.saveDraft({
      id: `draft-${Date.now()}`,
      subject,
      message,
      selectedClass,
      selectedBatch,
      recipientIds: selectedStudentIds,
      updatedAt: new Date().toISOString()
    });
    if (triggerNotification) triggerNotification('Draft saved successfully!', 'success');
  };

  // Send Messages
  const handleSend = async (target: 'selected' | 'all') => {
    const targetIds = target === 'all' ? filteredStudents.map((s) => s.id) : selectedStudentIds;

    if (targetIds.length === 0) {
      if (triggerNotification) triggerNotification('Please select at least one student recipient.', 'error');
      return;
    }

    if (!message.trim()) {
      if (triggerNotification) triggerNotification('Please write a message before sending.', 'error');
      return;
    }

    setIsSending(true);

    const recipients: MessagingRecipient[] = filteredStudents
      .filter((s) => targetIds.includes(s.id))
      .map((s) => ({
        studentId: s.id,
        name: s.name,
        rollNumber: s.rollNumber || 'N/A',
        phone: s.mobileNumber || s.phone || s.phoneNumber || '',
        email: s.email || '',
        className: s.className || s.class || '',
        batchName: s.batchName || s.batch || ''
      }));

    try {
      const res = await messagingService.sendBulkMessage({
        subject,
        message,
        recipients,
        attachments,
        channel
      });

      setSendStatusLogs(res.logs);
      if (triggerNotification) {
        triggerNotification(`Successfully dispatched notice to ${res.totalSent} recipient(s)!`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      if (triggerNotification) triggerNotification('Failed to dispatch message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const sampleStudent = filteredStudents[0] || {
    name: 'Rahul Sharma',
    rollNumber: '101',
    className: selectedClass || 'Class 10',
    batchName: selectedBatch || 'Batch A'
  };

  const previewText = message
    ? message
        .replace(/\{student_name\}/gi, sampleStudent.name)
        .replace(/\{roll_number\}/gi, sampleStudent.rollNumber || '101')
        .replace(/\{class_name\}/gi, sampleStudent.className)
        .replace(/\{batch_name\}/gi, sampleStudent.batchName)
    : 'Your notice text will be rendered here with personalized student details...';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex flex-col font-sans overflow-hidden"
    >
      <div className="bg-white w-full h-full flex flex-col max-w-5xl mx-auto shadow-2xl relative overflow-hidden">
        
        {/* HEADER BAR */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 -ml-2 text-white hover:bg-white/10 active:scale-95 rounded-full transition-all cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-[18px] font-black tracking-tight flex items-center gap-2">
                <MessageSquare className="h-5.5 w-5.5" /> Bulk SMS & Notice Center
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                Send instant announcements, SMS alerts, or WhatsApp messages
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-black bg-emerald-800/60 border border-emerald-400/30 px-3 py-1 rounded-full text-emerald-100">
              API Gateway Ready
            </span>
          </div>
        </div>

        {/* MAIN TWO-COLUMN BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6 pb-28">
          
          {/* TOP CLASS & BATCH SELECTOR (Step 1 & 2) */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-emerald-600" />
                Target Recipients
              </h3>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                {filteredStudents.length} Students Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Step 1: Select Class */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 block">Step 1: Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full min-h-[48px] px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 transition-all cursor-pointer"
                >
                  {classList.length === 0 && <option value="">No Classes Found</option>}
                  {classList.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Batch */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 block">Step 2: Select Batch</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full min-h-[48px] px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 transition-all cursor-pointer"
                >
                  <option value="">All Batches</option>
                  {batchList.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: STUDENT LIST WITH CHECKBOXES (Step 3) */}
            <div className="lg:col-span-5 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[520px]">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900">Step 3: Student Selection</h4>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {selectedStudentIds.length} of {filteredStudents.length} selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {isAllSelected ? (
                    <>
                      <CheckSquare className="h-4 w-4 text-emerald-600" /> Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 text-emerald-600" /> Select All
                    </>
                  )}
                </button>
              </div>

              {/* Search inside list */}
              <div className="pt-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Student Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar pt-1">
                {displayedStudentsInList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <Users className="h-10 w-10 mb-2 opacity-40 text-emerald-600" />
                    <p className="text-xs font-bold text-slate-700">No students found</p>
                    <p className="text-[11px] text-slate-400">Try changing class or batch filter</p>
                  </div>
                ) : (
                  displayedStudentsInList.map((st) => {
                    const isChecked = selectedStudentIds.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleStudent(st.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isChecked
                            ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by parent container click
                          className="h-4.5 w-4.5 accent-emerald-600 rounded cursor-pointer shrink-0"
                        />

                        {/* Profile Avatar */}
                        <div className="h-9 w-9 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full flex items-center justify-center shrink-0 border border-emerald-200">
                          {st.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Student Details */}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-black text-slate-900 truncate">{st.name}</h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              Roll #{st.rollNumber || 'N/A'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5 truncate">
                              <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                              {st.mobileNumber || st.phone || st.phoneNumber || 'No Phone'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: MESSAGE COMPOSER & PREVIEW */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* COMPOSER CARD */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
                    Message Composer
                  </h4>
                  
                  {/* Channel Switcher */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setChannel('sms')}
                      className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                        channel === 'sms' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel('whatsapp')}
                      className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                        channel === 'whatsapp' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel('email')}
                      className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                        channel === 'email' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Email
                    </button>
                  </div>
                </div>

                {/* Subject Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 block">Notice Subject / Heading</label>
                  <input
                    type="text"
                    placeholder="e.g. Exam Schedule Announcement / Fee Due Alert"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 transition-all"
                  />
                </div>

                {/* Insert Merge Tags */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 block">Message Body</label>
                    <span className="text-[11px] font-bold text-slate-400">{message.length} chars</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pb-1">
                    <span className="text-[10px] font-bold text-slate-400">Tags:</span>
                    <button
                      type="button"
                      onClick={() => insertTag('{student_name}')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      + Student Name
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTag('{roll_number}')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      + Roll No
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTag('{class_name}')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      + Class
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Write detailed notice here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 transition-all resize-none"
                  />
                </div>

                {/* ATTACHMENT SECTION (Image, PDF, Document) */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Paperclip className="h-4 w-4 text-emerald-600" />
                      Attachments (Image, PDF, Doc)
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      + Attach File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200"
                        >
                          {file.type === 'image' && <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />}
                          {file.type === 'pdf' && <FileText className="h-3.5 w-3.5 text-rose-600" />}
                          {file.type === 'document' && <FileCode className="h-3.5 w-3.5 text-indigo-600" />}
                          <span className="truncate max-w-[120px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="text-slate-400 hover:text-red-600 ml-1 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* LIVE PREVIEW CARD */}
              <div className="bg-emerald-900 text-white p-5 rounded-3xl shadow-md space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-emerald-400" />
                    Live Preview ({channel.toUpperCase()})
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono">Recipient: {sampleStudent.name}</span>
                </div>

                {subject && (
                  <h5 className="text-sm font-black text-emerald-100 pt-1">
                    📢 {subject}
                  </h5>
                )}

                <p className="text-xs font-medium text-emerald-50 leading-relaxed whitespace-pre-wrap">
                  {previewText}
                </p>

                {attachments.length > 0 && (
                  <div className="pt-2 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <Paperclip className="h-3 w-3" /> Includes {attachments.length} attachment file(s)
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS (Send Selected, Send All, Save Draft, Clear) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleSend('selected')}
                  disabled={isSending}
                  className="col-span-2 sm:col-span-1 min-h-[52px] px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Send Selected</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSend('all')}
                  disabled={isSending}
                  className="min-h-[52px] px-3 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Users className="h-4 w-4" />
                  <span>Send to All</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="min-h-[52px] px-3 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs uppercase tracking-wider rounded-2xl border-2 border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="h-4 w-4 text-emerald-600" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="min-h-[52px] px-3 bg-white hover:bg-rose-50 text-rose-700 font-extrabold text-xs uppercase tracking-wider rounded-2xl border-2 border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="h-4 w-4 text-rose-600" />
                  <span>Clear</span>
                </button>
              </div>

            </div>

          </div>

          {/* STATUS LOG MODAL / POPUP IF LOGS PRESENT */}
          <AnimatePresence>
            {sendStatusLogs && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      Bulk Message Dispatch Result
                    </h3>
                    <button
                      onClick={() => setSendStatusLogs(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl max-h-60 overflow-y-auto space-y-1">
                    {sendStatusLogs.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSendStatusLogs(null)}
                    className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Close Log
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </motion.div>
  );
};
export default BulkSMSModule;
