import React, { useState } from 'react';
import { Lock, Delete, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface PinLockScreenProps {
  savedPin: string;
  onUnlockSuccess: () => void;
  teacherName: string;
}

export default function PinLockScreen({ savedPin, onUnlockSuccess, teacherName }: PinLockScreenProps) {
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 4) {
      const newVal = enteredPin + num;
      setEnteredPin(newVal);
      setError(false);
      
      if (newVal === savedPin) {
        // Delay unlocking slightly for a satisfying sensory feedback
        setTimeout(() => {
          onUnlockSuccess();
        }, 300);
      } else if (newVal.length === 4) {
        // Wrong PIN
        setTimeout(() => {
          setError(true);
          setEnteredPin('');
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    if (enteredPin.length > 0) {
      setEnteredPin(enteredPin.slice(0, -1));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-4">
      <div className="max-w-md w-full bg-white rounded-[16px] border border-slate-100 shadow-xl p-8 flex flex-col items-center">
        
        {/* App Lock Icon */}
        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-7 w-7" />
        </div>

        <h2 className="text-[28px] font-bold text-slate-900 font-display text-center">App is Locked</h2>
        <p className="text-[15px] text-slate-500 mt-1 mb-8 text-center">
          Welcome back, {teacherName || 'Teacher'}. Enter your 4-digit security PIN to unlock.
        </p>

        {/* PIN Indicators */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map((index) => {
            const hasValue = enteredPin.length > index;
            return (
              <motion.div
                key={index}
                animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`h-5 w-5 rounded-full border-2 transition-all duration-150 ${
                  error 
                    ? 'border-red-500 bg-red-100' 
                    : hasValue 
                    ? 'border-blue-600 bg-blue-600' 
                    : 'border-slate-300 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium mb-4 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" /> Incorrect PIN. Please try again.
          </p>
        )}

        {/* Custom Numeric Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-16 w-16 text-xl font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {num}
            </button>
          ))}
          
          {/* Backspace */}
          <button
            onClick={handleDelete}
            className="h-16 w-16 text-slate-500 bg-transparent hover:bg-slate-50 rounded-full flex items-center justify-center transition-all focus:outline-none cursor-pointer"
          >
            <Delete className="h-6 w-6" />
          </button>

          {/* Zero */}
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 w-16 text-xl font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            0
          </button>

          {/* Help Indicator */}
          <div className="h-16 w-16 flex items-center justify-center text-xs text-slate-400 font-mono">
            PIN
          </div>
        </div>

        {/* Hint for developers/testing */}
        <p className="text-[10px] text-slate-400 mt-6 font-mono">
          Demo Hint: default pin is saved in settings if enabled.
        </p>
      </div>
    </div>
  );
}
