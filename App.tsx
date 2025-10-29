import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';  
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'; 

import SearchScreen from './screens/SearchScreen';
import MyTicketsScreen from './screens/MyTicketsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import AccountScreen from './screens/AccountScreen';

export type RootTabParamList = {
  Search: undefined;
  MyTickets: undefined;
  Notifications: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
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
            tabBarActiveTintColor: '#0066CC',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#e0e0e0',
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
            headerStyle: {
              backgroundColor: '#0066CC',
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
            }}
          />
          <Tab.Screen 
            name="MyTickets" 
            component={MyTicketsScreen}
            options={{
              title: 'Vé của tôi',
              tabBarLabel: 'Vé của tôi',
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
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// bottom 
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// const Tab = createBottomTabNavigator<RootStackParamList>();
//  screenOptions={({ route }) => ({
//             tabBarIcon: ({ color, size }) => {
//               let iconName = 'home';
//               if (route.name === 'Home') iconName = 'home';
//               else if (route.name === 'Profile') iconName = 'account';
//               else if (route.name === 'Todo') iconName = 'format-list-bulleted';
//               return <Icon name={iconName} size={size} color={color} />;
//             },
//             tabBarActiveTintColor: '#6200EE',
//             tabBarInactiveTintColor: 'gray',
//           })}
// <Tab.Navigator>
//   <Tab.Screen name="Home" component={HomeScreen} />
//   <Tab.Screen name="Search" component={SearchScreen} />
//   <Tab.Screen name="Profile" component={ProfileScreen} />
// </Tab.Navigator>

// drawer
// import { createDrawerNavigator } from '@react-navigation/drawer';

// const Drawer = createDrawerNavigator<RootStackParamList>();

// <Drawer.Navigator>
//   <Drawer.Screen name="Home" component={HomeScreen} />
//   <Drawer.Screen name="Settings" component={SettingsScreen} />
//   <Drawer.Screen name="Profile" component={ProfileScreen} />
// </Drawer.Navigator>