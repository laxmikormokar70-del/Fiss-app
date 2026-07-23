package com.coaching.erp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Payment
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
fun FeesScreen(viewModel: CoachingViewModel) {
    val context = LocalContext.current
    var activeTab by remember { mutableStateOf("All") }
    val feesList = viewModel.feesList.value

    val filteredList = feesList.filter {
        activeTab == "All" || it.status == activeTab
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp)
    ) {
        // Revenue Summary Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("TOTAL COLLECTED", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                    Text("₹2,700", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF4ADE80))
                }
                Divider(
                    color = Color.White.copy(alpha = 0.2f),
                    modifier = Modifier
                        .height(36.dp)
                        .width(1.dp)
                )
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("PENDING DUES", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                    Text("₹2,700", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFFF87171))
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Tabs
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("All", "Due", "Paid").forEach { tab ->
                Button(
                    onClick = { activeTab = tab },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (activeTab == tab) Color(0xFF16A34A) else Color.White,
                        contentColor = if (activeTab == tab) Color.White else Color(0xFF64748B)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(tab, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Fee List
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(filteredList) { item ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column {
                                Text(item.studentName, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = Color(0xFF0F172A))
                                Text("${item.className} • ${item.month}", fontSize = 12.sp, color = Color(0xFF64748B))
                            }
                            Text("₹${item.amount.toInt()}", fontWeight = FontWeight.Black, fontSize = 18.sp, color = Color(0xFF0F172A))
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Divider(color = Color(0xFFF1F5F9))
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                if (item.status == "Paid") "Paid on ${item.paidDate}" else "Payment Pending",
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8)
                            )

                            if (item.status == "Due") {
                                Button(
                                    onClick = {
                                        viewModel.collectFee(item.id)
                                        Toast.makeText(context, "Payment collected for ${item.studentName}!", Toast.LENGTH_SHORT).show()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Icon(Icons.Default.Payment, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Collect Payment", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            } else {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .background(Color(0xFFDCFCE7), RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF16A34A), modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("COMPLETED", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF15803D))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
