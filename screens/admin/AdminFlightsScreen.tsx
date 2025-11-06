import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, Modal, Clipboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';

interface Flight {
  _id: string;
  flightNumber: string;
  airline: string;
  from: string;
  to: string;
  departure: string | Date;
  arrival: string | Date;
  price: number;
  stops: number;
  availableCabins?: string[];
}

export default function AdminFlightsScreen({ navigation }: any) {
  const { tokens, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [allFlights, setAllFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [filterAirlines, setFilterAirlines] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<'default' | 'early' | 'late' | { from: string; to: string }>('default');
  const [sortBy, setSortBy] = useState<'default' | 'departure_early' | 'departure_late' | 'price_desc' | 'price_asc'>('default');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<'airline' | 'time' | 'sort' | null>(null);
  const [airlineSearchText, setAirlineSearchText] = useState('');

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

  const loadFlights = useCallback(async () => {
    if (!tokens?.access_token || !API_BASE_URL) return;

    try {
      setLoading(true);
      
      // Kiểm tra cache trước
      const { getCachedFlights, cacheFlights } = await import('../../utils/cacheService');
      const cachedFlights = await getCachedFlights();
      
      if (cachedFlights && cachedFlights.length > 0) {
        setAllFlights(cachedFlights as any);
        setLoading(false);
        setRefreshing(false);
      }
      
      // Gọi API để lấy dữ liệu mới nhất
      const { data } = await axios.get(`${API_BASE_URL}/flights`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const flights = Array.isArray(data) ? data : [];
      setAllFlights(flights);
      
      // Cache dữ liệu mới
      await cacheFlights(flights);
    } catch (error: any) {
      // Nếu API lỗi nhưng có cache, vẫn hiển thị cache
      const { getCachedFlights } = await import('../../utils/cacheService');
      const cachedFlights = await getCachedFlights();
      if (cachedFlights && cachedFlights.length > 0) {
        setAllFlights(cachedFlights as any);
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách chuyến bay');
      }
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

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
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

  const calculateDuration = (departure: string | Date, arrival: string | Date) => {
    const depDate = new Date(departure);
    const arrDate = new Date(arrival);
    const diffMs = arrDate.getTime() - depDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const copyFlightNumber = (flightNumber: string) => {
    Clipboard.setString(flightNumber);
    Alert.alert('Thành công', `Đã sao chép: ${flightNumber}`);
  };

  // Map mã hãng bay sang tên đầy đủ
  const airlineNameMap: Record<string, string> = {
    'VN': 'Vietnam Airlines',
    'VJ': 'VietJet Air',
    'BL': 'Bamboo Airways',
    'QH': 'Pacific Airlines',
  };

  // Get unique airlines
  const uniqueAirlines = useMemo(() => {
    const airlines = new Set<string>();
    allFlights.forEach(f => airlines.add(f.airline));
    return Array.from(airlines).sort();
  }, [allFlights]);

  // Filter flights
  const flights = useMemo(() => {
    let filtered = [...allFlights];

    // Search by flight number
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(f => 
        f.flightNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by airlines
    if (filterAirlines.length > 0) {
      filtered = filtered.filter(f => filterAirlines.includes(f.airline));
    }

    // Filter by time
    if (timeFilter !== 'default') {
      if (timeFilter === 'early') {
        filtered = filtered.filter(f => {
          if (!f.departure) return false;
          const depTime = new Date(f.departure);
          const hours = depTime.getHours();
          return hours >= 0 && hours < 12; // 0:00 - 11:59
        });
      } else if (timeFilter === 'late') {
        filtered = filtered.filter(f => {
          if (!f.departure) return false;
          const depTime = new Date(f.departure);
          const hours = depTime.getHours();
          return hours >= 12 && hours < 24; // 12:00 - 23:59
        });
      } else if (typeof timeFilter === 'object' && timeFilter.from && timeFilter.to) {
        filtered = filtered.filter(f => {
          if (!f.departure) return false;
          const depTime = new Date(f.departure);
          const hours = depTime.getHours();
          const minutes = depTime.getMinutes();
          const totalMinutes = hours * 60 + minutes;
          
          const [fromHours, fromMins] = timeFilter.from.split(':').map(Number);
          const [toHours, toMins] = timeFilter.to.split(':').map(Number);
          const fromTotal = fromHours * 60 + fromMins;
          const toTotal = toHours * 60 + toMins;
          
          return totalMinutes >= fromTotal && totalMinutes <= toTotal;
        });
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'default') {
        return 0; // Keep original order
      } else if (sortBy === 'departure_early') {
        const aTime = a.departure ? new Date(a.departure).getTime() : Infinity;
        const bTime = b.departure ? new Date(b.departure).getTime() : Infinity;
        return aTime - bTime;
      } else if (sortBy === 'departure_late') {
        const aTime = a.departure ? new Date(a.departure).getTime() : Infinity;
        const bTime = b.departure ? new Date(b.departure).getTime() : Infinity;
        return bTime - aTime;
      } else if (sortBy === 'price_asc') {
        return (a.price || 0) - (b.price || 0);
      } else if (sortBy === 'price_desc') {
        return (b.price || 0) - (a.price || 0);
      }
      return 0;
    });

    return filtered;
  }, [allFlights, searchText, filterAirlines, timeFilter, sortBy]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          Quản lý chuyến bay
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

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo số hiệu chuyến bay..."
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Icon name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContent}
        >
          <TouchableOpacity
            style={[styles.filterButton, filterAirlines.length > 0 && styles.filterButtonActive]}
            onPress={() => {
              setFilterType('airline');
              setShowFilterModal(true);
            }}
          >
            <Icon name="airplane" size={14} color={filterAirlines.length > 0 ? "#fff" : "#6B7280"} />
            <Text style={[styles.filterButtonText, filterAirlines.length > 0 && styles.filterButtonTextActive]} numberOfLines={1} ellipsizeMode="tail">
              Hãng bay
            </Text>
            {filterAirlines.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterAirlines.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, timeFilter !== 'default' && styles.filterButtonActive]}
            onPress={() => {
              setFilterType('time');
              setShowFilterModal(true);
            }}
          >
            <Icon name="clock-outline" size={14} color={timeFilter !== 'default' ? "#fff" : "#6B7280"} />
            <Text style={[styles.filterButtonText, timeFilter !== 'default' && styles.filterButtonTextActive]} numberOfLines={1} ellipsizeMode="tail">
              Giờ bay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, sortBy !== 'default' && styles.filterButtonActive]}
            onPress={() => {
              setFilterType('sort');
              setShowFilterModal(true);
            }}
          >
            <Icon name="sort" size={14} color={sortBy !== 'default' ? "#fff" : "#6B7280"} />
            <Text style={[styles.filterButtonText, sortBy !== 'default' && styles.filterButtonTextActive]} numberOfLines={1} ellipsizeMode="tail">
              Sắp xếp
            </Text>
          </TouchableOpacity>
          {(filterAirlines.length > 0 || timeFilter !== 'default' || sortBy !== 'default') && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => {
                setFilterAirlines([]);
                setTimeFilter('default');
                setSortBy('default');
              }}
            >
              <Icon name="close" size={14} color="#EF4444" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && allFlights.length === 0 ? (
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
                  <Icon name="airplane" size={18} color="#2873e6" />
                  <View style={styles.airlineInfo}>
                    <View style={styles.airlineNameContainer}>
                      <Text style={styles.airlineText} numberOfLines={1} ellipsizeMode="tail">
                        {flight.airline}
                      </Text>
                      {airlineNameMap[flight.airline] && (
                        <Text style={styles.airlineFullNameText} numberOfLines={1} ellipsizeMode="tail">
                          - {airlineNameMap[flight.airline]}
                        </Text>
                      )}
                    </View>
                    {flight.flightNumber && (
                      <View style={styles.flightNumberContainer}>
                        <Text style={styles.flightNumberText} numberOfLines={1} ellipsizeMode="tail">
                          {flight.flightNumber}
                        </Text>
                        <TouchableOpacity
                          style={styles.copyButton}
                          onPress={() => copyFlightNumber(flight.flightNumber)}
                        >
                          <Icon name="content-copy" size={14} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('AdminEditFlight', { flightId: flight._id })}
                    style={styles.actionButton}
                  >
                    <Icon name="pencil" size={18} color="#2873e6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(flight._id)} style={styles.actionButton}>
                    <Icon name="delete" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routeItem}>
                  <Text style={styles.airportCode} numberOfLines={1} ellipsizeMode="tail">
                    {flight.from}
                  </Text>
                  <Text style={styles.timeText} numberOfLines={1} ellipsizeMode="tail">
                    {formatDate(flight.departure)}
                  </Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Icon name="arrow-right" size={18} color="#6B7280" />
                  <Text style={styles.durationText} numberOfLines={1} ellipsizeMode="tail">
                    {calculateDuration(flight.departure, flight.arrival)}
                  </Text>
                  {flight.stops > 0 && (
                    <Text style={styles.stopsText} numberOfLines={1} ellipsizeMode="tail">
                      {flight.stops} điểm dừng
                    </Text>
                  )}
                </View>
                <View style={styles.routeItem}>
                  <Text style={styles.airportCode} numberOfLines={1} ellipsizeMode="tail">
                    {flight.to}
                  </Text>
                  <Text style={styles.timeText} numberOfLines={1} ellipsizeMode="tail">
                    {formatDate(flight.arrival)}
                  </Text>
                </View>
              </View>

              <View style={styles.footerContainer}>
                <Text style={styles.priceText} numberOfLines={1} ellipsizeMode="tail">
                  {formatCurrency(flight.price)}
                </Text>
                {flight.availableCabins && flight.availableCabins.length > 0 && (
                  <View style={styles.cabinContainer}>
                    <Text style={styles.cabinLabel} numberOfLines={1} ellipsizeMode="tail">
                      Hạng ghế:{' '}
                    </Text>
                    <Text style={styles.cabinText} numberOfLines={1} ellipsizeMode="tail">
                      {flight.availableCabins.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Flight Button - nằm sát ngay trên bottom tab */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AdminAddFlight')}
        >
          <Icon name="airplane-plus" size={20} color="#fff" />
          <Text style={styles.addButtonText} numberOfLines={1} ellipsizeMode="tail">
            Thêm chuyến bay
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent={true} animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {filterType === 'airline' ? 'Lọc theo hãng bay' : 
                 filterType === 'time' ? 'Lọc theo giờ bay' : 
                 'Sắp xếp'}
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Icon name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {filterType === 'airline' && (
              <View style={styles.modalBody}>
                <View style={styles.searchBarContainer}>
                  <Icon name="magnify" size={20} color="#6B7280" />
                  <TextInput
                    style={styles.searchBarInput}
                    placeholder="Tìm kiếm hãng bay..."
                    placeholderTextColor="#9CA3AF"
                    value={airlineSearchText}
                    onChangeText={setAirlineSearchText}
                  />
                </View>
                <ScrollView style={styles.airlineList}>
                  {uniqueAirlines
                    .filter(airline => 
                      airline.toLowerCase().includes(airlineSearchText.toLowerCase())
                    )
                    .map(airline => (
                      <TouchableOpacity
                        key={airline}
                        style={styles.airlineOptionRow}
                        onPress={() => {
                          if (filterAirlines.includes(airline)) {
                            setFilterAirlines(filterAirlines.filter(a => a !== airline));
                          } else {
                            setFilterAirlines([...filterAirlines, airline]);
                          }
                        }}
                      >
                        <Text style={styles.airlineName}>{airline}</Text>
                        <View style={[styles.checkbox, filterAirlines.includes(airline) && styles.checkboxSelected]}>
                          {filterAirlines.includes(airline) && (
                            <Icon name="check" size={16} color="#fff" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            {filterType === 'time' && (
              <View style={styles.modalBody}>
                <TouchableOpacity
                  style={[styles.timeOption, timeFilter === 'early' && styles.timeOptionActive]}
                  onPress={() => setTimeFilter('early')}
                >
                  <View style={[styles.radioButton, timeFilter === 'early' && styles.radioButtonSelected]}>
                    {timeFilter === 'early' && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={[styles.timeOptionText, timeFilter === 'early' && styles.timeOptionTextActive]}>
                    Sáng (0:00 - 11:59)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timeOption, timeFilter === 'late' && styles.timeOptionActive]}
                  onPress={() => setTimeFilter('late')}
                >
                  <View style={[styles.radioButton, timeFilter === 'late' && styles.radioButtonSelected]}>
                    {timeFilter === 'late' && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={[styles.timeOptionText, timeFilter === 'late' && styles.timeOptionTextActive]}>
                    Chiều/Tối (12:00 - 23:59)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timeOption, typeof timeFilter === 'object' && styles.timeOptionActive]}
                  onPress={() => setTimeFilter({ from: '00:00', to: '23:59' })}
                >
                  <View style={[styles.radioButton, typeof timeFilter === 'object' && styles.radioButtonSelected]}>
                    {typeof timeFilter === 'object' && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={[styles.timeOptionText, typeof timeFilter === 'object' && styles.timeOptionTextActive]}>
                    Tùy chỉnh
                  </Text>
                </TouchableOpacity>
                {typeof timeFilter === 'object' && (
                  <View style={styles.timeRangeContainer}>
                    <View style={styles.timeInputWrapper}>
                      <Text style={styles.timeInputLabel}>Từ</Text>
                      <TextInput
                        style={styles.timeInput}
                        placeholder="00:00"
                        value={timeFilter.from}
                        onChangeText={(text) => setTimeFilter({ ...timeFilter, from: text })}
                      />
                    </View>
                    <Text style={styles.timeSeparator}>-</Text>
                    <View style={styles.timeInputWrapper}>
                      <Text style={styles.timeInputLabel}>Đến</Text>
                      <TextInput
                        style={styles.timeInput}
                        placeholder="23:59"
                        value={timeFilter.to}
                        onChangeText={(text) => setTimeFilter({ ...timeFilter, to: text })}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {filterType === 'sort' && (
              <View style={styles.modalBody}>
                {[
                  { key: 'default', label: 'Mặc định' },
                  { key: 'departure_early', label: 'Giờ đi sớm nhất' },
                  { key: 'departure_late', label: 'Giờ đi muộn nhất' },
                  { key: 'price_desc', label: 'Giá giảm dần' },
                  { key: 'price_asc', label: 'Giá tăng dần' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.sortOption, sortBy === option.key && styles.sortOptionActive]}
                    onPress={() => {
                      setSortBy(option.key as any);
                      setShowFilterModal(false);
                    }}
                  >
                    <Text style={[styles.sortOptionText, sortBy === option.key && styles.sortOptionTextActive]}>
                      {option.label}
                    </Text>
                    <View style={[styles.radioButton, sortBy === option.key && styles.radioButtonSelected]}>
                      {sortBy === option.key && <View style={styles.radioButtonInner} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  if (filterType === 'airline') {
                    setFilterAirlines([]);
                  } else if (filterType === 'time') {
                    setTimeFilter('default');
                  } else if (filterType === 'sort') {
                    setSortBy('default');
                  }
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>
                  {filterType === 'sort' ? 'Đặt lại' : 'Xóa lọc'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.modalButtonPrimaryText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 16,
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
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  flightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
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
    marginBottom: 10,
    gap: 8,
  },
  airlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  airlineInfo: {
    flex: 1,
    marginLeft: 8,
  },
  airlineNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  airlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  airlineFullNameText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  flightNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  flightNumberText: {
    fontSize: 11,
    color: '#6B7280',
  },
  copyButton: {
    padding: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  actionButton: {
    padding: 6,
  },
  routeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  routeItem: {
    flex: 1,
    alignItems: 'center',
  },
  airportCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#6B7280',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  durationText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  stopsText: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2873e6',
    flex: 1,
  },
  cabinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  cabinLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  cabinText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterBar: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 48,
  },
  filterBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
    flexShrink: 0,
  },
  filterButtonActive: {
    backgroundColor: '#2873e6',
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  clearFilterButton: {
    padding: 6,
    marginLeft: 4,
    flexShrink: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonPrimary: {
    backgroundColor: '#2873e6',
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  airlineList: {
    maxHeight: 300,
  },
  airlineOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  airlineName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2873e6',
    borderColor: '#2873e6',
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  timeOptionActive: {
    backgroundColor: '#EBF4FF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#2873e6',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2873e6',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeOptionTextActive: {
    color: '#2873e6',
    fontWeight: '600',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  timeInputWrapper: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  timeSeparator: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 24,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  sortOptionActive: {
    backgroundColor: '#EBF4FF',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sortOptionTextActive: {
    color: '#2873e6',
    fontWeight: '600',
  },
  addButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2873e6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

