import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { Flight } from '../types/flight';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

export default function ResultsLoadingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const params = route.params || {};
  const { from, to, date, passengers, seatClass, tripType, flights: flightsSegments } = params;

  const progressValue = useRef(new Animated.Value(0)).current;
  const [searchProgress, setSearchProgress] = useState(0);
  
  const isMulticity = tripType === 'multicity' && flightsSegments && Array.isArray(flightsSegments);

  // Convert display date to ISO format
  const toISODateFromDisplay = (display?: string | null): string => {
    if (!display || typeof display !== 'string') {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
    try {
      if (/^\d{4}-\d{2}-\d{2}/.test(display)) {
        return display.slice(0, 10);
      }
      const cleaned = String(display).replace(',', '');
      if (!cleaned || typeof cleaned !== 'string') {
        return new Date().toISOString().split('T')[0];
      }
      const parts = cleaned.split(' ').filter(Boolean);
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
    } catch (error) {
      // Error parsing date
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Animation for progress bar - sync with actual search progress
  useEffect(() => {
    // Animate progress bar to match searchProgress
    Animated.timing(progressValue, {
      toValue: searchProgress / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [searchProgress]);

  // Search flights from BE
  useEffect(() => {
    const searchFlights = async () => {
      try {
        setSearchProgress(0);
        
        if (!API_BASE_URL) throw new Error('API base URL not configured');

        // Xử lý multicity search
        if (isMulticity) {
          setSearchProgress(10);
          
          // Convert segments to API format
          const segments = flightsSegments.map((f: any) => ({
            from: f.departure,
            to: f.arrival,
            date: toISODateFromDisplay(f.date),
          }));
          
          setSearchProgress(30);
          
          // Call multicity search API
          const requestBody = {
            segments,
            cabinClass: seatClass,
            passengers: passengers,
          };
          
          const { data } = await axios.post(`${API_BASE_URL}/flights/search-multicity`, requestBody);
          
          setSearchProgress(80);
          
          // Map response to Flight[][]
          const allFlights: Flight[][] = (Array.isArray(data) ? data : []).map((segmentFlights: any[]) => {
            return (Array.isArray(segmentFlights) ? segmentFlights : []).map((f: any) => ({
              flightNumber: f.flightNumber,
              from: f.from,
              to: f.to,
              departure: f.departure,
              arrival: f.arrival,
              price: f.price,
              stops: f.stops ?? 0,
              airline: f.airline,
              availableCabins: f.availableCabins ?? ['Economy'],
              seatsAvailable: f.seatsAvailable ?? { Economy: 50 },
            }));
          });
          
          setSearchProgress(100);
          
          // Navigate to Results screen with multicity data
          // Note: Results screen chưa hỗ trợ multicity, cần flatten hoặc xử lý riêng
          const flattenedFlights = allFlights.flat();
          
          setTimeout(() => {
            navigation.replace('Results', { 
              from: flightsSegments[0]?.departure || '',
              to: flightsSegments[flightsSegments.length - 1]?.arrival || '',
              date: flightsSegments[0]?.date || '',
              passengers, 
              seatClass,
              flights: flattenedFlights,
              multicityResults: allFlights, // Pass original structure for future use
            });
          }, 300);
          
          return;
        }
        
        // Xử lý single/round trip search
        // Convert display date to ISO format for API
        const isoDate = toISODateFromDisplay(date);

        setSearchProgress(30);

        // Build query params
        const queryParams = new URLSearchParams();
        if (from) queryParams.append('from', from);
        if (to) queryParams.append('to', to);
        if (isoDate) {
          queryParams.append('date', isoDate);
        }
        if (seatClass) {
          queryParams.append('cabinClass', seatClass);
        }
        if (passengers) {
          queryParams.append('passengers', String(passengers));
        }
        
        setSearchProgress(50);

        // Kiểm tra cache trước
        const { getCachedSearchResults, cacheSearchResults, createSearchKey, cacheFlights } = await import('../utils/cacheService');
        const searchKey = createSearchKey({ from, to, date: isoDate, cabinClass: seatClass, passengers });
        const cachedResults = await getCachedSearchResults(searchKey);
        
        if (cachedResults && cachedResults.length > 0) {
          setSearchProgress(100);
          navigation.replace('Results', {
            flights: cachedResults,
            from,
            to,
            date,
            seatClass,
            passengers,
          });
          return;
        }

        // Call real search API (BE seed data) - backend will filter by cabinClass and passengers
        const { data } = await axios.get(`${API_BASE_URL}/flights/search?${queryParams.toString()}`);
        
        setSearchProgress(80);

        // BE đã trả đúng schema và đã filter; chỉ ép kiểu về FE type
        const mappedFlights: Flight[] = (Array.isArray(data) ? data : []).map((f: any) => ({
          _id: f._id,
          flightNumber: f.flightNumber,
          from: f.from,
          to: f.to,
          departure: f.departure,
          arrival: f.arrival,
          price: f.price,
          stops: f.stops ?? 0,
          airline: f.airline,
          availableCabins: f.availableCabins ?? ['Economy'],
          seatsAvailable: f.seatsAvailable ?? { Economy: 50 },
        }));
        
        // Backend đã filter theo cabinClass và passengers, không cần filter lại ở FE
        const filtered = mappedFlights;
        
        // Cache kết quả tìm kiếm và flights
        await cacheSearchResults(searchKey, filtered);
        await cacheFlights(filtered);

        setSearchProgress(100);

        // Navigate to Results screen with fetched data
        setTimeout(() => {
          navigation.replace('Results', { 
            from, 
            to, 
            date, 
            passengers, 
            seatClass,
            flights: filtered.length ? filtered : mappedFlights 
          });
        }, 300);
      } catch (error) {
        // Navigate to Results with empty array on error
        setTimeout(() => {
          navigation.replace('Results', { 
            from: isMulticity ? '' : from, 
            to: isMulticity ? '' : to, 
            date: isMulticity ? '' : date, 
            passengers, 
            seatClass,
            flights: [] 
          });
        }, 300);
      }
    };
    
    searchFlights();
  }, [from, to, date, passengers, seatClass, navigation, isMulticity, flightsSegments]);

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../assets/bg-loading-timKiem.jpg')} style={styles.backgroundImage} blurRadius={2}>
        <View style={styles.overlay}>
          <View style={[styles.header, { paddingTop: Math.max(20, insets.top + 8), paddingBottom: 12 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerRoute}>{from} → {to}</Text>
              <Text style={styles.headerDate}>{date}</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          <View style={[styles.mainContent, { paddingHorizontal: 24 }] }>
            <Text style={styles.searchingText}>Đang tìm kiếm chuyến bay</Text>
            <View style={styles.routeDisplay}>
              <Text style={styles.cityName}>{from || 'Hà Nội'}</Text>
              <Icon name="arrow-down" size={40} color="#fff" />
              <Text style={styles.cityName}>{to || 'TP Hồ Chí Minh'}</Text>
            </View>
            <Text style={styles.subtitle}>Chúng tôi làm việc với hơn 100 hãng hàng không trên khắp thế giới</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={[styles.footerContainer, { paddingBottom: Math.max(16, insets.bottom), paddingTop: 12 }] }>
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerText}>Đang tìm kiếm</Text>
            <Icon name="airplane" size={24} color="#fff" />
          </View>
          <Text style={styles.progressPercent}>
            {searchProgress}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, resizeMode: 'cover' },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)', justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerRoute: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerDate: { fontSize: 14, color: '#fff', opacity: 0.9 },
  mainContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchingText: { fontSize: 20, color: '#fff', fontWeight: '600', marginBottom: 60, textAlign: 'center' },
  routeDisplay: { alignItems: 'center', marginBottom: 32 },
  cityName: { fontSize: 36, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginVertical: 10 },
  subtitle: { fontSize: 16, color: '#fff', textAlign: 'center', opacity: 0.9, lineHeight: 24 },
  footerContainer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#2873e6', paddingHorizontal: 24 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  progressPercent: { fontSize: 16, fontWeight: '600', color: '#fff' },
});


