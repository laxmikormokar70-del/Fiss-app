import React, { useState, useEffect, Suspense, lazy } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  writeBatch,
  addDoc,
  collectionGroup
} from 'firebase/firestore';
import { Student, Payment, TeacherProfile, Attendance } from './types';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  FileSpreadsheet, 
  Calendar, 
  Settings as SettingsIcon, 
  LogOut, 
  BookOpen, 
  Lock,
  Sparkles,
  School,
  Grid,
  CheckSquare,
  User,
  Loader2,
  Wallet,
  GraduationCap,
  XCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import firebaseConfig from '../firebase-applet-config.json';

// Tabs & Screens - Lazy Loaded
const AuthPage = lazy(() => import('./components/AuthPage'));
const PinLockScreen = lazy(() => import('./components/PinLockScreen'));
const DashboardTab = lazy(() => import('./components/DashboardTab'));
const StudentsTab = lazy(() => import('./components/StudentsTab'));
const FeesTab = lazy(() => import('./components/FeesTab'));
const ReportsTab = lazy(() => import('./components/ReportsTab'));
const FeeManagementTab = lazy(() => import('./components/FeeManagementTab'));
const SettingsTab = lazy(() => import('./components/SettingsTab'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const CompleteProfileModal = lazy(() => import('./components/CompleteProfileModal'));
const StudentRegisterPage = lazy(() => import('./components/StudentRegisterPage'));
const StudentQRScanPage = lazy(() => import('./components/StudentQRScanPage'));
const MoreTab = lazy(() => import('./components/MoreTab'));
const AttendanceTab = lazy(() => import('./components/AttendanceTab'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage'));
const SupportTicketPage = lazy(() => import('./components/SupportTicketPage'));

// Fallback skeleton loader
const PageLoader = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
    <Loader2 className="h-10 w-10 text-[#16A34A] animate-spin mb-4" />
    <p className="text-slate-600 font-medium">Loading workspace...</p>
  </div>
);

// New Unified Auth Flow Components
const CompleteProfilePage = lazy(() => import('./components/CompleteProfilePage'));
const PendingApprovalPage = lazy(() => import('./components/PendingApprovalPage'));
const RejectedPage = lazy(() => import('./components/RejectedPage'));

export default function App() {
  const [isOfflineMode, setIsOfflineMode] = useState(() => localStorage.getItem('edu_offline_mode') === 'true');
  const [customConfigInput, setCustomConfigInput] = useState('');
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [configError, setConfigError] = useState('');

  const isFirebaseUnconfigured = !isOfflineMode && (
    firebaseConfig.projectId.startsWith('remixed-') || 
    firebaseConfig.apiKey.includes('mock')
  );

  // Check for student self-registration link immediately
  const urlParams = new URLSearchParams(window.location.search);
  let registerTeacherId = urlParams.get('register');
  const classIdParam = urlParams.get('classId');
  const batchIdParam = urlParams.get('batchId');

  if (!registerTeacherId && window.location.pathname.includes('/register/')) {
    const parts = window.location.pathname.split('/register/');
    if (parts[1]) {
      registerTeacherId = parts[1].split('/')[0];
    }
  }

  if (registerTeacherId && !isFirebaseUnconfigured) {
    return <StudentRegisterPage teacherId={registerTeacherId} initialClassId={classIdParam} initialBatchId={batchIdParam} />;
  }

  const studentScan = urlParams.get('student_scan');
  const scanTeacherId = urlParams.get('teacherId');
  const scanClassId = urlParams.get('classId');
  const scanBatchId = urlParams.get('batchId');
  if (studentScan === 'true' && scanTeacherId && scanClassId && scanBatchId && !isFirebaseUnconfigured) {
    return <StudentQRScanPage teacherId={scanTeacherId} classId={scanClassId} batchId={scanBatchId} />;
  }

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardView, setDashboardView] = useState<'dashboard' | 'create-class' | 'edit-class'>('dashboard');
  const [dashboardEditingClassId, setDashboardEditingClassId] = useState<string | null>(null);

  const handleEditClassSchedule = (classId: string) => {
    setDashboardEditingClassId(classId);
    setDashboardView('edit-class');
    setActiveTab('dashboard');
  };

  const [authUser, setAuthUser] = useState<any | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Custom Auth and Protection overlays
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'resubmit' | null>(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [authPopupMessage, setAuthPopupMessage] = useState<string | null>(null);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [showKYCPendingModal, setShowKYCPendingModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Security Locks & UI
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);
  const [quickPayState, setQuickPayState] = useState<{ studentId: string; class: string; batch: string; rollNumber: string; fromTab: string } | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || false;
  });

  const [isInputFocused, setIsInputFocused] = useState(false);

  // Monitor text inputs to auto hide navigation bar
  useEffect(() => {
    const handleFocusChange = () => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        const isTextInput = tagName === 'textarea' || (tagName === 'input' && ['text', 'number', 'email', 'password', 'tel', 'search', 'url'].includes((activeEl as HTMLInputElement).type.toLowerCase()));
        setIsInputFocused(isTextInput);
      } else {
        setIsInputFocused(false);
      }
    };

    // Use capturing phase or focusin/focusout for reliable event bubble detection
    document.addEventListener('focusin', handleFocusChange);
    document.addEventListener('focusout', handleFocusChange);
    return () => {
      document.removeEventListener('focusin', handleFocusChange);
      document.removeEventListener('focusout', handleFocusChange);
    };
  }, []);

  // Handle dark mode side effects
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Listen to Firebase Auth state change and Teacher Profile
  useEffect(() => {
    if (isFirebaseUnconfigured || isOfflineMode) return;
    
    let unsubscribeDoc: (() => void) | undefined;
    
    const handleUserChange = async (user: any) => {
      setAuthUser(user);
      if (user) {
        const teacherDocRef = doc(db, 'users', user.uid);
        
        // Failsafe bootstrap for Super Admin
        const adminEmails = ['admin@edumanager.com', 'laxmikormokar70@gmail.com'];
        const userEmail = user.email?.toLowerCase() || '';
        if (adminEmails.includes(userEmail)) {
          try {
            const adminSnap = await getDoc(teacherDocRef);
            const currentProfile = adminSnap.exists() ? adminSnap.data() as TeacherProfile : null;
            
            if (!currentProfile || currentProfile.role !== 'admin' || currentProfile.approvalStatus !== 'approved' || (userEmail === 'laxmikormokar70@gmail.com' && !currentProfile.adminPasswordChanged)) {
              const adminProfile: TeacherProfile = {
                uid: user.uid,
                email: user.email!,
                name: currentProfile?.name || 'Super Admin',
                schoolName: currentProfile?.schoolName || 'EduManager Admin Hub',
                approvalStatus: 'approved',
                isProfileComplete: true,
                role: 'admin',
                adminPasswordChanged: userEmail === 'laxmikormokar70@gmail.com' ? true : (currentProfile?.adminPasswordChanged !== undefined ? currentProfile.adminPasswordChanged : true),
                registrationDate: currentProfile?.registrationDate || new Date().toISOString()
              };
              
              await setDoc(teacherDocRef, adminProfile, { merge: true });
            }
          } catch (err) {
            console.warn("Admin bootstrap status (info):", err);
          }
        }

        // Listen to teacher profile changes in real-time
        unsubscribeDoc = onSnapshot(teacherDocRef, (teacherSnap) => {
          if (teacherSnap.exists()) {
            const profileData = teacherSnap.data() as TeacherProfile;
            const updatedProfile = { ...profileData, uid: user.uid };
            setTeacherProfile(updatedProfile);
            
            if (profileData.isPinEnabled && profileData.pinCode) {
              setIsUnlocked(false);
            } else {
              setIsUnlocked(true);
            }
          } else {
            setTeacherProfile(null);
            setIsUnlocked(true);
          }
          setAppLoading(false);
        }, (err) => {
          console.warn("Profile snapshot stream issue:", err);
          setAppLoading(false);
        });

      } else {
        setTeacherProfile(null);
        setStudents([]);
        setPayments([]);
        setAttendance([]);
        setClasses([]);
        setIsUnlocked(false);
        setAppLoading(false);
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = undefined;
        }
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      handleUserChange(user ? { ...user, uid: user.uid } : null);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, [isFirebaseUnconfigured, isOfflineMode]);

  // Real-time Firestore sync of Students and Payments for the logged-in Teacher
  useEffect(() => {
    if (isOfflineMode) return;
    if (!authUser || !teacherProfile) return;

    const isTeacher = teacherProfile.role !== 'admin';
    if (!isTeacher) return; // Admins must NOT stream any other collections, reducing reads by 99%
    
    const isApprovedOrPending = teacherProfile.approvalStatus === 'approved' || teacherProfile.approvalStatus === 'pending';
    if (!isApprovedOrPending) return;

    // Stream Students
    // We query the 'students' collection group for instant, index-free real-time sync of the nested paths.
    const studentsQuery = query(collectionGroup(db, 'students'), where('teacherId', '==', authUser.uid));
    
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentList: Student[] = [];
      snapshot.forEach((doc) => {
        studentList.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(studentList);
    }, (err) => {
      console.error("Failed to sync students:", err);
    });

    // Stream Payments
    const paymentsQuery = query(collection(db, 'payments'), where('teacherId', '==', authUser.uid));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const paymentList: Payment[] = [];
      snapshot.forEach((doc) => {
        paymentList.push({ id: doc.id, ...doc.data() } as Payment);
      });
      setPayments(paymentList);
    }, (err) => {
      console.error("Failed to sync payments:", err);
    });

    // Stream Attendance
    const attendanceQuery = query(collection(db, 'attendance'), where('teacherId', '==', authUser.uid));
    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceList: Attendance[] = [];
      snapshot.forEach((doc) => {
        attendanceList.push({ id: doc.id, ...doc.data() } as Attendance);
      });
      setAttendance(attendanceList);
    }, (err) => {
      console.error("Failed to sync attendance:", err);
    });

    // Stream Classes
    const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', authUser.uid));
    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      const classesList: any[] = [];
      snapshot.forEach((doc) => {
        classesList.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classesList);
    }, (err) => {
      console.error("Failed to sync classes:", err);
    });

    return () => {
      unsubscribeStudents();
      unsubscribePayments();
      unsubscribeAttendance();
      unsubscribeClasses();
    };
  }, [authUser, teacherProfile?.uid, teacherProfile?.role, teacherProfile?.approvalStatus]);

  // Auto seed 3 beautiful realistic student records
  const autoSeedWorkspace = async (uid: string) => {
    try {
      const batch = writeBatch(db);
      
      const seedStudents = [
        {
          name: 'Alice Smith',
          rollNumber: '101',
          class: 'Grade 10',
          mobileNumber: '+1 555-0101',
          guardianName: 'George Smith',
          monthlyFee: 150,
          admissionDate: '2026-01-10',
          status: 'Active' as const,
          photoUrl: '',
          createdAt: new Date().toISOString()
        },
        {
          name: 'Bob Johnson',
          rollNumber: '102',
          class: 'Grade 10',
          mobileNumber: '+1 555-0102',
          guardianName: 'Emma Johnson',
          monthlyFee: 120,
          admissionDate: '2026-02-15',
          status: 'Active' as const,
          photoUrl: '',
          createdAt: new Date().toISOString()
        },
        {
          name: 'Charlie Brown',
          rollNumber: '103',
          class: 'Grade 9',
          mobileNumber: '+1 555-0103',
          guardianName: 'Sally Brown',
          monthlyFee: 140,
          admissionDate: '2026-03-20',
          status: 'Active' as const,
          photoUrl: '',
          createdAt: new Date().toISOString()
        }
      ];

      // Generate doc IDs and add to batch
      const studentIds: string[] = [];
      seedStudents.forEach((student) => {
        const studentRef = doc(collection(db, 'students'));
        batch.set(studentRef, { teacherId: uid, ...student });
        studentIds.push(studentRef.id);
      });

      await batch.commit();
      console.log('Successfully seeded default classroom records');
    } catch (err) {
      console.warn('Seeding failed or already complete', err);
    }
  };

  // --- Database Operations Handler Functions ---

  const handleAddStudent = async (studentPayload: Omit<Student, 'id' | 'createdAt' | 'teacherId'>) => {
    // Generate IDs early for fast local state update
    const studentId = `student-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Resolve IDs
    const clsId = (studentPayload as any).classId;
    const bId = (studentPayload as any).batchId || 'batch-a';

    const newStudent: Student = {
      ...studentPayload,
      id: studentId,
      studentId: studentId,
      teacherId: isOfflineMode ? 'offline-teacher' : (authUser?.uid || 'unknown'),
      name: studentPayload.name,
      studentName: studentPayload.name,
      rollNumber: studentPayload.rollNumber,
      fatherName: studentPayload.fatherName || studentPayload.guardianName || '',
      motherName: studentPayload.motherName || '',
      fatherPhone: studentPayload.mobileNumber || '',
      mobileNumber: studentPayload.mobileNumber || '',
      phone: studentPayload.mobileNumber || '',
      phoneNumber: studentPayload.mobileNumber || '',
      motherPhone: studentPayload.motherMobile || '',
      address: studentPayload.address || '',
      classId: clsId || studentPayload.class.toLowerCase().replace(/\s+/g, '-'),
      className: studentPayload.class,
      class: studentPayload.class,
      batchId: bId.toLowerCase().replace(/\s+/g, '-'),
      batchName: studentPayload.batch,
      batch: studentPayload.batch,
      photoUrl: studentPayload.photoUrl || '',
      feeInformation: studentPayload.monthlyFee,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: studentPayload.status || 'Active',
      time: studentPayload.time || '',
      gender: studentPayload.gender,
      dob: studentPayload.dob || '',
      monthlyFee: studentPayload.monthlyFee,
      admissionDate: studentPayload.admissionDate,
    };
    
    // Clean up any undefined fields to prevent Firestore errors
    Object.keys(newStudent).forEach(key => (newStudent as any)[key] === undefined && delete (newStudent as any)[key]);

    // INSTANT UI UPDATE (Optimistic)
    const updated = [...students, newStudent];
    setStudents(updated);
    if (isOfflineMode) {
      localStorage.setItem('edu_students', JSON.stringify(updated));
      triggerNotification('Student Added Successfully (Offline)');
      return;
    }

    if (!authUser) {
      throw new Error('Teacher is not authenticated. Please log in first.');
    }
    
    try {
      // NEW NESTED STRUCTURE: teachers/{teacherId}/classes/{classId}/batches/{batchId}/students/{studentId}
      const safeClassId = clsId || studentPayload.class.toLowerCase().replace(/\s+/g, '-');
      const safeBatchId = bId.toLowerCase().replace(/\s+/g, '-');
      
      const studentRef = doc(db, 'users', authUser.uid, 'classes', safeClassId, 'batches', safeBatchId, 'students', studentId);

      // Save to nested path
      await setDoc(studentRef, newStudent);
      
      triggerNotification('Student Added Successfully');
    } catch (err: any) {
      console.error("Add Student failed", err);
      // Rollback optimistic update on fatal error
      setStudents(prev => prev.filter(s => s.id !== studentId));
      
      const errorMessage = err.code === 'permission-denied' 
        ? "Permission denied. Please check your account status."
        : (err.message || 'Failed to add student');
      triggerNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  const handleEditStudent = async (id: string, studentPayload: Partial<Omit<Student, 'id' | 'createdAt' | 'teacherId'>>) => {
    const currentStudent = students.find(s => s.id === id);
    if (!currentStudent) return;

    // Optimistic UI Update
    const updatedStudents = students.map(s => s.id === id ? { ...s, ...studentPayload } : s);
    setStudents(updatedStudents);

    if (isOfflineMode) {
      localStorage.setItem('edu_students', JSON.stringify(updatedStudents));
      triggerNotification('Student Updated Successfully (Offline)');
      return;
    }

    if (!authUser) {
      throw new Error('Teacher is not authenticated. Please log in first.');
    }

    try {
      const oldClassId = currentStudent.classId || currentStudent.class.toLowerCase().replace(/\s+/g, '-');
      const oldBatchId = (currentStudent.batchId || currentStudent.batch || 'batch-a').toLowerCase().replace(/\s+/g, '-');
      
      const newClassId = studentPayload.classId || (studentPayload.class ? studentPayload.class.toLowerCase().replace(/\s+/g, '-') : oldClassId);
      const newBatchId = studentPayload.batchId || (studentPayload.batch ? studentPayload.batch.toLowerCase().replace(/\s+/g, '-') : oldBatchId);

      const oldRef = doc(db, 'users', authUser.uid, 'classes', oldClassId, 'batches', oldBatchId, 'students', id);
      const newRef = doc(db, 'users', authUser.uid, 'classes', newClassId, 'batches', newBatchId, 'students', id);

      const updateData: any = { 
        ...studentPayload,
        updatedAt: new Date().toISOString()
      };
      if (studentPayload.name) {
        updateData.studentName = studentPayload.name;
      }
      if (studentPayload.mobileNumber) {
        updateData.phone = studentPayload.mobileNumber;
        updateData.phoneNumber = studentPayload.mobileNumber;
        updateData.fatherPhone = studentPayload.mobileNumber;
      }
      if (studentPayload.motherMobile) {
        updateData.motherPhone = studentPayload.motherMobile;
      }
      if (studentPayload.class) {
        updateData.className = studentPayload.class;
      }
      if (studentPayload.batch) {
        updateData.batchName = studentPayload.batch;
      }
      if (studentPayload.monthlyFee !== undefined) {
        updateData.feeInformation = studentPayload.monthlyFee;
      }
      
      // Clean up any undefined fields
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      if (oldClassId !== newClassId || oldBatchId !== newBatchId) {
        // Path changed, move document
        const fullData = { ...currentStudent, ...updateData };
        await setDoc(newRef, fullData);
        await deleteDoc(oldRef);
      } else {
        await updateDoc(oldRef, updateData);
      }
      
      triggerNotification('Student Updated Successfully');
    } catch (err: any) {
      console.error("Edit Student failed", err);
      // Rollback optimistic update
      setStudents(students); 
      const errorMessage = err.code === 'permission-denied' 
        ? "Permission denied. You might not have access to edit this record."
        : (err.message || 'Failed to update student');
      triggerNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const studentToDelete = students.find(s => s.id === id);
    if (!studentToDelete) return;

    // Optimistic UI Update
    const updatedStudents = students.filter(s => s.id !== id);
    setStudents(updatedStudents);

    if (isOfflineMode) {
      localStorage.setItem('edu_students', JSON.stringify(updatedStudents));
      const updatedPayments = payments.filter(p => p.studentId !== id);
      setPayments(updatedPayments);
      localStorage.setItem('edu_payments', JSON.stringify(updatedPayments));
      triggerNotification('Student Deleted Successfully (Offline)');
      return;
    }

    if (!authUser) {
      throw new Error('Teacher is not authenticated. Please log in first.');
    }
    
    try {
      const classId = studentToDelete.classId || studentToDelete.class.toLowerCase().replace(/\s+/g, '-');
      const batchId = (studentToDelete.batchId || studentToDelete.batch || 'batch-a').toLowerCase().replace(/\s+/g, '-');
      const studentRef = doc(db, 'users', authUser.uid, 'classes', classId, 'batches', batchId, 'students', id);
      
      // Delete from nested path
      await deleteDoc(studentRef);
      
      // Clean up payments related to this student
      const studentPayments = payments.filter(p => p.studentId === id);
      for (const p of studentPayments) {
        try {
          await deleteDoc(doc(db, 'payments', p.id));
        } catch (e) {}
      }
      
      triggerNotification('Student Deleted Successfully');
    } catch (err: any) {
      console.error("Delete Student failed", err);
      // Rollback
      setStudents(students);
      triggerNotification('Failed to delete student', 'error');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (isOfflineMode) {
      const classDoc = classes.find(c => c.id === classId);
      if (!classDoc) return;
      const className = classDoc.className;

      const updatedClasses = classes.filter(c => c.id !== classId);
      setClasses(updatedClasses);
      localStorage.setItem('edu_classes', JSON.stringify(updatedClasses));

      const updatedStudents = students.filter(s => s.class !== className);
      setStudents(updatedStudents);
      localStorage.setItem('edu_students', JSON.stringify(updatedStudents));

      const updatedPayments = payments.filter(p => p.studentClass !== className);
      setPayments(updatedPayments);
      localStorage.setItem('edu_payments', JSON.stringify(updatedPayments));

      if (teacherProfile) {
        const updatedProfileClasses = (teacherProfile.customClasses || []).filter(c => c !== className);
        const updatedProfile = { ...teacherProfile, customClasses: updatedProfileClasses };
        setTeacherProfile(updatedProfile);
        localStorage.setItem('edu_teacher_profile', JSON.stringify(updatedProfile));
      }

      triggerNotification(`Class "${className}" and all associated data deleted.`);
      return;
    }

    if (!authUser) {
      throw new Error('Teacher is not authenticated. Please log in first.');
    }
    try {
      const classDoc = classes.find(c => c.id === classId);
      if (!classDoc) return;

      const className = classDoc.className;

      // 1. Delete class document
      await deleteDoc(doc(db, 'classes', classId));

      // 2. Identify students in this class
      const classStudents = students.filter(s => s.class === className && s.teacherId === authUser.uid);
      
      // 3. Delete students and their payments
      for (const student of classStudents) {
        const studentClassId = student.classId || student.class.toLowerCase().replace(/\s+/g, '-');
        const studentBatchId = (student.batchId || student.batch || 'batch-a').toLowerCase().replace(/\s+/g, '-');
        const studentRef = doc(db, 'users', authUser.uid, 'classes', studentClassId, 'batches', studentBatchId, 'students', student.id);
        
        try {
          await deleteDoc(studentRef);
        } catch (e) {
          console.warn("Failed to delete nested student document:", e);
        }

        const studentPayments = payments.filter(p => p.studentId === student.id);
        for (const p of studentPayments) {
          try {
            await deleteDoc(doc(db, 'payments', p.id));
          } catch (e) {}
        }
      }

      // 4. Update teacher profile customClasses
      const teacherRef = doc(db, 'users', authUser.uid);
      const updatedClasses = (teacherProfile?.customClasses || []).filter(c => c !== className);
      
      try {
        await updateDoc(teacherRef, {
          customClasses: updatedClasses
        });
      } catch (profileErr) {
        console.warn("Failed to update teacher customClasses list", profileErr);
      }

      triggerNotification(`Class "${className}" and all associated data deleted.`);
    } catch (err: any) {
      console.error("Delete Class failed", err);
      triggerNotification(err.message || 'Failed to delete class', 'error');
      throw err;
    }
  };

  const handleSaveClassState = (savedClass: any, customClasses?: string[], customBatches?: string[]) => {
    setClasses(prev => {
      const exists = prev.some(c => c.id === savedClass.id);
      if (exists) {
        return prev.map(c => c.id === savedClass.id ? savedClass : c);
      } else {
        return [...prev, savedClass];
      }
    });

    if (customClasses || customBatches) {
      setTeacherProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          customClasses: Array.from(new Set([...(prev.customClasses || []), ...(customClasses || [])])),
          customBatches: Array.from(new Set([...(prev.customBatches || []), ...(customBatches || [])])),
        };
      });
    }
  };

  // Safe idempotent saving of Payments
  const handleSavePayment = async (paymentPayload: Omit<Payment, 'id'>) => {
    if (isOfflineMode) {
      const docId = `${paymentPayload.studentId}-${paymentPayload.month}`;
      const newPayment = { ...paymentPayload, id: docId };
      let updated;
      if (payments.some(p => p.id === docId)) {
        updated = payments.map(p => p.id === docId ? newPayment : p);
      } else {
        updated = [...payments, newPayment];
      }
      setPayments(updated);
      localStorage.setItem('edu_payments', JSON.stringify(updated));
      triggerNotification('Payment Saved Successfully (Offline)');
      return;
    }

    try {
      const docId = `${paymentPayload.studentId}-${paymentPayload.month}`;
      const paymentRef = doc(db, 'payments', docId);
      await setDoc(paymentRef, paymentPayload, { merge: true });
      triggerNotification('Payment Saved Successfully');
    } catch (err: any) {
      console.error("Save Payment failed", err);
      triggerNotification(err.message || 'Failed to save payment', 'error');
    }
  };

  // Safe idempotent saving of Attendance
  const handleSaveAttendance = async (date: string, marks: Record<string, 'present' | 'absent'>) => {
    if (isOfflineMode) {
      const docId = `offline-teacher-${date}`;
      const newAttendance = {
        id: docId,
        teacherId: 'offline-teacher',
        date,
        attendanceMarks: marks,
        createdAt: new Date().toISOString()
      };
      let updated;
      if (attendance.some(a => a.date === date)) {
        updated = attendance.map(a => a.date === date ? newAttendance : a);
      } else {
        updated = [...attendance, newAttendance];
      }
      setAttendance(updated);
      localStorage.setItem('edu_attendance', JSON.stringify(updated));
      triggerNotification('Attendance Saved Successfully (Offline)');
      return;
    }

    if (!authUser) return;
    try {
      const docId = `${authUser.uid}-${date}`;
      const attendanceRef = doc(db, 'attendance', docId);
      await setDoc(attendanceRef, {
        teacherId: authUser.uid,
        date,
        attendanceMarks: marks,
        createdAt: new Date().toISOString()
      }, { merge: true });
      triggerNotification('Attendance Saved Successfully');
    } catch (err: any) {
      console.error("Save Attendance failed", err);
      triggerNotification(err.message || 'Failed to save attendance', 'error');
    }
  };

  const handleUpdateProfile = async (profilePayload: Partial<TeacherProfile>) => {
    if (isOfflineMode) {
      const updatedProfile = teacherProfile ? { ...teacherProfile, ...profilePayload } : {
        uid: 'offline-teacher',
        email: 'teacher@coaching.com',
        name: 'Demo Instructor',
        schoolName: 'My Coaching Institute',
        approvalStatus: 'approved',
        isProfileComplete: true,
        role: 'teacher',
        registrationDate: new Date().toISOString(),
        ...profilePayload
      };
      setTeacherProfile(updatedProfile);
      localStorage.setItem('edu_teacher_profile', JSON.stringify(updatedProfile));
      triggerNotification('Profile Updated Successfully (Offline)');
      return;
    }

    if (!authUser) return;
    try {
      const teacherRef = doc(db, 'users', authUser.uid);
      await updateDoc(teacherRef, profilePayload);
      
      // Sync React State
      setTeacherProfile(prev => prev ? { ...prev, ...profilePayload } : null);
      triggerNotification('Profile Updated Successfully');
    } catch (err: any) {
      console.error("Update profile failed", err);
      triggerNotification(err.message || 'Failed to update profile', 'error');
    }
  };

  // Comprehensive Cloud Restore
  const handleRestoreData = async (backupData: { students: Student[]; payments: Payment[] }) => {
    if (isOfflineMode) {
      setStudents(backupData.students);
      setPayments(backupData.payments);
      localStorage.setItem('edu_students', JSON.stringify(backupData.students));
      localStorage.setItem('edu_payments', JSON.stringify(backupData.payments));
      triggerNotification('Data Restored Successfully (Offline)');
      return;
    }

    if (!authUser) return;
    const batch = writeBatch(db);

    // Delete existing records first
    students.forEach(s => {
      batch.delete(doc(db, 'students', s.id));
    });
    payments.forEach(p => {
      batch.delete(doc(db, 'payments', p.id));
    });

    // Write backup students
    backupData.students.forEach(s => {
      const studentRef = doc(db, 'students', s.id);
      batch.set(studentRef, {
        teacherId: authUser.uid,
        name: s.name,
        rollNumber: s.rollNumber,
        class: s.class,
        mobileNumber: s.mobileNumber || '',
        guardianName: s.guardianName || '',
        monthlyFee: s.monthlyFee || 0,
        admissionDate: s.admissionDate || '',
        status: s.status || 'Active',
        photoUrl: s.photoUrl || '',
        createdAt: s.createdAt || new Date().toISOString()
      });
    });

    // Write backup payments
    backupData.payments.forEach(p => {
      const paymentRef = doc(db, 'payments', p.id);
      batch.set(paymentRef, {
        teacherId: authUser.uid,
        studentId: p.studentId,
        studentName: p.studentName,
        studentRoll: p.studentRoll,
        studentClass: p.studentClass,
        month: p.month,
        paymentDate: p.paymentDate,
        amountPaid: p.amountPaid,
        dueAmount: p.dueAmount,
        advanceAmount: p.advanceAmount,
        status: p.status,
        notes: p.notes || ''
      });
    });

    await batch.commit();
  };

  const handleSignOut = async () => {
    if (isOfflineMode) {
      localStorage.removeItem('edu_offline_mode');
      setIsOfflineMode(false);
      setAuthUser(null);
      setTeacherProfile(null);
      window.location.reload();
      return;
    }

    try {
      await signOut(auth);
      // Clear all local session data
      localStorage.clear();
      sessionStorage.clear();
      setIsUnlocked(false);
      setLogoutSuccess(true);
      setTimeout(() => setLogoutSuccess(false), 3000);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Nav to Fee marking tab and auto select student
  const handleSelectStudentForBilling = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('fees');
  };

  const handleInitiateQuickPay = (studentId: string, className: string, batchName: string, rollNumber: string, fromTab: string = 'reports') => {
    setQuickPayState({ studentId, class: className, batch: batchName, rollNumber, fromTab });
    setActiveTab('fee-management');
  };

  // --- Render Layout Blocks ---

  const displayedStudents = authUser && (teacherProfile?.approvalStatus === 'approved' || teacherProfile?.approvalStatus === 'pending') ? students : [];
  const displayedPayments = authUser && (teacherProfile?.approvalStatus === 'approved' || teacherProfile?.approvalStatus === 'pending') ? payments : [];
  const displayedAttendance = authUser && (teacherProfile?.approvalStatus === 'approved' || teacherProfile?.approvalStatus === 'pending') ? attendance : [];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'dashboard') {
      setActiveTab('dashboard');
      return;
    }
    
    if (!authUser) {
      setAuthPopupMessage('Please Login or Register to continue.');
      setShowAuthPopup(true);
      return;
    }

    // Always allowed for authenticated users
    if (['profile', 'settings', 'support', 'privacy'].includes(tabId)) {
      setActiveTab(tabId);
      return;
    }

    if (teacherProfile) {
      if (teacherProfile.approvalStatus !== 'approved') {
        if (teacherProfile.approvalStatus === 'suspended') {
          setAuthPopupMessage('Your coaching account has been suspended by the Admin.');
          setShowAuthPopup(true);
          return;
        }
        setShowKYCPendingModal(true);
        return;
      }
    }

    setActiveTab(tabId);
  };

  // --- Render Layout Blocks ---

  if (isFirebaseUnconfigured) {
    const handlePasteSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const parsed = JSON.parse(customConfigInput);
        if (!parsed.apiKey || !parsed.projectId) {
          throw new Error("Missing critical keys (apiKey or projectId).");
        }
        localStorage.setItem('custom_firebase_config', JSON.stringify(parsed));
        localStorage.removeItem('edu_offline_mode');
        triggerNotification('Cloud database configured successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err: any) {
        setConfigError(err.message || 'Invalid Firebase configuration JSON. Please check and try again.');
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-lg w-full text-center space-y-6 border border-slate-100 dark:border-slate-700/50"
        >
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <School className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">EduManager Setup Assistant</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Your cloud database has not been fully configured. You can start instantly in <strong>Offline Local Storage Mode</strong> (data is saved in your browser) or link your custom Firebase project config below.
            </p>
          </div>

          {!showConfigForm ? (
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => {
                  localStorage.setItem('edu_offline_mode', 'true');
                  setIsOfflineMode(true);
                  triggerNotification('Started Offline Mode');
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-100 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Start Offline Mode</span>
              </button>
              <button
                onClick={() => setShowConfigForm(true)}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:hover:bg-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                ⚙️ Link Custom Firebase Project
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasteSubmit} className="text-left space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Firebase Config JSON Object:</label>
                <textarea
                  rows={6}
                  value={customConfigInput}
                  onChange={(e) => setCustomConfigInput(e.target.value)}
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "...",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                  className="w-full p-3 font-mono text-[10px] border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  Paste the configuration object from your Firebase Console &gt; Project Settings &gt; Web App section.
                </p>
              </div>

              {configError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[11px] font-bold">
                  ⚠️ {configError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfigForm(false);
                    setConfigError('');
                  }}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer animate-pulse"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  if (appLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white flex flex-col items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center max-w-sm text-center space-y-5"
        >
          <div className="relative flex items-center justify-center h-20 w-20 bg-emerald-50 rounded-3xl shadow-xs">
            <div className="absolute inset-0 bg-[#16A34A]/5 rounded-3xl animate-ping opacity-75"></div>
            <GraduationCap className="h-10 w-10 text-[#16A34A]" />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">EduManager ERP</h3>
            <p className="text-[11px] text-slate-400 font-medium">Securing connection and loading database...</p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full text-[#16A34A] text-[10px] font-black uppercase tracking-wider">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Synchronizing...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================
  // UNIFIED AUTH STATE ROUTER
  // ==========================
  if (!isOfflineMode) {
    // 1. Not Authenticated
    if (!authUser) {
      return (
        <Suspense fallback={<PageLoader />}>
          <AuthPage 
            onAuthSuccess={() => {}} 
            onOfflineToggle={() => {
              setIsOfflineMode(true);
              localStorage.setItem('edu_offline_mode', 'true');
              window.location.reload();
            }} 
          />
        </Suspense>
      );
    }

    // 2. Admin Routing
    const isSystemAdmin = ['admin@edumanager.com', 'laxmikormokar70@gmail.com'].includes(authUser.email?.toLowerCase() || '') || teacherProfile?.role === 'admin';
    if (teacherProfile?.role === 'admin' || isSystemAdmin) {
      return (
        <Suspense fallback={<PageLoader />}>
          <AdminDashboard onLogout={handleSignOut} adminProfile={teacherProfile || {
            uid: authUser.uid,
            email: authUser.email || '',
            name: 'Super Admin',
            schoolName: 'EduManager Admin Hub',
            approvalStatus: 'approved',
            isProfileComplete: true,
            role: 'admin',
            adminPasswordChanged: true,
            registrationDate: new Date().toISOString()
          }} />
        </Suspense>
      );
    }

    // 4. Incomplete Profile Gate
    const isProfileComplete = teacherProfile?.profileCompleted === true || teacherProfile?.isProfileComplete === true;
    if (!isProfileComplete) {
      return (
        <Suspense fallback={<PageLoader />}>
          <CompleteProfilePage 
            teacherProfile={teacherProfile}
            onComplete={() => {
              // Profile updated and set to incomplete: false, triggers snapshot sync
            }}
            onLogout={handleSignOut}
          />
        </Suspense>
      );
    }

    // 5. Verification / KYC Audit Status Gates
    // User can access home page normally, status is handled via home status card and tab filters.

    if (teacherProfile?.approvalStatus === 'suspended') {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center font-sans">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100 dark:border-slate-700/50 space-y-6">
            <div className="h-16 w-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Account Suspended</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Your coaching workspace has been temporarily suspended by the platform administrator. Please contact support.
            </p>
            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }
  }

  // Gateway 5: Authenticated but PIN enabled -> Show Pin Unlock Screen
  if (authUser && !isUnlocked && teacherProfile?.isPinEnabled && teacherProfile?.pinCode) {
    return (
      <Suspense fallback={<PageLoader />}>
        <PinLockScreen
          savedPin={teacherProfile.pinCode}
          teacherName={teacherProfile.name}
          onUnlockSuccess={() => setIsUnlocked(true)}
        />
      </Suspense>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'fee-management', label: 'Fees', icon: Wallet },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className={`min-h-screen ${activeTab === 'dashboard' ? 'bg-[#F8FAFC]' : 'bg-white'} text-slate-800 flex flex-col md:flex-row font-sans transition-colors duration-200 overflow-x-hidden w-full`}>
      
      {/* Sidebar - Desktop Only */}
      {authUser && (
        <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-slate-100 p-6 shadow-xs shrink-0">
          <div className="space-y-8">
            {/* Logo / Brand Header */}
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 bg-gradient-to-br from-[#16A34A] to-emerald-600 text-white rounded-[16px] flex items-center justify-center shadow-md shadow-emerald-100 shrink-0 border border-emerald-500/10">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-extrabold text-slate-900 font-display leading-tight tracking-tight line-clamp-2">
                  {teacherProfile?.schoolName || 'EduManager Portal'}
                </h2>
                <span className="text-[9px] text-[#16A34A] font-mono flex items-center gap-1 font-black uppercase tracking-widest mt-1">
                  <Sparkles className="h-3 w-3 text-[#16A34A] animate-pulse" /> coaching erp
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    id={`nav-${item.id}-btn`}
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-2xl text-xs font-bold transition-all active-press transition-premium cursor-pointer ${
                      isActive 
                        ? 'bg-[#16A34A] text-white shadow-md shadow-emerald-100' 
                        : 'text-slate-500 hover:bg-[#DCFCE7]/40 hover:text-[#16A34A]'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
            <div 
              onClick={() => handleTabChange('profile')}
              className="flex items-center gap-2.5 p-1 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors group"
            >
              <div className="h-8 w-8 bg-[#DCFCE7] text-[#16A34A] rounded-lg flex items-center justify-center font-bold text-xs uppercase group-hover:scale-105 transition-transform">
                {teacherProfile?.name?.slice(0, 2) || 'TE'}
              </div>
              <div className="line-clamp-1">
                <p className="text-xs font-bold text-slate-800 group-hover:text-[#16A34A] transition-colors">{teacherProfile?.name || 'Teacher'}</p>
                <p className="text-[9px] text-slate-400">Class Instructor</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 py-2 px-3 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-all mt-1"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out Workspace</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${(activeTab === 'dashboard' || activeTab === 'attendance' || activeTab === 'fees' || activeTab === 'fee-management' || activeTab === 'reports') ? 'p-0 md:p-0 max-w-none overflow-hidden' : 'p-4 md:p-8 max-w-7xl mx-auto overflow-y-auto w-full pb-32 sm:pb-28 md:pb-8'} overflow-x-hidden relative`}>
        <div className="w-full h-full relative">
          
          {/* Blur & Lock Overlay for Pending Accounts on Management Pages */}
          {authUser && teacherProfile && (teacherProfile.approvalStatus === 'pending' || teacherProfile.status === 'pending') && activeTab !== 'dashboard' && activeTab !== 'profile' && activeTab !== 'settings' && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-white border border-amber-200 shadow-xl rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4">
                <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-amber-100">
                  <Clock className="h-8 w-8 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Your account is under admin review</h3>
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                    Add Student, Attendance, Fees, and Reports are disabled until your coaching profile is verified and approved by the admin.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-100 transition-all cursor-pointer"
                  >
                    Return to Home Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          <Suspense fallback={<PageLoader />}>
            {/* Dashboard Tab (Keep Alive) */}
          <div className={activeTab === 'dashboard' ? 'block w-full' : 'hidden'}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={activeTab === 'dashboard' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >
              <DashboardTab 
                students={displayedStudents} 
                payments={displayedPayments} 
                attendance={displayedAttendance}
                teacherProfile={teacherProfile}
                classes={classes}
                onTabChange={handleTabChange}
                onSelectStudent={handleSelectStudentForBilling}
                onTriggerAuth={(mode) => setAuthScreen(mode)}
                onDeleteClass={handleDeleteClass}
                onSaveClassState={handleSaveClassState}
                triggerNotification={triggerNotification}
                onInitiateQuickPay={handleInitiateQuickPay}
                initialView={dashboardView}
                initialEditingClassId={dashboardEditingClassId}
                onViewChange={(view) => setDashboardView(view)}
                onEditingClassIdChange={(id) => setDashboardEditingClassId(id)}
              />
            </motion.div>
          </div>

          {/* Students Tab (Keep Alive) */}
          <div className={activeTab === 'students' ? 'block w-full' : 'hidden'}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={activeTab === 'students' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >
              <StudentsTab
                payments={displayedPayments}
                students={displayedStudents}
                classes={classes}
                onAddStudent={handleAddStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                teacherProfile={teacherProfile}
                isOfflineMode={isOfflineMode}
                onSaveClassState={handleSaveClassState}
                triggerNotification={triggerNotification}
              />
            </motion.div>
          </div>

          {/* Attendance Tab (Keep Alive) */}
          <div className={activeTab === 'attendance' ? 'block w-full' : 'hidden'}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={activeTab === 'attendance' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >
              <AttendanceTab
                students={displayedStudents}
                attendance={displayedAttendance}
                classes={classes}
                payments={displayedPayments}
                teacherProfile={teacherProfile}
                onSaveAttendance={handleSaveAttendance}
                onTabChange={handleTabChange}
                triggerNotification={triggerNotification}
                onEditClassSchedule={handleEditClassSchedule}
              />
            </motion.div>
          </div>

          {/* Reports Tab (Keep Alive) */}
          <div className={activeTab === 'reports' ? 'block w-full' : 'hidden'}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={activeTab === 'reports' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >
              <ReportsTab
                students={displayedStudents}
                payments={displayedPayments}
                attendance={displayedAttendance}
                teacherProfile={teacherProfile}
                classes={classes}
              />
            </motion.div>
          </div>

          {/* Fee Management Tab (Keep Alive) */}
          <div className={activeTab === 'fee-management' ? 'block w-full' : 'hidden'}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={activeTab === 'fee-management' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >
              <FeeManagementTab
                students={displayedStudents}
                payments={displayedPayments}
                teacherProfile={teacherProfile}
                onSavePayment={handleSavePayment}
                onEditStudent={handleEditStudent}
                classes={classes}
                onTabChange={handleTabChange}
                triggerNotification={triggerNotification}
                quickPayState={quickPayState}
                onClearQuickPayState={() => setQuickPayState(null)}
              />
            </motion.div>
          </div>

          {/* Fees Tab (Keep Alive) */}
          <div className={activeTab === 'fees' ? 'block w-full' : 'hidden'}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={activeTab === 'fees' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >
              <FeesTab
                students={displayedStudents}
                payments={displayedPayments}
                teacherProfile={teacherProfile}
                onSavePayment={handleSavePayment}
                classes={classes}
              />
            </motion.div>
          </div>

          {/* Settings Tab (Keep Alive) */}
          <div className={activeTab === 'settings' ? 'block w-full' : 'hidden'}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={activeTab === 'settings' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >
              <SettingsTab
                teacherProfile={teacherProfile}
                students={displayedStudents}
                payments={displayedPayments}
                onUpdateProfile={handleUpdateProfile}
                onRestoreData={handleRestoreData}
                onSignOut={handleSignOut}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
              />
            </motion.div>
          </div>

          {/* Profile Tab (Keep Alive) */}
          <div className={activeTab === 'profile' ? 'block w-full' : 'hidden'}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={activeTab === 'profile' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >
              <ProfilePage
                teacherProfile={teacherProfile}
                students={displayedStudents}
                payments={displayedPayments}
                classes={classes}
                onBack={() => setActiveTab('dashboard')}
                onUpdateProfile={handleUpdateProfile}
                onSignOut={handleSignOut}
                onTabChange={handleTabChange}
              />
            </motion.div>
          </div>

          {/* Support Tab (Keep Alive) */}
          <div className={activeTab === 'support' ? 'block w-full' : 'hidden'}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={activeTab === 'support' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >
              <SupportTicketPage
                teacherProfile={teacherProfile}
                onBack={() => setActiveTab('profile')}
              />
            </motion.div>
          </div>

          {/* Privacy Tab (Keep Alive) */}
          <div className={activeTab === 'privacy' ? 'block w-full' : 'hidden'}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={activeTab === 'privacy' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >
              <PrivacyPolicyPage
                onBack={() => setActiveTab('profile')}
              />
            </motion.div>
          </div>
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation - Desktop hidden */}
      <AnimatePresence>
        {authUser && !isInputFocused && (
          <motion.nav
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden fixed bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-white/95 backdrop-blur-xl border border-slate-200/80 flex justify-around py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] z-40 no-print shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-[24px]"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-mobile-${item.id}-btn`}
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className="flex flex-col items-center justify-center min-w-[56px] px-1 py-1.5 cursor-pointer relative active-press transition-premium"
                >
                  <div className={`p-1 transition-all ${
                    isActive ? 'text-[#16A34A]' : 'text-[#64748B]'
                  }`}>
                    <Icon className={`h-[22px] w-[22px] ${isActive ? 'fill-[#16A34A]/10' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-bold mt-0.5 transition-colors ${isActive ? 'text-[#16A34A]' : 'text-[#64748B]'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="bottomNavLine"
                      className="absolute bottom-0 h-[3px] w-8 bg-[#16A34A] rounded-t-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Logout Success Toast */}
      <AnimatePresence>
        {logoutSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700"
          >
            <CheckSquare className="h-5 w-5 text-emerald-400" />
            <span className="text-xs font-bold">Logged out successfully.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Toast Notification System */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 border text-white font-bold text-xs ${
              notification.type === 'success' 
                ? 'bg-emerald-600 border-emerald-500 shadow-emerald-100' 
                : 'bg-rose-600 border-rose-500 shadow-rose-100'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckSquare className="h-5 w-5 text-white shrink-0" />
            ) : (
              <span className="text-base shrink-0">⚠️</span>
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Protected Access Overlay Modal Popup */}
      {showAuthPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[24px] max-w-sm w-full p-6 shadow-2xl border border-[#E5E7EB] text-center space-y-4"
          >
            <div className="h-14 w-14 bg-[#DCFCE7] text-[#16A34A] rounded-full flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-[#111827]">Protected Feature</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{authPopupMessage}</p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              {!authUser ? (
                <>
                  <button
                    onClick={() => {
                      setShowAuthPopup(false);
                      setAuthScreen('login');
                    }}
                    className="w-full py-3 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    Login Workspace
                  </button>
                  <button
                    onClick={() => {
                      setShowAuthPopup(false);
                      setAuthScreen('register');
                    }}
                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Register Coaching
                  </button>
                </>
              ) : (
                teacherProfile?.approvalStatus === 'rejected' && (
                  <button
                    onClick={() => {
                      setShowAuthPopup(false);
                      setAuthScreen('resubmit');
                    }}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    Resubmit KYC Form
                  </button>
                )
              )}
              <button
                onClick={() => setShowAuthPopup(false)}
                className="w-full py-2 bg-white text-gray-400 hover:text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close & Browse Home
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Professional KYC Pending Dialog */}
      <AnimatePresence>
        {showKYCPendingModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[24px] max-w-sm w-full p-6 shadow-2xl border border-[#E5E7EB] text-center space-y-5"
            >
              {teacherProfile?.approvalStatus === 'rejected' ? (
                <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-red-100">
                  <XCircle className="h-8 w-8 text-red-500 animate-pulse" />
                </div>
              ) : (
                <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-amber-100">
                  <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {teacherProfile?.approvalStatus === 'rejected' ? 'KYC Verification Rejected' : 'Verification Pending'}
                </h3>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed px-1">
                  {teacherProfile?.approvalStatus === 'rejected' ? (
                    <span>Your KYC verification was rejected. Please update your details under the Status Card on the Home page to resubmit.</span>
                  ) : (
                    <span>
                      KYC verification is pending.<br />
                      Your workspace will be activated after Admin approval.
                    </span>
                  )}
                </p>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={() => setShowKYCPendingModal(false)}
                  className="w-full py-3.5 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-emerald-100"
                >
                  Close & Explore
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
