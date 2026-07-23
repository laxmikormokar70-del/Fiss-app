package com.coaching.erp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.CheckBox
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.coaching.erp.ui.screens.*
import com.coaching.erp.ui.theme.CoachingERPTheme
import com.coaching.erp.viewmodel.CoachingViewModel

sealed class NavRoutes(val route: String, val title: String, val icon: ImageVector) {
    object Home : NavRoutes("home", "Home", Icons.Default.Home)
    object Students : NavRoutes("students", "Students", Icons.Default.People)
    object Attendance : NavRoutes("attendance", "Attendance", Icons.Default.CheckBox)
    object Fees : NavRoutes("fees", "Fees", Icons.Default.AccountBalanceWallet)
    object Reports : NavRoutes("reports", "Reports", Icons.Default.BarChart)
    object Profile : NavRoutes("profile", "Profile", Icons.Default.Person)
}

class MainActivity : ComponentActivity() {

    private val viewModel: CoachingViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CoachingERPTheme {
                MainAppScreen(viewModel)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen(viewModel: CoachingViewModel) {
    val navController = rememberNavController()
    val items = listOf(
        NavRoutes.Home,
        NavRoutes.Students,
        NavRoutes.Attendance,
        NavRoutes.Fees,
        NavRoutes.Reports,
        NavRoutes.Profile
    )

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: NavRoutes.Home.route

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = when (currentRoute) {
                            NavRoutes.Home.route -> "Coaching Dashboard"
                            NavRoutes.Students.route -> "Student Roster"
                            NavRoutes.Attendance.route -> "Mark Attendance"
                            NavRoutes.Fees.route -> "Fee Management"
                            NavRoutes.Reports.route -> "Analytics & Reports"
                            NavRoutes.Profile.route -> "Coaching Settings"
                            else -> "Coaching ERP"
                        },
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0F172A)
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                items.forEach { item ->
                    NavigationBarItem(
                        icon = { Icon(item.icon, contentDescription = item.title) },
                        label = { Text(item.title, fontWeight = FontWeight.Bold) },
                        selected = currentRoute == item.route,
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF16A34A),
                            selectedTextColor = Color(0xFF16A34A),
                            indicatorColor = Color(0xFFDCFCE7),
                            unselectedIconColor = Color(0xFF64748B),
                            unselectedTextColor = Color(0xFF64748B)
                        ),
                        onClick = {
                            if (currentRoute != item.route) {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        }
                    )
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = NavRoutes.Home.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(NavRoutes.Home.route) {
                HomeScreen(viewModel = viewModel, onNavigate = { route -> navController.navigate(route) })
            }
            composable(NavRoutes.Students.route) {
                StudentsScreen(viewModel = viewModel)
            }
            composable(NavRoutes.Attendance.route) {
                AttendanceScreen(viewModel = viewModel)
            }
            composable(NavRoutes.Fees.route) {
                FeesScreen(viewModel = viewModel)
            }
            composable(NavRoutes.Reports.route) {
                ReportsScreen(viewModel = viewModel)
            }
            composable(NavRoutes.Profile.route) {
                ProfileScreen(viewModel = viewModel)
            }
        }
    }
}
