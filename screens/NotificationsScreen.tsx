import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { Notification } from '../types/notification';

export default function NotificationsScreen() {
  const { isAuthenticated, user, tokens } = useAuthStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?._id || !API_BASE_URL) {
      setNotifications([]);
      return;
    }

    let cachedNotifications: any[] | null = null;
    try {
      setLoading(true);
      
      // Kiểm tra cache trước
      const { getCachedNotifications, cacheNotifications } = await import('../utils/cacheService');
      cachedNotifications = await getCachedNotifications(user._id);
      
      if (cachedNotifications && cachedNotifications.length > 0) {
        // Map từ cache service type sang screen type
        const mappedNotifications = cachedNotifications.map((n: any) => ({
          ...n,
          isRead: n.read || false,
        }));
        setNotifications(mappedNotifications);
        setLoading(false);
      }
      
      // Gọi API để lấy dữ liệu mới nhất
      const { data } = await axios.get(`${API_BASE_URL}/notifications`, {
        params: { userId: user._id },
        headers: tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : undefined,
      });
      
      const notifications = Array.isArray(data) ? data : [];
      setNotifications(notifications);
      
      // Cache dữ liệu
      await cacheNotifications(notifications.map((n: any) => ({
        ...n,
        read: n.isRead || false,
      })), user._id);
    } catch (error: any) {
      // Nếu API lỗi nhưng có cache, vẫn hiển thị cache
      if (!cachedNotifications || cachedNotifications.length === 0) {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id, tokens?.access_token, API_BASE_URL]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen for focus to reload when coming back to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated) {
        loadNotifications();
      }
    });

    return unsubscribe;
  }, [navigation, isAuthenticated, loadNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleMarkAsRead = async () => {
    if (!isAuthenticated || !user?._id || !API_BASE_URL) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    try {
      setIsMarkingAsRead(true);
      
      await axios.patch(
        `${API_BASE_URL}/notifications/user/${user._id}/read-all`,
        {},
        {
          headers: tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : undefined,
        }
      );

      Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc');
      
      // Refresh notifications list
      await loadNotifications();
      
      // Emit event để TabNavigator reload unread count
      // TabNavigator sẽ tự động reload khi focus vào tab
    } catch (error: any) {
      Alert.alert(
        'Lỗi',
        error?.response?.data?.message || 'Không thể đánh dấu thông báo là đã đọc. Vui lòng thử lại.'
      );
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  // Listen for markAsRead trigger from navigation params
  useEffect(() => {
    const params = route.params as any;
    if (params?.markAsRead && isAuthenticated) {
      handleMarkAsRead();
      // Clear the param after handling
      navigation.setParams({ markAsRead: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.markAsRead, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.card}>
          <Icon name="account-circle" size={72} color="#9CA3AF" />
          <Text style={styles.cardTitle}>Bạn chưa đăng nhập</Text>
          <Text style={styles.cardSubtitle}>
            Đăng nhập để xem thông báo về chuyến đi, điểm thưởng hoặc khuyến mãi.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Account', { screen: 'Login' })}
          >
            <Text style={styles.loginText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Format timestamp
  const formatTimestamp = (createdAt: string) => {
    if (!createdAt) return '';
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return '';
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${hours}:${minutes} • ${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  // Get icon and background color based on notification type
  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, { name: keyof typeof Icon.glyphMap; bgColor: string }> = {
      booking: { name: 'airplane', bgColor: '#10B981' },
      payment: { name: 'credit-card', bgColor: '#3B82F6' },
      promotion: { name: 'gift', bgColor: '#F59E0B' },
      system: { name: 'bell', bgColor: '#8B5CF6' },
    };
    return iconMap[type] || { name: 'bell', bgColor: '#6B7280' };
  };

  return (
    <View style={styles.container}>
      {loading && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2873e6" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="bell-off" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>Chưa có thông báo</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {notifications.map((notification) => {
            const iconInfo = getNotificationIcon(notification.type);
            const isUnread = !notification.isRead;
            return (
              <TouchableOpacity
                key={notification._id}
                style={[styles.notificationCard, isUnread && styles.unreadCard]}
                activeOpacity={0.7}
                onPress={async () => {
                  // Đánh dấu đã đọc nếu chưa đọc
                  if (isUnread && notification._id && API_BASE_URL) {
                    try {
                      await axios.patch(
                        `${API_BASE_URL}/notifications/${notification._id}/read`,
                        {},
                        {
                          headers: tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : undefined,
                        }
                      );
                      // Refresh notifications list
                      await loadNotifications();
                    } catch (error: any) {
                      // Error marking notification as read
                    }
                  }
                }}
              >
                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: iconInfo.bgColor }]}>
                  <Icon name={iconInfo.name} size={24} color="#fff" />
                </View>
                
                {/* Content */}
                <View style={styles.contentContainer}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.notificationTitle, isUnread && styles.unreadTitle]}>
                      {notification.title}
                    </Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={[styles.notificationMessage, isUnread && styles.unreadMessage]}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>{formatTimestamp(notification.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  card: {
    width: '84%',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginBtn: {
    marginTop: 16,
    backgroundColor: '#0f3c89',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loginText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 0,
    marginHorizontal: -16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  unreadCard: {
    backgroundColor: '#F9FAFB',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  unreadMessage: {
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2873e6',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
