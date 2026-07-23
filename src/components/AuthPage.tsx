import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { safeFetch } from '../utils/api';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  Sparkles, 
  Info, 
  HelpCircle, 
  ArrowLeft, 
  ShieldCheck, 
  Timer, 
  RefreshCw,
  User,
  Send,
  CheckCircle2,
  LockKeyhole
} from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: () => void;
  onOfflineToggle?: () => void;
}

// 3D Graduation Student Illustration Component
const GraduationStudentIllustration = () => (
  <div className="relative w-28 h-32 md:w-36 md:h-40 shrink-0 flex items-center justify-center select-none pointer-events-none">
    {/* Soft glowing aura */}
    <div className="absolute inset-0 bg-emerald-300/30 rounded-full blur-2xl animate-pulse" />
    
    <svg className="w-full h-full drop-shadow-2xl relative z-10" viewBox="0 0 200 230" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Graduation Cap */}
      <polygon points="100,20 175,48 100,72 25,48" fill="#0F172A" />
      <polygon points="100,26 165,48 100,68 35,48" fill="#1E293B" />
      <rect x="84" y="48" width="32" height="26" rx="4" fill="#0F172A" />
      {/* Cap Tassel */}
      <path d="M165 48 L172 90 L167 115" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="167" cy="118" r="5.5" fill="#F59E0B" />
      
      {/* Head & Skin */}
      <circle cx="100" cy="88" r="34" fill="#FDBA74" />
      {/* Hair */}
      <path d="M68 78 C68 56, 132 56, 132 78 C122 66, 78 66, 68 78 Z" fill="#291D18" />
      {/* Eyes */}
      <circle cx="86" cy="88" r="4.5" fill="#1E293B" />
      <circle cx="114" cy="88" r="4.5" fill="#1E293B" />
      <circle cx="88" cy="86" r="1.8" fill="#FFFFFF" />
      <circle cx="116" cy="86" r="1.8" fill="#FFFFFF" />
      {/* Eyebrows */}
      <path d="M80 80 Q86 76 92 80" stroke="#291D18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M108 80 Q114 76 120 80" stroke="#291D18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <circle cx="78" cy="94" r="5" fill="#F97316" fillOpacity="0.25" />
      <circle cx="122" cy="94" r="5" fill="#F97316" fillOpacity="0.25" />
      {/* Smile */}
      <path d="M90 102 Q100 112 110 102" stroke="#C2410C" strokeWidth="3" strokeLinecap="round" fill="none" />
      
      {/* Body & Emerald Hoodie */}
      <path d="M52 126 C52 114, 148 114, 148 126 L164 218 L36 218 Z" fill="#16A34A" />
      <path d="M68 126 L100 158 L132 126" stroke="#15803D" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      
      {/* Backpack Straps */}
      <path d="M62 130 L54 200" stroke="#065F46" strokeWidth="9" strokeLinecap="round" />
      <path d="M138 130 L146 200" stroke="#065F46" strokeWidth="9" strokeLinecap="round" />
      
      {/* Books Held */}
      <rect x="112" y="148" width="50" height="60" rx="5" fill="#0284C7" transform="rotate(-12 112 148)" />
      <rect x="117" y="151" width="45" height="54" rx="4" fill="#38BDF8" transform="rotate(-12 117 151)" />
      <rect x="114" y="149" width="7" height="58" fill="#0369A1" transform="rotate(-12 114 149)" />
      <line x1="128" y1="170" x2="152" y2="165" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  </div>
);

// Helper function to mask email nicely
const maskEmail = (str: string) => {
  if (!str) return 'w***********@gmail.com';
  const parts = str.split('@');
  if (parts.length !== 2) return str;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  const maskedName = name[0] + '*'.repeat(Math.max(name.length - 2, 8)) + name[name.length - 1];
  return `${maskedName}@${domain}`;
};

