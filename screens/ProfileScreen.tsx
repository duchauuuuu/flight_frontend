import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [name, setName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+84');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      if (user.dob) {
        // Format dob from YYYY-MM-DD to DD/MM/YYYY if needed
        setBirthDate(user.dob);
      }
    }
  }, [user]);

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin tài khoản</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await logout();
            // Điều hướng trực tiếp tới tab Account -> AccountMain
            navigation.getParent?.()?.navigate('Account', { screen: 'AccountMain' });
          }}
        >
          <View>
            <Text style={styles.logoutText}>Đăng xuất</Text>
            <View style={styles.underline} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Info Alert */}
        <View style={styles.alertBox}>
          <Icon name="information" size={20} color="#2873e6" />
          <Text style={styles.alertText}>
            Bổ sung đầy đủ thông tin sẽ giúp Flight hỗ trợ bạn tốt hơn khi đặt vé.
          </Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user ? getInitials(user.name) : 'U'}</Text>
          </View>
        </View>

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Họ và tên <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nhập họ và tên"
          />
        </View>

        {/* Phone Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Số điện thoại <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.phoneContainer}>
            <View style={styles.phoneCodeContainer}>
              <View style={styles.flagIcon}>
                <Text style={styles.flagText}>🇻🇳</Text>
              </View>
              <Text style={styles.phoneCode}>{phoneCode}</Text>
              <Icon name="chevron-down" size={16} color="#666" />
            </View>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Số điện thoại"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Email <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Nhập email"
            keyboardType="email-address"
          />
        </View>

        {/* Success Alert */}
        <View style={styles.successBox}>
          <Icon name="check-circle" size={20} color="#10B981" />
          <Text style={styles.successText}>
            Thông tin đặt vé sẽ được gửi đến số điện thoại và email bạn cung cấp.
          </Text>
        </View>

        {/* Birth Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ngày sinh</Text>
          <TouchableOpacity style={styles.dateInput}>
            <TextInput
              style={styles.dateText}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="dd/mm/yyyy"
            />
            <Icon name="calendar" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
              onPress={() => setGender('male')}
            >
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                Nam
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
              onPress={() => setGender('female')}
            >
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                Nữ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
              onPress={() => setGender('other')}
            >
              <Text style={[styles.genderText, gender === 'other' && styles.genderTextActive]}>
                Khác
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Lưu</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2873e6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginLeft: 16,
  },
  logoutButton: {
    padding: 4,
  },
  logoutText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  underline: {
    height: 1.5,
    backgroundColor: '#fff',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    marginLeft: 8,
    lineHeight: 18,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212121',
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  phoneCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 100,
  },
  flagIcon: {
    marginRight: 4,
  },
  flagText: {
    fontSize: 20,
  },
  phoneCode: {
    fontSize: 15,
    color: '#212121',
    marginRight: 4,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212121',
  },
  successBox: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#059669',
    marginLeft: 8,
    lineHeight: 18,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#2873e6',
    borderColor: '#2873e6',
    borderRadius: 999,
  },
  genderText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
