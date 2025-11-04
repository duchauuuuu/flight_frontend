import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  points?: number;
  membershipTier?: string;
  createdAt?: string;
}

export default function AdminUsersScreen({ navigation }: any) {
  const { tokens, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all'); // 'all', 'Admin', 'Customer'
  const [showFilter, setShowFilter] = useState(true); // Hiển thị/ẩn phần lọc

  const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;

  const loadUsers = useCallback(async () => {
    if (!tokens?.access_token || !API_BASE_URL) return;

    try {
      setLoading(true);
      
      // Kiểm tra cache trước
      const { getCachedUsers, cacheUsers } = await import('../../utils/cacheService');
      const cachedUsers = await getCachedUsers();
      
      if (cachedUsers && cachedUsers.length > 0) {
        setUsers(cachedUsers);
        setLoading(false);
        setRefreshing(false);
      }
      
      // Gọi API để lấy dữ liệu mới nhất
      const { data } = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const allUsers = Array.isArray(data) ? data : [];
      setUsers(allUsers);
      
      // Cache dữ liệu mới
      await cacheUsers(allUsers);
    } catch (error: any) {
      // Nếu API lỗi nhưng có cache, vẫn hiển thị cache
      const { getCachedUsers } = await import('../../utils/cacheService');
      const cachedUsers = await getCachedUsers();
      if (cachedUsers && cachedUsers.length > 0) {
        setUsers(cachedUsers);
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tokens?.access_token, API_BASE_URL]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (userId: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa người dùng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/users/${userId}`, {
                headers: { Authorization: `Bearer ${tokens?.access_token}` },
              });
              Alert.alert('Thành công', 'Đã xóa người dùng');
              loadUsers();
            } catch (error: any) {
              Alert.alert('Lỗi', 'Không thể xóa người dùng');
            }
          },
        },
      ]
    );
  };


  const filteredUsers = users.filter((user) => {
    // Lọc theo search query
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Lọc theo role
    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'Admin':
        return '#EF4444';
      case 'Customer':
        return '#2873e6';
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          Quản lý người dùng
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await logout();
          }}
          style={styles.logoutButton}
        >
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Icon name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterLabel} numberOfLines={1} ellipsizeMode="tail">
            Lọc theo vai trò:
          </Text>
          <TouchableOpacity
            onPress={() => setShowFilter(!showFilter)}
            style={styles.filterToggleButton}
          >
            <Icon 
              name={showFilter ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>
        </View>
        {showFilter && (
          <View style={[styles.filterButtons, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[styles.filterButton, filterRole === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterRole('all')}
            >
              <Text style={[styles.filterButtonText, filterRole === 'all' && styles.filterButtonTextActive]} numberOfLines={1} ellipsizeMode="tail">
                Tất cả
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterRole === 'Admin' && styles.filterButtonActive]}
              onPress={() => setFilterRole('Admin')}
            >
              <Text style={[styles.filterButtonText, filterRole === 'Admin' && styles.filterButtonTextActive]} numberOfLines={1} ellipsizeMode="tail">
                Admin
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterRole === 'Customer' && styles.filterButtonActive]}
              onPress={() => setFilterRole('Customer')}
            >
              <Text style={[styles.filterButtonText, filterRole === 'Customer' && styles.filterButtonTextActive]} numberOfLines={1} ellipsizeMode="tail">
                Customer
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && users.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="account-off" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText} numberOfLines={2} ellipsizeMode="tail">
              {searchQuery ? 'Không tìm thấy người dùng' : 'Chưa có người dùng nào'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <View key={user._id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userInfoContainer}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                      {user.name}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">
                      {user.email}
                    </Text>
                    {user.phone && (
                      <Text style={styles.userPhone} numberOfLines={1} ellipsizeMode="tail">
                        {user.phone}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                  <Text style={styles.roleText} numberOfLines={1} ellipsizeMode="tail">
                    {user.role || 'Customer'}
                  </Text>
                </View>
              </View>

              <View style={styles.userStats}>
                <View style={styles.statItem}>
                  <Icon name="star" size={16} color="#F59E0B" />
                  <Text style={styles.statText} numberOfLines={1} ellipsizeMode="tail">
                    {user.points || 0} điểm
                  </Text>
                </View>
                {user.membershipTier && (
                  <View style={styles.statItem}>
                    <Icon name="trophy" size={16} color="#F59E0B" />
                    <Text style={styles.statText} numberOfLines={1} ellipsizeMode="tail">
                      {user.membershipTier}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => navigation.navigate('AdminEditUser', { userId: user._id })}
                >
                  <Icon name="pencil" size={16} color="#fff" />
                  <Text style={styles.actionButtonText} numberOfLines={1} ellipsizeMode="tail">
                    Sửa
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(user._id)}
                >
                  <Icon name="delete" size={16} color="#fff" />
                  <Text style={styles.actionButtonText} numberOfLines={1} ellipsizeMode="tail">
                    Xóa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add User Button - nằm sát ngay trên bottom tab */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AdminAddUser')}
        >
          <Icon name="account-plus" size={20} color="#fff" />
          <Text style={styles.addButtonText} numberOfLines={1} ellipsizeMode="tail">
            Thêm khách hàng
          </Text>
        </TouchableOpacity>
      </View>
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
  logoutButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
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
    fontSize: 16,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 8,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2873e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  userStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#2873e6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  filterContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  filterToggleButton: {
    padding: 4,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#2873e6',
    borderColor: '#2873e6',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  addButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2873e6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
