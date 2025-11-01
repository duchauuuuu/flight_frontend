import React, { useEffect, useState, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

import SearchScreen from '../screens/SearchScreen';
import ResultsScreen from '../screens/ResultsScreen';
import ResultsLoadingScreen from '../screens/ResultsLoadingScreen';
import BookingScreen from '../screens/BookingScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import AirportsScreen from '../screens/AirportsScreen';
import DatePickerScreen from '../screens/DatePickerScreen';
import MyTicketsScreen from '../screens/MyTicketsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AccountScreen from '../screens/AccountScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/Register';
import { RootTabParamList, AccountStackParamList, SearchStackParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();

function AccountStackScreen() {
  const { isAuthenticated, user } = useAuthStore();
  
  return (
    <AccountStack.Navigator 
      key={isAuthenticated ? 'auth' : 'no-auth'}
      screenOptions={{ headerShown: false }}
      initialRouteName={"AccountMain"}
    >
      <AccountStack.Screen name="AccountMain" component={AccountScreen} />
      <AccountStack.Screen name="Profile" component={ProfileScreen} />
      {!isAuthenticated && (
        <>
          <AccountStack.Screen name="Login" component={LoginScreen} />
          <AccountStack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </AccountStack.Navigator>
  );
}

function SearchStackScreen() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="SearchMain" component={SearchScreen} />
      <SearchStack.Screen name="Airports" component={AirportsScreen} />
      <SearchStack.Screen name="DatePicker" component={DatePickerScreen} />
      <SearchStack.Screen name="ResultsLoading" component={ResultsLoadingScreen} options={{ headerShown: false }} />
      <SearchStack.Screen 
        name="Results" 
        component={ResultsScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen 
        name="Booking" 
        component={BookingScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen 
        name="PaymentSuccess" 
        component={PaymentSuccessScreen}
        options={{ headerShown: false }}
      />
    </SearchStack.Navigator>
  );
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user, tokens } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user?._id || !API_BASE_URL) {
      setUnreadCount(0);
      return;
    }

    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/notifications/user/${user._id}/unread-count`,
        {
          headers: tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : undefined,
        }
      );
      setUnreadCount(typeof data === 'number' ? data : 0);
    } catch (error: any) {
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?._id, tokens?.access_token, API_BASE_URL]);

  // Load unread count khi component mount và khi auth state thay đổi
  useEffect(() => {
    loadUnreadCount();
    
    // Reload unread count mỗi 5 giây khi đã đăng nhập
    if (isAuthenticated && user?._id) {
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [loadUnreadCount, isAuthenticated, user?._id]);

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
          
          if (route.name === 'Notifications' && unreadCount > 0) {
            return (
              <View style={{ position: 'relative' }}>
                <Icon name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              </View>
            );
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
        component={SearchStackScreen}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'SearchMain';
          
          return {
            title: 'Tìm kiếm',
            tabBarLabel: 'Tìm kiếm',
            headerShown: false,
            tabBarStyle: (routeName === 'Results' || routeName === 'ResultsLoading' || routeName === 'Booking' || routeName === 'PaymentSuccess') ? { display: 'none' } : undefined,
          };
        }}
      />
      <Tab.Screen 
        name="MyTickets" 
        component={MyTicketsScreen}
        options={({ navigation }) => ({
          title: 'Vé của tôi',
          tabBarLabel: 'Vé của tôi',
          headerRight: () => (
            isAuthenticated ? (
              <TouchableOpacity 
                style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => {
                  // Navigate với param refresh để trigger refresh trong MyTicketsScreen
                  navigation.navigate('MyTickets', { refresh: Date.now() });
                }}
              >
                <Icon name="refresh" size={20} color="#fff" />
                <View style={{ marginLeft: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>Làm mới</Text>
                  <View style={{ height: 1.5, backgroundColor: '#fff' }} />
                </View>
              </TouchableOpacity>
            ) : null
          ),
        })}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        listeners={{
          focus: () => {
            // Reload unread count khi focus vào tab Notifications
            loadUnreadCount();
          },
        }}
        options={({ navigation }) => ({
          title: 'Thông báo',
          tabBarLabel: 'Thông báo',
          headerRight: () => (
            isAuthenticated ? (
              <TouchableOpacity 
                style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => {
                  // Navigate với param markAsRead để trigger mark as read trong NotificationsScreen
                  navigation.navigate('Notifications', { markAsRead: Date.now() });
                  // Reload unread count sau khi đánh dấu đã đọc
                  setTimeout(() => loadUnreadCount(), 500);
                }}
              >
                <View>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>Đánh dấu đã đọc</Text>
                  <View style={{ height: 1.5, backgroundColor: '#fff' }} />
                </View>
              </TouchableOpacity>
            ) : null
          ),
        })}
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

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
