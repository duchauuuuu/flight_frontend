import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av'; // Uncomment for video background
import FlightBookingCard from '../components/FlightBookingCard';
import RecentSearches from '../components/RecentSearches';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Airport } from '../types/airport';

export default function SearchScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const videoRef = useRef<Video>(null);
  const [airportData, setAirportData] = useState<{ airportType?: string; airport?: Airport } | null>(null);

  // Get last name or default to "User"
  const lastName = user?.name?.split(' ').slice(-1)[0] || 'User';

  useEffect(() => {
    if (route.params?.airportType && route.params?.airport) {
      setAirportData({
        airportType: route.params.airportType,
        airport: route.params.airport,
      });
      // Clear params after handling to avoid duplicate updates
      // Note: FlightBookingCard also handles route.params directly, so this is a backup
      navigation.setParams({ airportType: undefined, airport: undefined });
    }
  }, [route.params, navigation]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section with background image */}
      {/* <ImageBackground
        source={require('../assets/bg2.png')}
        style={styles.headerImage}
        imageStyle={styles.headerImageStyle}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Chào {userName}!</Text>
          <Text style={styles.headerSubtitle}>Chúc bạn có một chuyến bay vui vẻ</Text>
        </View>
      </ImageBackground> */}

      {/* Uncomment below for VIDEO background (and comment out ImageBackground above) */}
      <View style={styles.headerVideo}>
        <Video
          ref={videoRef}
          source={require('../assets/bg5.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay
          isMuted
        />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Icon name="airplane" size={32} color="#FFFFFF" />
              <Text style={styles.logoText}>Flight</Text>
            </View>
            <TouchableOpacity 
              style={styles.userGreeting}
              onPress={() => {
                if (isAuthenticated) {
                  navigation.navigate('Account');
                } else {
                  navigation.navigate('Account', { screen: 'Login' });
                }
              }}
            >
              <Text style={[styles.greetingText, !isAuthenticated && styles.linkText]}>
                {isAuthenticated ? `Chào ${lastName}` : 'Đăng nhập'}
              </Text>
              <Icon name="chevron-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Booking Card */}
        <FlightBookingCard airportData={airportData} />

        {/* Recent Searches */}
        <RecentSearches />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  // Styles for IMAGE background (currently active)
  headerImage: {
    height: 400,
    paddingTop: 50,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },
  headerImageStyle: {
    resizeMode: 'cover',
  },
  headerContent: {
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  userGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF', // Use '#111827' for image background
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF', // Use '#374151' for image background
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  // Styles for VIDEO background (currently active)
  headerVideo: {
    height: 400,
    position: 'relative',
    overflow: 'hidden',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  mainContent: {
    marginTop: -180,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
});
