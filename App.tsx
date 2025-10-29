import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './components/TabNavigator';
import AdminNavigator from './components/AdminNavigator';
import { loadAuthState, useAuthStore } from './store/authStore';
import { initDatabase, clearExpiredCache } from './utils/database';

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

  useEffect(() => {
    // Khởi tạo database và xóa cache hết hạn khi app khởi động
    const initDB = async () => {
      try {
        await initDatabase();
        // Xóa cache hết hạn mỗi 10 phút
        setInterval(async () => {
          await clearExpiredCache();
        }, 10 * 60 * 1000);
      } catch (error) {
        // Error initializing database
      }
    };
    initDB();
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
