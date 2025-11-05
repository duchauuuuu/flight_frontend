import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { Booking as BookingType } from '../types/booking';

export default function MyTicketsScreen() {
  const [activeTab, setActiveTab] = useState<'current' | 'past' | 'cancelled'>('current');
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated, user, tokens } = useAuthStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [bookings, setBookings] = useState<BookingType[]>([]);

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

  const loadBookings = useCallback(async () => {
    if (!isAuthenticated || !user?._id || !API_BASE_URL) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/bookings`, {
        params: { userId: user._id },
        headers: tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : undefined,
      });
      let list = Array.isArray(data) ? data : [];
      
      // Debug: Log raw data from API
      console.log('Raw bookings data:', JSON.stringify(list, null, 2));
      
      // Check if flights are populated
      if (list.length > 0) {
        const firstBooking = list[0];
        console.log('First booking flightIds:', firstBooking?.flightIds);
        if (firstBooking?.flightIds?.[0]) {
          console.log('First flight data:', JSON.stringify(firstBooking.flightIds[0], null, 2));
        }
      }
      
      // Ensure flights are populated; if an item has string flightId, fetch it
      const needsFetch = list.filter((bk: any) => Array.isArray(bk.flightIds) && typeof bk.flightIds[0] === 'string');
      if (needsFetch.length) {
        const idToFlight: Record<string, any> = {};
        await Promise.all(needsFetch.map(async (bk: any) => {
          const id = bk.flightIds[0];
          if (id && !idToFlight[id]) {
            try {
              const r = await axios.get(`${API_BASE_URL}/flights/${id}`);
              idToFlight[id] = r.data;
            } catch {}
          }
        }));
        list = list.map((bk: any) => {
          if (Array.isArray(bk.flightIds) && typeof bk.flightIds[0] === 'string') {
            const id = bk.flightIds[0];
            if (idToFlight[id]) {
              return { ...bk, flightIds: [idToFlight[id]] };
            }
          }
          return bk;
        });
      }
      setBookings(list);
    } catch (e: any) {
      console.log('Load bookings failed:', (e && e.response && e.response.data) || e?.message || String(e));
    }
  }, [API_BASE_URL, isAuthenticated, user?._id, tokens?.access_token]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Listen for refresh trigger from navigation params
  useEffect(() => {
    const params = route.params as any;
    if (params?.refresh && isAuthenticated) {
      onRefresh();
      // Clear the param after refresh
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh, isAuthenticated, navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings().finally(() => setRefreshing(false));
  };

  const handleRefreshButton = () => {
    onRefresh();
  };

  const handleCancelBooking = (bookingId: string, bookingCode: string) => {
    Alert.alert(
      'Xác nhận hủy vé',
      `Bạn có chắc chắn muốn hủy vé ${bookingCode}? Hành động này không thể hoàn tác.`,
      [
        {
          text: 'Không',
          style: 'cancel',
        },
        {
          text: 'Hủy vé',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!API_BASE_URL || !tokens?.access_token) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
                return;
              }

              // Dùng PATCH để cập nhật status thành cancelled thay vì xóa
              await axios.patch(
                `${API_BASE_URL}/bookings/${bookingId}/cancel`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                  },
                }
              );

              Alert.alert('Thành công', 'Đã hủy vé thành công');
              
              // Reload danh sách vé
              await loadBookings();
            } catch (error: any) {
              console.error('Cancel booking error:', error);
              const errorMessage = error?.response?.data?.message || error?.message || 'Không thể hủy vé. Vui lòng thử lại.';
              Alert.alert('Lỗi', errorMessage);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'current' && styles.tabActive]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.tabTextActive]}>
            Hiện tại
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Đã đi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'cancelled' && styles.tabActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
            Đã hủy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          isAuthenticated
            ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2873e6']}
                tintColor="#2873e6"
              />
            )
            : undefined
        }
      >
        {!isAuthenticated ? (
          <View style={styles.authCardWrap}>
            <View style={styles.authCard}>
              <Icon name="account-circle" size={72} color="#9CA3AF" />
              <Text style={styles.authTitle}>Bạn chưa đăng nhập</Text>
              <Text style={styles.authSubtitle}>
                Đăng nhập để xem lịch sử vé, kiểm tra trạng thái và hủy chuyến khi cần
              </Text>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate('Account', { screen: 'Login' })}
              >
                <Text style={styles.loginText}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          (() => {
            // Filter bookings theo tab
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const filteredBookings = bookings.filter((b: any) => {
              const status = b.status || 'pending';
              
              if (activeTab === 'cancelled') {
                return status === 'cancelled';
              }
              
              if (status === 'cancelled') {
                return false; // Không hiển thị cancelled trong tab current/past
              }
              
              // Lấy ngày bay (departure date của flight đầu tiên)
              const f: any = b.flightIds && Array.isArray(b.flightIds) && b.flightIds[0] ? b.flightIds[0] : null;
              if (!f || !f.departure) {
                return false; // Không có flight data thì không hiển thị
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
              if (!depDate) return false;
              
              const departureDate = new Date(depDate);
              departureDate.setHours(0, 0, 0, 0);
              
              if (activeTab === 'current') {
                // Hiện tại: ngày bay >= hôm nay
                return departureDate >= today;
              } else if (activeTab === 'past') {
                // Đã đi: ngày bay < hôm nay
                return departureDate < today;
              }
              
              return false;
            });
            
            if (filteredBookings.length === 0) {
              const emptyMessages = {
                current: 'Bạn chưa có vé nào sắp tới',
                past: 'Bạn chưa có vé nào đã đi',
                cancelled: 'Bạn chưa có vé nào đã hủy',
              };
              
              return (
                <View style={styles.emptyState}>
                  <View style={styles.iconContainer}>
                    <Icon name="airplane" size={80} color="#2873e6" />
                  </View>
                  <Text style={styles.emptyTitle}>{emptyMessages[activeTab]}</Text>
                  <Text style={styles.emptySubtitle}>Kéo xuống để đồng bộ vé mới đặt</Text>
                </View>
              );
            }
            
            // Helper function để parse date
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
            
            return (
              <View style={{ width: '100%', paddingHorizontal: 16 }}>
                {filteredBookings.map((b) => {
                // Check if multicity booking
                const isMulticity = (b as any).tripType === 'Multi-city';
                const allFlights: any[] = (b as any).flightIds && Array.isArray((b as any).flightIds) ? (b as any).flightIds : [];
                
                // Lấy flight đầu tiên và cuối cùng
                const firstFlight: any = allFlights.length > 0 ? allFlights[0] : {};
                const lastFlight: any = allFlights.length > 0 ? allFlights[allFlights.length - 1] : {};
                
                // Với multicity, hiển thị từ segment đầu đến segment cuối
                const f: any = isMulticity ? {
                  from: firstFlight.from,
                  to: lastFlight.to,
                  departure: firstFlight.departure,
                  arrival: lastFlight.arrival,
                  airline: firstFlight.airline || allFlights[0]?.airline,
                } : (allFlights[0] || {});
                
                const dep = parseDate(f?.departure);
                const arr = parseDate(f?.arrival);
                
                // Debug log (remove in production)
                if (!dep || !arr) {
                  console.log('Flight data missing:', {
                    hasFlight: !!f,
                    flightId: f?._id || f?.flightNumber,
                    departure: f?.departure,
                    arrival: f?.arrival,
                    from: f?.from,
                    to: f?.to,
                    airline: f?.airline,
                    isMulticity,
                    totalFlights: allFlights.length,
                  });
                }
                
                const hhmm = (d?: Date | null) => {
                  if (!d || isNaN(d.getTime())) return '--:--';
                  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                };
                const ddmmyy = (d?: Date | null) => {
                  if (!d || isNaN(d.getTime())) return '';
                  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
                };
                const dayOfWeek = (d?: Date | null) => {
                  if (!d || isNaN(d.getTime())) return '';
                  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                  return days[d.getDay()] || '';
                };
                const pnr = (b as any).bookingCode || (b._id ? String(b._id).slice(-6) : Math.random().toString(36).slice(2,8)).toUpperCase();
                const fromStr = String(f.from || '').trim();
                const toStr = String(f.to || '').trim();
                const fromCity = fromStr ? fromStr.split(' ')[0] : '';
                const toCity = toStr ? toStr.split(' ')[0] : '';
                const fromCode = f.from && typeof f.from === 'string' ? (f.from.match(/\(([A-Z]{3})\)/)?.[1] || f.from.slice(-3)) : '';
                const toCode = f.to && typeof f.to === 'string' ? (f.to.match(/\(([A-Z]{3})\)/)?.[1] || f.to.slice(-3)) : '';

                return (
                  <View key={b._id || Math.random().toString(36)} style={styles.bookingCard}>
                    {/* Header: Logo + Airline name */}
                    <View style={styles.headerRow}>
                      <View style={styles.logoContainer}>
                        <Icon name="airplane" size={20} color="#2873e6" />
                      </View>
                      <Text style={styles.airlineName}>
                        {isMulticity ? `${allFlights.length} chuyến` : (f.airline || 'VietJet Air')}
                      </Text>
                      {isMulticity && (
                        <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>
                          Nhiều thành phố
                        </Text>
                      )}
                    </View>

                    {/* Route: From/To with times */}
                    <View style={styles.routeSection}>
                      <View style={styles.routeLeft}>
                        <Text style={styles.cityName}>{fromCity} ({fromCode || 'DAD'})</Text>
                        <Text style={styles.timeDisplay}>{hhmm(dep)}</Text>
                        <Text style={styles.dateDisplay}>{dayOfWeek(dep)} {ddmmyy(dep)}</Text>
                      </View>
                      <Icon name="arrow-right" size={24} color="#2873e6" style={{ marginHorizontal: 12 }} />
                      <View style={styles.routeRight}>
                        <Text style={styles.cityName}>{toCity} ({toCode || 'SGN'})</Text>
                        <Text style={styles.timeDisplay}>{hhmm(arr)}</Text>
                        <Text style={styles.dateDisplay}>{dayOfWeek(arr)} {ddmmyy(arr)}</Text>
                      </View>
                    </View>
                    
                    {/* Multicity flights list - hiển thị tất cả segments */}
                    {isMulticity && allFlights.length > 1 && (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                        <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: '600' }}>
                          Các chuyến bay:
                        </Text>
                        {allFlights.map((flight: any, idx: number) => {
                          const flightDep = parseDate(flight?.departure);
                          const flightArr = parseDate(flight?.arrival);
                          const flightFromCode = flight?.from || '';
                          const flightToCode = flight?.to || '';
                          return (
                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                              <Text style={{ fontSize: 12, color: '#111827', flex: 1 }}>
                                {idx + 1}. {flightFromCode} → {flightToCode}
                              </Text>
                              <Text style={{ fontSize: 11, color: '#6B7280' }}>
                                {hhmm(flightDep)} - {hhmm(flightArr)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Booking code box */}
                    <View style={styles.bookingCodeBox}>
                      <Text style={styles.bookingCodeLabel}>Mã đặt chỗ</Text>
                      <Text style={styles.bookingCodeValue}>{pnr}</Text>
                    </View>

                    {/* Check-in hint */}
                    <Text style={styles.checkinHint}>Dùng mã này để check-in tại quầy hoặc check-in online</Text>

                    {/* Cancel button - chỉ hiển thị khi vé chưa bay và chưa hủy */}
                    {(() => {
                      const status = (b as any).status || 'pending';
                      const isCancelled = status === 'cancelled';
                      
                      // Kiểm tra xem đã bay chưa (ngày bay < hôm nay)
                      const depDate = parseDate(f?.departure);
                      const hasFlown = depDate ? depDate < today : false;
                      
                      // Chỉ hiển thị nút hủy nếu chưa bay và chưa hủy
                      if (!isCancelled && !hasFlown && b._id) {
                        return (
                          <TouchableOpacity 
                            style={styles.cancelBtn} 
                            onPress={() => handleCancelBooking(b._id || '', pnr)}
                          >
                            <Text style={styles.cancelBtnText}>Hủy vé</Text>
                          </TouchableOpacity>
                        );
                      }
                      
                      // Hiển thị badge status nếu đã hủy hoặc đã đi
                      if (isCancelled) {
                        return (
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeTextCancelled}>Đã hủy</Text>
                          </View>
                        );
                      }
                      
                      if (hasFlown) {
                        return (
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeTextPast}>Đã đi</Text>
                          </View>
                        );
                      }
                      
                      return null;
                    })()}
                  </View>
                );
                })}
              </View>
            );
          })()
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2873e6',
  },
  tabText: {
    fontSize: 15,
    color: '#757575',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2873e6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  authCardWrap: {
    width: '100%',
    alignItems: 'center',
  },
  authCard: {
    width: '84%',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  authTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  authSubtitle: {
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#E3F2FD',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  bookingCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logoContainer: { 
    marginRight: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  airlineName: { color: '#111827', fontWeight: '700', fontSize: 16 },
  routeSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  routeLeft: { flex: 1 },
  routeRight: { flex: 1, alignItems: 'flex-end' },
  cityName: { color: '#111827', fontWeight: '700', fontSize: 14, marginBottom: 8 },
  timeDisplay: { color: '#111827', fontWeight: '900', fontSize: 32, lineHeight: 38, marginBottom: 4 },
  dateDisplay: { color: '#6B7280', fontSize: 13 },
  bookingCodeBox: { 
    backgroundColor: '#F3F4F6', 
    borderRadius: 12, 
    paddingVertical: 16, 
    paddingHorizontal: 16, 
    alignItems: 'center', 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookingCodeLabel: { color: '#6B7280', fontSize: 13, marginBottom: 8, fontWeight: '500' },
  bookingCodeValue: { color: '#2873e6', fontWeight: '900', fontSize: 28 },
  checkinHint: { color: '#6B7280', textAlign: 'center', fontSize: 13, marginBottom: 16 },
  cancelBtn: { 
    backgroundColor: '#EF4444', 
    borderRadius: 10, 
    paddingVertical: 12, 
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusBadgeTextCancelled: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  statusBadgeTextPast: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 14,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2873e6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#2873e6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
