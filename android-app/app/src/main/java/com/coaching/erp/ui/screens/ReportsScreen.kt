package com.coaching.erp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.GridOn
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
fun ReportsScreen(viewModel: CoachingViewModel) {
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
        // Month Selector Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("July 2026 Summary", fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color(0xFF0F172A))
            Button(
                onClick = { Toast.makeText(context, "Exporting PDF Ledger...", Toast.LENGTH_SHORT).show() },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("PDF Export", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Attendance Performance
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Attendance Performance", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Spacer(modifier = Modifier.height(12.dp))
                ReportItem("Average Daily Attendance", "94.2%", Color(0xFF16A34A))
                ReportItem("Total Working Days", "22 Days", Color(0xFF0F172A))
                ReportItem("Most Regular Class", "Class 10 (97.8%)", Color(0xFF2563EB))
            }
        }

        // Financial Analytics
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Financial Analytics", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Spacer(modifier = Modifier.height(12.dp))
                ReportItem("Total Projected Revenue", "₹5,400", Color(0xFF0F172A))
                ReportItem("Total Collected", "₹2,700 (50%)", Color(0xFF16A34A))
                ReportItem("Total Outstanding Dues", "₹2,700 (50%)", Color(0xFFDC2626))
            }
        }

        // Quick Export Grid
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                modifier = Modifier
                    .weight(1f)
                    .height(110.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                onClick = { Toast.makeText(context, "Exporting PDF Ledger...", Toast.LENGTH_SHORT).show() }
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(Icons.Default.Description, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(32.dp))
                    Text("Full PDF Ledger", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Detailed breakdown", fontSize = 10.sp, color = Color(0xFF94A3B8))
                }
            }

            Card(
                modifier = Modifier
                    .weight(1f)
                    .height(110.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                onClick = { Toast.makeText(context, "Exporting Excel Sheet...", Toast.LENGTH_SHORT).show() }
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(Icons.Default.GridOn, contentDescription = null, tint = Color(0xFF16A34A), modifier = Modifier.size(32.dp))
                    Text("Excel Sheet", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Raw CSV export", fontSize = 10.sp, color = Color(0xFF94A3B8))
                }
            }
        }
    }
}

@Composable
fun ReportItem(label: String, value: String, valColor: Color) {
    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, color = Color(0xFF64748B), fontSize = 13.sp)
            Text(value, color = valColor, fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
        Divider(color = Color(0xFFF1F5F9))
    }
}
