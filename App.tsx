import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './components/TabNavigator';
import AdminNavigator from './components/AdminNavigator';
import { loadAuthState, useAuthStore } from './store/authStore';

export default function App() {
  const { user, isAuthenticated } = useAuthStore();
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    // Load persisted auth state on app start
    const initAuth = async () => {
      await loadAuthState();
      setAuthLoaded(true);
    };
    initAuth();
  }, []);

  // Nếu là admin thì hiển thị AdminNavigator, không thì hiển thị TabNavigator
  const isAdmin = authLoaded && isAuthenticated && user?.role === 'Admin';

  if (!authLoaded) {
    // Có thể hiển thị loading screen ở đây
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isAdmin ? <AdminNavigator /> : <TabNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
