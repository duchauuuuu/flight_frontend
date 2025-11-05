import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Airport } from '../types/airport';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

export default function AirportsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  const { type, mode, flightIndex } = route.params || { type: 'departure' };
  
  const [query, setQuery] = useState('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);

  // Load airports từ BE thật (sau khi đã seed)
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setLoading(true);
        if (!API_BASE_URL) {
          console.error('API_BASE_URL chưa được cấu hình');
          setAirports([]);
          setFilteredAirports([]);
          return;
        }

        // Gọi endpoint thật từ DB (sau khi đã seed)
        const { data } = await axios.get(`${API_BASE_URL}/airports`);
        
        if (Array.isArray(data) && data.length > 0) {
          setAirports(data);
          setFilteredAirports(data);
        } else {
          console.warn('Không có dữ liệu airports. Bạn đã gọi POST /seed để tạo dữ liệu chưa?');
          setAirports([]);
          setFilteredAirports([]);
        }
      } catch (error: any) {
        console.error('Error fetching airports:', error);
        console.error('Chi tiết lỗi:', {
          message: error?.message,
          status: error?.response?.status,
          url: error?.config?.url,
        });
        
        // Nếu lỗi, thử fallback về mock endpoint
        try {
          const { data } = await axios.get(`${API_BASE_URL}/airports/mock`);
          setAirports(Array.isArray(data) ? data : []);
          setFilteredAirports(Array.isArray(data) ? data : []);
        } catch (fallbackError) {
          console.error('Fallback cũng lỗi:', fallbackError);
          setAirports([]);
          setFilteredAirports([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAirports();
  }, []);

  const handleAirportSelect = (airport: Airport) => {
    if (mode === 'multicity' && typeof flightIndex === 'number') {
      navigation.navigate('Search' as never, {
        screen: 'SearchMain',
        params: {
          mode: 'multicity',
          flightIndex: flightIndex,
          airportType: type,
          airport: airport,
        },
        merge: true as any,
      } as never);
    } else {
      navigation.navigate('Search' as never, {
        screen: 'SearchMain',
        params: {
          airportType: type,
          airport: airport,
        },
        merge: true as any,
      } as never);
    }
  };

  const handleSearchChange = (text: string) => {
    setQuery(text);
    const lower = text.trim().toLowerCase();
    if (!lower) {
      setFilteredAirports(airports);
      return;
    }
    setFilteredAirports(
      airports.filter(a =>
        a.code.toLowerCase().includes(lower) ||
        a.city.toLowerCase().includes(lower) ||
        a.name.toLowerCase().includes(lower)
      ),
    );
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder={type === 'departure' ? 'Chọn điểm khởi hành' : 'Chọn điểm đến'}
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={handleSearchChange}
          multiline={false}
          scrollEnabled={false}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
          autoFocus
          returnKeyType="search"
        />
        <View style={{ width: 24 }} />
      </View>

      {/* Recent Section */}
      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>
          {type === 'departure' ? 'Điểm khởi hành gần đây' : 'Điểm đến gần đây'}
        </Text>
        <Icon name="chevron-down" size={20} color="#2873e6" />
      </View>

      {/* Airport List */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2873e6" />
            <Text style={styles.loadingText}>Đang tải danh sách sân bay...</Text>
          </View>
        ) : (
          filteredAirports.map((airport, index) => (
            <TouchableOpacity
              key={index}
              style={styles.airportItem}
              onPress={() => handleAirportSelect(airport)}
            >
              <View style={styles.airportCodeContainer}>
                <Text style={styles.airportCode}>{airport.code}</Text>
              </View>
              <View style={styles.airportInfo}>
                <Text style={styles.airportCity}>{airport.city}</Text>
                <Text style={styles.airportName}>{airport.name}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2873e6',
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
    marginHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
    // Android text rendering tweaks
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  recentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2873e6',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  airportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  airportCodeContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#2873e6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  airportCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  airportInfo: {
    flex: 1,
  },
  airportCity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  airportName: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});

