import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FlightBookingCard from '../components/FlightBookingCard';
import RecentSearches from '../components/RecentSearches';

export default function SearchScreen() {
  const [userName] = useState('User');
  const [tripType, setTripType] = useState<'round' | 'oneway'>('round');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section with Gradient */}
      <LinearGradient
        colors={['#FDE68A', '#FEF3C7', '#FEFCE8']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Chào {userName}!</Text>
          <Text style={styles.headerSubtitle}>Chúc bạn có một chuyến bay vui vẻ</Text>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Trip Type Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setTripType('round')}
            style={[
              styles.tab,
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
        </View>

        {/* Booking Card */}
        <FlightBookingCard tripType={tripType} />

        {/* Recent Searches */}
        <RecentSearches />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf4dd',
  },
  headerGradient: {
    paddingTop: 32,
    paddingBottom: 96,
    paddingHorizontal: 24,
  },
  headerContent: {
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#374151',
  },
  mainContent: {
    marginTop: -72,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  tabActive: {
    backgroundColor: '#fff',
    borderColor: '#EAB308',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabInactive: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#EAB308',
  },
  tabTextInactive: {
    color: '#6B7280',
  },
});
