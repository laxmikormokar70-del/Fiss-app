import React, { useState } from 'react';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { TeacherProfile } from '../types';

interface SupportTicketPageProps {
  teacherProfile: TeacherProfile | null;
  onBack: () => void;
}

export default function SupportTicketPage({ teacherProfile, onBack }: SupportTicketPageProps) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherProfile) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        teacherId: teacherProfile.uid,
        teacherName: teacherProfile.name,
        teacherEmail: teacherProfile.email,
        subject,
        category,
        description,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      onBack();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-12">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center gap-4 border-b border-slate-100">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6 text-slate-700" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Create Support Ticket</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-4">
        <input 
          type="text" 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)} 
          placeholder="Subject" 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl" 
          required 
        />
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)} 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl"
        >
          <option>General</option>
          <option>Technical Issue</option>
          <option>Billing</option>
        </select>
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Description" 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl h-32" 
          required 
        />
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5" />}
          Submit Ticket
        </button>
      </form>
    </div>
  );
}
