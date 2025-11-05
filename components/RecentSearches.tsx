import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { SearchHistoryItem } from '../types/search-history';
import axios from 'axios';

export default function RecentSearches() {
  const navigation = useNavigation<any>();
  const { isAuthenticated, user, tokens } = useAuthStore();
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

  const loadRecentSearches = async () => {
    if (!isAuthenticated || !user?._id || !API_BASE_URL) {
      setRecentSearches([]);
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/search-history`, {
        params: { userId: user._id, limit: 10 },
        headers: tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : undefined,
      });
      
      setRecentSearches(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading recent searches:', error);
      setRecentSearches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentSearches();
  }, [isAuthenticated, user?._id, tokens?.access_token]);

  // Listen for focus to reload when coming back to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated) {
        loadRecentSearches();
      }
    });

    return unsubscribe;
  }, [navigation, isAuthenticated]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tìm kiếm gần đây</Text>
        {isAuthenticated && recentSearches.length > 0 && (
          <TouchableOpacity
            onPress={async () => {
              Alert.alert(
                'Xác nhận',
                'Bạn có chắc chắn muốn xóa tất cả lịch sử tìm kiếm?',
                [
                  {
                    text: 'Không',
                    style: 'cancel',
                  },
                  {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        if (!API_BASE_URL || !user?._id || !tokens?.access_token) {
                          Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
                          return;
                        }

                        await axios.delete(`${API_BASE_URL}/search-history/user/${user._id}`, {
                          headers: {
                            Authorization: `Bearer ${tokens.access_token}`,
                          },
                        });

                        setRecentSearches([]);
                        Alert.alert('Thành công', 'Đã xóa tất cả lịch sử tìm kiếm');
                      } catch (error: any) {
                        console.error('Error deleting search history:', error);
                        Alert.alert('Lỗi', 'Không thể xóa lịch sử tìm kiếm');
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.clearButton}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Items */}
      {!isAuthenticated ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Đăng nhập để xem lịch sử tìm kiếm</Text>
        </View>
      ) : loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Đang tải...</Text>
        </View>
      ) : recentSearches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có lịch sử tìm kiếm</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {recentSearches.map((search) => {
            const formatDate = (dateStr: string) => {
              if (!dateStr) return '';
              try {
                // Nếu dateStr đã ở format display (ví dụ: "29 Thg 10, 2025"), return luôn
                if (dateStr.includes('Thg') || dateStr.includes('thg')) {
                  // Parse display format: "29 Thg 10, 2025" hoặc "29 thg 10, 2025"
                  const cleaned = dateStr.replace(',', '').trim();
                  const parts = cleaned.split(' ').filter(Boolean);
                  if (parts.length >= 4) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[2], 10);
                    const year = parseInt(parts[3], 10);
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                      const date = new Date(year, month - 1, day);
                      if (!isNaN(date.getTime())) {
                        const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
                        const monthName = date.toLocaleString('vi-VN', { month: 'short' });
                        return `${dayOfWeek}, ${day} ${monthName} ${year}`;
                      }
                    }
                  }
                  return dateStr; // Return original if parsing fails
                }
                
                // Nếu là ISO format hoặc date object string
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return dateStr; // Return original if invalid
                const day = date.getDate();
                const month = date.toLocaleString('vi-VN', { month: 'short' });
                const year = date.getFullYear();
                const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
                return `${dayOfWeek}, ${day} ${month} ${year}`;
              } catch {
                return dateStr;
              }
            };

            const formatPassengers = (count: number) => {
              return count === 1 ? '1 khách' : `${count} khách`;
            };

            const formatTripType = (type: string) => {
              const types: Record<string, string> = {
                round: 'Khứ hồi',
                oneway: 'Một chiều',
                multicity: 'Nhiều chặng',
              };
              return types[type] || type;
            };

            const dateDisplay = search.returnDate
              ? `${formatDate(search.departDate)} - ${formatDate(search.returnDate)}`
              : formatDate(search.departDate);

            return (
              <TouchableOpacity
                key={search._id}
                style={styles.searchCard}
                onPress={() => {
                  // Navigate to search with these params
                  // Nếu là multicity, sẽ cần tìm lại flights từ saved data
                  // Nhưng hiện tại chỉ navigate với from/to đầu tiên
                  if (search.tripType === 'multicity') {
                    // TODO: Cần lưu flights array vào search history để navigate đúng
                    // Tạm thời navigate với from/to đầu tiên
                    navigation.navigate('ResultsLoading', {
                      from: search.from,
                      to: search.to,
                      date: search.departDate,
                      passengers: search.passengers,
                      seatClass: search.seatClass,
                    });
                  } else {
                    navigation.navigate('ResultsLoading', {
                      from: search.from,
                      to: search.to,
                      date: search.departDate,
                      returnDate: search.returnDate,
                      passengers: search.passengers,
                      seatClass: search.seatClass,
                    });
                  }
                }}
              >
                <View style={styles.searchHeader}>
                  <View style={styles.searchInfo}>
                    <Text style={styles.searchLabel}>Từ - Đến</Text>
                    <Text style={styles.searchRoute}>
                      {search.fromCity} ({search.from}) ⇌ {search.toCity} ({search.to})
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={async (e) => {
                      e.stopPropagation();
                      try {
                        if (!API_BASE_URL || !tokens?.access_token) {
                          Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
                          return;
                        }

                        await axios.delete(`${API_BASE_URL}/search-history/${search._id}`, {
                          headers: {
                            Authorization: `Bearer ${tokens.access_token}`,
                          },
                        });

                        setRecentSearches(prev => prev.filter(s => s._id !== search._id));
                      } catch (error: any) {
                        console.error('Error deleting search history:', error);
                        Alert.alert('Lỗi', 'Không thể xóa mục này');
                      }
                    }}
                  >
                    <Icon name="close-circle" size={28} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.searchDate}>{dateDisplay}</Text>
                <Text style={styles.searchPassengers}>
                  {formatTripType(search.tripType)}, {formatPassengers(search.passengers)} • {search.seatClass}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  clearButton: {
    color: '#2873e6',
    fontWeight: '600',
    fontSize: 14,
  },
  grid: {
    gap: 12,
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  searchInfo: {
    flex: 1,
  },
  searchLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  searchRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  searchDate: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
  },
  searchPassengers: {
    fontSize: 12,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
