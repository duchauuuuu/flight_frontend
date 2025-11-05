import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flight } from '../types/flight';

const screenWidth = Dimensions.get('window').width;

export default function ResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  // Get search params and flights from navigation (already loaded in ResultsLoadingScreen)
  const { from, to, date, passengers, seatClass, flights: initialFlights, multicityResults } = route.params || {};
  
  // State
  const [flights, setFlights] = useState<Flight[]>(initialFlights || []);
  
  // Check if multicity
  const isMulticity = multicityResults && Array.isArray(multicityResults) && multicityResults.length > 0;
  
  // Tạo combinations từ multicityResults để booking
  const multicityCombinations = useMemo(() => {
    if (!isMulticity || !multicityResults) return [];
    
    // Tạo combinations (Cartesian product) từ multicityResults
    const createCombinations = (segments: Flight[][]): Flight[][] => {
      if (segments.length === 0) return [];
      if (segments.length === 1) return segments[0].map(f => [f]);
      
      const [first, ...rest] = segments;
      const restCombinations = createCombinations(rest);
      
      const combinations: Flight[][] = [];
      for (const flight of first) {
        for (const restCombo of restCombinations) {
          combinations.push([flight, ...restCombo]);
        }
      }
      return combinations;
    };
    
    return createCombinations(multicityResults);
  }, [isMulticity, multicityResults]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  
  // Modal states
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [timeFilterModalVisible, setTimeFilterModalVisible] = useState(false);
  const [airlineFilterModalVisible, setAirlineFilterModalVisible] = useState(false);
  
  // Sort & filter states
  const [sortBy, setSortBy] = useState<'default' | 'departure_early' | 'departure_late' | 'price_desc' | 'price_asc'>('default');
  const [filterAirlines, setFilterAirlines] = useState<string[]>([]);
  const [filterPriceRange, setFilterPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [timeFilter, setTimeFilter] = useState<'default' | 'early' | 'late' | { from: string; to: string }>('default');
  const [airlineSearchText, setAirlineSearchText] = useState('');

  // Update flights when params change (e.g., coming from loading screen)
  useEffect(() => {
    if (initialFlights) {
      let filteredFlights = [...initialFlights];
      
      // Apply filters
      if (filterAirlines.length > 0) {
        filteredFlights = filteredFlights.filter(f => 
          filterAirlines.includes(f.airline)
        );
      }
      
      if (filterPriceRange) {
        filteredFlights = filteredFlights.filter(f => {
          const price = f.price || 0;
          return price >= filterPriceRange.min && price <= filterPriceRange.max;
        });
      }
      
      // Apply time filter
      if (timeFilter !== 'default') {
        if (timeFilter === 'early') {
          filteredFlights = filteredFlights.filter(f => {
            if (!f.departure) return false;
            const depTime = new Date(f.departure);
            const hours = depTime.getHours();
            return hours >= 0 && hours < 12; // 0:00 - 11:59
          });
        } else if (timeFilter === 'late') {
          filteredFlights = filteredFlights.filter(f => {
            if (!f.departure) return false;
            const depTime = new Date(f.departure);
            const hours = depTime.getHours();
            return hours >= 12 && hours < 24; // 12:00 - 23:59
          });
        } else if (typeof timeFilter === 'object' && timeFilter.from && timeFilter.to) {
          filteredFlights = filteredFlights.filter(f => {
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
      filteredFlights.sort((a, b) => {
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
      
      setFlights(filteredFlights);
    }
  }, [initialFlights, sortBy, filterAirlines, filterPriceRange, timeFilter]);

  // Map mã hãng bay sang tên đầy đủ
  const airlineNameMap: Record<string, string> = {
    'VN': 'Vietnam Airlines',
    'VJ': 'VietJet Air',
    'BL': 'Bamboo Airways',
    'QH': 'Pacific Airlines',
  };

  const cabinViMap: Record<string, string> = {
    'Economy': 'Economy',
    'Premium Economy': 'Economy+',
    'Business': 'Business',
    'First': 'First',
  };
  
  // Map từ tiếng Việt sang tiếng Anh
  const cabinMapViToEn: Record<string, string> = {
    'Phổ thông': 'Economy',
    'Phổ thông cao cấp': 'Premium Economy',
    'Thương gia': 'Business',
    'Hạng nhất': 'First',
  };
  
  // Map từ tiếng Anh sang tiếng Việt
  const cabinMapEnToVi: Record<string, string> = {
    'Economy': 'Economy',
    'Premium Economy': 'Economy+',
    'Business': 'Business',
    'First': 'First',
  };
  
  // Lấy hạng ghế đã chọn từ params
  const selectedCabinEn = seatClass ? cabinMapViToEn[String(seatClass)] : undefined;
  const selectedCabinDisplay = selectedCabinEn ? cabinViMap[selectedCabinEn] || selectedCabinEn : undefined;
  
  // Map hạng ghế sang mã hiển thị ngắn gọn (ECO, BUS, PRE, FST)
  const cabinShortCodeMap: Record<string, string> = {
    'Economy': 'ECO',
    'Premium Economy': 'PRE',
    'Business': 'BUS',
    'First': 'FST',
  };
  
  const selectedCabinShortCode = selectedCabinEn ? cabinShortCodeMap[selectedCabinEn] || 'ECO' : 'ECO';

  const formatHm = (iso?: string | Date | null) => {
    if (!iso) return '00:00';
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    if (isNaN(d.getTime())) return '00:00';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Tính duration cho multicity (tổng từ departure của flight đầu đến arrival của flight cuối trong combination)
  const calcMulticityDuration = (flight: Flight): string => {
    if (!isMulticity || !multicityCombinations || multicityCombinations.length === 0) return '00h00m';
    
    // Tìm combination chứa flight này
    const combination = multicityCombinations.find(combo => 
      combo.some(cf => cf.flightNumber === flight.flightNumber && cf.from === flight.from && cf.to === flight.to)
    );
    
    if (!combination || combination.length === 0) return '00h00m';
    
    // Lấy departure của flight đầu tiên trong combination
    const firstFlight = combination[0];
    // Lấy arrival của flight cuối cùng trong combination
    const lastFlight = combination[combination.length - 1];
    
    if (!firstFlight || !lastFlight) return '00h00m';
    
    const firstDep = typeof firstFlight.departure === 'string' ? new Date(firstFlight.departure) : firstFlight.departure;
    const lastArr = typeof lastFlight.arrival === 'string' ? new Date(lastFlight.arrival) : lastFlight.arrival;
    
    if (isNaN(firstDep.getTime()) || isNaN(lastArr.getTime())) return '00h00m';
    
    const depTime = firstDep.getTime();
    const arrTime = lastArr.getTime();
    const diff = Math.max(0, arrTime - depTime);
    const minutes = Math.round(diff / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    
    return `${hh}h${mm}m`;
  };
  
  // Lấy departure và arrival time cho multicity flight
  const getMulticityTimes = (flight: Flight): { departure: string; arrival: string } => {
    if (!isMulticity || !multicityCombinations || multicityCombinations.length === 0) {
      return { departure: formatHm(flight.departure), arrival: formatHm(flight.arrival) };
    }
    
    // Tìm combination chứa flight này
    const combination = multicityCombinations.find(combo => 
      combo.some(cf => cf.flightNumber === flight.flightNumber && cf.from === flight.from && cf.to === flight.to)
    );
    
    if (!combination || combination.length === 0) {
      return { departure: formatHm(flight.departure), arrival: formatHm(flight.arrival) };
    }
    
    // Lấy departure của flight đầu tiên trong combination
    const firstFlight = combination[0];
    // Lấy arrival của flight cuối cùng trong combination
    const lastFlight = combination[combination.length - 1];
    
    return {
      departure: formatHm(firstFlight.departure),
      arrival: formatHm(lastFlight.arrival),
    };
  };

  const calcDuration = (depIso?: string | Date | null, arrIso?: string | Date | null, flight?: Flight) => {
    // Nếu là multicity, tính duration từ combination
    if (isMulticity && flight) {
      return calcMulticityDuration(flight);
    }
    
    // Tính duration cho single flight (không phải multicity)
    if (!depIso || !arrIso) return '00h00m';
    const dep = typeof depIso === 'string' ? new Date(depIso) : depIso;
    const arr = typeof arrIso === 'string' ? new Date(arrIso) : arrIso;
    if (isNaN(dep.getTime()) || isNaN(arr.getTime())) return '00h00m';
    const depTime = dep.getTime();
    const arrTime = arr.getTime();
    const diff = Math.max(0, arrTime - depTime);
    const minutes = Math.round(diff / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${hh}h${mm}m`;
  };

  const formatDateVN = (iso?: string | Date | null) => {
    if (!iso) return '';
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    if (isNaN(d.getTime())) return '';
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
        <Text style={styles.topInfoTextPlain}>Giá trên một hành khách đã giảm trừ KM của hãng và chưa bao gồm thuế, phí, phí đại lý.</Text>
      </View>

      {/* Sort & filter bar */}
      <View style={styles.sortBarPlain}>
        <TouchableOpacity 
          style={styles.sortBarItem}
          onPress={() => setSortModalVisible(true)}
        >
          <Icon name="sort" size={18} color="#fff" />
          <Text style={styles.sortBarItemText}>Sắp xếp</Text>
        </TouchableOpacity>
        <View style={styles.sortBarDivider} />
        <TouchableOpacity 
          style={styles.sortBarItem}
          onPress={() => setTimeFilterModalVisible(true)}
        >
          <Icon name="clock-outline" size={18} color="#fff" />
          <Text style={styles.sortBarItemText}>Giờ đi</Text>
        </TouchableOpacity>
        <View style={styles.sortBarDivider} />
        <TouchableOpacity 
          style={styles.sortBarItem}
          onPress={() => setAirlineFilterModalVisible(true)}
        >
          <Icon name="airplane" size={18} color="#fff" />
          <Text style={styles.sortBarItemText}>Hãng bay</Text>
        </TouchableOpacity>
      </View>

      {/* Results list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}>
        {flights.length > 0 ? (
          flights.map((f, idx) => (
          <TouchableOpacity key={idx} style={styles.resultCardPlain} activeOpacity={0.9} onPress={() => {
            const pax = typeof passengers === 'number' ? passengers : 1;
            
            // Nếu là multicity, tìm combination tương ứng và gửi tất cả flights
            if (isMulticity && multicityCombinations.length > 0) {
              // Tìm combination chứa flight này
              const combination = multicityCombinations.find(combo => 
                combo.some(cf => cf.flightNumber === f.flightNumber && cf.from === f.from && cf.to === f.to)
              );
              
              if (combination && combination.length > 0) {
                // Tính tổng giá từ tất cả flights trong combination
                const totalPrice = combination.reduce((sum, cf) => sum + (cf.price || 0), 0);
                const base = totalPrice * pax;
                const taxesAndFees = 0;
                const total = base + taxesAndFees;
                
                navigation.navigate('Booking', { 
                  flights: combination, 
                  tripType: 'Multi-city',
                  passengers: pax, 
                  pricing: { base, taxesAndFees, total } 
                });
                return;
              }
            }
            
            // Nếu không phải multicity hoặc không tìm thấy combination, gửi 1 flight
            const base = (f.price || 0) * pax;
            const taxesAndFees = 0;
            const total = base + taxesAndFees;
            navigation.navigate('Booking', { 
              flight: f, 
              tripType: 'One-way',
              passengers: pax, 
              pricing: { base, taxesAndFees, total } 
            });
          }}>
              <View style={styles.resultRowTopPlain}>
              <Text style={styles.timeTextPlain} numberOfLines={1}>
                {isMulticity ? getMulticityTimes(f).departure : formatHm(f.departure)}
              </Text>
              <Text style={styles.durationTextPlain} numberOfLines={1}>
                {isMulticity ? calcDuration(undefined, undefined, f) : calcDuration(f.departure, f.arrival)}
              </Text>
              <Text style={styles.timeTextPlain} numberOfLines={1}>
                {isMulticity ? getMulticityTimes(f).arrival : formatHm(f.arrival)}
              </Text>
              <View style={styles.cabinTagPlain}>
                <Text style={styles.cabinTagTextPlain} numberOfLines={1}>
                  {selectedCabinDisplay || cabinViMap[f.availableCabins[0]] || 'Economy'}
                </Text>
              </View>
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
                <Text style={styles.remainTextPlain} numberOfLines={1}>
                  Còn {(f.seatsAvailable as any)[selectedCabinEn || 'Economy'] ?? (f.seatsAvailable as any)['Economy'] ?? 7} chỗ
                </Text>
                <Text style={styles.priceTextPlain} numberOfLines={1}>{f.price.toLocaleString('vi-VN')} đ</Text>
              </View>
            </View>
          </TouchableOpacity>
          ))
        ) : (
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
                    <Text style={styles.summaryValue}>
                      {selectedFlight ? (
                        isMulticity 
                          ? (calcDuration(undefined, undefined, selectedFlight) || '00h00m').replace('h', ' giờ ').replace('m', ' phút')
                          : (calcDuration(selectedFlight.departure, selectedFlight.arrival) || '00h00m').replace('h', ' giờ ').replace('m', ' phút')
                      ) : ''}
                    </Text>
                  </View>
            </View>
                <View style={styles.badgeStraight}>
                  <Text style={styles.badgeStraightText}>
                    {isMulticity && multicityCombinations.length > 0 && selectedFlight ? (
                      (() => {
                        const combination = multicityCombinations.find(combo => 
                          combo.some(cf => cf.flightNumber === selectedFlight.flightNumber && cf.from === selectedFlight.from && cf.to === selectedFlight.to)
                        );
                        return combination ? `${combination.length} chuyến` : '1 chuyến';
                      })()
                    ) : (selectedFlight?.stops === 0 ? 'Bay thẳng' : `${selectedFlight?.stops} điểm dừng`)}
                  </Text>
                </View>
          </View>

              {/* Timeline */}
              {selectedFlight && (
                <View style={styles.timelineBlock}>
                  {isMulticity && multicityCombinations.length > 0 && selectedFlight ? (
                    // Tìm combination chứa selectedFlight
                    (() => {
                      const combination = multicityCombinations.find(combo => 
                        combo.some(cf => cf.flightNumber === selectedFlight.flightNumber && cf.from === selectedFlight.from && cf.to === selectedFlight.to)
                      );
                      
                      if (!combination || combination.length === 0) return null;
                      
                      // Hiển thị tất cả các flights trong combination
                      return combination.map((segmentFlight, segmentIndex) => {
                        const isLastSegment = segmentIndex === combination.length - 1;
                      
                      return (
                        <View key={segmentIndex}>
                          {/* From/Intermediate point */}
                          <View style={styles.timelineRow}>
                            <View style={styles.timelineColLeft}>
                              <Text style={styles.timelineTime}>{formatHm(segmentFlight.departure)}</Text>
                              <Text style={styles.timelineDate}>{formatDateVN(segmentFlight.departure)}</Text>
                            </View>
                            <View style={styles.timelineColDot}>
                              <View style={styles.dot} />
                              {!isLastSegment && <View style={styles.vLine} />}
                            </View>
                            <View style={styles.timelineColRight}>
                              <Text style={styles.cityTitle} numberOfLines={1}>
                                {segmentFlight.from === 'HAN' ? 'Hà Nội' : 
                                 segmentFlight.from === 'SGN' ? 'TP Hồ Chí Minh' :
                                 segmentFlight.from === 'DAD' ? 'Đà Nẵng' :
                                 segmentFlight.from === 'PQC' ? 'Phú Quốc' : segmentFlight.from}
                              </Text>
                              <Text style={styles.airportName} numberOfLines={2}>
                                {segmentFlight.from === 'HAN' ? 'Sân bay quốc tế Nội Bài' :
                                 segmentFlight.from === 'SGN' ? 'Sân bay quốc tế Tân Sơn Nhất' :
                                 segmentFlight.from === 'DAD' ? 'Sân bay quốc tế Đà Nẵng' :
                                 segmentFlight.from === 'PQC' ? 'Sân bay quốc tế Phú Quốc' : `Sân bay ${segmentFlight.from}`}
                              </Text>
                              <View style={styles.flightCard}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                                  <Icon name="airplane" size={16} color="#EF4444" />
                                  <Text style={[styles.flightAirline, { flex: 1, flexShrink: 1 }]} numberOfLines={1}>  {segmentFlight.airline}</Text>
                                </View>
                                <Text style={styles.flightMeta} numberOfLines={2}>{segmentFlight.flightNumber} - Airbus A320-100/200</Text>
                                <Text style={styles.flightMeta} numberOfLines={1}>{selectedCabinShortCode}</Text>
                                <View style={styles.flightDivider} />
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                  <Icon name="clock-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
                                  <Text style={[styles.flightMeta, { flex: 1, flexShrink: 1 }]} numberOfLines={2}>
                                    Thời gian bay: {(calcDuration(segmentFlight.departure, segmentFlight.arrival) || '00h00m').replace('h', ' giờ ').replace('m', ' phút')}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          {/* To/Next point */}
                          {isLastSegment && (
                            <View style={styles.timelineRowEnd}>
                              <View style={styles.timelineColLeft}>
                                <Text style={styles.timelineTime}>{formatHm(segmentFlight.arrival)}</Text>
                                <Text style={styles.timelineDate}>{formatDateVN(segmentFlight.arrival)}</Text>
                              </View>
                              <View style={styles.timelineColDot}>
                                <View style={styles.dot} />
                              </View>
                              <View style={styles.timelineColRight}>
                                <Text style={styles.cityTitle} numberOfLines={1}>
                                  {segmentFlight.to === 'HAN' ? 'Hà Nội' : 
                                   segmentFlight.to === 'SGN' ? 'TP Hồ Chí Minh' :
                                   segmentFlight.to === 'DAD' ? 'Đà Nẵng' :
                                   segmentFlight.to === 'PQC' ? 'Phú Quốc' : segmentFlight.to}
                                </Text>
                                <Text style={styles.airportName} numberOfLines={2}>
                                  {segmentFlight.to === 'HAN' ? 'Sân bay quốc tế Nội Bài' :
                                   segmentFlight.to === 'SGN' ? 'Sân bay quốc tế Tân Sơn Nhất' :
                                   segmentFlight.to === 'DAD' ? 'Sân bay quốc tế Đà Nẵng' :
                                   segmentFlight.to === 'PQC' ? 'Sân bay quốc tế Phú Quốc' : `Sân bay ${segmentFlight.to}`}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                      });
                    })()
                  ) : (
                    // Hiển thị single flight (không phải multicity)
                    <>
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
                            <Text style={styles.flightMeta} numberOfLines={1}>{selectedCabinShortCode}</Text>
                            <View style={styles.flightDivider} />
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <Icon name="clock-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
                              <Text style={[styles.flightMeta, { flex: 1, flexShrink: 1 }]} numberOfLines={2}>  Thời gian bay: {(calcDuration(selectedFlight.departure, selectedFlight.arrival) || '00h00m').replace('h', ' giờ ').replace('m', ' phút')}</Text>
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
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={sortModalVisible} transparent={true} animationType="slide" onRequestClose={() => setSortModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalContainer}>
            {/* Header */}
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>Sắp xếp</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Text style={styles.sortModalClose}>Đóng</Text>
              </TouchableOpacity>
            </View>

            {/* Sort Options */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {[
                { key: 'default', label: 'Mặc định' },
                { key: 'departure_early', label: 'Giờ đi sớm nhất' },
                { key: 'departure_late', label: 'Giờ đi muộn nhất' },
                { key: 'price_desc', label: 'Giá giảm dần' },
                { key: 'price_asc', label: 'Giá tăng dần' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.sortOptionRow}
                  onPress={() => {
                    setSortBy(option.key as any);
                    setSortModalVisible(false);
                  }}
                >
                  <Text style={styles.sortOptionText}>{option.label}</Text>
                  <View style={[
                    styles.radioButton,
                    sortBy === option.key && styles.radioButtonSelected
                  ]}>
                    {sortBy === option.key && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time Filter Modal */}
      <Modal visible={timeFilterModalVisible} transparent={true} animationType="slide" onRequestClose={() => setTimeFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalContainer}>
            {/* Header */}
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>Giờ đi</Text>
              <TouchableOpacity onPress={() => setTimeFilterModalVisible(false)}>
                <Text style={styles.sortModalClose}>Đóng</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {/* Time Range Inputs */}
              <View style={styles.timeRangeContainer}>
                <View style={styles.timeInputWrapper}>
                  <Text style={styles.timeInputLabel}>Từ</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={typeof timeFilter === 'object' ? timeFilter.from : '00:00'}
                    placeholder="00:00"
                    onChangeText={(text) => {
                      if (typeof timeFilter === 'object') {
                        setTimeFilter({ ...timeFilter, from: text });
                      } else {
                        setTimeFilter({ from: text, to: '24:00' });
                      }
                    }}
                  />
                </View>
                <Text style={styles.timeSeparator}>-</Text>
                <View style={styles.timeInputWrapper}>
                  <Text style={styles.timeInputLabel}>Đến</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={typeof timeFilter === 'object' ? timeFilter.to : '24:00'}
                    placeholder="24:00"
                    onChangeText={(text) => {
                      if (typeof timeFilter === 'object') {
                        setTimeFilter({ ...timeFilter, to: text });
                      } else {
                        setTimeFilter({ from: '00:00', to: text });
                      }
                    }}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Footer buttons */}
            <View style={[styles.modalFooter, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setTimeFilter('default');
                  setTimeFilterModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Xóa lọc</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setTimeFilterModalVisible(false)}
              >
                <Text style={styles.modalButtonPrimaryText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Airline Filter Modal */}
      <Modal visible={airlineFilterModalVisible} transparent={true} animationType="slide" onRequestClose={() => setAirlineFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalContainer}>
            {/* Header */}
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>Hãng bay</Text>
              <TouchableOpacity onPress={() => setAirlineFilterModalVisible(false)}>
                <Text style={styles.sortModalClose}>Đóng</Text>
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchBarContainer}>
              <Icon name="magnify" size={20} color="#6B7280" />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Tìm hãng bay trong danh sách dưới"
                value={airlineSearchText}
                onChangeText={setAirlineSearchText}
              />
            </View>

            {/* Airline list */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {(() => {
                const airlines = Array.from(new Set(initialFlights?.map((f: Flight) => f.airline).filter((a: string | undefined): a is string => Boolean(a)) || [])) as string[];
                const filteredAirlines = airlines.filter(airline => {
                  const airlineFullName = airlineNameMap[airline] || airline;
                  return airline.toLowerCase().includes(airlineSearchText.toLowerCase()) ||
                         airlineFullName.toLowerCase().includes(airlineSearchText.toLowerCase());
                });
                
                return filteredAirlines.map((airline: string) => {
                  const airlineFullName = airlineNameMap[airline] || airline;
                  return (
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
                    <View style={styles.airlineInfo}>
                      <Text style={styles.airlineName}>{airlineFullName}</Text>
                      <Text style={styles.airlineCode}>{airline}</Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      filterAirlines.includes(airline) && styles.checkboxSelected
                    ]}>
                      {filterAirlines.includes(airline) && (
                        <Icon name="check" size={16} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                )});
              })()}
            </ScrollView>

            {/* Footer buttons */}
            <View style={[styles.modalFooter, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setFilterAirlines([]);
                  setAirlineFilterModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Xóa lọc</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setAirlineFilterModalVisible(false)}
              >
                <Text style={styles.modalButtonPrimaryText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
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
  sortBarPlain: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#2873e6', 
    paddingHorizontal: 0, 
    paddingVertical: 12,
  },
  sortBarItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sortBarItemText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 14,
  },
  sortBarDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
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
  modalHeaderContainer: { backgroundColor: '#2873e6' },
  modalHeaderRow: { backgroundColor: '#2873e6', paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2873e6', marginTop: 6, marginBottom: 2 },
  vLine: { width: 2, backgroundColor: '#E5E7EB', flex: 1 },
  timelineTime: { color: '#111827', fontWeight: '700' },
  timelineDate: { color: '#94A3B8', fontSize: 12 },
  cityTitle: { color: '#111827', fontWeight: '700' },
  airportName: { color: '#64748B', marginBottom: 8 },
  flightCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10 },
  flightAirline: { color: '#111827', fontWeight: '700' },
  flightMeta: { color: '#64748B', fontSize: 12, marginTop: 2 },
  flightDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  // Sort & Filter Modal styles
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  optionCardSelected: {
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#2873e6',
  },
  optionText: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#2873e6',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
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
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // New Sort/Time/Airline Modal styles
  sortModalContainer: {
    height: '70%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sortModalClose: {
    fontSize: 16,
    color: '#2873e6',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  timeInputWrapper: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  timeSeparator: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 24,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  airlineOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  airlineInfo: {
    flex: 1,
  },
  airlineName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  airlineCode: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
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
});

