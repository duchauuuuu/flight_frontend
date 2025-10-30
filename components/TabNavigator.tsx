import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { TouchableOpacity, Text, View } from 'react-native';
import { useAuthStore } from '../store/authStore';

import SearchScreen from '../screens/SearchScreen';
import MyTicketsScreen from '../screens/MyTicketsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AccountScreen from '../screens/AccountScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/Register';

export type RootTabParamList = {
  Search: undefined;
  MyTickets: undefined;
  Notifications: undefined;
  Account: undefined;
};

export type AccountStackParamList = {
  AccountMain: undefined;
  Profile: undefined;
  Login: undefined;
  Register: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();

function AccountStackScreen() {
  const { isAuthenticated, user } = useAuthStore();
  
  return (
    <AccountStack.Navigator 
      key={isAuthenticated ? 'auth' : 'no-auth'}
      screenOptions={{ headerShown: false }}
      initialRouteName={isAuthenticated ? "AccountMain" : "Login"}
    >
      <AccountStack.Screen name="AccountMain" component={AccountScreen} />
      <AccountStack.Screen name="Profile" component={ProfileScreen} />
      <AccountStack.Screen name="Login" component={LoginScreen} />
      <AccountStack.Screen name="Register" component={RegisterScreen} />
    </AccountStack.Navigator>
  );
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Search"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Icon.glyphMap = 'home';
          
          if (route.name === 'Search') {
            iconName = 'airplane-search';
          } else if (route.name === 'MyTickets') {
            iconName = 'ticket-confirmation';
          } else if (route.name === 'Notifications') {
            iconName = 'bell';
          } else if (route.name === 'Account') {
            iconName = 'account';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2873e6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#2873e6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          title: 'Tìm kiếm',
          tabBarLabel: 'Tìm kiếm',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="MyTickets" 
        component={MyTicketsScreen}
        options={{
          title: 'Vé của tôi',
          tabBarLabel: 'Vé của tôi',
          headerRight: () => (
            <TouchableOpacity 
              style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => {
                // This will be handled by the screen itself
                console.log('Refresh tickets');
              }}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <View style={{ marginLeft: 4 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>Làm mới</Text>
                <View style={{ height: 1.5, backgroundColor: '#fff' }} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          title: 'Thông báo',
          tabBarLabel: 'Thông báo',
        }}
      />
      <Tab.Screen 
        name="Account" 
        component={AccountStackScreen}
        options={{
          title: 'Tài khoản',
          tabBarLabel: 'Tài khoản',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}
