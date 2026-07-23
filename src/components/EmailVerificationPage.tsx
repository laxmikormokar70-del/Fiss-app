import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { motion } from 'motion/react';
import { Mail, ShieldCheck, RefreshCw, LogOut, Loader2, ArrowRight } from 'lucide-react';

interface EmailVerificationPageProps {
  onVerified: () => void;
  onLogout: () => void;
}

export default function EmailVerificationPage({ onVerified, onLogout }: EmailVerificationPageProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Countdown Timer for Resend Button
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // 2. Automatic Detection (Poll every 5 seconds)
  useEffect(() => {
    const checkVerification = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          await user.reload();
          if (user.emailVerified) {
            onVerified();
          }
        } catch (err: any) {
          // Gracefully swallow network request failures or log as warning to prevent console errors
          if (err?.code === 'auth/network-request-failed' || err?.message?.includes('network-request-failed')) {
            console.warn("Auto verification check paused due to a transient network condition.");
          } else {
            console.warn("Auto verification check encountered an issue:", err);
          }
        }
      }
    };

    // Run immediately and then set interval
    checkVerification();
    const interval = setInterval(checkVerification, 5000);

    return () => clearInterval(interval);
  }, [onVerified]);

  // Send a new verification email
  const handleResend = async () => {
    if (timeLeft > 0) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setSuccess('Verification link successfully sent to your email.');
        setTimeLeft(60);
      } else {
        setError('No authenticated user found. Please log in.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Manual Check Button
  const handleManualCheck = async () => {
    setError('');
    setSuccess('');
    setChecking(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          setSuccess('Email verified successfully!');
          setTimeout(() => {
            onVerified();
          }, 1000);
        } else {
          setError('Email is still unverified. Please check your inbox or try resending.');
        }
      } else {
        setError('No active session found.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification check failed.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 p-8 rounded-[24px] shadow-xl max-w-md w-full border border-slate-100 dark:border-slate-700/50 space-y-6"
      >
        {/* Visual Badge Header */}
        <div className="text-center space-y-3">
          <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-900/20 text-[#16A34A] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Mail className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Email Verification</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              We've sent a verification link to <span className="font-bold text-slate-700 dark:text-slate-200">{auth.currentUser?.email}</span>
            </p>
          </div>
        </div>

        {/* Messaging Feedback */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-xl font-medium"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl font-medium"
          >
            {success}
          </motion.div>
        )}

        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
          <p className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold">Auto Verification Status</p>
          <div className="flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#16A34A]" />
            <span className="text-xs font-semibold">Listening for email verification...</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-emerald-100 dark:shadow-none"
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking inbox...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                I Verified My Email
              </>
            )}
          </button>

          <button
            onClick={handleResend}
            disabled={timeLeft > 0 || loading}
            className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              timeLeft > 0 
                ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-white dark:bg-slate-800 border-[#16A34A]/20 dark:border-[#16A34A]/30 text-[#16A34A] hover:bg-emerald-50/50'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>
              {timeLeft > 0 ? `Resend Verification Link (${timeLeft}s)` : 'Resend Verification Link'}
            </span>
          </button>
        </div>

        {/* Separation / Sign out option */}
        <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4 text-center">
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-semibold cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out & Try Another Account</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
