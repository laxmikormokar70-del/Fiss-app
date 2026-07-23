export interface TeacherProfile {
  uid: string;
  email: string;
  phone?: string;
  name: string;
  schoolName: string;
  logoUrl?: string;
  profilePhoto?: string; // base64
  bannerPhoto?: string; // base64
  institutePhoto?: string; // base64
  address?: string;
  city?: string;
  state?: string;
  postalPinCode?: string;
  gpsLocation?: string;
  description?: string;
  alternateEmail?: string;
  paymentDetails?: string; // bKash / Rocket / Nagad / Bank
  pinCode?: string; // app lock PIN
  isPinEnabled?: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  isProfileComplete?: boolean;
  profileCompleted?: boolean;
  fullName?: string;
  coachingName?: string;
  bannerImage?: string;
  mobile?: string;
  instituteName?: string;
  role?: 'admin' | 'teacher';
  registrationDate?: string;
  createdAt?: string;
  updatedAt?: string;
  rejectionReason?: string;
  adminPasswordChanged?: boolean;
  customClasses?: string[];
  customBatches?: string[];
  timeLockEnabled?: boolean;
  allowLateAttendance?: boolean;
  lateMinutes?: number;
}

export interface Student {
  id: string;
  studentId?: string;
  teacherId: string;
  name: string;
  rollNumber: string;
  class: string;
  classId?: string;
  batch: string;
  batchId?: string;
  time: string;
  mobileNumber: string;
  phone?: string;
  phoneNumber?: string;
  feeInformation?: number;
  guardianName: string;
  fatherName?: string;
  motherName?: string;
  motherMobile?: string;
  address?: string;
  dob?: string;
  monthlyFee: number;
  admissionDate: string;
  status: 'Active' | 'Inactive' | 'Archived';
  photoUrl?: string; // base64
  gender?: 'Boy' | 'Girl';
  createdAt: string;
  studentName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  className?: string;
  batchName?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentClass: string;
  month: string; // e.g. "2026-07"
  paymentDate: string; // ISO string
  amountPaid: number;
  dueAmount: number;
  advanceAmount: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  notes?: string;
  paymentMode?: 'Cash' | 'Online' | string;
  paymentTime?: string;
}

export interface Settings {
  darkMode: boolean;
  schoolName: string;
  teacherName: string;
  logoUrl?: string;
  pinCode?: string;
  isPinEnabled?: boolean;
}

export interface Attendance {
  id: string;
  teacherId: string;
  date: string;
  attendanceMarks: Record<string, 'present' | 'absent'>;
  createdAt: string;
  classId?: string;
  className?: string;
  batchId?: string;
  batchName?: string;
  attendanceDate?: string;
  attendanceDay?: string;
  attendanceTime?: string;
  scheduleStart?: string;
  scheduleEnd?: string;
  lateMinutes?: number;
  timeLockEnabled?: boolean;
  markedBy?: string;
}

