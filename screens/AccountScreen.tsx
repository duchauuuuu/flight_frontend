import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';

interface MenuItem {
  icon: keyof typeof Icon.glyphMap;
  title: string;
  badge?: string;
  onPress: () => void;
}

export default function AccountScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  const menuItems: MenuItem[] = [
    {
      icon: 'star-outline',
      title: 'Điểm thưởng của tôi',
      badge: `${user?.points || 0} điểm`,
      onPress: () => console.log('Điểm thưởng'),
    },
    {
      icon: 'tag-outline',
      title: 'Ưu đãi',
      onPress: () => console.log('Ưu đãi'),
    },
    {
      icon: 'gift-outline',
      title: 'Giới thiệu nhận quà',
      badge: 'Mới',
      onPress: () => console.log('Giới thiệu'),
    },
    {
      icon: 'credit-card-outline',
      title: 'Quản lý thẻ',
      onPress: () => console.log('Quản lý thẻ'),
    },
    {
      icon: 'text-box-outline',
      title: 'Đánh giá chuyến đi',
      onPress: () => console.log('Đánh giá'),
    },
    {
      icon: 'cog-outline',
      title: 'Cài đặt',
      onPress: () => console.log('Cài đặt'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Trung tâm Hỗ trợ',
      onPress: () => console.log('Hỗ trợ'),
    },
    {
      icon: 'email-outline',
      title: 'Góp ý',
      onPress: () => console.log('Góp ý'),
    },
    {
      icon: 'logout',
      title: 'Đăng xuất',
      onPress: async () => {
        await logout();
        // Không reset thủ công; AccountStack sẽ remount theo isAuthenticated và tự về Login
      },
    },
  ];

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={styles.wrapper}>
      {/* Custom Header with User Profile */}
      <View style={styles.customHeader}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user ? getInitials(user.name) : 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
            <Text style={styles.userBadge}>Thành viên {user?.membershipTier?.toLowerCase() || 'Đồng'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <View>
            <Text style={styles.editButtonText}>Chỉnh sửa</Text>
            <View style={styles.underline} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.slice(0, 3).map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuLeft}>
              <Icon name={item.icon} size={24} color="#2873e6" />
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <View style={styles.menuRight}>
              {item.badge && (
                <View style={[
                  styles.badge,
                  item.badge === 'Mới' && styles.badgeNew,
                  item.title === 'Điểm thưởng của tôi' && styles.badgePoints,
                ]}>
                  <Text style={[
                    styles.badgeText,
                    item.badge === 'Mới' && styles.badgeTextNew,
                  ]}>
                    {item.badge}
                  </Text>
                </View>
              )}
              <Icon name="chevron-right" size={20} color="#BDBDBD" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={require('../assets/gioithieu.png')}
          style={styles.banner}
          resizeMode="cover"
        />
      </View>

      {/* Remaining Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.slice(3).map((item, index) => (
          <TouchableOpacity
            key={index + 3}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuLeft}>
              <Icon name={item.icon} size={24} color="#2873e6" />
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <View style={styles.menuRight}>
              {item.badge && (
                <View style={[
                  styles.badge,
                  item.badge === 'Mới' && styles.badgeNew,
                  item.title === 'Điểm thưởng của tôi' && styles.badgePoints,
                ]}>
                  <Text style={[
                    styles.badgeText,
                    item.badge === 'Mới' && styles.badgeTextNew,
                  ]}>
                    {item.badge}
                  </Text>
                </View>
              )}
              <Icon name="chevron-right" size={20} color="#BDBDBD" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  customHeader: {
    backgroundColor: '#2873e6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#2873e6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userBadge: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  editButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  underline: {
    height: 1.5,
    backgroundColor: '#fff',
  },
  bannerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 0,
  },
  banner: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 0,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    color: '#212121',
    marginLeft: 16,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
  },
  badgePoints: {
    backgroundColor: 'transparent',
  },
  badgeNew: {
    backgroundColor: '#2873e6',
  },
  badgeText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  badgeTextNew: {
    color: '#fff',
  },
});
