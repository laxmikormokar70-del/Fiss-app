package com.coaching.erp.viewmodel

import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import com.coaching.erp.model.FeeRecord
import com.coaching.erp.model.Student

class CoachingViewModel : ViewModel() {

    var teacherName = mutableStateOf("Amit Sir")
    var instituteName = mutableStateOf("Apex Coaching Institute")
    var phone = mutableStateOf("9876543210")
    var pinLockEnabled = mutableStateOf(true)
    var timeLockEnabled = mutableStateOf(true)

    val studentsList = mutableStateOf(
        listOf(
            Student("1", "Aarav Sharma", "101", "Class 10", "9876543210", 0.0, "Paid"),
            Student("2", "Priya Verma", "102", "Class 10", "9876543211", 1200.0, "Due"),
            Student("3", "Rohan Gupta", "103", "Class 12", "9876543212", 0.0, "Paid"),
            Student("4", "Sneha Patel", "104", "Class 12", "9876543213", 1500.0, "Due"),
            Student("5", "Karan Malhotra", "105", "Class 11", "9876543214", 800.0, "Due"),
            Student("6", "Ananya Roy", "106", "Class 11", "9876543215", 0.0, "Paid")
        )
    )

    val attendanceState = mutableStateMapOf(
        "1" to "Present",
        "2" to "Absent",
        "3" to "Present",
        "4" to "Present",
        "5" to "Late",
        "6" to "Present"
    )

    val feesList = mutableStateOf(
        listOf(
            FeeRecord("1", "Aarav Sharma", "Class 10", 1200.0, "July 2026", "Paid", "2026-07-15"),
            FeeRecord("2", "Priya Verma", "Class 10", 1200.0, "July 2026", "Due", "-"),
            FeeRecord("3", "Rohan Gupta", "Class 12", 1500.0, "July 2026", "Paid", "2026-07-10"),
            FeeRecord("4", "Sneha Patel", "Class 12", 1500.0, "July 2026", "Due", "-")
        )
    )

    fun addStudent(student: Student) {
        studentsList.value = listOf(student) + studentsList.value
        attendanceState[student.id] = "Present"
    }

    fun setAttendanceStatus(studentId: String, status: String) {
        attendanceState[studentId] = status
    }

    fun collectFee(feeId: String) {
        feesList.value = feesList.value.map { fee ->
            if (fee.id == feeId) {
                fee.copy(status = "Paid", paidDate = "2026-07-23")
            } else {
                fee
            }
        }
    }
}
