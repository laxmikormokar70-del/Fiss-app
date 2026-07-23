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
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.coaching.erp.model.Student
import com.coaching.erp.viewmodel.CoachingViewModel

@Composable
fun HomeScreen(
    viewModel: CoachingViewModel,
    onNavigate: (String) -> Unit
) {
    val context = LocalContext.current
    var showAddModal by remember { mutableStateOf(false) }

    val students = viewModel.studentsList.value
    val totalStudents = students.size
    val totalPaid = students.count { it.status == "Paid" || it.dueAmount <= 0 }
    val totalDueAmount = students.sumOf { it.dueAmount }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(16.dp),
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
                        Text(
                            text = viewModel.instituteName.value,
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Teacher: ${viewModel.teacherName.value}",
                            color = Color(0xFF94A3B8),
                            fontSize = 13.sp
                        )
                    }
                    IconButton(
                        onClick = { onNavigate("profile") },
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Color(0xFF16A34A))
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = "Profile",
                            tint = Color.White
                        )
                    }
                }
            }
        }

        // Stat Cards Grid
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatBox(
                        title = "Total Students",
                        value = "$totalStudents",
                        sub = "Active Enrollment",
                        icon = Icons.Default.People,
                        color = Color(0xFF2563EB),
                        bgColor = Color(0xFFEFF6FF),
                        modifier = Modifier.weight(1f)
                    )
                    StatBox(
                        title = "Attendance Rate",
                        value = "94.2%",
                        sub = "Today's Average",
                        icon = Icons.Default.CheckCircle,
                        color = Color(0xFF16A34A),
                        bgColor = Color(0xFFF0FDF4),
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatBox(
                        title = "Paid Fees",
                        value = "$totalPaid/$totalStudents",
                        sub = "Clear Records",
                        icon = Icons.Default.AccountBalanceWallet,
                        color = Color(0xFF0284C7),
                        bgColor = Color(0xFFF0F9FF),
                        modifier = Modifier.weight(1f)
                    )
                    StatBox(
                        title = "Pending Dues",
                        value = "₹${totalDueAmount.toInt()}",
                        sub = "Action Required",
                        icon = Icons.Default.Warning,
                        color = Color(0xFFDC2626),
                        bgColor = Color(0xFFFEF2F2),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Today's Live Batch Schedule
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                "Class 10 - Mathematics",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = Color(0xFF0F172A)
                            )
                            Text(
                                "CBSE Batch A • 05:00 PM - 06:30 PM",
                                fontSize = 12.sp,
                                color = Color(0xFF64748B)
                            )
                        }
                        Button(
                            onClick = { onNavigate("attendance") },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Take Roll", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Quick Actions
        item {
            Text(
                "Quick Management",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF0F172A)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White, RoundedCornerShape(16.dp))
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                QuickItem("Add Student", Icons.Default.PersonAdd, Color(0xFF2563EB)) { showAddModal = true }
                QuickItem("Attendance", Icons.Default.CheckBox, Color(0xFF16A34A)) { onNavigate("attendance") }
                QuickItem("Fee Collect", Icons.Default.AccountBalanceWallet, Color(0xFFD97706)) { onNavigate("fees") }
                QuickItem("Reports", Icons.Default.Description, Color(0xFF9333EA)) { onNavigate("reports") }
            }
        }

        // Recent Students
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Recent Students",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF0F172A)
                )
                Text(
                    "View All ($totalStudents) →",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF2563EB),
                    modifier = Modifier.clickable { onNavigate("students") }
                )
            }
        }

        items(students.take(3)) { student ->
            StudentRow(student = student) {
                Toast.makeText(context, "Call Guardian: ${student.phone}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    if (showAddModal) {
        AddStudentDialog(
            onDismiss = { showAddModal = false },
            onAdd = { newStudent ->
                viewModel.addStudent(newStudent)
                showAddModal = false
                Toast.makeText(context, "${newStudent.name} added!", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

@Composable
fun StatBox(
    title: String,
    value: String,
    sub: String,
    icon: ImageVector,
    color: Color,
    bgColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = bgColor),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.height(6.dp))
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF0F172A))
            Text(title, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF475569))
            Text(sub, fontSize = 10.sp, color = Color(0xFF94A3B8))
        }
    }
}

@Composable
fun QuickItem(title: String, icon: ImageVector, color: Color, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable { onClick() }
            .padding(4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .background(color.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = title, tint = color)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(title, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
    }
}

@Composable
fun StudentRow(student: Student, onCall: () -> Unit) {
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
                Text(student.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF0F172A))
                Text("Roll #${student.rollNumber} • ${student.className}", fontSize = 12.sp, color = Color(0xFF64748B))
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = if (student.dueAmount > 0) "Due: ₹${student.dueAmount.toInt()}" else "Paid",
                    color = if (student.dueAmount > 0) Color(0xFFDC2626) else Color(0xFF16A34A),
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(end = 8.dp)
                )
                IconButton(onClick = onCall) {
                    Icon(Icons.Default.Phone, contentDescription = "Call", tint = Color(0xFF2563EB))
                }
            }
        }
    }
}

@Composable
fun AddStudentDialog(onDismiss: () -> Unit, onAdd: (Student) -> Unit) {
    var name by remember { mutableStateOf("") }
    var roll by remember { mutableStateOf("") }
    var className by remember { mutableStateOf("Class 10") }
    var phone by remember { mutableStateOf("") }
    var due by remember { mutableStateOf("0") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add New Student", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Student Name") })
                OutlinedTextField(value = roll, onValueChange = { roll = it }, label = { Text("Roll Number") })
                OutlinedTextField(value = className, onValueChange = { className = it }, label = { Text("Class") })
                OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Guardian Phone") })
                OutlinedTextField(value = due, onValueChange = { due = it }, label = { Text("Due Amount (₹)") })
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank()) {
                        onAdd(
                            Student(
                                id = System.currentTimeMillis().toString(),
                                name = name,
                                rollNumber = roll.ifBlank { "100" },
                                className = className,
                                phone = phone.ifBlank { "9876543210" },
                                dueAmount = due.toDoubleOrNull() ?: 0.0,
                                status = if ((due.toDoubleOrNull() ?: 0.0) > 0) "Due" else "Paid"
                            )
                        )
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A))
            ) {
                Text("Save Student")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
