import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flight } from '../types/flight';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

export default function ResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  // Get search params from navigation
  const { from, to, date, passengers, seatClass } = route.params || {};
  
  // State
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  
  // Try to build ISO date from provided display date like "29 Thg 10, 2025"
  const toISODateFromDisplay = (display?: string): string => {
    if (!display || typeof display !== 'string') return new Date().toISOString().split('T')[0];
    try {
      // Expect formats like: "29 Thg 10, 2025" or ISO already
      if (/^\d{4}-\d{2}-\d{2}/.test(display)) return display.slice(0, 10);
      const parts = display.replace(',', '').split(' ').filter(Boolean);
      // [day, 'Thg', month, year]
      if (parts.length >= 4) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[2], 10);
        const year = parseInt(parts[3], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const mm = String(month).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          return `${year}-${mm}-${dd}`;
        }
      }
    } catch {}
    return new Date().toISOString().split('T')[0];
  };

  // Generate fake flight data (fallback)
  const generateFakeFlights = (): Flight[] => {
    const airlines = ['Vietnam Airlines', 'VietJet Air', 'Bamboo Airways', 'Vietravel Airlines'];
    const baseDate = toISODateFromDisplay(date);
    
    const flights: Flight[] = [
      {
        flightNumber: 'VN123',
        from: from || 'HAN',
        to: to || 'SGN',
        departure: `${baseDate}T08:30:00Z`,
        arrival: `${baseDate}T10:45:00Z`,
        price: 1850000,
        stops: 0,
        airline: airlines[0],
        availableCabins: ['Economy', 'Premium Economy', 'Business', 'First'],
        seatsAvailable: {
          'Economy': 45,
          'Premium Economy': 15,
          'Business': 8,
          'First': 3,
        },
      },
      {
        flightNumber: 'VJ456',
        from: from || 'HAN',
        to: to || 'SGN',
        departure: `${baseDate}T10:00:00Z`,
        arrival: `${baseDate}T12:15:00Z`,
        price: 1350000,
        stops: 0,
        airline: airlines[1],
        availableCabins: ['Economy', 'Premium Economy', 'Business', 'First'],
        seatsAvailable: {
          'Economy': 60,
          'Premium Economy': 12,
          'Business': 5,
          'First': 2,
        },
      },
      {
        flightNumber: 'BAM789',
        from: from || 'HAN',
        to: to || 'SGN',
        departure: `${baseDate}T12:30:00Z`,
        arrival: `${baseDate}T14:45:00Z`,
        price: 1650000,
        stops: 0,
        airline: airlines[2],
        availableCabins: ['Economy', 'Premium Economy', 'Business', 'First'],
        seatsAvailable: {
          'Economy': 40,
          'Premium Economy': 18,
          'Business': 10,
          'First': 4,
        },
      },
      {
        flightNumber: 'VTR012',
        from: from || 'HAN',
        to: to || 'SGN',
        departure: `${baseDate}T14:00:00Z`,
        arrival: `${baseDate}T16:30:00Z`,
        price: 1200000,
        stops: 1,
        airline: airlines[3],
        availableCabins: ['Economy', 'Premium Economy', 'Business', 'First'],
        seatsAvailable: {
          'Economy': 55,
          'Premium Economy': 10,
          'Business': 6,
          'First': 1,
        },
      },
      {
        flightNumber: 'VN345',
        from: from || 'HAN',
        to: to || 'SGN',
        departure: `${baseDate}T16:00:00Z`,
        arrival: `${baseDate}T18:15:00Z`,
        price: 1950000,
        stops: 0,
        airline: airlines[0],
        availableCabins: ['Economy', 'Premium Economy', 'Business', 'First'],
        seatsAvailable: {
          'Economy': 35,
          'Premium Economy': 20,
          'Business': 12,
          'First': 5,
        },
      },
      {
        flightNumber: 'VJ678',
        from: from || 'HAN',
        to: to || 'SGN',
        departure: `${baseDate}T18:30:00Z`,
        arrival: `${baseDate}T20:45:00Z`,
        price: 1450000,
        stops: 0,
        airline: airlines[1],
        availableCabins: ['Economy', 'Premium Economy', 'Business', 'First'],
        seatsAvailable: {
          'Economy': 50,
          'Premium Economy': 15,
          'Business': 7,
          'First': 3,
        },
      },
    ];
    
    return flights;
  };

  // Fetch flights from BE mock API
  useEffect(() => {
    const loadFlights = async () => {
      try {
        setIsLoading(true);
        
        // Convert display date to ISO format for API
        const isoDate = toISODateFromDisplay(date);
        
        if (!API_BASE_URL) throw new Error('API base URL not configured');

        // Build query params
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        if (isoDate) params.append('date', isoDate);
        
        // Call mock search API
        const { data } = await axios.get(`${API_BASE_URL}/flights/mock-search?${params.toString()}`);
        
        // Map BE data to FE Flight type
        const mappedFlights: Flight[] = data.map((f: any, idx: number) => {
          const airlines = ['Vietnam Airlines', 'VietJet Air', 'Bamboo Airways', 'Vietravel Airlines'];
          const airlineIndex = f.airline === 'VN' ? 0 : f.airline === 'VJ' ? 1 : idx % 4;
          
          return {
            flightNumber: `${f.airline || 'VN'}${idx + 1}${idx + 2}`,
            from: f.from || from || 'HAN',
            to: f.to || to || 'SGN',
            departure: f.departure || new Date().toISOString(),
            arrival: f.arrival || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            price: f.price || (1200000 + idx * 150000),
            stops: 0,
            airline: airlines[airlineIndex],
            availableCabins: ['Economy', 'Premium Economy', 'Business', 'First'],
            seatsAvailable: {
              'Economy': 45 + idx * 5,
              'Premium Economy': 15 - idx,
              'Business': 8 - idx,
              'First': 3 - idx,
            },
          };
        });
        
        // Apply filters
        const cabinMap: Record<string, string> = {
          'Phổ thông': 'Economy',
          'Phổ thông cao cấp': 'Premium Economy',
          'Thương gia': 'Business',
          'Hạng nhất': 'First',
        };
        const desiredCabin = seatClass ? cabinMap[String(seatClass)] : undefined;
        const desiredPax = typeof passengers === 'number' ? passengers : 1;

        const filtered = mappedFlights.filter(f => {
          const matchFrom = !from || f.from === from;
          const matchTo = !to || f.to === to;
          const matchCabin = !desiredCabin || f.availableCabins.includes(desiredCabin);
          const hasSeats = !desiredCabin || (f.seatsAvailable as any)[desiredCabin] >= desiredPax;
          return matchFrom && matchTo && matchCabin && hasSeats;
        });

        setFlights(filtered.length ? filtered : mappedFlights);
      } catch (error) {
        console.error('Error fetching flights:', error);
        // Fallback to fake data if API fails
        const generatedFlights = generateFakeFlights();
        setFlights(generatedFlights);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFlights();
  }, [from, to, date, passengers, seatClass]);
  
  console.log('Flights data:', flights);

  const cabinViMap: Record<string, string> = {
    'Economy': 'Economy',
    'Premium Economy': 'Economy+',
    'Business': 'Business',
    'First': 'First',
  };

  const formatHm = (iso: string | Date) => {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const calcDuration = (depIso: string | Date, arrIso: string | Date) => {
    const dep = (typeof depIso === 'string' ? new Date(depIso) : depIso).getTime();
    const arr = (typeof arrIso === 'string' ? new Date(arrIso) : arrIso).getTime();
    const diff = Math.max(0, arr - dep);
    const minutes = Math.round(diff / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${hh}h${mm}m`;
  };

  const formatDateVN = (iso: string | Date) => {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header (trắng) */}
      <View style={styles.headerPlain}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1F2937" />
            </TouchableOpacity>
        <View style={styles.headerCenterPlain}>
          <Text style={styles.headerRoutePlain}>{from} → {to}</Text>
          <Text style={styles.headerDatePlain}>{date}</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

      {/* Top info bar */}
      <View style={styles.topInfoBarPlain}>
        <Text style={styles.topInfoTextPlain}>Giá trên một hành khách; đã giảm trừ KM của hãng và chưa bao gồm thuế; phí; phí đại lý.</Text>
        <TouchableOpacity style={styles.changeDateBtnPlain} onPress={() => navigation.navigate('DatePicker', { type: 'departure' })}>
          <Text style={styles.changeDateTextPlain}>Đổi ngày bay</Text>
          <Icon name="calendar" size={18} color="#2873e6" />
        </TouchableOpacity>
      </View>

      {/* Sort & filter bar */}
      <View style={styles.sortBarPlain}>
        <Icon name="filter-variant" size={18} color="#64748B" />
        <Text style={styles.sortBarTextPlain}>Sắp xếp & lọc</Text>
      </View>

      {/* Results list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2873e6" />
            <Text style={styles.loadingText}>Đang tìm kiếm chuyến bay...</Text>
          </View>
        ) : (
          flights.map((f, idx) => (
          <View key={idx} style={styles.resultCardPlain}>
              <View style={styles.resultRowTopPlain}>
              <Text style={styles.timeTextPlain} numberOfLines={1}>{formatHm(f.departure)}</Text>
              <Text style={styles.durationTextPlain} numberOfLines={1}>{calcDuration(f.departure, f.arrival)}</Text>
              <Text style={styles.timeTextPlain} numberOfLines={1}>{formatHm(f.arrival)}</Text>
              <View style={styles.cabinTagPlain}><Text style={styles.cabinTagTextPlain} numberOfLines={1}>{cabinViMap[f.availableCabins[0]] || 'Economy'}</Text></View>
              <TouchableOpacity onPress={() => { setSelectedFlight(f); setDetailVisible(true); }}><Text style={styles.detailLinkPlain} numberOfLines={1}>Chi tiết</Text></TouchableOpacity>
            </View>

            <View style={styles.resultRowMidPlain}>
              <View style={styles.airlineRowPlain}>
                <Icon name="airplane" size={18} color="#F59E0B" />
                <Text style={styles.airlineNamePlain} numberOfLines={1}>{f.airline}</Text>
                <Text style={styles.flightCodePlain} numberOfLines={1}>{f.flightNumber}</Text>
                <Text style={styles.aircraftTextPlain} numberOfLines={1}>Airbus A321-100/200</Text>
              </View>
              <View style={styles.priceColPlain}>
                <Text style={styles.remainTextPlain} numberOfLines={1}>Còn {(f.seatsAvailable as any)['Economy'] ?? 7} chỗ</Text>
                <Text style={styles.priceTextPlain} numberOfLines={1}>{f.price.toLocaleString('vi-VN')} đ</Text>
              </View>
            </View>
          </View>
          ))
        )}
        {!isLoading && flights.length === 0 && (
          <Text style={{ color: '#1F2937', textAlign: 'center', marginTop: 40 }}>Không tìm thấy chuyến phù hợp</Text>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={detailVisible} transparent={true} animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            {/* Header */}
            <View style={[styles.modalHeaderContainer, { paddingTop: insets.top }]}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalHeaderSide} />
                <Text style={styles.modalHeaderTitle}>Thông tin chiều đi</Text>
                <TouchableOpacity style={styles.modalHeaderSide} onPress={() => setDetailVisible(false)}>
                  <Icon name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16, paddingBottom: Math.max(24, insets.bottom + 16) }}>
              {/* Chi tiết chuyến bay toggle row */}
              <View style={styles.sectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.circleIcon}><Icon name="airplane" size={16} color="#2873e6" /></View>
                  <Text style={styles.sectionTitle}>Chi tiết chuyến bay</Text>
                </View>
                <Icon name="chevron-down" size={22} color="#64748B" />
              </View>

              {/* Tổng thời gian + Bay thẳng */}
              <View style={styles.summaryCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.circleIconLg}><Icon name="airplane-takeoff" size={20} color="#2873e6" /></View>
                  <View>
                    <Text style={styles.summaryLabel}>Tổng chuyến đi</Text>
                    <Text style={styles.summaryValue}>{selectedFlight ? calcDuration(selectedFlight.departure, selectedFlight.arrival).replace('h', ' giờ ').replace('m', ' phút') : ''}</Text>
                  </View>
            </View>
                <View style={styles.badgeStraight}><Text style={styles.badgeStraightText}>{selectedFlight?.stops === 0 ? 'Bay thẳng' : `${selectedFlight?.stops} điểm dừng`}</Text></View>
          </View>

              {/* Timeline */}
              {selectedFlight && (
                <View style={styles.timelineBlock}>
                  {/* From */}
                  <View style={styles.timelineRow}>
                    <View style={styles.timelineColLeft}>
                      <Text style={styles.timelineTime}>{formatHm(selectedFlight.departure)}</Text>
                      <Text style={styles.timelineDate}>{formatDateVN(selectedFlight.departure)}</Text>
                    </View>
                    <View style={styles.timelineColDot}>
                      <View style={styles.dot} />
                      <View style={styles.vLine} />
                    </View>
                    <View style={styles.timelineColRight}>
                      <Text style={styles.cityTitle} numberOfLines={1}>{from === 'HAN' ? 'Hà Nội' : from}</Text>
                      <Text style={styles.airportName} numberOfLines={2}>Sân bay quốc tế Nội Bài</Text>
                      <View style={styles.flightCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                          <Icon name="airplane" size={16} color="#EF4444" />
                          <Text style={[styles.flightAirline, { flex: 1, flexShrink: 1 }]} numberOfLines={1}>  {selectedFlight.airline}</Text>
                        </View>
                        <Text style={styles.flightMeta} numberOfLines={2}>{selectedFlight.flightNumber} - Airbus A320-100/200</Text>
                        <Text style={styles.flightMeta} numberOfLines={1}>ECO</Text>
                        <View style={styles.flightDivider} />
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <Icon name="clock-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
                          <Text style={[styles.flightMeta, { flex: 1, flexShrink: 1 }]} numberOfLines={2}>  Thời gian bay: {calcDuration(selectedFlight.departure, selectedFlight.arrival).replace('h', ' giờ ').replace('m', ' phút')}</Text>
                        </View>
                      </View>
                    </View>
        </View>

                  {/* To */}
                  <View style={styles.timelineRowEnd}>
                    <View style={styles.timelineColLeft}>
                      <Text style={styles.timelineTime}>{formatHm(selectedFlight.arrival)}</Text>
                      <Text style={styles.timelineDate}>{formatDateVN(selectedFlight.arrival)}</Text>
                    </View>
                    <View style={styles.timelineColDot}>
                      <View style={styles.dot} />
          </View>
                    <View style={styles.timelineColRight}>
                      <Text style={styles.cityTitle} numberOfLines={1}>{to === 'SGN' ? 'TP Hồ Chí Minh' : to}</Text>
                      <Text style={styles.airportName} numberOfLines={2}>Sân bay quốc tế Tân Sơn Nhất</Text>
        </View>
      </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerPlain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerCenterPlain: { alignItems: 'center', flex: 1 },
  headerRoutePlain: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerDatePlain: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  helpLink: { color: '#2873e6', textDecorationLine: 'underline', fontWeight: '600' },
  topInfoBarPlain: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 },
  topInfoTextPlain: { color: '#6B7280', fontSize: 12, lineHeight: 16, marginBottom: 8 },
  changeDateBtnPlain: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EAF2FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  changeDateTextPlain: { color: '#2873e6', fontWeight: '700' },
  sortBarPlain: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  sortBarTextPlain: { color: '#1F2937', fontWeight: '700' },
  resultCardPlain: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 12 },
  resultRowTopPlain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 4 },
  timeTextPlain: { color: '#111827', fontWeight: '700', fontSize: 16, flexShrink: 0 },
  durationTextPlain: { color: '#6B7280', flexShrink: 1 },
  cabinTagPlain: { borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, flexShrink: 0 },
  cabinTagTextPlain: { color: '#6B7280', fontSize: 12 },
  detailLinkPlain: { color: '#2873e6', fontWeight: '600', flexShrink: 0 },
  resultRowMidPlain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  airlineRowPlain: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap', minWidth: 0 },
  airlineNamePlain: { color: '#111827', fontWeight: '600', flexShrink: 1 },
  flightCodePlain: { color: '#6B7280', flexShrink: 1 },
  aircraftTextPlain: { color: '#94A3B8', flexShrink: 1 },
  priceColPlain: { alignItems: 'flex-end' },
  remainTextPlain: { color: '#6B7280', marginBottom: 2 },
  priceTextPlain: { color: '#111827', fontWeight: '700', fontSize: 16 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetContainer: { height: '90%', backgroundColor: '#fff', borderTopLeftRadius: 14, borderTopRightRadius: 14, overflow: 'hidden' },
  modalHeaderContainer: { backgroundColor: '#0EA5E9' },
  modalHeaderRow: { backgroundColor: '#0EA5E9', paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalHeaderSide: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  modalHeaderTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  circleIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sectionTitle: { color: '#111827', fontWeight: '700' },
  summaryCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  circleIconLg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  summaryLabel: { color: '#6B7280', fontSize: 12 },
  summaryValue: { color: '#111827', fontWeight: '700', fontSize: 16 },
  badgeStraight: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeStraightText: { color: '#16A34A', fontWeight: '700' },
  timelineBlock: { backgroundColor: '#fff' },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineRowEnd: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  timelineColLeft: { width: 70 },
  timelineColDot: { width: 20, alignItems: 'center' },
  timelineColRight: { flex: 1, minWidth: 0 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0EA5E9', marginTop: 6, marginBottom: 2 },
  vLine: { width: 2, backgroundColor: '#E5E7EB', flex: 1 },
  timelineTime: { color: '#111827', fontWeight: '700' },
  timelineDate: { color: '#94A3B8', fontSize: 12 },
  cityTitle: { color: '#111827', fontWeight: '700' },
  airportName: { color: '#64748B', marginBottom: 8 },
  flightCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10 },
  flightAirline: { color: '#111827', fontWeight: '700' },
  flightMeta: { color: '#64748B', fontSize: 12, marginTop: 2 },
  flightDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});

