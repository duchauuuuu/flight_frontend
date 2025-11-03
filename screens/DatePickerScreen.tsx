import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configure Vietnamese locale
LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  monthNamesShort: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
  dayNames: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

export default function DatePickerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  const { type, mode, flightIndex } = route.params || { type: 'departure' };
  
  const [selectedDate, setSelectedDate] = useState('2025-11-05');
  
  const handleDateConfirm = () => {
    if (mode === 'multicity' && typeof flightIndex === 'number') {
      navigation.navigate('Search', {
        mode: 'multicity',
        flightIndex: flightIndex,
        selectedDate: selectedDate,
        dateType: type,
      });
    } else {
      navigation.navigate('Search', {
        selectedDate: selectedDate,
        dateType: type,
      });
    }
  };
  
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
    const dayOfWeek = dayNames[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${dayOfWeek} - ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  };
  
  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: '#2873e6',
      selectedTextColor: '#fff',
    },
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#2873e6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn ngày bay</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Current Date Display */}
      <View style={styles.currentDateSection}>
        <Text style={styles.currentDateLabel}>{type === 'departure' ? 'Ngày đi' : 'Ngày về'}</Text>
        <Text style={styles.currentDate}>{formatDisplayDate(selectedDate)}</Text>
      </View>

      {/* Calendar */}
      <ScrollView style={styles.calendarContainer}>
        <Calendar
          current={selectedDate}
          minDate={new Date().toISOString().split('T')[0]}
          markedDates={markedDates}
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
          }}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#6B7280',
            selectedDayBackgroundColor: '#2873e6',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2873e6',
            dayTextColor: '#1F2937',
            textDisabledColor: '#D1D5DB',
            dotColor: '#2873e6',
            selectedDotColor: '#ffffff',
            arrowColor: '#2873e6',
            monthTextColor: '#1F2937',
            indicatorColor: '#2873e6',
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
          style={styles.calendar}
        />
      </ScrollView>

      {/* Confirm Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom) }]}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleDateConfirm}>
          <Text style={styles.confirmButtonText}>Xác nhận</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  currentDateSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  currentDateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  currentDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calendar: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#2873e6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

