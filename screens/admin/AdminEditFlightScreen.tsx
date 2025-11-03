import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function AdminEditFlightScreen({ navigation, route }: any) {
  const { tokens } = useAuthStore();
  const { flightId } = route.params || {};

  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [price, setPrice] = useState('0');
  const [stops, setStops] = useState('0');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

  // Format ngày theo định dạng DD/MM/YYYY
  const formatDateInput = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 8);
    let formatted = '';
    if (limitedNumbers.length > 0) {
      formatted = limitedNumbers.slice(0, 2);
      if (limitedNumbers.length > 2) {
        formatted += '/' + limitedNumbers.slice(2, 4);
      }
      if (limitedNumbers.length > 4) {
        formatted += '/' + limitedNumbers.slice(4, 8);
      }
    }
    return formatted;
  };

  // Format giờ theo định dạng HH:mm
  const formatTimeInput = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 4);
    let formatted = '';
    if (limitedNumbers.length > 0) {
      formatted = limitedNumbers.slice(0, 2);
      if (limitedNumbers.length > 2) {
        formatted += ':' + limitedNumbers.slice(2, 4);
      }
    }
    return formatted;
  };

  // Chuyển đổi DD/MM/YYYY HH:mm sang Date object
  const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
    if (!dateStr || !timeStr) return null;
    
    try {
      const [day, month, year] = dateStr.split('/').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
        return null;
      }
      
      return new Date(year, month - 1, day, hours, minutes);
    } catch (error) {
      return null;
    }
  };

  const loadFlight = useCallback(async () => {
    if (!flightId || !tokens?.access_token || !API_BASE_URL) return;

    try {
      setLoading(true);
      
      // Kiểm tra cache trước
      const { getCachedFlight, cacheFlights } = await import('../../utils/cacheService');
      const cachedFlight = await getCachedFlight(flightId);
      
      if (cachedFlight) {
        // Populate form từ cache
        setFlightNumber(cachedFlight.flightNumber || '');
        setAirline(cachedFlight.airline || '');
        setFrom(cachedFlight.from || '');
        setTo(cachedFlight.to || '');
        
        if (cachedFlight.departure) {
          const depDate = new Date(cachedFlight.departure);
          const day = String(depDate.getDate()).padStart(2, '0');
          const month = String(depDate.getMonth() + 1).padStart(2, '0');
          const year = depDate.getFullYear();
          const hours = String(depDate.getHours()).padStart(2, '0');
          const minutes = String(depDate.getMinutes()).padStart(2, '0');
          setDepartureDate(`${day}/${month}/${year}`);
          setDepartureTime(`${hours}:${minutes}`);
        }
        
        if (cachedFlight.arrival) {
          const arrDate = new Date(cachedFlight.arrival);
          const day = String(arrDate.getDate()).padStart(2, '0');
          const month = String(arrDate.getMonth() + 1).padStart(2, '0');
          const year = arrDate.getFullYear();
          const hours = String(arrDate.getHours()).padStart(2, '0');
          const minutes = String(arrDate.getMinutes()).padStart(2, '0');
          setArrivalDate(`${day}/${month}/${year}`);
          setArrivalTime(`${hours}:${minutes}`);
        }
        
        setPrice(String(cachedFlight.price || ''));
        setStops(String(cachedFlight.stops || 0));
        setLoading(false);
      }
      
      // Gọi API để lấy dữ liệu mới nhất
      const { data } = await axios.get(`${API_BASE_URL}/flights/${flightId}`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      setFlightNumber(data.flightNumber || '');
      setAirline(data.airline || '');
      setFrom(data.from || '');
      setTo(data.to || '');
      
      // Format departure
      if (data.departure) {
        const depDate = new Date(data.departure);
        const day = String(depDate.getDate()).padStart(2, '0');
        const month = String(depDate.getMonth() + 1).padStart(2, '0');
        const year = depDate.getFullYear();
        const hours = String(depDate.getHours()).padStart(2, '0');
        const minutes = String(depDate.getMinutes()).padStart(2, '0');
        setDepartureDate(`${day}/${month}/${year}`);
        setDepartureTime(`${hours}:${minutes}`);
      }
      
      // Format arrival
      if (data.arrival) {
        const arrDate = new Date(data.arrival);
        const day = String(arrDate.getDate()).padStart(2, '0');
        const month = String(arrDate.getMonth() + 1).padStart(2, '0');
        const year = arrDate.getFullYear();
        const hours = String(arrDate.getHours()).padStart(2, '0');
        const minutes = String(arrDate.getMinutes()).padStart(2, '0');
        setArrivalDate(`${day}/${month}/${year}`);
        setArrivalTime(`${hours}:${minutes}`);
      }
      
      setPrice(String(data.price || 0));
      setStops(String(data.stops || 0));
      
      // Cache flight (đã import cacheFlights ở trên)
      await cacheFlights([{
        _id: data._id,
        flightNumber: data.flightNumber,
        from: data.from,
        to: data.to,
        departure: data.departure,
        arrival: data.arrival,
        price: data.price,
        stops: data.stops || 0,
        airline: data.airline,
        availableCabins: data.availableCabins || [],
        seatsAvailable: data.seatsAvailable || {},
      }]);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải thông tin chuyến bay');
    } finally {
      setLoading(false);
    }
  }, [flightId, tokens?.access_token, API_BASE_URL]);

  useFocusEffect(
    useCallback(() => {
      if (flightId) {
        loadFlight();
      }
    }, [loadFlight, flightId])
  );

  const handleSave = async () => {
    // Validate
    if (!flightNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số hiệu chuyến bay');
      return;
    }

    if (!airline.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập hãng bay');
      return;
    }

    if (!from.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập điểm đi');
      return;
    }

    if (!to.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập điểm đến');
      return;
    }

    if (!departureDate.trim() || !departureTime.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ ngày và giờ khởi hành');
      return;
    }

    if (!arrivalDate.trim() || !arrivalTime.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ ngày và giờ đến');
      return;
    }

    const departureDateTime = parseDateTime(departureDate, departureTime);
    const arrivalDateTime = parseDateTime(arrivalDate, arrivalTime);

    if (!departureDateTime || !arrivalDateTime) {
      Alert.alert('Lỗi', 'Định dạng ngày hoặc giờ không hợp lệ');
      return;
    }

    if (arrivalDateTime <= departureDateTime) {
      Alert.alert('Lỗi', 'Thời gian đến phải sau thời gian khởi hành');
      return;
    }

    const priceNum = parseInt(price, 10);
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Lỗi', 'Giá phải là số dương');
      return;
    }

    const stopsNum = parseInt(stops, 10);
    if (isNaN(stopsNum) || stopsNum < 0) {
      Alert.alert('Lỗi', 'Số điểm dừng phải là số dương');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        flightNumber: flightNumber.trim(),
        airline: airline.trim(),
        from: from.trim(),
        to: to.trim(),
        departure: departureDateTime,
        arrival: arrivalDateTime,
        price: priceNum,
        stops: stopsNum,
      };

      await axios.put(`${API_BASE_URL}/flights/${flightId}`, payload, {
        headers: { Authorization: `Bearer ${tokens?.access_token}` },
      });

      Alert.alert('Thành công', 'Đã cập nhật thông tin chuyến bay');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật chuyến bay');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          Sửa chuyến bay
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              Số hiệu chuyến bay
            </Text>
            <TextInput
              style={styles.input}
              placeholder="VD: VN001"
              value={flightNumber}
              onChangeText={setFlightNumber}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              Hãng bay
            </Text>
            <TextInput
              style={styles.input}
              placeholder="VD: VN, VJ, BL, QH"
              value={airline}
              onChangeText={setAirline}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              Điểm đi
            </Text>
            <TextInput
              style={styles.input}
              placeholder="VD: HAN, SGN"
              value={from}
              onChangeText={setFrom}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              Điểm đến
            </Text>
            <TextInput
              style={styles.input}
              placeholder="VD: SGN, HAN"
              value={to}
              onChangeText={setTo}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              Ngày khởi hành
            </Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY (ví dụ: 14/03/2025)"
              value={departureDate}
              onChangeText={(text) => setDepartureDate(formatDateInput(text))}
              keyboardType="numeric"
              maxLength={10}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              Giờ khởi hành
            </Text>
            <TextInput
              style={styles.input}
              placeholder="HH:mm (ví dụ: 14:30)"
              value={departureTime}
              onChangeText={(text) => setDepartureTime(formatTimeInput(text))}
              keyboardType="numeric"
              maxLength={5}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              Ngày đến
            </Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY (ví dụ: 14/03/2025)"
              value={arrivalDate}
              onChangeText={(text) => setArrivalDate(formatDateInput(text))}
              keyboardType="numeric"
              maxLength={10}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              Giờ đến
            </Text>
            <TextInput
              style={styles.input}
              placeholder="HH:mm (ví dụ: 16:45)"
              value={arrivalTime}
              onChangeText={(text) => setArrivalTime(formatTimeInput(text))}
              keyboardType="numeric"
              maxLength={5}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              Giá (VND)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              Số điểm dừng
            </Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={stops}
              onChangeText={setStops}
              keyboardType="numeric"
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText} numberOfLines={1} ellipsizeMode="tail">
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#2873e6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

