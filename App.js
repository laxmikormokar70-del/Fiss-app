import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from './screens/DashboardScreen';
import StudentsScreen from './screens/StudentsScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import FeesScreen from './screens/FeesScreen';
import ReportsScreen from './screens/ReportsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#ffffff', elevation: 0, shadowOpacity: 0 },
            headerTitleStyle: { fontWeight: '800', fontSize: 17, color: '#0f172a' },
            tabBarActiveTintColor: '#16a34a',
            tabBarInactiveTintColor: '#64748b',
            tabBarStyle: {
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#f1f5f9',
              height: 60,
              paddingBottom: 8,
              paddingTop: 6,
            },
            tabBarIcon: ({ focused, color, size }) => {
              let iconName = 'home';
              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Students') {
                iconName = focused ? 'people' : 'people-outline';
              } else if (route.name === 'Attendance') {
                iconName = focused ? 'checkbox' : 'checkbox-outline';
              } else if (route.name === 'Fees') {
                iconName = focused ? 'wallet' : 'wallet-outline';
              } else if (route.name === 'Reports') {
                iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }
              return <Ionicons name={iconName} size={size || 22} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Home', headerTitle: 'Coaching Dashboard' }} />
          <Tab.Screen name="Students" component={StudentsScreen} options={{ title: 'Students', headerTitle: 'Student Roster' }} />
          <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Attendance', headerTitle: 'Mark Attendance' }} />
          <Tab.Screen name="Fees" component={FeesScreen} options={{ title: 'Fees', headerTitle: 'Fee Management' }} />
          <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports', headerTitle: 'Analytics & Reports' }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', headerTitle: 'Coaching Settings' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
