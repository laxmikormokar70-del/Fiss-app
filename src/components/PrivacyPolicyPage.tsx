import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white font-sans pb-12">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center gap-4 border-b border-slate-100">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-slate-700" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Privacy Policy</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6 text-slate-700">
        <h2 className="text-xl font-bold text-slate-900">Our Commitment</h2>
        <p>We value your privacy and are committed to protecting your personal information. This privacy policy explains how we collect, use, and share your data.</p>
        
        <h2 className="text-xl font-bold text-slate-900">Information We Collect</h2>
        <p>We collect information you provide directly to us, such as your profile details, student data, and support requests.</p>
        
        <h2 className="text-xl font-bold text-slate-900">How We Use Information</h2>
        <p>We use your information to provide and improve our services, manage your account, and communicate with you.</p>
      </div>
    </div>
  );
}
