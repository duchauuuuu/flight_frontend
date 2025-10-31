import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminFlightsScreen from '../screens/admin/AdminFlightsScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminEditUserScreen from '../screens/admin/AdminEditUserScreen';
import AdminAddUserScreen from '../screens/admin/AdminAddUserScreen';
import AdminEditFlightScreen from '../screens/admin/AdminEditFlightScreen';
import AdminAddFlightScreen from '../screens/admin/AdminAddFlightScreen';
import { AccountStackParamList } from '../types/navigation';

const AdminTab = createBottomTabNavigator();
const AdminStack = createNativeStackNavigator<AccountStackParamList>();

// Stack Navigator cho Dashboard
function AdminStackNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="AdminDashboard"
    >
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboard} />
    </AdminStack.Navigator>
  );
}

// Stack Navigator cho Users tab (bao gồm edit/add)
function AdminUsersStackNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="AdminUsers"
    >
      <AdminStack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <AdminStack.Screen name="AdminEditUser" component={AdminEditUserScreen} />
      <AdminStack.Screen name="AdminAddUser" component={AdminAddUserScreen} />
    </AdminStack.Navigator>
  );
}

// Stack Navigator cho Flights tab (bao gồm edit/add)
function AdminFlightsStackNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="AdminFlights"
    >
      <AdminStack.Screen name="AdminFlights" component={AdminFlightsScreen} />
      <AdminStack.Screen name="AdminEditFlight" component={AdminEditFlightScreen} />
      <AdminStack.Screen name="AdminAddFlight" component={AdminAddFlightScreen} />
    </AdminStack.Navigator>
  );
}

export default function AdminNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <AdminTab.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Icon.glyphMap = 'view-dashboard';

          if (route.name === 'AdminDashboard') {
            iconName = 'view-dashboard';
          } else if (route.name === 'AdminFlights') {
            iconName = 'airplane';
          } else if (route.name === 'AdminBookings') {
            iconName = 'ticket-confirmation';
          } else if (route.name === 'AdminUsers') {
            iconName = 'account-group';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2873e6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 0,
          shadowColor: 'transparent',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <AdminTab.Screen
        name="AdminDashboard"
        component={AdminStackNavigator}
        options={{
          tabBarLabel: 'Trang chủ',
          title: 'Trang chủ',
        }}
      />
      <AdminTab.Screen
        name="AdminFlights"
        component={AdminFlightsStackNavigator}
        options={{
          tabBarLabel: 'Chuyến bay',
          title: 'Quản lý chuyến bay',
        }}
      />
      <AdminTab.Screen
        name="AdminBookings"
        component={AdminBookingsScreen}
        options={{
          tabBarLabel: 'Đặt vé',
          title: 'Quản lý đặt vé',
        }}
      />
      <AdminTab.Screen
        name="AdminUsers"
        component={AdminUsersStackNavigator}
        options={{
          tabBarLabel: 'Người dùng',
          title: 'Quản lý người dùng',
        }}
      />
    </AdminTab.Navigator>
  );
}

