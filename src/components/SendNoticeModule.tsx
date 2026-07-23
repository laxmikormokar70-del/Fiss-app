import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bell, ClipboardList, Clock, Paperclip, CheckCircle2, ChevronRight, Users, School, AlertCircle, History, Info } from 'lucide-react';
import { Student, TeacherProfile } from '../types';

interface SendNoticeModuleProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teacherProfile: TeacherProfile | null;
}

interface Notice {
  id: string;
  title: string;
  desc: string;
  type: string;
  priority: string;
  date: string;
  audience: string;
}

export const SendNoticeModule: React.FC<SendNoticeModuleProps> = ({ isOpen, onClose, students, teacherProfile }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [audience, setAudience] = useState('All');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [history] = useState<Notice[]>([
    { id: '1', title: 'Monthly Exam Schedule', desc: 'The exam will start from next Monday.', type: 'Academic', priority: 'High', date: '2026-07-10', audience: 'All' },
    { id: '2', title: 'Rainy Day Holiday', desc: 'Institute will remain closed today due to heavy rain.', type: 'Holiday', priority: 'Urgent', date: '2026-07-05', audience: 'Class 10' }
  ]);

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setTitle('');
        setDesc('');
        setActiveTab('history');
      }, 2000);
    }, 1500);
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
          <h2 className="text-[18px] font-black text-slate-800">Notice Center</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4 bg-white flex border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-3.5 text-[14px] font-black transition-all relative ${
            activeTab === 'create' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          Create Notice
          {activeTab === 'create' && <motion.div layoutId="noticeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3.5 text-[14px] font-black transition-all relative ${
            activeTab === 'history' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          Notice History
          {activeTab === 'history' && <motion.div layoutId="noticeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-5 space-y-6 max-w-lg mx-auto">
          {activeTab === 'create' ? (
            <div className="space-y-6">
              {/* Form Card */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-5">
                <div className="space-y-1.5">
                  <p className="text-[12px] font-bold text-slate-400 px-1">Notice Title</p>
                  <input 
                    type="text"
                    placeholder="Enter notice heading"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 px-5 py-4 rounded-[18px] text-[15px] font-bold text-slate-800 placeholder:text-slate-400 border border-transparent focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[12px] font-bold text-slate-400 px-1">Description</p>
                  <textarea 
                    rows={4}
                    placeholder="Write detailed information here..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-slate-50 px-5 py-4 rounded-[18px] text-[15px] font-bold text-slate-800 placeholder:text-slate-400 border border-transparent focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[12px] font-bold text-slate-400 px-1">Type</p>
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-slate-50 px-4 py-3.5 rounded-[16px] text-[14px] font-bold text-slate-800 border border-transparent focus:border-emerald-500 outline-none"
                    >
                      <option value="General">General</option>
                      <option value="Academic">Academic</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Fee">Fee Reminder</option>
                      <option value="Event">Event</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[12px] font-bold text-slate-400 px-1">Priority</p>
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-slate-50 px-4 py-3.5 rounded-[16px] text-[14px] font-bold text-slate-800 border border-transparent focus:border-emerald-500 outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[12px] font-bold text-slate-400 px-1">Audience</p>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Class 10', 'Class 12', 'Batches', 'Staff'].map(aud => (
                      <button
                        key={aud}
                        onClick={() => setAudience(aud)}
                        className={`px-4 py-2 rounded-full text-[12px] font-bold border transition-all ${
                          audience === aud 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-slate-50 text-slate-600 border-transparent'
                        }`}
                      >
                        {aud}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Attachments & Actions */}
              <div className="flex items-center gap-3">
                <button className="flex-1 bg-white border border-slate-200 py-4 rounded-[20px] font-bold text-[15px] flex items-center justify-center gap-2 active:bg-slate-50 transition-colors">
                  <Paperclip className="h-5 w-5" /> Attachment
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!title || !desc || isSending}
                  className="flex-[2] bg-emerald-600 disabled:opacity-50 text-white py-4 rounded-[20px] font-black text-[16px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 relative overflow-hidden"
                >
                  {isSending ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Clock className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <>
                      <Send className="h-5 w-5" /> Send Notice
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group active:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                      item.priority === 'Urgent' ? 'bg-red-50 text-red-600' : 
                      item.priority === 'High' ? 'bg-orange-50 text-orange-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {item.priority}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">{item.date}</span>
                  </div>
                  <h4 className="text-[16px] font-black text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-[13px] text-slate-500 font-medium line-clamp-2 mb-4 leading-relaxed">{item.desc}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">{item.audience}</span>
                    </div>
                    <button className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      Details <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {history.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                   <div className="h-20 w-20 bg-slate-50 rounded-[30px] flex items-center justify-center mb-4">
                     <History className="h-10 w-10 text-slate-200" />
                   </div>
                   <h3 className="text-[17px] font-black text-slate-800">No Notice History</h3>
                   <p className="text-[13px] text-slate-400 font-bold max-w-[200px]">Send your first notice to see them here.</p>
                </div>
              )}
            </div>
          )}
        </div>
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
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h4 className="text-[16px] font-black">Notice Sent Successfully!</h4>
              <p className="text-[13px] text-emerald-50 font-bold">Successfully broadcasted to selected audience.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
