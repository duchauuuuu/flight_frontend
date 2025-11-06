import React, { useState, useEffect } from 'react';
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
  
  const { type, mode, flightIndex, currentDate, onDateSelected } = route.params || { type: 'departure' };
  
  // Parse current date to ISO format if provided
  const parseCurrentDate = (dateStr?: string): string => {
    if (!dateStr) {
      const today = new Date().toISOString().split('T')[0];
      return today;
    }
    try {
      // If already ISO format
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const isoDate = dateStr.slice(0, 10);
        return isoDate;
      }
      // If display format like "6 Thg 11, 2025" or "29 Thg 10, 2025"
      const cleaned = String(dateStr).replace(',', '').trim();
      const parts = cleaned.split(' ').filter(Boolean);
      if (parts.length >= 4) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[2], 10);
        const year = parseInt(parts[3], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const mm = String(month).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          const isoDate = `${year}-${mm}-${dd}`;
          return isoDate;
        }
      }
    } catch (error) {
      // Error parsing date
    }
    const today = new Date().toISOString().split('T')[0];
    return today;
  };
  
  // Get today's date first (before parsing currentDate) - use local time
  const getTodayISO = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const todayISO = getTodayISO();
  
  const initialDate = parseCurrentDate(currentDate);
  // Ensure initialDate is not in the past
  const validInitialDate = initialDate >= todayISO ? initialDate : todayISO;
  const [selectedDate, setSelectedDate] = useState(validInitialDate);
  
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('vi-VN', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };
  
  const handleDateConfirm = () => {
    // Ensure we're confirming a valid date (today or future)
    // Use validSelectedDate to ensure it's not in the past
    // Note: todayISOForMinDate is defined in the render scope, so we need to recalculate it here
    const todayForConfirm = new Date();
    const yearConfirm = todayForConfirm.getFullYear();
    const monthConfirm = String(todayForConfirm.getMonth() + 1).padStart(2, '0');
    const dayConfirm = String(todayForConfirm.getDate()).padStart(2, '0');
    const todayISOConfirm = `${yearConfirm}-${monthConfirm}-${dayConfirm}`;
    
    const dateToConfirm = validSelectedDate >= todayISOConfirm ? validSelectedDate : todayISOConfirm;
    const displayDate = formatDisplayDate(dateToConfirm);
    
    if (onDateSelected && typeof onDateSelected === 'function') {
      // Call callback if provided (from ResultsScreen)
      onDateSelected(displayDate);
      navigation.goBack();
    } else if (mode === 'multicity' && typeof flightIndex === 'number') {
      // Navigate to SearchMain screen with params
      navigation.navigate('Search' as never, {
        screen: 'SearchMain',
        params: {
          mode: 'multicity',
          flightIndex: flightIndex,
          selectedDate: displayDate,
          dateType: type,
        },
        merge: true as any,
      } as never);
    } else {
      // Navigate to SearchMain screen with params
      navigation.navigate('Search' as never, {
        screen: 'SearchMain',
        params: {
          selectedDate: displayDate,
          dateType: type,
        },
        merge: true as any,
      } as never);
    }
  };
  
  // Recalculate todayISO in render (to ensure it's always current)
  // But we'll use the same value calculated above to avoid recalculation
  const todayISOForMinDate = todayISO; // Use the same value
  
  // Ensure selectedDate is not in the past - if it is, use today
  // Use useEffect to update selectedDate if it's in the past
  useEffect(() => {
    const currentTodayISO = getTodayISO();
    if (selectedDate < currentTodayISO) {
      setSelectedDate(currentTodayISO);
    }
  }, [selectedDate]);
  
  // Use valid selected date (today or in the future)
  const validSelectedDate = selectedDate >= todayISOForMinDate ? selectedDate : todayISOForMinDate;
  
  // Mark selected date (only if it's today or in the future and actually selected)
  const markedDates: any = {};
  
  // Only mark the date that user explicitly selected (from today onwards)
  // Don't mark based on 'current' prop - that's just for navigation
  // IMPORTANT: Only mark if selectedDate is actually >= todayISOForMinDate
  // Do NOT mark today automatically - only mark if user selected it
  if (selectedDate >= todayISOForMinDate) {
    // Only mark this specific date that user selected
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: '#2873e6',
      selectedTextColor: '#fff',
    };
  }
  
  // Ensure no past dates are marked
  // Past dates should be disabled by minDate automatically
  
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
        <Text style={styles.currentDate}>{formatDisplayDate(validSelectedDate)}</Text>
      </View>

      {/* Calendar */}
      <ScrollView style={styles.calendarContainer}>
        <Calendar
          current={todayISOForMinDate}
          minDate={todayISOForMinDate}
          maxDate="2030-12-31"
          markedDates={markedDates}
          hideExtraDays={true}
          firstDay={1}
          onDayPress={(day) => {
            // Recalculate today to ensure we're using current date
            const currentTodayISO = getTodayISO();
            
            // Only allow selecting dates from today onwards
            // Strictly enforce this - reject any past dates
            if (day.dateString >= currentTodayISO) {
              setSelectedDate(day.dateString);
            }
          }}
          onDayLongPress={(day) => {
            // Prevent long press on past dates
            const currentTodayISO = getTodayISO();
            if (day.dateString < currentTodayISO) {
              return;
            }
          }}
          disabledDaysIndexes={[]}
          disableAllTouchEventsForDisabledDays={true}
          enableSwipeMonths={true}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#6B7280',
            selectedDayBackgroundColor: '#2873e6',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#1F2937',
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

