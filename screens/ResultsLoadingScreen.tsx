import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResultsLoadingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { from, to, date, passengers, seatClass } = route.params || {};

  const progressValue = useRef(new Animated.Value(0)).current;
  const [percentText, setPercentText] = useState('0%');

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(progressValue, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(progressValue, { toValue: 0, duration: 0, useNativeDriver: false }),
      ]).start(() => animate());
    };
    animate();
  }, []);

  useEffect(() => {
    const listenerId = progressValue.addListener(({ value }) => {
      const percent = Math.round(value * 100);
      setPercentText(`${percent}%`);
    });
    return () => {
      progressValue.removeListener(listenerId);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Results', { from, to, date, passengers, seatClass });
    }, 1500);
    return () => clearTimeout(timer);
  }, [from, to, date, passengers, seatClass]);

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
            {percentText}
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


