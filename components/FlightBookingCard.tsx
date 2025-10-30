import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface Flight {
  id: string;
  departure: string;
  arrival: string;
  departureCity: string;
  arrivalCity: string;
  date: string;
}

export default function FlightBookingCard() {
  const [tripType, setTripType] = useState<'round' | 'oneway' | 'multicity'>('round');
  const [departure, setDeparture] = useState('SGN');
  const [arrival, setArrival] = useState('HUI');
  const [passengers, setPassengers] = useState(1);
  const [departDate, setDepartDate] = useState('29 Thg 10, 2025');
  const [returnDate, setReturnDate] = useState('31 Thg 10, 2025');
  const [seatClass, setSeatClass] = useState('Phổ thông');
  
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
                <View style={styles.routeItem}>
                  <View style={styles.routeIconContainer}>
                    <Icon name="airplane-takeoff" size={16} color="#2873e6" />
                  </View>
                  <View style={styles.routeTextContainer}>
                    <Text style={styles.routeLabel}>Điểm đi</Text>
                    <Text style={styles.routeValue}>{flight.departure}</Text>
                    <Text style={styles.routeSubValue}>{flight.departureCity}</Text>
                  </View>
                </View>

                <View style={styles.arrowContainer}>
                  <Icon name="swap-horizontal" size={24} color="#2873e6" />
                </View>

                <View style={styles.routeItem}>
                  <View style={styles.routeIconContainer}>
                    <Icon name="airplane-landing" size={16} color="#2873e6" />
                  </View>
                  <View style={styles.routeTextContainer}>
                    <Text style={styles.routeLabel}>Điểm đến</Text>
                    <Text style={styles.routeValue}>{flight.arrival}</Text>
                    <Text style={styles.routeSubValue}>{flight.arrivalCity}</Text>
                  </View>
                </View>
              </View>

              {/* Date */}
              <View style={styles.gridItem}>
                <View style={styles.iconContainer}>
                  <Icon name="calendar" size={24} color="#2873e6" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Ngày đi</Text>
                  <Text style={styles.value}>{flight.date}</Text>
                </View>
              </View>
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
            <View style={styles.gridItem}>
              <View style={styles.iconContainer}>
                <Icon name="account-group" size={24} color="#2873e6" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Hành khách</Text>
                <Text style={styles.value}>{passengers} Người lớn</Text>
              </View>
            </View>

            <View style={styles.gridItem}>
              <View style={styles.iconContainer}>
                <Icon name="seat-passenger" size={24} color="#2873e6" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Hạng ghế</Text>
                <Text style={styles.value}>{seatClass}</Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        // Single/Round trip view
        <View style={styles.grid}>
          {/* Departure and Arrival - Same Row */}
          <View style={styles.routeRow}>
            {/* Departure */}
            <View style={styles.routeItem}>
              <View style={styles.routeIconContainer}>
                <Icon name="airplane-takeoff" size={16} color="#2873e6" />
              </View>
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Điểm đi</Text>
                <Text style={styles.routeValue}>{departure}</Text>
                <Text style={styles.routeSubValue}>Tp. Hồ Chí Minh, ...</Text>
              </View>
            </View>

            {/* Arrow Icon */}
            <View style={styles.arrowContainer}>
              <Icon name="swap-horizontal" size={24} color="#2873e6" />
            </View>

            {/* Arrival */}
            <View style={styles.routeItem}>
              <View style={styles.routeIconContainer}>
                <Icon name="airplane-landing" size={16} color="#2873e6" />
              </View>
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Điểm đến</Text>
                <Text style={styles.routeValue}>{arrival}</Text>
                <Text style={styles.routeSubValue}>Huế, Việt Nam</Text>
              </View>
            </View>
          </View>

          {/* Dates */}
          {tripType === 'round' ? (
            <>
              <View style={styles.gridItem}>
                <View style={styles.iconContainer}>
                  <Icon name="calendar" size={24} color="#2873e6" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Ngày đi</Text>
                  <Text style={styles.value}>{departDate}</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <View style={styles.iconContainer}>
                  <Icon name="calendar" size={24} color="#2873e6" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Ngày về</Text>
                  <Text style={styles.value}>{returnDate}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.gridItem}>
              <View style={styles.iconContainer}>
                <Icon name="calendar" size={24} color="#2873e6" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Ngày đi</Text>
                <Text style={styles.value}>{departDate}</Text>
              </View>
            </View>
          )}

          {/* Passengers */}
          <View style={styles.gridItem}>
            <View style={styles.iconContainer}>
              <Icon name="account-group" size={24} color="#2873e6" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>Hành khách</Text>
              <Text style={styles.value}>{passengers} Người lớn</Text>
            </View>
          </View>

          {/* Seat Class */}
          <View style={styles.gridItem}>
            <View style={styles.iconContainer}>
              <Icon name="seat-passenger" size={24} color="#2873e6" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>Hạng ghế</Text>
              <Text style={styles.value}>{seatClass}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Search Button */}
      <TouchableOpacity style={styles.searchButton}>
        <Icon name="magnify" size={20} color="#fff" />
        <Text style={styles.searchButtonText}>Tìm kiếm</Text>
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
});
