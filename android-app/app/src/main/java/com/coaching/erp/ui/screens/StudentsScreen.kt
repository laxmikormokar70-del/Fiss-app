package com.coaching.erp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
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
fun StudentsScreen(viewModel: CoachingViewModel) {
    val context = LocalContext.current
    var search by remember { mutableStateOf("") }
    var filterClass by remember { mutableStateOf("All") }
    var showAddModal by remember { mutableStateOf(false) }

    val students = viewModel.studentsList.value
    val filteredStudents = students.filter { student ->
        val matchesSearch = student.name.contains(search, ignoreCase = true) || student.rollNumber.contains(search)
        val matchesClass = filterClass == "All" || student.className == filterClass
        matchesSearch && matchesClass
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp)
    ) {
        // Search & Add Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                placeholder = { Text("Search name or roll...", fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = Color.White,
                    focusedContainerColor = Color.White
                )
            )

            FloatingActionButton(
                onClick = { showAddModal = true },
                containerColor = Color(0xFF16A34A),
                contentColor = Color.White,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.size(52.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Student")
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Class Filters
        val filterOptions = listOf("All", "Class 10", "Class 11", "Class 12")
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(filterOptions) { cls ->
                FilterChip(
                    selected = filterClass == cls,
                    onClick = { filterClass = cls },
                    label = { Text(cls, fontWeight = FontWeight.Bold) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Color(0xFF16A34A),
                        selectedLabelColor = Color.White
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Student Roster
        if (filteredStudents.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text("No Students Found", color = Color(0xFF64748B), fontWeight = FontWeight.Bold)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(filteredStudents) { student ->
                    StudentRow(student = student) {
                        Toast.makeText(context, "Dialing ${student.phone}", Toast.LENGTH_SHORT).show()
                    }
                }
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
