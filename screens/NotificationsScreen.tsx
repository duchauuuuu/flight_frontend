import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';

export default function NotificationsScreen() {
  const { isAuthenticated } = useAuthStore();
  const navigation = useNavigation<any>();

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Icon name="account-circle" size={72} color="#9CA3AF" />
          <Text style={styles.cardTitle}>Bạn chưa đăng nhập</Text>
          <Text style={styles.cardSubtitle}>
            Đăng nhập để xem thông báo về chuyến đi, điểm thưởng hoặc khuyến mãi.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Account', { screen: 'Login' })}
          >
            <Text style={styles.loginText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông báo</Text>
      <Text style={styles.subtitle}>Các thông báo về chuyến bay của bạn</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  card: {
    width: '84%',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginBtn: {
    marginTop: 16,
    backgroundColor: '#0f3c89',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loginText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
