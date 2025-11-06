import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Airport } from '../types/airport';
import { FlightSegment } from '../types/flight-segment';
import { FlightBookingCardProps } from '../types/component-props';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

// Module-level persistent storage (không bị reset khi component re-mount)
const persistentDepartureStorage: { value: Airport | null } = {
  value: {
    code: 'SGN',
    name: 'Sân bay Tân Sơn Nhất',
    city: 'Thành phố Hồ Chí Minh',
    country: 'Việt Nam',
  },
};

const persistentArrivalStorage: { value: Airport | null } = {
  value: {
    code: 'HAN',
    name: 'Sân bay Nội Bài',
    city: 'Hà Nội',
    country: 'Việt Nam',
  },
};

// Helper function to format date
const formatDateDefault = (date: Date): string => {
  const day = date.getDate();
  const month = date.toLocaleString('vi-VN', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
};

// Helper function to get default dates
const getDefaultDates = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    depart: formatDateDefault(today),
    return: formatDateDefault(tomorrow),
  };
};

// Module-level persistent storage for dates (không bị reset khi component re-mount)
const persistentDepartDateStorage: { value: string | null } = {
  value: getDefaultDates().depart,
};

const persistentReturnDateStorage: { value: string | null } = {
  value: getDefaultDates().return,
};

// Module-level persistent storage for tripType (không bị reset khi component re-mount)
const persistentTripTypeStorage: { value: 'round' | 'oneway' | 'multicity' } = {
  value: 'round',
};

// Module-level persistent storage for multicity flights (không bị reset khi component re-mount)
const persistentFlightsStorage: { value: FlightSegment[] | null } = {
  value: null,
};

