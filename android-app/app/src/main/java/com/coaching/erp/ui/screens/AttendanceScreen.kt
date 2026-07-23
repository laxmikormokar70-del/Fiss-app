package com.coaching.erp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.coaching.erp.viewmodel.CoachingViewModel

@Composable
fun AttendanceScreen(viewModel: CoachingViewModel) {
    val context = LocalContext.current
    val students = viewModel.studentsList.value
    val attendanceMap = viewModel.attendanceState

    val presentCount = attendanceMap.values.count { it == "Present" }
    val absentCount = attendanceMap.values.count { it == "Absent" }
    val lateCount = attendanceMap.values.count { it == "Late" }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
    ) {
        // Banner
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            shape = RoundedCornerShape(0.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Class 10 - Mathematics", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("Today's Batch • 05:00 PM", color = Color(0xFF94A3B8), fontSize = 12.sp)
                }
                Button(
                    onClick = { Toast.makeText(context, "Scanning QR Code...", Toast.LENGTH_SHORT).show() },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.QrCodeScanner, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Scan QR", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Summary Cards Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            SummaryChip("PRESENT", "$presentCount", Color(0xFFDCFCE7), Color(0xFF15803D), Modifier.weight(1f))
            SummaryChip("ABSENT", "$absentCount", Color(0xFFFEE2E2), Color(0xFFB91C1C), Modifier.weight(1f))
            SummaryChip("LATE", "$lateCount", Color(0xFFFEF3C7), Color(0xFFB45309), Modifier.weight(1f))
        }

        // Attendance List
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(students) { student ->
                val currentStatus = attendanceMap[student.id] ?: "Present"
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("#${student.rollNumber}", color = Color(0xFF2563EB), fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
                            Text(student.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF0F172A))
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            StatusToggle("P", currentStatus == "Present", Color(0xFF22C55E)) {
                                viewModel.setAttendanceStatus(student.id, "Present")
                            }
                            StatusToggle("A", currentStatus == "Absent", Color(0xFFEF4444)) {
                                viewModel.setAttendanceStatus(student.id, "Absent")
                            }
                            StatusToggle("L", currentStatus == "Late", Color(0xFFF59E0B)) {
                                viewModel.setAttendanceStatus(student.id, "Late")
                            }
                        }
                    }
                }
            }
        }

        // Bottom Save Bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(16.dp)
        ) {
            Button(
                onClick = {
                    Toast.makeText(context, "Attendance Saved! Dispatched SMS Alerts.", Toast.LENGTH_LONG).show()
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                Icon(Icons.Default.CheckCircle, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Submit & Send SMS Alerts", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        }
    }
}

@Composable
fun SummaryChip(label: String, count: String, bgColor: Color, textColor: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = bgColor),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(count, fontSize = 20.sp, fontWeight = FontWeight.Black, color = textColor)
            Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = textColor)
        }
    }
}

@Composable
fun StatusToggle(label: String, isSelected: Boolean, activeColor: Color, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .background(if (isSelected) activeColor else Color(0xFFF1F5F9), CircleShape)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontWeight = FontWeight.Bold,
            color = if (isSelected) Color.White else Color(0xFF64748B),
            fontSize = 14.sp
        )
    }
}
