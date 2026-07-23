package com.coaching.erp.model

data class Student(
    val id: String,
    val name: String,
    val rollNumber: String,
    val className: String,
    val phone: String,
    val dueAmount: Double,
    val status: String
)

data class FeeRecord(
    val id: String,
    val studentName: String,
    val className: String,
    val amount: Double,
    val month: String,
    val status: String,
    val paidDate: String
)
