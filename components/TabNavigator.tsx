import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { TouchableOpacity, Text } from 'react-native';

import SearchScreen from '../screens/SearchScreen';
import MyTicketsScreen from '../screens/MyTicketsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AccountScreen from '../screens/AccountScreen';

export type RootTabParamList = {
  Search: undefined;
  MyTickets: undefined;
  Notifications: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

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
        tabBarActiveTintColor: '#EAB308',
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
          backgroundColor: '#f9a912',
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
              <Text style={{ color: '#fff', fontSize: 14, marginLeft: 4, fontWeight: '500' }}>Làm mới</Text>
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
        component={AccountScreen}
        options={{
          title: 'Tài khoản',
          tabBarLabel: 'Tài khoản',
        }}
      />
    </Tab.Navigator>
  );
}