export default function FlightBookingCard({ airportData }: FlightBookingCardProps) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isAuthenticated, user, tokens } = useAuthStore();
  
  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;
  
  // State cho tripType - khôi phục từ module-level storage nếu đã có
  const [tripType, setTripType] = useState<'round' | 'oneway' | 'multicity'>(() => {
    const saved = persistentTripTypeStorage.value;
    return saved;
  });
  
  // Default values
  const defaultDeparture: Airport = {
    code: 'SGN',
    name: 'Sân bay Tân Sơn Nhất',
    city: 'Thành phố Hồ Chí Minh',
    country: 'Việt Nam',
  };
  
  const defaultArrival: Airport = {
    code: 'HAN',
    name: 'Sân bay Nội Bài',
    city: 'Hà Nội',
    country: 'Việt Nam',
  };
  
  // Ref để track xem đã set giá trị chưa (không bị reset khi re-mount)
  const hasInitializedRef = useRef(false);
  
  // State riêng cho điểm đi - khôi phục từ module-level storage nếu đã có
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(() => {
    const saved = persistentDepartureStorage.value;
    return saved || defaultDeparture;
  });
  
  // State riêng cho điểm đến - khôi phục từ module-level storage nếu đã có
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(() => {
    const saved = persistentArrivalStorage.value;
    return saved || defaultArrival;
  });
  
  // Sync state với module-level storage để persist khi re-mount
  useEffect(() => {
    if (departureAirport) {
      persistentDepartureStorage.value = departureAirport;
    }
  }, [departureAirport]);
  
  useEffect(() => {
    if (arrivalAirport) {
      persistentArrivalStorage.value = arrivalAirport;
    }
  }, [arrivalAirport]);
  

  // Sync tripType state với module-level storage để persist khi re-mount
  useEffect(() => {
    if (tripType) {
      persistentTripTypeStorage.value = tripType;
    }
  }, [tripType]);
  
  
  // Computed values từ state
  const departure = departureAirport?.code || '';
  const departureCity = departureAirport ? `${departureAirport.city}, ${departureAirport.country}` : '';
  const arrival = arrivalAirport?.code || '';
  const arrivalCity = arrivalAirport ? `${arrivalAirport.city}, ${arrivalAirport.country}` : '';
  const [passengers, setPassengers] = useState(1);
  
  // Initialize dates from module-level persistent storage
  const [departDate, setDepartDate] = useState(() => {
    const saved = persistentDepartDateStorage.value || getDefaultDates().depart;
    // Update storage if it's null (first time)
    if (!persistentDepartDateStorage.value) {
      persistentDepartDateStorage.value = saved;
    }
    return saved;
  });
  const [returnDate, setReturnDate] = useState(() => {
    const saved = persistentReturnDateStorage.value || getDefaultDates().return;
    // Update storage if it's null (first time)
    if (!persistentReturnDateStorage.value) {
      persistentReturnDateStorage.value = saved;
    }
    return saved;
  });
  const [seatClass, setSeatClass] = useState('Phổ thông');
  
  // Modal states
  const [showSeatClassModal, setShowSeatClassModal] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Passenger counts
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [infantCount, setInfantCount] = useState(0);
  
  // Seat class options
  const seatClasses = [
    { value: 'Phổ thông', description: 'Bay tiết kiệm, đáp ứng mọi nhu cầu cơ bản của bạn' },
    { value: 'Phổ thông cao cấp', description: 'Chi phí hợp lý với bữa ăn ngon và chỗ để chân rộng rãi' },
    { value: 'Thương gia', description: 'Bay đẳng cấp, với quầy làm thủ tục và khu ghế ngồi riêng' },
    { value: 'Hạng nhất', description: 'Trải nghiệm sang trọng nhất với phục vụ ưu tiên và không gian riêng tư cao cấp' },
  ];
  
  // Airport data đã được lấy từ BE, không cần hardcode nữa
  // const airports: Airport[] = [];
  
  // Multi-city flights - khôi phục từ module-level storage nếu đã có
  const [flights, setFlights] = useState<FlightSegment[]>(() => {
    const saved = persistentFlightsStorage.value;
    if (saved && saved.length > 0) {
      return saved;
    }
    // Default: một chuyến bay với giá trị mặc định (giống logic một chiều)
    const defaultDate = getDefaultDates().depart;
    const defaultFlight: FlightSegment = {
      id: '1',
      departure: defaultDeparture.code,
      arrival: defaultArrival.code,
      departureCity: `${defaultDeparture.city}, ${defaultDeparture.country}`,
      arrivalCity: `${defaultArrival.city}, ${defaultArrival.country}`,
      date: defaultDate,
    };
    return [defaultFlight];
  });

  // Sync flights state với module-level storage để persist khi re-mount
  useEffect(() => {
    if (tripType === 'multicity' && flights.length > 0) {
      persistentFlightsStorage.value = flights;
    } else if (tripType !== 'multicity') {
      // Clear flights storage khi không phải multicity mode
      persistentFlightsStorage.value = null;
    }
  }, [flights, tripType]);
  
  // Ref để track params đã xử lý, tránh xử lý lại khi clear params
  const processedParamsRef = useRef<Set<string>>(new Set());
  
  // Handle params returning from Airports/DatePicker - XỬ LÝ DUY NHẤT TẠI ĐÂY
  useEffect(() => {
    const params = route.params as any;
    
    if (!params) {
      return;
    }
    
    const { mode, flightIndex, airportType: typeFromAirport, airport, selectedDate, dateType } = params;
    
    // Bỏ qua nếu không có data hợp lệ (sau khi clear params)
    // Nhưng phải check selectedDate và dateType riêng vì có thể chỉ có date update
    if (!airport && !selectedDate && !mode && !dateType) {
      return;
    }
    
    // Tạo key để track params đã xử lý
    // Separate keys for airport and date to avoid conflicts
    const airportKey = airport && typeFromAirport ? `${typeFromAirport}-${airport.code}` : '';
    const dateKey = selectedDate && dateType ? `${dateType}-${selectedDate}` : '';
    const paramsKey = airportKey || dateKey || `${mode}-${flightIndex}`;
    
    // Nếu params này đã được xử lý, bỏ qua
    if (processedParamsRef.current.has(paramsKey)) {
      return;
    }
    
    // Handle multicity mode
    if (mode === 'multicity' && typeof flightIndex === 'number') {
      setFlights(prev => {
        const updated = [...prev];
        const target = { ...updated[flightIndex] };
        
        if (airport && typeFromAirport) {
          if (typeFromAirport === 'departure') {
            target.departure = airport.code;
            target.departureCity = `${airport.city}, ${airport.country}`;
          } else if (typeFromAirport === 'arrival') {
            target.arrival = airport.code;
            target.arrivalCity = `${airport.city}, ${airport.country}`;
          }
        }
        
        if (selectedDate && dateType === 'departure') {
          target.date = selectedDate;
        }
        
        updated[flightIndex] = target;
        
        // Lưu vào module-level storage trước để persist
        persistentFlightsStorage.value = updated;
        
        return updated;
      });
      
      // Đánh dấu đã xử lý
      processedParamsRef.current.add(paramsKey);
      // Clear params ngay lập tức
      navigation.setParams({ mode: undefined, flightIndex: undefined, airportType: undefined, airport: undefined, selectedDate: undefined, dateType: undefined });
      return;
    } 
    
    // Handle single/round trip mode - update directly from route params
    if (airport && typeFromAirport && !mode) {
      // Đánh dấu đã xử lý TRƯỚC KHI setState để tránh xử lý lại
      processedParamsRef.current.add(paramsKey);
      
      // Đánh dấu đã initialize
      hasInitializedRef.current = true;
      
      // Lưu giá trị hiện tại của airport kia để đảm bảo không bị mất
      // Sử dụng closure để lưu giá trị hiện tại
      const currentDeparture = departureAirport || defaultDeparture;
      const currentArrival = arrivalAirport || defaultArrival;
      
      if (typeFromAirport === 'departure') {
        // Chỉ cập nhật state cho điểm đi, GIỮ NGUYÊN điểm đến
        // Lưu vào module-level storage trước để persist
        persistentDepartureStorage.value = airport;
        persistentArrivalStorage.value = currentArrival;
        
        setDepartureAirport(airport);
        // Đảm bảo arrival không bị thay đổi
        setArrivalAirport(currentArrival);
      } else if (typeFromAirport === 'arrival') {
        // Chỉ cập nhật state cho điểm đến, GIỮ NGUYÊN điểm đi
        // Lưu vào module-level storage trước để persist
        persistentDepartureStorage.value = currentDeparture;
        persistentArrivalStorage.value = airport;
        
        setArrivalAirport(airport);
        // Đảm bảo departure không bị thay đổi
        setDepartureAirport(currentDeparture);
      }
      
      // KHÔNG clear params để tránh component re-mount
      // Params sẽ được clear tự động khi navigate đến màn hình khác
      // Hoặc có thể clear sau khi component đã update xong
      
      return; // Exit early để không xử lý date
    }
    
    // Handle date updates for single/round trip
    // Check if we have date params and no airport params (or airport was already processed)
    if (selectedDate && dateType && !mode) {
      // Only process if we don't have airport params, or if airport params were already processed
      const hasAirportParams = airport && typeFromAirport;
      
      if (!hasAirportParams) {
        // Check if this date update was already processed
        if (processedParamsRef.current.has(paramsKey)) {
          return;
        }
        
        // Lưu giá trị hiện tại của ngày kia để đảm bảo không bị mất
        const currentDepartDate = departDate || persistentDepartDateStorage.value || getDefaultDates().depart;
        const currentReturnDate = returnDate || persistentReturnDateStorage.value || getDefaultDates().return;
        
        // selectedDate is already in display format from DatePickerScreen (e.g., "6 Thg 11, 2025")
        // So we can use it directly
      if (dateType === 'departure') {
          // Lưu vào module-level storage trước để persist
          persistentDepartDateStorage.value = selectedDate;
          persistentReturnDateStorage.value = currentReturnDate;
          
          setDepartDate(selectedDate);
          // Đảm bảo returnDate không bị thay đổi
          setReturnDate(currentReturnDate);
      } else if (dateType === 'return') {
          // Lưu vào module-level storage trước để persist
          persistentDepartDateStorage.value = currentDepartDate;
          persistentReturnDateStorage.value = selectedDate;
          
          setReturnDate(selectedDate);
          // Đảm bảo departDate không bị thay đổi
          setDepartDate(currentDepartDate);
        }
        
        // Đánh dấu đã xử lý
        processedParamsRef.current.add(paramsKey);
        
        // Clear params ngay lập tức
        setTimeout(() => {
      navigation.setParams({ selectedDate: undefined, dateType: undefined });
        }, 100);
      }
    }
  }, [route.params, navigation]);

  const addFlight = () => {
    const newFlight: FlightSegment = {
      id: Date.now().toString(),
      departure: '',
      arrival: '',
      departureCity: '',
      arrivalCity: '',
      date: '',
    };
    const updatedFlights = [...flights, newFlight];
    setFlights(updatedFlights);
    // Lưu vào module-level storage
    persistentFlightsStorage.value = updatedFlights;
  };

  const removeFlight = (id: string) => {
    if (flights.length > 2) {
      const updatedFlights = flights.filter(f => f.id !== id);
      setFlights(updatedFlights);
      // Lưu vào module-level storage
      persistentFlightsStorage.value = updatedFlights;
    }
  };
  
  const getPassengerDisplayText = () => {
    const parts = [];
    if (adultCount > 0) parts.push(`${adultCount} Người lớn`);
    if (childCount > 0) parts.push(`${childCount} Trẻ em`);
    if (infantCount > 0) parts.push(`${infantCount} Em bé`);
    return parts.join(', ');
  };
  
  const handleConfirmPassengers = () => {
    setPassengers(adultCount + childCount + infantCount);
    setShowPassengerModal(false);
  };
  
  const handleConfirmSeatClass = () => {
    setShowSeatClassModal(false);
  };

  const handleSwapSingle = () => {
    // Swap airports bằng cách swap state
    const temp = departureAirport;
    setDepartureAirport(arrivalAirport);
    setArrivalAirport(temp);
  };

  const handleSwapMulti = (index: number) => {
    setFlights(prev => {
      const updated = [...prev];
      const f = { ...updated[index] };
      // Lưu vào module-level storage
      persistentFlightsStorage.value = updated;
      const tmpCode = f.departure;
      const tmpCity = f.departureCity;
      f.departure = f.arrival;
      f.departureCity = f.arrivalCity;
      f.arrival = tmpCode;
      f.arrivalCity = tmpCity;
      updated[index] = f;
      return updated;
    });
  };
  
  const handleSearch = async () => {
    try {
      setLoading(true);
      
      // Xử lý multicity search
      if (tripType === 'multicity') {
        // Validate flights array
        const validFlights = flights.filter(f => f.departure && f.arrival && f.date);
        if (validFlights.length === 0) {
          alert('Vui lòng nhập đầy đủ thông tin cho các chuyến bay');
          return;
        }
        
        // Lưu search history nếu user đã đăng nhập
        if (isAuthenticated && user?._id && API_BASE_URL && validFlights.length > 0) {
          try {
            // Lấy thông tin từ segment đầu và cuối
            const firstFlight = validFlights[0];
            const lastFlight = validFlights[validFlights.length - 1];
            
            // Map airport code to city name (simple mapping)
            const airportCityMap: Record<string, string> = {
              'HAN': 'Hà Nội',
              'SGN': 'Thành phố Hồ Chí Minh',
              'DAD': 'Đà Nẵng',
              'PQC': 'Phú Quốc',
              'HPH': 'Hải Phòng',
              'VCA': 'Cần Thơ',
              'NHA': 'Nha Trang',
              'HUI': 'Huế',
              'BKK': 'Bangkok',
              'SIN': 'Singapore',
              'KUL': 'Kuala Lumpur',
              'ICN': 'Seoul',
              'NRT': 'Tokyo',
              'PEK': 'Beijing',
            };
            
            await axios.post(
              `${API_BASE_URL}/search-history`,
              {
                userId: user._id,
                from: firstFlight.departure,
                to: lastFlight.arrival,
                fromCity: airportCityMap[firstFlight.departure] || firstFlight.departure,
                toCity: airportCityMap[lastFlight.arrival] || lastFlight.arrival,
                departDate: firstFlight.date,
                tripType: tripType,
                passengers: passengers,
                seatClass: seatClass,
              },
              {
                headers: tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : undefined,
              }
            );
          } catch (error: any) {
            // Error saving search history
          }
        }
        
        // Navigate to Loading screen với multicity data
        navigation.navigate('ResultsLoading', {
          tripType: 'multicity',
          flights: validFlights,
          passengers: passengers,
          seatClass: seatClass,
        });
        
        return;
      }
      
      // Xử lý single/round trip search
      // Lưu search history nếu user đã đăng nhập
      if (isAuthenticated && user?._id && API_BASE_URL && departureAirport && arrivalAirport) {
        try {
          await axios.post(
            `${API_BASE_URL}/search-history`,
            {
              userId: user._id,
              from: departure,
              to: arrival,
              fromCity: departureAirport.city,
              toCity: arrivalAirport.city,
              departDate: departDate,
              returnDate: tripType === 'round' ? returnDate : undefined,
              tripType: tripType,
              passengers: passengers,
              seatClass: seatClass,
            },
            {
              headers: tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : undefined,
            }
          );
        } catch (error: any) {
          // Không block search nếu lưu history thất bại
        }
      }
      
      // Navigate to Loading screen first
      navigation.navigate('ResultsLoading', {
        from: departure,
        to: arrival,
        date: departDate,
        passengers: passengers,
        seatClass: seatClass,
      });
      
    } catch (error: any) {
      // Search error
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Trip Type Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setTripType('round')}
          style={[
            styles.tab,
            styles.tabSmall,
            tripType === 'round' ? styles.tabActive : styles.tabInactive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              tripType === 'round' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Khứ hồi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTripType('oneway')}
          style={[
            styles.tab,
            styles.tabSmall,
            tripType === 'oneway' ? styles.tabActive : styles.tabInactive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              tripType === 'oneway' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Một chiều
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTripType('multicity')}
          style={[
            styles.tab,
            styles.tabLarge,
            tripType === 'multicity' ? styles.tabActive : styles.tabInactive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              tripType === 'multicity' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Nhiều thành phố
          </Text>
        </TouchableOpacity>
      </View>

      {tripType === 'multicity' ? (
        // Multi-city view
        <>
          {flights.map((flight, index) => (
            <View key={flight.id} style={styles.flightSection}>
              <View style={styles.flightHeader}>
                <Text style={styles.flightNumber}>Chuyến bay {index + 1}</Text>
                {flights.length > 2 && (
                  <TouchableOpacity onPress={() => removeFlight(flight.id)}>
                    <Icon name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Route */}
              <View style={styles.routeRow}>
                <TouchableOpacity style={styles.routeItem} onPress={() => navigation.navigate('Airports', { type: 'departure', mode: 'multicity', flightIndex: index })}>
                  <View style={styles.routeIconContainer}>
                    <Icon name="airplane-takeoff" size={16} color="#2873e6" />
                  </View>
                  <View style={styles.routeTextContainer}>
                    <Text style={styles.routeLabel}>Điểm đi</Text>
                    <Text style={styles.routeValue}>{flight.departure}</Text>
                    <Text style={styles.routeSubValue}>{flight.departureCity}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.arrowContainer} onPress={() => handleSwapMulti(index)}>
                  <Icon name="swap-horizontal" size={24} color="#2873e6" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.routeItem} onPress={() => navigation.navigate('Airports', { type: 'arrival', mode: 'multicity', flightIndex: index })}>
                  <View style={styles.routeIconContainer}>
                    <Icon name="airplane-landing" size={16} color="#2873e6" />
                  </View>
                  <View style={styles.routeTextContainer}>
                    <Text style={styles.routeLabel}>Điểm đến</Text>
                    <Text style={styles.routeValue}>{flight.arrival}</Text>
                    <Text style={styles.routeSubValue}>{flight.arrivalCity}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Date */}
              <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DatePicker', { type: 'departure', mode: 'multicity', flightIndex: index })}>
                <View style={styles.iconContainer}>
                  <Icon name="calendar" size={24} color="#2873e6" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Ngày đi</Text>
                  <Text style={styles.value}>{flight.date}</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Flight Button */}
          {flights.length < 5 && (
            <TouchableOpacity style={styles.addFlightButton} onPress={addFlight}>
              <Icon name="plus-circle" size={20} color="#2873e6" />
              <Text style={styles.addFlightText}>Thêm chuyến bay</Text>
            </TouchableOpacity>
          )}

          {/* Passengers and Seat Class */}
          <View style={styles.grid}>
            <TouchableOpacity style={styles.gridItem} onPress={() => setShowPassengerModal(true)}>
              <View style={styles.iconContainer}>
                <Icon name="account-group" size={24} color="#2873e6" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Hành khách</Text>
                <Text style={styles.value}>{getPassengerDisplayText()}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => setShowSeatClassModal(true)}>
              <View style={styles.iconContainer}>
                <Icon name="seat-passenger" size={24} color="#2873e6" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Hạng ghế</Text>
                <Text style={styles.value}>{seatClass}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // Single/Round trip view
        <View style={styles.grid}>
          {/* Departure and Arrival - Same Row */}
          <View style={styles.routeRow}>
            {/* Departure */}
            <TouchableOpacity style={styles.routeItem} onPress={() => navigation.navigate('Airports', { type: 'departure' })}>
              <View style={styles.routeIconContainer}>
                <Icon name="airplane-takeoff" size={16} color="#2873e6" />
              </View>
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Điểm đi</Text>
                <Text style={styles.routeValue}>{departure}</Text>
                <Text style={styles.routeSubValue}>{departureCity}</Text>
              </View>
            </TouchableOpacity>

            {/* Arrow Icon */}
            <TouchableOpacity style={styles.arrowContainer} onPress={handleSwapSingle}>
              <Icon name="swap-horizontal" size={24} color="#2873e6" />
            </TouchableOpacity>

            {/* Arrival */}
            <TouchableOpacity style={styles.routeItem} onPress={() => navigation.navigate('Airports', { type: 'arrival' })}>
              <View style={styles.routeIconContainer}>
                <Icon name="airplane-landing" size={16} color="#2873e6" />
              </View>
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Điểm đến</Text>
                <Text style={styles.routeValue}>{arrival}</Text>
                <Text style={styles.routeSubValue}>{arrivalCity}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Dates */}
          {tripType === 'round' ? (
            <>
              <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DatePicker', { type: 'departure', currentDate: departDate })}>
                <View style={styles.iconContainer}>
                  <Icon name="calendar" size={24} color="#2873e6" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Ngày đi</Text>
                  <Text style={styles.value}>{departDate}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DatePicker', { type: 'return', currentDate: returnDate })}>
                <View style={styles.iconContainer}>
                  <Icon name="calendar" size={24} color="#2873e6" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Ngày về</Text>
                  <Text style={styles.value}>{returnDate}</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DatePicker', { type: 'departure', currentDate: departDate })}>
              <View style={styles.iconContainer}>
                <Icon name="calendar" size={24} color="#2873e6" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Ngày đi</Text>
                <Text style={styles.value}>{departDate}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Passengers */}
          <TouchableOpacity style={styles.gridItem} onPress={() => setShowPassengerModal(true)}>
            <View style={styles.iconContainer}>
              <Icon name="account-group" size={24} color="#2873e6" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>Hành khách</Text>
              <Text style={styles.value}>{getPassengerDisplayText()}</Text>
            </View>
          </TouchableOpacity>

          {/* Seat Class */}
          <TouchableOpacity style={styles.gridItem} onPress={() => setShowSeatClassModal(true)}>
            <View style={styles.iconContainer}>
              <Icon name="seat-passenger" size={24} color="#2873e6" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>Hạng ghế</Text>
              <Text style={styles.value}>{seatClass}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Seat Class Modal */}
      <Modal
        visible={showSeatClassModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSeatClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hạng ghế</Text>
              <TouchableOpacity onPress={() => setShowSeatClassModal(false)}>
                <Text style={styles.modalCloseButton}>Đóng</Text>
              </TouchableOpacity>
            </View>

            {/* Seat Class Options */}
            <ScrollView style={styles.modalScrollView}>
              {seatClasses.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.seatClassOption,
                    seatClass === item.value && styles.seatClassOptionSelected,
                  ]}
                  onPress={() => setSeatClass(item.value)}
                >
                  <View style={styles.radioButton}>
                    {seatClass === item.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.seatClassInfo}>
                    <Text style={styles.seatClassTitle}>{item.value}</Text>
                    <Text style={styles.seatClassDescription}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Confirm Button */}
            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirmSeatClass}>
              <Text style={styles.modalConfirmButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Passenger Modal */}
      <Modal
        visible={showPassengerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPassengerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hành khách</Text>
              <TouchableOpacity onPress={() => setShowPassengerModal(false)}>
                <Text style={styles.modalCloseButton}>Đóng</Text>
              </TouchableOpacity>
            </View>

            {/* Passenger Counters */}
            <ScrollView style={styles.modalScrollView}>
              {/* Adults */}
              <View style={styles.passengerRow}>
                <View style={styles.passengerInfo}>
                  <Text style={styles.passengerTitle}>Người lớn</Text>
                  <Text style={styles.passengerSubtitle}>Từ đúng 12 tuổi trở lên vào ngày khởi hành</Text>
                </View>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={[styles.counterButton, adultCount <= 1 && styles.counterButtonDisabled]}
                    onPress={() => adultCount > 1 && setAdultCount(adultCount - 1)}
                    disabled={adultCount <= 1}
                  >
                    <Icon name="minus" size={20} color={adultCount <= 1 ? '#9CA3AF' : '#2873e6'} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{adultCount}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setAdultCount(adultCount + 1)}
                  >
                    <Icon name="plus" size={20} color="#2873e6" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Children */}
              <View style={styles.passengerRow}>
                <View style={styles.passengerInfo}>
                  <Text style={styles.passengerTitle}>Trẻ em</Text>
                  <Text style={styles.passengerSubtitle}>Từ đúng 2 tuổi đến dưới 11 tuổi</Text>
                </View>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={[styles.counterButton, childCount === 0 && styles.counterButtonDisabled]}
                    onPress={() => setChildCount(Math.max(0, childCount - 1))}
                    disabled={childCount === 0}
                  >
                    <Icon name="minus" size={20} color={childCount === 0 ? '#9CA3AF' : '#2873e6'} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{childCount}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setChildCount(childCount + 1)}
                  >
                    <Icon name="plus" size={20} color="#2873e6" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Infants */}
              <View style={styles.passengerRow}>
                <View style={styles.passengerInfo}>
                  <Text style={styles.passengerTitle}>Em bé</Text>
                  <Text style={styles.passengerSubtitle}>Từ đúng 14 ngày đến dưới 2 tuổi</Text>
                </View>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={[styles.counterButton, infantCount === 0 && styles.counterButtonDisabled]}
                    onPress={() => setInfantCount(Math.max(0, infantCount - 1))}
                    disabled={infantCount === 0}
                  >
                    <Icon name="minus" size={20} color={infantCount === 0 ? '#9CA3AF' : '#2873e6'} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{infantCount}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setInfantCount(infantCount + 1)}
                  >
                    <Icon name="plus" size={20} color="#2873e6" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Confirm Button */}
            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirmPassengers}>
              <Text style={styles.modalConfirmButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Search Button */}
      <TouchableOpacity 
        style={[styles.searchButton, loading && styles.searchButtonDisabled]} 
        onPress={handleSearch}
        disabled={loading}
      >
        <Icon name="magnify" size={20} color="#fff" />
        <Text style={styles.searchButtonText}>{loading ? 'Đang tìm...' : 'Tìm kiếm'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSmall: {
    flex: 1,
  },
  tabLarge: {
    flex: 1.8,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2873e6',
  },
  tabInactive: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#2873e6',
  },
  tabTextInactive: {
    color: '#000000',
  },
  grid: {
    marginBottom: 24,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  subValue: {
    fontSize: 12,
    color: '#4B5563',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  routeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  routeIconContainer: {
    backgroundColor: 'transparent',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    marginTop: 0,
  },
  routeTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  routeLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  routeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  routeSubValue: {
    fontSize: 10,
    color: '#4B5563',
  },
  arrowContainer: {
    marginHorizontal: 4,
    paddingTop: 8,
    alignSelf: 'flex-start',
  },
  flightSection: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  flightNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  addFlightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#2873e6',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 20,
  },
  addFlightText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2873e6',
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#2873e6',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2873e6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalCloseButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2873e6',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  // Seat Class Modal styles
  seatClassOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  seatClassOptionSelected: {
    backgroundColor: '#F3F4F6',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2873e6',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2873e6',
  },
  seatClassInfo: {
    flex: 1,
  },
  seatClassTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  seatClassDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // Passenger Modal styles
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  passengerInfo: {
    flex: 1,
    marginRight: 16,
  },
  passengerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  passengerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    minWidth: 30,
    textAlign: 'center',
  },
  modalConfirmButton: {
    backgroundColor: '#2873e6',
    marginHorizontal: 24,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  airportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  airportIconContainer: {
    marginRight: 16,
  },
  airportInfo: {
    flex: 1,
  },
  airportCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  airportName: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  airportLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateOption: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateValue: {
    fontSize: 16,
    color: '#111827',
  },
});
