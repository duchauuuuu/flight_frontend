import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface FlightBookingCardProps {
  tripType: 'round' | 'oneway';
}

export default function FlightBookingCard({ tripType }: FlightBookingCardProps) {
  const [departure, setDeparture] = useState('SGN');
  const [arrival, setArrival] = useState('HUI');
  const [passengers, setPassengers] = useState(1);
  const [departDate, setDepartDate] = useState('29 Thg 10, 2025');
  const [returnDate, setReturnDate] = useState('31 Thg 10, 2025');
  const [seatClass, setSeatClass] = useState('Phổ thông');

  return (
    <View style={styles.card}>
      {/* Trip Details Grid */}
      <View style={styles.grid}>
        {/* Departure and Arrival - Same Row */}
        <View style={styles.routeRow}>
          {/* Departure */}
          <View style={styles.routeItem}>
            <View style={styles.routeIconContainer}>
              <Icon name="airplane-takeoff" size={16} color="#EAB308" />
            </View>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>Điểm đi</Text>
              <Text style={styles.routeValue}>{departure}</Text>
              <Text style={styles.routeSubValue}>Tp. Hồ Chí Minh, ...</Text>
            </View>
          </View>

          {/* Arrow Icon */}
          <View style={styles.arrowContainer}>
            <Icon name="swap-horizontal" size={24} color="#EAB308" />
          </View>

          {/* Arrival */}
          <View style={styles.routeItem}>
            <View style={styles.routeIconContainer}>
              <Icon name="airplane-landing" size={16} color="#EAB308" />
            </View>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>Điểm đến</Text>
              <Text style={styles.routeValue}>{arrival}</Text>
              <Text style={styles.routeSubValue}>Huế, Việt Nam</Text>
            </View>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.gridItem}>
          <View style={styles.iconContainer}>
            <Icon name="calendar" size={24} color="#EAB308" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Ngày đi - Ngày về</Text>
            <Text style={styles.value}>
              {departDate}{tripType === 'round' ? ` - ${returnDate}` : ''}
            </Text>
          </View>
        </View>

        {/* Passengers */}
        <View style={styles.gridItem}>
          <View style={styles.iconContainer}>
            <Icon name="account-group" size={24} color="#EAB308" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Hành khách</Text>
            <Text style={styles.value}>{passengers} Người lớn</Text>
          </View>
        </View>

        {/* Seat Class */}
        <View style={styles.gridItem}>
          <View style={styles.iconContainer}>
            <Icon name="seat-passenger" size={24} color="#EAB308" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Hạng ghế</Text>
            <Text style={styles.value}>{seatClass}</Text>
          </View>
        </View>
      </View>

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
  grid: {
    marginBottom: 24,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    backgroundColor: '#FEF3C7',
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
    paddingHorizontal: 8,
  },
  routeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIconContainer: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  routeTextContainer: {
    flex: 1,
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
    marginHorizontal: 8,
    paddingTop: 16,
  },
  searchButton: {
    backgroundColor: '#EAB308',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EAB308',
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
