import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';

interface Flight {
  _id: string;
  airline: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  price: number;
  durationMinutes: number;
  availableCabins?: string[];
}

export default function AdminFlightsScreen({ navigation }: any) {
  const { tokens, logout } = useAuthStore();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

  const loadFlights = useCallback(async () => {
    if (!tokens?.access_token || !API_BASE_URL) return;

    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/flights`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      setFlights(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading flights:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách chuyến bay');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tokens?.access_token, API_BASE_URL]);

  useFocusEffect(
    useCallback(() => {
      loadFlights();
    }, [loadFlights])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFlights();
  }, [loadFlights]);

  const handleDelete = async (flightId: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa chuyến bay này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/flights/${flightId}`, {
                headers: { Authorization: `Bearer ${tokens?.access_token}` },
              });
              Alert.alert('Thành công', 'Đã xóa chuyến bay');
              loadFlights();
            } catch (error: any) {
              Alert.alert('Lỗi', 'Không thể xóa chuyến bay');
            }
          },
        },
      ]
    );
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý chuyến bay</Text>
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
        {loading && flights.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : flights.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="airplane-off" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có chuyến bay nào</Text>
          </View>
        ) : (
          flights.map((flight) => (
            <View key={flight._id} style={styles.flightCard}>
              <View style={styles.flightHeader}>
                <View style={styles.airlineContainer}>
                  <Icon name="airplane" size={24} color="#2873e6" />
                  <Text style={styles.airlineText}>{flight.airline}</Text>
                </View>
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('AdminEditFlight', { flightId: flight._id })}
                    style={styles.actionButton}
                  >
                    <Icon name="pencil" size={20} color="#2873e6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(flight._id)} style={styles.actionButton}>
                    <Icon name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routeItem}>
                  <Text style={styles.airportCode}>{flight.from}</Text>
                  <Text style={styles.timeText}>{formatDate(flight.departure)}</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Icon name="arrow-right" size={24} color="#6B7280" />
                  <Text style={styles.durationText}>{formatDuration(flight.durationMinutes)}</Text>
                </View>
                <View style={styles.routeItem}>
                  <Text style={styles.airportCode}>{flight.to}</Text>
                  <Text style={styles.timeText}>{formatDate(flight.arrival)}</Text>
                </View>
              </View>

              <View style={styles.footerContainer}>
                <Text style={styles.priceText}>{formatCurrency(flight.price)}</Text>
                {flight.availableCabins && flight.availableCabins.length > 0 && (
                  <View style={styles.cabinContainer}>
                    <Text style={styles.cabinLabel}>Hạng ghế: </Text>
                    <Text style={styles.cabinText}>{flight.availableCabins.join(', ')}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
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
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  flightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  airlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  airlineText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  routeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  routeItem: {
    flex: 1,
    alignItems: 'center',
  },
  airportCode: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2873e6',
  },
  cabinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cabinLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  cabinText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

