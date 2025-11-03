import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Airport } from '../types/airport';

interface Flight {
  id: string;
  departure: string;
  arrival: string;
  departureCity: string;
  arrivalCity: string;
  date: string;
}

interface Props {
  airportData?: { airportType?: string; airport?: Airport } | null;
}

export default function FlightBookingCard({ airportData }: Props) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [tripType, setTripType] = useState<'round' | 'oneway' | 'multicity'>('round');
  const [departure, setDeparture] = useState('SGN');
  const [departureCity, setDepartureCity] = useState('Tp. Hồ Chí Minh, ...');
  const [arrival, setArrival] = useState('HUI');
  const [arrivalCity, setArrivalCity] = useState('Huế, Việt Nam');
  const [passengers, setPassengers] = useState(1);
  const [departDate, setDepartDate] = useState('29 Thg 10, 2025');
  const [returnDate, setReturnDate] = useState('31 Thg 10, 2025');
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
  
  // Fake airport data
  const airports: Airport[] = [
    { code: 'SGN', name: 'Tân Sơn Nhất', city: 'Tp. Hồ Chí Minh', country: 'Việt Nam' },
    { code: 'HAN', name: 'Nội Bài', city: 'Hà Nội', country: 'Việt Nam' },
    { code: 'DAD', name: 'Đà Nẵng', city: 'Đà Nẵng', country: 'Việt Nam' },
    { code: 'HUI', name: 'Phú Bài', city: 'Huế', country: 'Việt Nam' },
    { code: 'CXR', name: 'Cam Ranh', city: 'Nha Trang', country: 'Việt Nam' },
    { code: 'VCA', name: 'Cần Thơ', city: 'Cần Thơ', country: 'Việt Nam' },
    { code: 'HPH', name: 'Cát Bi', city: 'Hải Phòng', country: 'Việt Nam' },
    { code: 'DLI', name: 'Liên Khương', city: 'Đà Lạt', country: 'Việt Nam' },
  ];
  
  // Multi-city flights
  const [flights, setFlights] = useState<Flight[]>([
    {
      id: '1',
      departure: 'SGN',
      arrival: 'HAN',
      departureCity: 'Tp. Hồ Chí Minh, VN',
      arrivalCity: 'Hà Nội, VN',
      date: '29 Thg 10, 2025',
    },
    {
      id: '2',
      departure: 'HAN',
      arrival: 'DAD',
      departureCity: 'Hà Nội, VN',
      arrivalCity: 'Đà Nẵng, VN',
      date: '31 Thg 10, 2025',
    },
  ]);
  
  // Handle airport data from SearchScreen (single/round trip)
  useEffect(() => {
    if (airportData?.airportType && airportData?.airport) {
      const { airportType, airport } = airportData;
      if (airportType === 'departure') {
        setDeparture(airport.code);
        setDepartureCity(`${airport.city}, ${airport.country}`);
      } else if (airportType === 'arrival') {
        setArrival(airport.code);
        setArrivalCity(`${airport.city}, ${airport.country}`);
      }
    }
  }, [airportData]);

  // Handle params returning from Airports/DatePicker
  useEffect(() => {
    const params = route.params as any;
    if (!params) return;
    
    const { mode, flightIndex, airportType: typeFromAirport, airport, selectedDate, dateType } = params;
    
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
          // You may format date for display here if needed
          target.date = selectedDate;
        }
        updated[flightIndex] = target;
        return updated;
      });
      // Clear just-used params to avoid repeated updates
      navigation.setParams({ mode: undefined, flightIndex: undefined, airportType: undefined, airport: undefined, selectedDate: undefined, dateType: undefined });
    } 
    // Handle single/round trip mode - update directly from route params
    else if (airport && typeFromAirport && !mode) {
      if (typeFromAirport === 'departure') {
        setDeparture(airport.code);
        setDepartureCity(`${airport.city}, ${airport.country}`);
      } else if (typeFromAirport === 'arrival') {
        setArrival(airport.code);
        setArrivalCity(`${airport.city}, ${airport.country}`);
      }
      // Clear params after handling
      navigation.setParams({ airportType: undefined, airport: undefined });
    }
    
    // Handle date updates for single/round trip
    if (selectedDate && dateType && !mode) {
      if (dateType === 'departure') {
        // Format date for display
        const date = new Date(selectedDate);
        const day = date.getDate();
        const month = date.toLocaleString('vi-VN', { month: 'short' });
        const year = date.getFullYear();
        setDepartDate(`${day} ${month}, ${year}`);
      } else if (dateType === 'return') {
        const date = new Date(selectedDate);
        const day = date.getDate();
        const month = date.toLocaleString('vi-VN', { month: 'short' });
        const year = date.getFullYear();
        setReturnDate(`${day} ${month}, ${year}`);
      }
      // Clear params after handling
      navigation.setParams({ selectedDate: undefined, dateType: undefined });
    }
  }, [route.params, navigation]);
  

  const addFlight = () => {
    const newFlight: Flight = {
      id: Date.now().toString(),
      departure: 'SGN',
      arrival: 'HAN',
      departureCity: 'Tp. Hồ Chí Minh, VN',
      arrivalCity: 'Hà Nội, VN',
      date: '29 Thg 10, 2025',
    };
    setFlights([...flights, newFlight]);
  };

  const removeFlight = (id: string) => {
    if (flights.length > 2) {
      setFlights(flights.filter(f => f.id !== id));
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
    setDeparture(prev => {
      const oldDeparture = prev;
      setDepartureCity(prevCity => {
        const oldCity = prevCity;
        setArrivalCity(oldCity);
        return prevCity; // value not used after swap
      });
      setArrival(oldArrival => {
        const temp = oldArrival;
        setArrival(oldDeparture);
        return temp;
      });
      // After arrival updated above, now set departure to previous arrival
      return departure; // placeholder, will be corrected below
    });
    // Proper swap using locals to avoid stale state
    const newDeparture = arrival;
    const newArrival = departure;
    const newDepartureCity = arrivalCity;
    const newArrivalCity = departureCity;
    setDeparture(newDeparture);
    setArrival(newArrival);
    setDepartureCity(newDepartureCity);
    setArrivalCity(newArrivalCity);
  };

  const handleSwapMulti = (index: number) => {
    setFlights(prev => {
      const updated = [...prev];
      const f = { ...updated[index] };
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
      
      // Navigate to Loading screen first
      navigation.navigate('ResultsLoading', {
        from: departure,
        to: arrival,
        date: departDate,
        passengers: passengers,
        seatClass: seatClass,
      });
      
    } catch (error: any) {
      console.error('Search error:', error);
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
              <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DatePicker', { type: 'departure' })}>
                <View style={styles.iconContainer}>
                  <Icon name="calendar" size={24} color="#2873e6" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Ngày đi</Text>
                  <Text style={styles.value}>{departDate}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DatePicker', { type: 'return' })}>
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
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('DatePicker', { type: 'departure' })}>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  routeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIconContainer: {
    backgroundColor: 'transparent',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
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
    paddingTop: 16,
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
