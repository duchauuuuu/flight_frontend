import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function RecentSearches() {
  const recentSearches = [
    {
      id: 1,
      from: 'Ho Chi Minh (SGN)',
      to: 'Hue (HUI)',
      date: 'Thứ 4, 29 thg 10 - Thứ 6, 31 thg 10',
      passengers: 'Khứ hồi, 1 k',
    },
    {
      id: 2,
      from: 'Ho Chi Minh (HUI)',
      to: 'Da Nang (DAN)',
      date: 'Thứ 2, 27 thg 10',
      passengers: 'Khứ hồi, 1 k',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tìm kiếm gần đây</Text>
        <TouchableOpacity>
          <Text style={styles.clearButton}>Xóa tất cả</Text>
        </TouchableOpacity>
      </View>

      {/* Search Items */}
      <View style={styles.grid}>
        {recentSearches.map((search) => (
          <TouchableOpacity key={search.id} style={styles.searchCard}>
            <View style={styles.searchHeader}>
              <View style={styles.searchInfo}>
                <Text style={styles.searchLabel}>Từ - Đến</Text>
                <Text style={styles.searchRoute}>
                  {search.from} ⇌ {search.to}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9CA3AF" />
            </View>
            <Text style={styles.searchDate}>{search.date}</Text>
            <Text style={styles.searchPassengers}>{search.passengers}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  clearButton: {
    color: '#EAB308',
    fontWeight: '600',
    fontSize: 14,
  },
  grid: {
    gap: 12,
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  searchInfo: {
    flex: 1,
  },
  searchLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  searchRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  searchDate: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
  },
  searchPassengers: {
    fontSize: 12,
    color: '#6B7280',
  },
});
