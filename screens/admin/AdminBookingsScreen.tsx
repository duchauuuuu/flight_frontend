import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';

interface Flight {
  _id: string;
  departure: string;
  arrival: string;
  [key: string]: any;
}

interface Booking {
  _id: string;
  bookingCode: string;
  userId: string;
  flightIds: string[] | Flight[];
  status: string;
  tripType: string;
  payment?: {
    amount: number;
    method: string;
  };
  createdAt: string;
}

export default function AdminBookingsScreen({ navigation }: any) {
  const { tokens, logout } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

  const loadBookings = useCallback(async () => {
    if (!tokens?.access_token || !API_BASE_URL) return;

    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/bookings`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      let allBookings = Array.isArray(data) ? data : [];

      // Ensure flights are populated; if an item has string flightId, fetch it
      const needsFetch = allBookings.filter(
        (bk: any) => Array.isArray(bk.flightIds) && bk.flightIds.length > 0 && typeof bk.flightIds[0] === 'string'
      );
      if (needsFetch.length) {
        const idToFlight: Record<string, any> = {};
        await Promise.all(
          needsFetch.map(async (bk: any) => {
            for (const id of bk.flightIds) {
              if (id && typeof id === 'string' && !idToFlight[id]) {
                try {
                  const r = await axios.get(`${API_BASE_URL}/flights/${id}`);
                  idToFlight[id] = r.data;
                } catch {}
              }
            }
          })
        );
        allBookings = allBookings.map((bk: any) => {
          if (Array.isArray(bk.flightIds) && bk.flightIds.length > 0 && typeof bk.flightIds[0] === 'string') {
            return {
              ...bk,
              flightIds: bk.flightIds.map((id: string) => idToFlight[id] || id),
            };
          }
          return bk;
        });
      }

      // Filter bookings theo trạng thái
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const parseDate = (dateValue: any): Date | null => {
        if (!dateValue) return null;
        if (dateValue instanceof Date) return dateValue;
        if (typeof dateValue === 'string') {
          const parsed = new Date(dateValue);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        if (typeof dateValue === 'object' && dateValue.$date) {
          const parsed = new Date(dateValue.$date);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;
      };

      const filtered = allBookings.filter((b: any) => {
        if (filterStatus === 'all') return true;

        const status = b.status || 'pending';

        if (filterStatus === 'cancelled') {
          return status === 'cancelled';
        }

        if (status === 'cancelled') {
          return false; // Không hiển thị cancelled trong tab current/past
        }

        // Nếu status là "completed" thì luôn là "past" (đã đi)
        if (status === 'completed') {
          if (filterStatus === 'past') {
            return true;
          } else if (filterStatus === 'current') {
            return false;
          }
        }

        // Lấy ngày bay (departure date của flight đầu tiên)
        const f: any = b.flightIds && Array.isArray(b.flightIds) && b.flightIds[0] ? b.flightIds[0] : null;
        if (!f || !f.departure) {
          // Nếu không có flight data, chỉ hiển thị trong "all"
          return false;
        }

        const depDate = parseDate(f.departure);
        if (!depDate) return false;

        const departureDate = new Date(depDate);
        departureDate.setHours(0, 0, 0, 0);

        if (filterStatus === 'current') {
          // Hiện tại: ngày bay >= hôm nay
          return departureDate >= today;
        } else if (filterStatus === 'past') {
          // Đã đi: ngày bay < hôm nay hoặc status = completed
          return departureDate < today;
        }

        return true;
      });

      // Filter by search query (booking code)
      const finalFiltered = searchQuery.trim()
        ? filtered.filter((b: any) =>
            b.bookingCode?.toLowerCase().includes(searchQuery.toLowerCase().trim())
          )
        : filtered;

      setBookings(finalFiltered);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đặt vé');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tokens?.access_token, API_BASE_URL, filterStatus, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings();
  }, [loadBookings]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/bookings/${bookingId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${tokens?.access_token}` },
        }
      );
      Alert.alert('Thành công', 'Đã cập nhật trạng thái');
      loadBookings();
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBookingStatus = (booking: Booking): 'current' | 'past' | 'cancelled' => {
    const status = booking.status || 'pending';
    if (status === 'cancelled') {
      return 'cancelled';
    }

    // Nếu status là "completed" thì luôn là "past" (đã đi)
    if (status === 'completed') {
      return 'past';
    }

    // Lấy ngày bay (departure date của flight đầu tiên)
    const f: any = booking.flightIds && Array.isArray(booking.flightIds) && booking.flightIds[0] ? booking.flightIds[0] : null;
    if (!f || !f.departure) {
      return 'current'; // Default nếu không có flight data
    }

    const parseDate = (dateValue: any): Date | null => {
      if (!dateValue) return null;
      if (dateValue instanceof Date) return dateValue;
      if (typeof dateValue === 'string') {
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      if (typeof dateValue === 'object' && dateValue.$date) {
        const parsed = new Date(dateValue.$date);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      return null;
    };

    const depDate = parseDate(f.departure);
    if (!depDate) return 'current';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const departureDate = new Date(depDate);
    departureDate.setHours(0, 0, 0, 0);

    if (departureDate >= today) {
      return 'current';
    } else {
      return 'past';
    }
  };

  const getStatusColor = (bookingStatus: 'current' | 'past' | 'cancelled') => {
    switch (bookingStatus) {
      case 'current':
        return '#2873e6';
      case 'past':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (bookingStatus: 'current' | 'past' | 'cancelled') => {
    switch (bookingStatus) {
      case 'current':
        return 'Hiện tại';
      case 'past':
        return 'Đã đi';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return bookingStatus;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          Quản lý đặt vé
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await logout();
          }}
          style={styles.logoutButton}
        >
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo mã vé..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Icon name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['all', 'current', 'past', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[styles.filterText, filterStatus === status && styles.filterTextActive]} numberOfLines={1} ellipsizeMode="tail">
                {status === 'all' ? 'Tất cả' : status === 'current' ? 'Hiện tại' : status === 'past' ? 'Đã đi' : 'Đã hủy'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && bookings.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="ticket-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText} numberOfLines={2} ellipsizeMode="tail">
              {searchQuery ? 'Không tìm thấy đặt vé' : 'Chưa có đặt vé nào'}
            </Text>
          </View>
        ) : (
          bookings.map((booking) => {
            const bookingStatus = getBookingStatus(booking);
            return (
            <View key={booking._id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.bookingCodeContainer}>
                  <Text style={styles.bookingCodeLabel} numberOfLines={1} ellipsizeMode="tail">
                    Mã đặt vé:
                  </Text>
                  <Text style={styles.bookingCode} numberOfLines={1} ellipsizeMode="tail">
                    {booking.bookingCode}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bookingStatus) }]}>
                  <Text style={styles.statusText} numberOfLines={1} ellipsizeMode="tail">
                    {getStatusText(bookingStatus)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingInfo}>
                <View style={styles.infoRow}>
                  <Icon name="airplane" size={16} color="#6B7280" />
                  <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                    {Array.isArray(booking.flightIds) ? `${booking.flightIds.length} chuyến` : '1 chuyến'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="tag" size={16} color="#6B7280" />
                  <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                    {booking.tripType || 'One-way'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="cash" size={16} color="#6B7280" />
                  <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                    {booking.payment ? formatCurrency(booking.payment.amount) : 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                    {formatDate(booking.createdAt)}
                  </Text>
                </View>
              </View>

              {bookingStatus === 'current' && booking.status !== 'cancelled' && (
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={() => handleUpdateStatus(booking._id, 'completed')}
                  >
                    <Icon name="check" size={16} color="#fff" />
                    <Text style={styles.actionButtonText} numberOfLines={1} ellipsizeMode="tail">
                      Xác nhận
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleUpdateStatus(booking._id, 'cancelled')}
                  >
                    <Icon name="close" size={16} color="#fff" />
                    <Text style={styles.actionButtonText} numberOfLines={1} ellipsizeMode="tail">
                      Hủy vé
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2873e6',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2873e6',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  bookingCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  bookingCodeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
  },
  bookingCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  bookingInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

