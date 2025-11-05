import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function PaymentSuccessScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const goHome = () => {
    const parent = navigation.getParent?.();
    if (parent) {
      // chuyển về tab Search và màn SearchMain trong stack
      parent.navigate('Search', { screen: 'SearchMain' });
      return;
    }
    // fallback
    navigation.navigate('Search' as never);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(16, insets.bottom) }]}> 
      <View style={styles.content}> 
        <View style={styles.iconCircle}>
          <Icon name="check-circle" size={96} color="#22C55E" />
        </View>
        <Text style={styles.title}>Thanh toán thành công!</Text>
        <Text style={styles.subtitle}>Cảm ơn bạn đã đặt vé. Thông tin vé đã được lưu trong mục "Vé của tôi".</Text>

        <TouchableOpacity style={styles.confirmBtn} onPress={goHome}>
          <Text style={styles.confirmText}>Xác nhận</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 24 },
  iconCircle: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5', marginBottom: 16 },
  title: { color: '#111827', fontWeight: '700', fontSize: 20 },
  subtitle: { color: '#6B7280', textAlign: 'center', marginTop: 8 },
  confirmBtn: { marginTop: 24, backgroundColor: '#2873e6', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});


