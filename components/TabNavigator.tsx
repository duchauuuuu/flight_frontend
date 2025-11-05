import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { TouchableOpacity, Text, View } from 'react-native';
import { useAuthStore } from '../store/authStore';

import SearchScreen from '../screens/SearchScreen';
import ResultsScreen from '../screens/ResultsScreen';
import ResultsLoadingScreen from '../screens/ResultsLoadingScreen';
import PassengerInfoScreen from '../screens/PassengerInfoScreen';
import AirportsScreen from '../screens/AirportsScreen';
import DatePickerScreen from '../screens/DatePickerScreen';
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

export type SearchStackParamList = {
  SearchMain: undefined;
  Airports: { type: 'departure' | 'arrival' };
  DatePicker: { type: 'departure' | 'return' };
  ResultsLoading: { from: string; to: string; date: string; passengers: number; seatClass: string };
  Results: { from: string; to: string; date: string; passengers: number; seatClass: string };
  PassengerInfo: { flight: any; passengers?: number; pricing?: { base: number; taxesAndFees?: number; total: number } };
};

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
        name="PassengerInfo" 
        component={PassengerInfoScreen}
        options={{ headerShown: false }}
      />
    </SearchStack.Navigator>
  );
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

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
        component={SearchStackScreen}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'SearchMain';
          
          return {
            title: 'Tìm kiếm',
            tabBarLabel: 'Tìm kiếm',
            headerShown: false,
            tabBarStyle: (routeName === 'Results' || routeName === 'ResultsLoading' || routeName === 'PassengerInfo') ? { display: 'none' } : undefined,
          };
        }}
      />
      <Tab.Screen 
        name="MyTickets" 
        component={MyTicketsScreen}
        options={{
          title: 'Vé của tôi',
          tabBarLabel: 'Vé của tôi',
          headerRight: () => (
            isAuthenticated ? (
              <TouchableOpacity 
                style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => {
                  console.log('Refresh tickets');
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
