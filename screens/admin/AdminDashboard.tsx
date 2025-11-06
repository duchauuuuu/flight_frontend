import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
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
  flightIds: string[] | Flight[];
  status: string;
  [key: string]: any;
}

interface Stats {
  totalFlights: number;
  totalBookings: number;
  totalUsers: number;
  totalRevenue: number;
  currentBookings: number;
  pastBookings: number;
  cancelledBookings: number;
}

export default function AdminDashboard({ navigation }: any) {
  const { tokens, user, logout } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalFlights: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0,
    currentBookings: 0,
    pastBookings: 0,
    cancelledBookings: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

  const loadStats = useCallback(async () => {
    if (!tokens?.access_token || !API_BASE_URL) return;

    try {
      setLoading(true);
      
      // Load flights count
      const flightsRes = await axios.get(`${API_BASE_URL}/flights`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const totalFlights = Array.isArray(flightsRes.data) ? flightsRes.data.length : 0;

      // Load bookings count and calculate revenue
      const bookingsRes = await axios.get(`${API_BASE_URL}/bookings`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      let bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];

      // Ensure flights are populated; if an item has string flightId, fetch it
      const needsFetch = bookings.filter(
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
        bookings = bookings.map((bk: any) => {
          if (Array.isArray(bk.flightIds) && bk.flightIds.length > 0 && typeof bk.flightIds[0] === 'string') {
            return {
              ...bk,
              flightIds: bk.flightIds.map((id: string) => idToFlight[id] || id),
            };
          }
          return bk;
        });
      }

      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.payment?.amount || 0), 0);

      // Calculate booking status counts
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

      let currentBookings = 0;
      let pastBookings = 0;
      let cancelledBookings = 0;

      bookings.forEach((b: any) => {
        const status = b.status || 'pending';

        if (status === 'cancelled') {
          cancelledBookings++;
          return;
        }

        // Nếu status là "completed" thì luôn là "past" (đã đi)
        if (status === 'completed') {
          pastBookings++;
          return;
        }

        // Lấy ngày bay (departure date của flight đầu tiên)
        const f: any = b.flightIds && Array.isArray(b.flightIds) && b.flightIds[0] ? b.flightIds[0] : null;
        if (!f || !f.departure) {
          currentBookings++; // Default nếu không có flight data
          return;
        }

        const depDate = parseDate(f.departure);
        if (!depDate) {
          currentBookings++;
          return;
        }

        const departureDate = new Date(depDate);
        departureDate.setHours(0, 0, 0, 0);

        if (departureDate >= today) {
          currentBookings++;
        } else {
          pastBookings++;
        }
      });

      // Load users count
      const usersRes = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const totalUsers = users.length;

      setStats({
        totalFlights,
        totalBookings,
        totalUsers,
        totalRevenue,
        currentBookings,
        pastBookings,
        cancelledBookings,
      });
    } catch (error: any) {
      // Error loading stats
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tokens?.access_token, API_BASE_URL]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, [loadStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const StatCard = ({ icon, label, value, color }: { icon: keyof typeof Icon.glyphMap; label: string; value: string | number; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIconContainer}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel} numberOfLines={2} ellipsizeMode="tail">
          {label}
        </Text>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );

  const MenuCard = ({ icon, title, onPress }: { icon: keyof typeof Icon.glyphMap; title: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress}>
      <Icon name={icon} size={28} color="#2873e6" />
      <Text style={styles.menuTitle} numberOfLines={2} ellipsizeMode="tail">
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          Quản trị viên
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

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText} numberOfLines={2} ellipsizeMode="tail">
            Xin chào, {user?.name || 'Admin'}
          </Text>
          <Text style={styles.welcomeSubtext} numberOfLines={1} ellipsizeMode="tail">
            Bảng điều khiển quản trị
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="airplane" label="Tổng chuyến bay" value={stats.totalFlights} color="#2873e6" />
          <StatCard icon="ticket-confirmation" label="Tổng đặt vé" value={stats.totalBookings} color="#10B981" />
          <StatCard icon="account-group" label="Tổng người dùng" value={stats.totalUsers} color="#F59E0B" />
          <StatCard icon="cash" label="Tổng doanh thu" value={formatCurrency(stats.totalRevenue)} color="#EF4444" />
        </View>

        {/* Booking Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
            Trạng thái đặt vé
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{stats.currentBookings}</Text>
              <Text style={styles.statusLabel} numberOfLines={1}>
                Hiện tại
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusValue, { color: '#10B981' }]}>{stats.pastBookings}</Text>
              <Text style={styles.statusLabel} numberOfLines={1}>
                Đã đi
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusValue, { color: '#EF4444' }]}>{stats.cancelledBookings}</Text>
              <Text style={styles.statusLabel} numberOfLines={1}>
                Đã hủy
              </Text>
            </View>
          </View>
        </View>

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
  content: {
    flex: 1,
  },
  welcomeSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    flex: 1,
    minWidth: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2873e6',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: '30%',
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 6,
    textAlign: 'center',
  },
});