export default function AuthPage({ onAuthSuccess, onOfflineToggle }: AuthPageProps) {
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Verification States
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  
  // 6 separate OTP box digits
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(60); // 60s resend timer
  const [expiryTimer, setExpiryTimer] = useState(300); // 5 minutes code expiry

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend (60s) and expiry (300s)
  useEffect(() => {
    if (step !== 'otp') return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setExpiryTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Format expiry timer into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-redirect if already authenticated and not on pending OTP step
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && step !== 'otp') {
        onAuthSuccess();
      }
    });
    return () => unsubscribe();
  }, [onAuthSuccess, step]);

  // Auto focus first OTP input when stepping into OTP view
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Requesting OTP from backend
  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (authMode === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    } else if (authMode === 'signin') {
      if (!password) {
        setError('Please enter your password.');
        return;
      }
    }

    setLoading(true);
    
    try {
      if (authMode === 'signin') {
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, password);
          await signOut(auth);
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            let isUserFound = true;
            try {
              const usersRef = collection(db, 'users');
              const q = query(usersRef, where('email', '==', cleanEmail));
              const snap = await getDocs(q);
              if (snap.empty) {
                isUserFound = false;
              }
            } catch (firestoreErr) {
              console.warn("Firestore lookup failed during signin check:", firestoreErr);
              // Fallback: assume user might exist if error is permission-denied
            }

            if (!isUserFound) {
              setError('Email is not registered. Please create a new account.');
              setLoading(false);
              setTimeout(() => {
                setAuthMode('signup');
                setError('');
              }, 2000);
              return;
            } else {
              setError('Incorrect password. Please check your credentials.');
              setLoading(false);
              return;
            }
          } else if (err.code === 'auth/wrong-password') {
            setError('Incorrect password. Please try again.');
            setLoading(false);
            return;
          }
          throw err;
        }
      } else if (authMode === 'signup') {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', cleanEmail));
          const snap = await getDocs(q);

          if (!snap.empty) {
            setError('This email is already registered. Please Sign In.');
            setLoading(false);
            setTimeout(() => {
              setAuthMode('signin');
              setError('');
            }, 2000);
            return;
          }
        } catch (firestoreErr) {
          console.warn("Firestore lookup failed during signup check:", firestoreErr);
        }
      }

      // Secure Backend API Call to dispatch 6-digit OTP via Nodemailer
      const result = await safeFetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, action: authMode }),
      });
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to dispatch verification email.');
      }

      setSuccess('OTP Sent Successfully');
      setStep('otp');
      setTimer(60);
      setExpiryTimer(300);
      setDigits(['', '', '', '', '', '']);
      setOtpCode('');
    } catch (err: any) {
      console.error("Verification Request Error:", err);
      let friendlyError = err.message || 'Failed to send verification code.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        friendlyError = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/wrong-password') {
        friendlyError = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'Please enter a valid email address.';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  // Verifying OTP via backend
  const executeVerify = async (codeToVerify: string) => {
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();

    if (!codeToVerify || codeToVerify.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const result = await safeFetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: codeToVerify }),
      });

      if (!result.success) {
        throw new Error(result.message || 'Invalid verification code.');
      }

      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        setSuccess('Logged in successfully!');
        setTimeout(() => {
          onAuthSuccess();
        }, 500);
      } else if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        const isAdmin = ['admin@edumanager.com', 'laxmikormokar70@gmail.com'].includes(cleanEmail);
        const initialProfile = {
          uid: user.uid,
          email: user.email!,
          fullName: fullName.trim() || 'User',
          name: fullName.trim() || 'User',
          phone: '',
          schoolName: isAdmin ? 'Hridoy Coaching Admin Hub' : '',
          coachingName: '',
          address: '',
          city: '',
          state: '',
          postalPinCode: '',
          profilePhoto: '',
          bannerPhoto: '',
          isProfileComplete: isAdmin,
          profileCompleted: isAdmin,
          approvalStatus: isAdmin ? 'approved' : 'pending',
          status: isAdmin ? 'approved' : 'pending',
          role: isAdmin ? 'admin' : 'teacher',
          adminPasswordChanged: isAdmin,
          registrationDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), initialProfile);

        try {
          await safeFetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toEmail: user.email,
              type: 'welcome_signup',
              data: {
                email: user.email,
                name: fullName.trim()
              }
            })
          });
        } catch (emailErr) {
          console.warn("Welcome notification dispatch failed:", emailErr);
        }

        setSuccess('Account created successfully! Welcome to Hridoy Coaching.');
        setTimeout(() => {
          onAuthSuccess();
        }, 1000);
      } else if (authMode === 'forgot') {
        await sendPasswordResetEmail(auth, cleanEmail);
        setSuccess('OTP Verified! Password reset link dispatched to your email.');
        setTimeout(() => {
          setAuthMode('signin');
          setStep('input');
          setError('');
          setSuccess('');
        }, 3500);
      }

    } catch (err: any) {
      console.error("Verification confirmation failed:", err);
      let friendlyError = err.message || 'Verification failed.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'An account with this email address already exists.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'The password must be at least 6 characters.';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpForm = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerify(digits.join(''));
  };

  // OTP Box navigation handlers
  const handleDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    const combined = newDigits.join('');
    setOtpCode(combined);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every(d => d !== '') && combined.length === 6) {
      executeVerify(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const arr = pasted.split('');
      while (arr.length < 6) arr.push('');
      setDigits(arr);
      setOtpCode(pasted);
      if (pasted.length === 6) {
        inputRefs.current[5]?.focus();
        executeVerify(pasted);
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (timer > 0 || isResending) return;
    setError('');
    setSuccess('');
    setIsResending(true);
    try {
      const result = await safeFetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), action: authMode }),
      });
      if (!result.success) {
        throw new Error(result.message || 'Failed to dispatch verification code.');
      }
      setSuccess('Verification code resent successfully!');
      setTimer(60);
      setExpiryTimer(300);
      setDigits(['', '', '', '', '', '']);
      setOtpCode('');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col items-center justify-start font-sans relative overflow-x-hidden pb-12">
      
      {/* 1. TOP BANNER: Ultra-Premium Emerald Green Gradient Banner */}
      <div className="w-full bg-gradient-to-br from-[#0B6636] via-[#16A34A] to-[#0A522B] pt-8 pb-16 px-6 sm:px-8 rounded-b-[40px] md:rounded-b-[50px] shadow-lg shadow-emerald-900/10 relative overflow-hidden flex flex-col justify-between min-h-[220px] sm:min-h-[250px]">
        
        {/* Security Shield Watermark Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
          <ShieldCheck className="w-[320px] h-[320px] text-white stroke-[1]" />
        </div>
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar with Back Button */}
        <div className="w-full max-w-lg mx-auto flex items-center justify-between relative z-10 mb-4">
          {step === 'otp' ? (
            <button
              onClick={() => {
                setStep('input');
                setError('');
                setSuccess('');
              }}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xs font-black text-white/90 uppercase tracking-widest font-mono">
                Hridoy Coaching
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-emerald-950/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-bold text-white/90">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            <span>Secure 256-bit ERP</span>
          </div>
        </div>

        {/* Banner Content & 3D Student Illustration */}
        <div className="w-full max-w-lg mx-auto flex items-center justify-between gap-4 relative z-10 my-auto">
          <div className="space-y-1 text-left max-w-[240px] sm:max-w-[280px]">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {step === 'otp' 
                ? 'Verify Your Email' 
                : (authMode === 'signin' 
                  ? 'Welcome Back!' 
                  : (authMode === 'signup' ? 'Create Account' : 'Reset Password'))}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-emerald-100/90 leading-relaxed">
              {step === 'otp'
                ? 'Enter the 6-digit verification code sent to your email.'
                : (authMode === 'signin'
                  ? 'Glad to see you again. Please login to continue.'
                  : (authMode === 'signup' ? 'Join thousands of students and start your journey.' : 'We will send a code to recover your account.'))}
            </p>
          </div>

          {/* 3D Student Character Graphic */}
          <GraduationStudentIllustration />
        </div>
      </div>

      {/* 2. FLOATING WHITE CARD: Ultra-Smooth iOS + Material 3 Container */}
      <div className="w-full max-w-lg px-4 sm:px-6 relative z-20 -mt-8 sm:-mt-10">
        
        {/* Unified feedback messages */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-4 p-4 bg-red-50 border border-red-200/80 text-red-700 text-xs rounded-2xl font-bold flex items-start gap-2.5 shadow-sm"
          >
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-4 p-4 bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs rounded-2xl font-bold flex items-start gap-2.5 shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{success}</span>
          </motion.div>
        )}

        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-[28px] sm:rounded-[32px] shadow-xl shadow-slate-900/5 border border-slate-200/80 p-6 sm:p-8 backdrop-blur-xl"
        >
          <AnimatePresence mode="wait">
            {step === 'otp' ? (
              /* OTP VERIFICATION VIEW */
              <motion.div
                key="otp_step_view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 text-center"
              >
                {/* Floating Green Email Badge */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center border border-emerald-100 shadow-inner relative mb-3">
                    <Mail className="h-7 w-7 stroke-[2]" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#16A34A] rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-500">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="text-sm font-extrabold text-[#16A34A] mt-0.5 break-all">
                    {maskEmail(email)}
                  </p>
                </div>

                {/* 6 Large OTP Boxes with Auto-Advance, Auto-Backspace, Auto-Paste */}
                <form onSubmit={handleVerifyOtpForm} className="space-y-6">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 my-2" onPaste={handlePaste}>
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`w-11 h-14 sm:w-13 sm:h-16 rounded-2xl text-center text-2xl font-black transition-all outline-none border-2 ${
                          digit 
                            ? 'bg-white border-[#16A34A] text-[#16A34A] shadow-md shadow-emerald-500/10 scale-105' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#16A34A] focus:bg-white focus:ring-4 focus:ring-emerald-500/10'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Resend Timer Text */}
                  <div className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5">
                    <span>Didn’t receive the code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={timer > 0 || isResending}
                      className={`font-bold transition-colors cursor-pointer ${
                        timer > 0 
                          ? 'text-slate-400 cursor-not-allowed' 
                          : 'text-[#16A34A] hover:text-[#15803D] hover:underline'
                      }`}
                    >
                      {isResending ? (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Sending...
                        </span>
                      ) : (
                        `Resend OTP ${timer > 0 ? `(${timer}s)` : ''}`
                      )}
                    </button>
                  </div>

                  {/* Security Box */}
                  <div className="border border-emerald-200/90 bg-emerald-50/60 rounded-2xl p-4 text-left flex items-start gap-3">
                    <ShieldCheck className="h-6 w-6 text-[#16A34A] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-extrabold text-slate-900">Your security is our priority</h4>
                      <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                        Never share your verification code with anyone. Our team will never ask for it.
                      </p>
                    </div>
                  </div>

                  {/* Main Action Button */}
                  <button
                    type="submit"
                    disabled={loading || digits.join('').length !== 6}
                    className="w-full py-4 bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#0F6B32] disabled:opacity-50 text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Verify & Continue</span>
                      </>
                    )}
                  </button>

                  {/* Expiry indicator */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold pt-1">
                    <LockKeyhole className="h-3.5 w-3.5 text-slate-400" />
                    <span>This code will expire in <strong className="text-slate-700 font-bold">{formatTime(expiryTimer)}</strong> minutes</span>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* LOGIN / REGISTER / FORGOT FORM VIEW */
              <motion.div
                key="input_step_view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                {/* Segmented Controller Mode Switching Tabs */}
                {authMode !== 'forgot' && (
                  <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setError('');
                        setSuccess('');
                      }}
                      className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                        authMode === 'signin'
                          ? 'bg-white text-[#16A34A] shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setError('');
                        setSuccess('');
                      }}
                      className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                        authMode === 'signup' 
                          ? 'bg-white text-[#16A34A] shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Register
                    </button>
                  </div>
                )}

                {/* Main Auth Form */}
                <form onSubmit={handleRequestVerification} className="space-y-4">
                  {/* Full Name field (only for signup) */}
                  {authMode === 'signup' && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all"
                        placeholder="Full Name"
                      />
                    </div>
                  )}

                  {/* Gmail Address field */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all"
                      placeholder="Gmail Address"
                    />
                  </div>

                  {/* Password field */}
                  {authMode !== 'forgot' && (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all"
                          placeholder="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      {/* Forgot Password link */}
                      {authMode === 'signin' && (
                        <div className="flex justify-end pt-0.5 pr-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('forgot');
                              setError('');
                              setSuccess('');
                            }}
                            className="text-xs font-bold text-[#16A34A] hover:text-[#15803D] hover:underline transition-colors cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confirm Password field (only for signup) */}
                  {authMode === 'signup' && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all"
                        placeholder="Confirm Password"
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#0F6B32] text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        authMode === 'signin' 
                          ? 'Continue & Send OTP' 
                          : (authMode === 'signup' ? 'Create Account & Send OTP' : 'Send Recovery Code')
                      )}
                    </button>
                  </div>

                  {/* Back to Login link when in Forgot Password mode */}
                  {authMode === 'forgot' && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signin');
                          setError('');
                          setSuccess('');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Login</span>
                      </button>
                    </div>
                  )}
                </form>

                {/* Footer Security Note */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                  <span>Secure & Protected • Your data is safe with us</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 3. BOTTOM HELP LINK */}
        <div className="text-center mt-6">
          <a
            href="mailto:support@edumanager.com"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#16A34A] transition-colors cursor-pointer"
          >
            <HelpCircle className="h-4 w-4 text-[#16A34A]" />
            <span>Need help? Contact Support</span>
          </a>
        </div>

      </div>
    </div>
  );
}

