import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminFlightsScreen from '../screens/admin/AdminFlightsScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminEditUserScreen from '../screens/admin/AdminEditUserScreen';
import AdminAddUserScreen from '../screens/admin/AdminAddUserScreen';
import { AccountStackParamList } from '../types/navigation';

const AdminStack = createNativeStackNavigator<AccountStackParamList>();

export default function AdminNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="AdminDashboard"
    >
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboard} />
      <AdminStack.Screen name="AdminFlights" component={AdminFlightsScreen} />
      <AdminStack.Screen name="AdminBookings" component={AdminBookingsScreen} />
      <AdminStack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <AdminStack.Screen name="AdminEditUser" component={AdminEditUserScreen} />
      <AdminStack.Screen name="AdminAddUser" component={AdminAddUserScreen} />
    </AdminStack.Navigator>
  );
}

