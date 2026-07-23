import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { TeacherProfile } from '../types';
import { 
  Camera, 
  CheckCircle, 
  User, 
  Upload, 
  X, 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  School, 
  GraduationCap, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  Download, 
  Printer, 
  FileDown, 
  FileImage, 
  Info, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { saveLocalStudentImage } from '../utils/localImageStore';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface StudentRegisterPageProps {
  teacherId: string;
  initialClassId: string | null;
  initialBatchId: string | null;
}

export default function StudentRegisterPage({ teacherId, initialClassId, initialBatchId }: StudentRegisterPageProps) {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1); // Step 1: Class & Batch, Step 2: Info, Step 3: Preview, Step 4: Success ID Card

  // Step 1 States
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || '');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId || '');
  const [selectedClassData, setSelectedClassData] = useState<any | null>(null);
  const [batchStudentCounts, setBatchStudentCounts] = useState<Record<string, number>>({});

  // Step 2 Form States
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Boy' | 'Girl' | ''>('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Submission & Validation States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [assignedRoll, setAssignedRoll] = useState('');
  const [registeredStudentId, setRegisteredStudentId] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Load teacher details and classes
  useEffect(() => {
    async function fetchData() {
      try {
        const teacherDoc = await getDoc(doc(db, 'users', teacherId));
        if (!teacherDoc.exists()) throw new Error('Admission Portal is temporarily unavailable or link is invalid.');
        const teacherData = teacherDoc.data() as TeacherProfile;
        setTeacher(teacherData);

        // Fetch all classes created by this teacher
        const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
        const classesSnapshot = await getDocs(classesQuery);
        const classesList: any[] = [];
        classesSnapshot.forEach(doc => classesList.push({ id: doc.id, ...doc.data() }));
        setAvailableClasses(classesList);

        if (initialClassId) {
          const cls = classesList.find(c => c.id === initialClassId);
          if (cls) {
            setSelectedClassData(cls);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load admission details.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [teacherId, initialClassId]);

  // Load seats and student counts for batches dynamically in real-time
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchBatchCounts = async () => {
      const cls = availableClasses.find(c => c.id === selectedClassId);
      if (!cls) return;
      setSelectedClassData(cls);

      const counts: Record<string, number> = {};
      for (const batch of (cls.batches || [])) {
        const batchIdSafe = (batch.id || batch.name).toLowerCase().replace(/\s+/g, '-');
        try {
          const snap = await getDocs(
            collection(db, 'users', teacherId, 'classes', selectedClassId, 'batches', batchIdSafe, 'students')
          );
          counts[batch.name] = snap.size;
        } catch (e) {
          counts[batch.name] = 0;
        }
      }
      setBatchStudentCounts(counts);
    };

    fetchBatchCounts();
  }, [selectedClassId, availableClasses, teacherId]);

  // Step 1 Validation
  const isStep1Valid = !!selectedClassId && !!selectedBatchId;

  // Step 2 Validation
  const isStep2Valid = 
    !!photoUrl &&
    !!name.trim() &&
    !!fatherName.trim() &&
    !!motherName.trim() &&
    !!studentPhone.trim() &&
    !!guardianPhone.trim() &&
    !!dob &&
    !!gender &&
    !!bloodGroup &&
    !!schoolName.trim() &&
    !!address.trim() &&
    !!city.trim() &&
    !!pinCode.trim();

  // Photo Handling & Compression
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }
      setError('');
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setError('');
      setShowCamera(true);
      setTimeout(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 400, height: 400, facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        mediaStreamRef.current = stream;
      }, 300);
    } catch (err) {
      setError("Unable to access camera. Please upload a photo instead.");
      setShowCamera(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 400, 400);
        setPhotoUrl(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    mediaStreamRef.current = null;
    setShowCamera(false);
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const uploadPhotoFile = async (file: File): Promise<string> => {
    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 400, useWebWorker: false };
    let compressedFile = file;
    try { 
      compressedFile = await imageCompression(file, options); 
    } catch (e) {
      console.warn("Compression bypassed, using original:", e);
    }
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(compressedFile);
    });
  };

  // Perform Admission Validations
  const validateStudentDetails = async (): Promise<boolean> => {
    setError('');
    const safeClassId = selectedClassId;
    const safeBatchId = selectedBatchId.toLowerCase().replace(/\s+/g, '-');
    const studentsCollRef = collection(db, 'users', teacherId, 'classes', safeClassId, 'batches', safeBatchId, 'students');

    try {
      const snapshot = await getDocs(studentsCollRef);
      const studentsList = snapshot.docs.map(doc => doc.data());

      // 1. Prevent duplicate Phone Number
      const phoneExists = studentsList.some(s => s.mobileNumber === studentPhone.trim() || s.studentPhone === studentPhone.trim());
      if (phoneExists) {
        setError('This Student Phone Number is already registered in this batch.');
        return false;
      }

      // 2. Prevent Duplicate Student Name + DOB in the same batch
      const nameDobExists = studentsList.some(s => 
        s.name?.toLowerCase().trim() === name.trim().toLowerCase() && 
        s.dob === dob
      );
      if (nameDobExists) {
        setError('A student with the same Name and Date of Birth is already registered in this batch.');
        return false;
      }

      // 3. Prevent Duplicate Admission (Same name & same parent/phone/address combo)
      const duplicateAdmission = studentsList.some(s => 
        s.name?.toLowerCase().trim() === name.trim().toLowerCase() && 
        (s.fatherName?.toLowerCase().trim() === fatherName.trim().toLowerCase() || s.studentPhone === studentPhone.trim())
      );
      if (duplicateAdmission) {
        setError('This student has already been admitted to this batch.');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Validation fetch failed, assuming unique local state:', err);
      return true;
    }
  };

  // Move from Step 2 to Step 3 with full database validation checks
  const handleNextToStep3 = async () => {
    if (!isStep2Valid) {
      setError('Please fill in all student information fields and take/upload a photo.');
      return;
    }

    setSubmitting(true);
    const isValid = await validateStudentDetails();
    setSubmitting(false);

    if (isValid) {
      setCurrentStep(3);
    }
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    setError('');
    setSubmitting(true);

    try {
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        finalPhotoUrl = await uploadPhotoFile(photoFile);
      } else if (photoUrl && photoUrl.startsWith('data:')) {
        finalPhotoUrl = await uploadPhotoFile(dataURLtoFile(photoUrl, `student_${Date.now()}.jpg`));
      }

      const studentId = `student-${Date.now()}`;
      let localPhotoToken = '';
      if (finalPhotoUrl) {
        localPhotoToken = await saveLocalStudentImage(studentId, finalPhotoUrl);
      }

      const safeClassId = selectedClassId;
      const safeBatchId = selectedBatchId.toLowerCase().replace(/\s+/g, '-');
      const studentsCollRef = collection(db, 'users', teacherId, 'classes', safeClassId, 'batches', safeBatchId, 'students');

      // Unique Roll Number Logic: lowest unused positive integer
      const snapshot = await getDocs(studentsCollRef);
      const existingRolls = new Set<number>();
      snapshot.forEach(doc => {
        const roll = parseInt(doc.data().rollNumber || '', 10);
        if (!isNaN(roll) && roll > 0) {
          existingRolls.add(roll);
        }
      });

      let generatedRollNum = 1;
      while (existingRolls.has(generatedRollNum)) {
        generatedRollNum++;
      }
      const finalRoll = String(generatedRollNum);

      const batchObj = selectedClassData?.batches?.find((b: any) => b.name === selectedBatchId);
      const timeStr = batchObj?.time || batchObj?.schedules?.[0]?.startTime || '';

      const studentPayload = {
        id: studentId,
        studentId: studentId,
        teacherId,
        classId: selectedClassId,
        className: selectedClassData?.className || 'Unknown Class',
        class: selectedClassData?.className || 'Unknown Class',
        batchId: selectedBatchId,
        batch: selectedBatchId,
        time: timeStr,
        name: name.trim(),
        studentName: name.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        studentPhone: studentPhone.trim(),
        mobileNumber: studentPhone.trim(),
        phone: studentPhone.trim(),
        guardianPhone: guardianPhone.trim(),
        dob,
        gender,
        bloodGroup,
        schoolName: schoolName.trim(),
        address: address.trim(),
        city: city.trim(),
        pinCode: pinCode.trim(),
        photo: localPhotoToken || finalPhotoUrl || '',
        photoUrl: localPhotoToken || finalPhotoUrl || '',
        rollNumber: finalRoll,
        studentUniqueId: studentId,
        createdAt: new Date().toISOString(),
        status: 'Active'
      };

      const studentRef = doc(db, 'users', teacherId, 'classes', safeClassId, 'batches', safeBatchId, 'students', studentId);
      await setDoc(studentRef, studentPayload);

      setAssignedRoll(finalRoll);
      setRegisteredStudentId(studentId);
      setAdmissionDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      setCurrentStep(4);
    } catch (err: any) {
      console.error("Admission system submission failure:", err);
      setError(err.message || 'Admission failed. Please check details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ID Card Vector Barcode SVG Generator
  const BarcodeSVG = ({ value }: { value: string }) => {
    const code = Array.from(value).map(char => char.charCodeAt(0).toString(2)).join('');
    const bars = [];
    let x = 10;
    for (let i = 0; i < Math.min(code.length, 65); i++) {
      const isDark = code[i] === '1';
      const width = isDark ? (i % 3 === 0 ? 3 : 1) : (i % 2 === 0 ? 2 : 1);
      if (isDark) {
        bars.push(<rect key={i} x={x} y={5} width={width} height={32} fill="black" />);
      }
      x += width + (isDark ? 1 : 2);
    }
    return (
      <svg viewBox={`0 0 ${x + 10} 46`} className="w-full h-11" id="barcode-element">
        {bars}
        <text x="50%" y="43" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#334155" className="tracking-widest font-bold">
          {value.toUpperCase()}
        </text>
      </svg>
    );
  };

  // Downloads & Actions for ID Card
  const downloadIDCardImage = async () => {
    const element = document.getElementById('student-id-card-display');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `ID_Card_${name.replace(/\s+/g, '_')}_Roll_${assignedRoll}.png`;
      link.click();
    } catch (e) {
      console.error("Image generation failed:", e);
    }
  };

  const downloadIDCardPDF = async () => {
    const element = document.getElementById('student-id-card-display');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      
      // Calculate standard card size centered beautifully
      const imgWidth = 85.6; // Standard CR80 width in mm
      const imgHeight = 125; // standard vertical card height
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      // Card boundary box
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.2);
      pdf.line(x - 5, y - 5, x + imgWidth + 5, y - 5);
      pdf.line(x - 5, y - 5, x - 5, y + imgHeight + 5);
      pdf.line(x + imgWidth + 5, y - 5, x + imgWidth + 5, y + imgHeight + 5);
      pdf.line(x - 5, y + imgHeight + 5, x + imgWidth + 5, y + imgHeight + 5);

      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Official Student Identity Card", pageWidth / 2, y - 10, { align: "center" });

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`ID_Card_${name.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
    }
  };

  const handlePrintIDCard = () => {
    const printContent = document.getElementById('student-id-card-display')?.outerHTML;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Student ID - ${name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #ffffff; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body class="bg-white flex justify-center items-center min-h-screen p-6">
            <div class="border border-slate-200 rounded-[24px] p-2 bg-white max-w-[340px] w-full">
              ${printContent}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4FBF7] flex flex-col items-center justify-center p-4">
        <Loader2 className="h-11 w-11 text-[#16A34A] animate-spin mb-4" />
        <p className="text-slate-900 font-extrabold text-[15px] tracking-wide">Connecting to Admission Server...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4FBF7] text-[#111111] font-sans pb-36">
      {/* 1. Portal Hero Header & Brand Info */}
      <div className="bg-gradient-to-br from-[#15803D] to-[#064E3B] text-white py-12 px-5 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4 animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            <span className="text-[10px] font-black tracking-widest uppercase">Verified Institution Portal</span>
          </div>
          
          <h1 className="text-3xl font-black tracking-tight leading-tight uppercase">
            {teacher?.schoolName || 'Elite Coaching Institute'}
          </h1>
          
          <p className="text-emerald-100/90 text-sm font-bold mt-2 tracking-wide flex items-center justify-center gap-1.5">
            <School className="h-4.5 w-4.5 text-emerald-300" />
            Director: <span className="text-white font-extrabold">{teacher?.name || 'Class Instructor'}</span>
          </p>
          
          <div className="mt-5 text-emerald-200 text-xs font-semibold max-w-sm mx-auto leading-relaxed">
            Welcome to our premium online registration portal. Complete the quick steps below to secure your admission.
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-xl mx-auto px-4 -mt-8 relative z-20">
        
        {/* Step Indicator Wizard (No tabs, clean indicator) */}
        {currentStep < 4 && (
          <div className="bg-white rounded-[24px] shadow-lg border border-slate-100 p-5 mb-5">
            <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
              <span className={currentStep === 1 ? 'text-[#15803D]' : ''}>1. Classes</span>
              <span className={currentStep === 2 ? 'text-[#15803D]' : ''}>2. Student Info</span>
              <span className={currentStep === 3 ? 'text-[#15803D]' : ''}>3. Review</span>
            </div>
            
            {/* Step Bar progress */}
            <div className="flex items-center w-full gap-1.5">
              <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-[#15803D]' : 'bg-slate-100'}`}></div>
              <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-[#15803D]' : 'bg-slate-100'}`}></div>
              <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-[#15803D]' : 'bg-slate-100'}`}></div>
            </div>
            
            <p className="text-[11px] text-slate-500 font-bold mt-3 text-center">
              Step {currentStep} of 3 • {currentStep === 1 ? 'Select your Class and Batch timings' : currentStep === 2 ? 'Provide student contact and personal details' : 'Verify entered details before final submission'}
            </p>
          </div>
        )}

        {/* Dynamic Error Message Box */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="p-4 mb-5 bg-red-50 text-red-700 font-extrabold text-xs rounded-[16px] text-center border-2 border-red-200/60 flex items-center gap-2 justify-center"
          >
            <Info className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          
          {/* STEP 1: CLASS & BATCH SELECTION */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[24px] shadow-lg border border-slate-100 p-6 space-y-6"
            >
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="h-9 w-9 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-black">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-black text-slate-900 tracking-tight">Select Program details</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Academics & Batch Schedules</p>
                </div>
              </div>

              {/* Class Selection Field */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">Select Class *</label>
                <div className="relative">
                  <select
                    required
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedBatchId('');
                    }}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-[#15803D] focus:bg-white transition-all appearance-none"
                  >
                    <option value="">-- Click to choose a Class --</option>
                    {availableClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.className}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Batch Selection Field */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">Select Available Batch *</label>
                
                {!selectedClassId ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-[11px] text-slate-400 font-bold">
                    Please select a Class first to view available batches and timings.
                  </div>
                ) : !selectedClassData?.batches || selectedClassData.batches.length === 0 ? (
                  <div className="p-4 bg-yellow-50 text-yellow-700 text-[11px] font-bold rounded-xl text-center border border-yellow-100">
                    No active batches configured for this class. Please contact the administrator.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {selectedClassData.batches.map((batch: any) => {
                      const capacity = batch.capacity || batch.maxSeats || 30;
                      const registered = batchStudentCounts[batch.name] || 0;
                      const seatsLeft = Math.max(0, capacity - registered);
                      const isFull = seatsLeft <= 0;
                      const isSelected = selectedBatchId === batch.name;

                      return (
                        <button
                          key={batch.name || batch.id}
                          type="button"
                          disabled={isFull}
                          onClick={() => setSelectedBatchId(batch.name)}
                          className={`w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center ${
                            isSelected 
                              ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500' 
                              : isFull 
                                ? 'bg-slate-100/50 border-slate-200 opacity-60 cursor-not-allowed' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-wide">{batch.name}</p>
                            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-emerald-600" />
                              Timing: {batch.time || batch.schedules?.[0]?.startTime || 'TBD'}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                              isFull 
                                ? 'bg-red-100 text-red-700' 
                                : seatsLeft <= 5 
                                  ? 'bg-amber-100 text-amber-700' 
                                  : 'bg-emerald-100 text-[#15803D]'
                            }`}>
                              {isFull ? 'Batch Full' : `${seatsLeft} Seats Left`}
                            </span>
                            <p className="text-[9px] text-slate-400 font-bold mt-1">Capacity: {capacity}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={!isStep1Valid}
                  onClick={() => setCurrentStep(2)}
                  className="w-full min-h-[50px] py-3.5 bg-[#15803D] hover:bg-[#166534] disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Next Step (Student Details)
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: STUDENT DETAILS FORM */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[24px] shadow-lg border border-slate-100 p-6 space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-black">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-black text-slate-900 tracking-tight">Student Information</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Demographics & Parents</p>
                  </div>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => setCurrentStep(1)}
                  className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-3 w-3" /> Back
                </button>
              </div>

              {/* Locked Selection Info Box */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex justify-between items-center text-[10px] font-black text-[#15803D] uppercase tracking-wide">
                <span>Class: {selectedClassData?.className}</span>
                <span>Batch: {selectedBatchId}</span>
              </div>

              {/* 1. Student Photo Section */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">Student Profile Photo *</label>
                <div className="flex flex-col items-center p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="relative h-24 w-24 bg-white rounded-full border-2 border-slate-100 overflow-hidden flex items-center justify-center mb-4 shadow-inner">
                    {photoUrl ? (
                      <img src={photoUrl} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-slate-300" />
                    )}
                    {photoUrl && (
                      <button 
                        type="button" 
                        onClick={() => { setPhotoUrl(''); setPhotoFile(null); }} 
                        className="absolute top-0 right-0 h-6 w-6 bg-red-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {showCamera ? (
                    <div className="flex flex-col items-center gap-3">
                      <video ref={videoRef} className="rounded-xl h-40 w-40 object-cover bg-black border-2 border-slate-300 shadow-md"></video>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={captureImage} 
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg cursor-pointer uppercase tracking-wider shadow-sm"
                        >
                          Capture Face
                        </button>
                        <button 
                          type="button" 
                          onClick={stopCamera} 
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black rounded-lg cursor-pointer uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2.5">
                      <button 
                        type="button" 
                        onClick={startCamera} 
                        className="px-3.5 py-2 bg-emerald-50 text-[#15803D] hover:bg-emerald-100/80 text-[11px] font-black rounded-xl border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="h-4 w-4" /> Use Camera
                      </button>
                      <label className="px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-100 text-[11px] font-black rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-xs">
                        <Upload className="h-4 w-4 text-slate-500" /> Upload Image
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                  <p className="text-[9px] text-slate-400 font-bold mt-2">Clear portrait photo required for Identity Card</p>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700">Student Full Name *</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#15803D] outline-none transition-all" placeholder="e.g. Laxmi Kormokar" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700">Father's Name *</label>
                  <input required value={fatherName} onChange={e => setFatherName(e.target.value)} className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#15803D] outline-none transition-all" placeholder="Father's full name" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700">Mother's Name *</label>
                  <input required value={motherName} onChange={e => setMotherName(e.target.value)} className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#15803D] outline-none transition-all" placeholder="Mother's full name" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700">Student Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
                    <input required type="tel" value={studentPhone} onChange={e => setStudentPhone(e.target.value)} className="w-full h-11 pl-9 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#15803D] outline-none transition-all" placeholder="e.g. 017XXXXXXXX" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700">Guardian Contact Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
                    <input required type="tel" value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} className="w-full h-11 pl-9 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#15803D] outline-none transition-all" placeholder="Guardian phone number" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Date of Birth *
                  </label>
                  <input required type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#15803D] outline-none transition-all" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700">Gender *</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setGender('Boy')} className={`flex-1 h-11 text-xs font-black rounded-xl border transition-all ${gender === 'Boy' ? 'bg-sky-50 border-sky-400 text-sky-700 ring-1 ring-sky-400' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>Boy</button>
                    <button type="button" onClick={() => setGender('Girl')} className={`flex-1 h-11 text-xs font-black rounded-xl border transition-all ${gender === 'Girl' ? 'bg-pink-50 border-pink-400 text-pink-700 ring-1 ring-pink-400' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>Girl</button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700">Blood Group *</label>
                  <select required value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#15803D] outline-none transition-all">
                    <option value="">Choose Blood Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700">School Name *</label>
                  <input required value={schoolName} onChange={e => setSchoolName(e.target.value)} className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#15803D] outline-none transition-all" placeholder="e.g. Holy Cross High School" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700">Admitted Class *</label>
                  <input disabled value={selectedClassData?.className || ''} className="w-full h-11 px-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-500 cursor-not-allowed" />
                </div>
              </div>

              {/* Physical Address Section */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Postal Address details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1.5 space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Street Address *</label>
                    <input required value={address} onChange={e => setAddress(e.target.value)} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#15803D] outline-none transition-all" placeholder="House/Flat No, Block, Road" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase">City *</label>
                    <input required value={city} onChange={e => setCity(e.target.value)} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#15803D] outline-none transition-all" placeholder="City Name" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase">PIN Code *</label>
                    <input required type="number" value={pinCode} onChange={e => setPinCode(e.target.value)} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#15803D] outline-none transition-all" placeholder="Zip Code" />
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleNextToStep3}
                  className="w-full min-h-[50px] py-3.5 bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Validating Profile...
                    </>
                  ) : (
                    <>
                      Next: Review Admission Details
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PREVIEW & REVIEW INFORMATION */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[24px] shadow-lg border border-slate-100 p-6 space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-black">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-black text-slate-900 tracking-tight">Review Your Admission</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verification Checklist</p>
                  </div>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => setCurrentStep(2)}
                  className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-3 w-3" /> Edit Info
                </button>
              </div>

              {/* Review summary cards */}
              <div className="space-y-4">
                
                {/* 1. Academic program */}
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-black text-[#15803D] uppercase tracking-wider">Class & Batch Program</p>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-[10px] font-bold text-emerald-700 hover:underline">Change</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
                    <p>Admitted Class: <span className="font-black text-slate-900">{selectedClassData?.className}</span></p>
                    <p>Selected Batch: <span className="font-black text-slate-900">{selectedBatchId}</span></p>
                    <p className="col-span-2 text-slate-500">Timing Schedule: {selectedClassData?.batches?.find((b: any) => b.name === selectedBatchId)?.time || 'As configured'}</p>
                  </div>
                </div>

                {/* 2. Personal Detail Card */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Demographic Profile</p>
                    <button type="button" onClick={() => setCurrentStep(2)} className="text-[10px] font-bold text-[#15803D] hover:underline">Edit Fields</button>
                  </div>

                  <div className="flex gap-4 items-start">
                    <img src={photoUrl} className="h-16 w-16 rounded-xl object-cover border-2 border-slate-200 shadow-sm shrink-0" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <p className="font-bold text-slate-500">Student Name: <strong className="text-slate-900">{name}</strong></p>
                      <p className="font-bold text-slate-500">Father's Name: <strong className="text-slate-900">{fatherName}</strong></p>
                      <p className="font-bold text-slate-500">Mother's Name: <strong className="text-slate-900">{motherName}</strong></p>
                      <p className="font-bold text-slate-500">Gender / Blood: <strong className="text-slate-900">{gender} ({bloodGroup})</strong></p>
                      <p className="font-bold text-slate-500">Date of Birth: <strong className="text-slate-900">{dob}</strong></p>
                      <p className="font-bold text-slate-500">School Name: <strong className="text-slate-900">{schoolName}</strong></p>
                      <p className="font-bold text-slate-500">Mobile: <strong className="text-slate-900">{studentPhone}</strong></p>
                      <p className="font-bold text-slate-500">Guardian Contact: <strong className="text-slate-900">{guardianPhone}</strong></p>
                    </div>
                  </div>
                </div>

                {/* 3. Address details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-200">Postal Address Details</p>
                  <p className="text-xs font-bold text-slate-800">
                    {address}, {city} - {pinCode}
                  </p>
                </div>
              </div>

              {/* Warning/Declaration text */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 font-bold leading-normal flex items-start gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>By submitting, I confirm that all details given are complete and accurate to the best of my knowledge. Once registered, a professional student ID card will be generated.</span>
              </div>

              {/* Submit triggers */}
              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase rounded-xl transition-all"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalSubmit}
                  className="flex-[2] min-h-[48px] bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md shadow-emerald-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Submitting Admission...
                    </>
                  ) : (
                    <>
                      Confirm & Submit
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS & ID CARD GENERATION */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="space-y-6"
            >
              
              {/* Success Banner */}
              <div className="bg-white rounded-[24px] shadow-lg border border-slate-100 p-6 text-center space-y-3">
                <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Admission Confirmed!</h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">Your profile has been registered in the database successfully.</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 inline-block border border-emerald-100">
                  <p className="text-[10px] text-[#15803D] font-black uppercase tracking-wider mb-0.5">Your Academic Roll</p>
                  <p className="text-3xl font-black text-slate-900">{assignedRoll}</p>
                </div>
              </div>

              {/* 5. Professional Student ID Card Element */}
              <div className="flex justify-center">
                <div 
                  id="student-id-card-display" 
                  className="w-[325px] bg-gradient-to-b from-[#FAFDFB] to-white border-4 border-[#15803D] rounded-[24px] shadow-2xl overflow-hidden relative font-sans text-[#111111] p-5 shrink-0"
                  style={{ minHeight: '470px' }}
                >
                  
                  {/* Accent Top bar */}
                  <div className="absolute top-0 left-0 right-0 h-2.5 bg-[#15803D]"></div>

                  {/* ID Card Header */}
                  <div className="text-center pb-3 border-b border-dashed border-emerald-200 mt-2">
                    <p className="text-[13px] font-black uppercase tracking-wide text-slate-800 line-clamp-1">
                      {teacher?.schoolName || 'Elite Coaching Academy'}
                    </p>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#15803D] mt-0.5">
                      Student Identity Card
                    </p>
                  </div>

                  {/* ID Card Body layout */}
                  <div className="flex flex-col items-center mt-4 space-y-3">
                    
                    {/* Student Photo with Emerald Frame */}
                    <div className="h-28 w-28 rounded-2xl border-4 border-[#15803D]/20 overflow-hidden shadow-md relative">
                      <img src={photoUrl} className="h-full w-full object-cover" alt={name} />
                      <div className="absolute bottom-1 right-1 h-3 w-3 bg-[#15803D] border border-white rounded-full"></div>
                    </div>

                    {/* Student Identity status */}
                    <div className="text-center space-y-1">
                      <h3 className="text-base font-black tracking-tight text-slate-900 uppercase">{name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-[#15803D] border border-emerald-200 rounded-full text-[8px] font-black uppercase tracking-wider">
                        Status: Active Student
                      </span>
                    </div>

                    {/* Data Rows block */}
                    <div className="w-full bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-[10px] space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                        <span className="text-slate-400 font-extrabold uppercase">Roll Number:</span>
                        <span className="font-black text-slate-900 text-xs">{assignedRoll}</span>
                      </div>
                      
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                        <span className="text-slate-400 font-extrabold uppercase">Class Program:</span>
                        <span className="font-black text-slate-800">{selectedClassData?.className}</span>
                      </div>

                      <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                        <span className="text-slate-400 font-extrabold uppercase">Batch Time:</span>
                        <span className="font-black text-slate-800">{selectedBatchId}</span>
                      </div>

                      <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                        <span className="text-slate-400 font-extrabold uppercase">Admission Date:</span>
                        <span className="font-bold text-slate-800">{admissionDate}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-extrabold uppercase">Instructor:</span>
                        <span className="font-extrabold text-[#15803D]">{teacher?.name}</span>
                      </div>
                    </div>

                    {/* Real-time QR and Barcode codes block */}
                    <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between gap-2.5">
                      <div className="w-2/3">
                        <BarcodeSVG value={registeredStudentId.slice(-9)} />
                      </div>
                      
                      <div className="bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                        <QRCodeSVG value={registeredStudentId} size={48} level="L" />
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* ID Card PDF/Image/Print Actions */}
              <div className="bg-white rounded-[24px] shadow-lg border border-slate-100 p-5 space-y-3.5">
                <p className="text-[11px] text-slate-400 font-black text-center uppercase tracking-wider">
                  Save your identity card
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={downloadIDCardPDF}
                    className="h-11 px-3 bg-emerald-50 hover:bg-emerald-100/80 text-[#15803D] font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-emerald-200"
                  >
                    <FileDown className="h-4.5 w-4.5" />
                    PDF Card
                  </button>

                  <button
                    type="button"
                    onClick={downloadIDCardImage}
                    className="h-11 px-3 bg-emerald-50 hover:bg-emerald-100/80 text-[#15803D] font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-emerald-200"
                  >
                    <FileImage className="h-4.5 w-4.5" />
                    Image Card
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintIDCard}
                    className="h-11 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    <Printer className="h-4.5 w-4.5" />
                    Print ID
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      // Reset state to initial class and batch configuration
                      setSelectedClassId(initialClassId || '');
                      setSelectedBatchId(initialBatchId || '');
                      setName('');
                      setFatherName('');
                      setMotherName('');
                      setStudentPhone('');
                      setGuardianPhone('');
                      setDob('');
                      setGender('');
                      setBloodGroup('');
                      setSchoolName('');
                      setAddress('');
                      setCity('');
                      setPinCode('');
                      setPhotoUrl('');
                      setPhotoFile(null);
                      setCurrentStep(1);
                    }}
                    className="px-6 py-2 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-black rounded-lg uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    Register Another Student
                  </button>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
