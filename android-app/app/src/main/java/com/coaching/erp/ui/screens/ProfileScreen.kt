package com.coaching.erp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LogOut
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.coaching.erp.viewmodel.CoachingViewModel

@Composable
fun ProfileScreen(viewModel: CoachingViewModel) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp)
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Profile Header
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(Color(0xFF16A34A), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        viewModel.teacherName.value.take(1),
                        color = Color.White,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Black
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
                Text(viewModel.teacherName.value, fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color(0xFF0F172A))
                Text(viewModel.instituteName.value, fontSize = 13.sp, color = Color(0xFF64748B), fontWeight = FontWeight.Medium)

                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(Color(0xFFDCFCE7), RoundedCornerShape(12.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF16A34A), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Verified Teacher", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF15803D))
                }
            }
        }

        // Details Section
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("Institute Details", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))

                OutlinedTextField(
                    value = viewModel.instituteName.value,
                    onValueChange = { viewModel.instituteName.value = it },
                    label = { Text("Institute Name") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = viewModel.teacherName.value,
                    onValueChange = { viewModel.teacherName.value = it },
                    label = { Text("Teacher Name") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = viewModel.phone.value,
                    onValueChange = { viewModel.phone.value = it },
                    label = { Text("Phone Number") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )
            }
        }

        // Locks & Security
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Security & Access Locks", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("4-Digit PIN Security", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Require PIN when opening app", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    }
                    Switch(
                        checked = viewModel.pinLockEnabled.value,
                        onCheckedChange = { viewModel.pinLockEnabled.value = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = Color(0xFF16A34A))
                    )
                }

                Divider(modifier = Modifier.padding(vertical = 8.dp), color = Color(0xFFF1F5F9))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Time-Based Auto Lock", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Lock attendance outside batch hours", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    }
                    Switch(
                        checked = viewModel.timeLockEnabled.value,
                        onCheckedChange = { viewModel.timeLockEnabled.value = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = Color(0xFF16A34A))
                    )
                }
            }
        }

        // Actions
        Button(
            onClick = { Toast.makeText(context, "Settings Saved!", Toast.LENGTH_SHORT).show() },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
        ) {
            Icon(Icons.Default.Save, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Save Profile Changes", fontWeight = FontWeight.Bold)
        }

        OutlinedButton(
            onClick = { Toast.makeText(context, "Logged Out", Toast.LENGTH_SHORT).show() },
            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFDC2626)),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
        ) {
            Icon(Icons.Default.LogOut, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Log Out Account", fontWeight = FontWeight.Bold)
        }
    }
}
