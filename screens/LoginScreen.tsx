import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, ScrollView, ImageBackground } from 'react-native';
import axios from 'axios';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

import { LoginScreenProps } from '../types/screen-props';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export default function LoginScreen({ onClose, onGotoRegister }: LoginScreenProps) {
  const navigation = useNavigation<any>();
  const { setUser, setTokens, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Error states for each field
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  // Khi đăng nhập xong, tự động chuyển sang màn AccountMain trong AccountStack
  useEffect(() => {
    if (isAuthenticated) {
      try {
        navigation.replace('AccountMain');
      } catch (e) {
        navigation.getParent?.()?.navigate('Account');
      }
    }
  }, [isAuthenticated]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: '',
      general: '',
    };

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email.';
      isValid = false;
    } else if (!/^[a-zA-Z0-9]+@gmail\.com$/.test(email)) {
      newErrors.email = 'Vui lòng sử dụng email (@gmail.com).';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  return (
    <View style={styles.container}>
  {/* Header */}
  <ImageBackground source={require('../assets/login.png')} style={styles.headerBg} resizeMode="cover">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (onClose ? onClose() : (navigation as any).goBack())} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Xin chào</Text>
            <Text style={styles.headerSubtitle}>Đăng nhập để tiếp tục</Text>
          </View>
        </View>
      </ImageBackground>

  {/* Form */}
  <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View>
          <View style={[styles.inputRow, errors.email && styles.inputRowError]}>
            <Icon name="email-outline" size={20} color={errors.email ? "#DC2626" : "#6B7280"} style={styles.inputIcon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({...errors, email: ''});
                }
              }}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        <View>
          <View style={[styles.inputRow, errors.password && styles.inputRowError]}>
            <Icon name="lock-outline" size={20} color={errors.password ? "#DC2626" : "#6B7280"} style={styles.inputIcon} />
            <TextInput
              placeholder="Mật khẩu"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({...errors, password: ''});
                }
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={errors.password ? "#DC2626" : "#6B7280"} 
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {errors.general ? <Text style={styles.generalErrorText}>{errors.general}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={async () => {
            if (!validateForm()) {
              return;
            }

            try {
              setSubmitting(true);
              const response = await axios.post(`${API_BASE}/auth/login`, {
                email,
                password,
              });
              
              // Lưu token và user info vào Zustand store
              if (response.data.access_token && response.data.user) {
                console.log('Login response user:', response.data.user);
                console.log('User name field:', response.data.user.name);
                
                // Đảm bảo lưu đúng user object với field name
                const userData = {
                  _id: response.data.user._id,
                  name: response.data.user.name || '',
                  email: response.data.user.email,
                  phone: response.data.user.phone || '',
                  dob: response.data.user.dob || '',
                  points: response.data.user.points || 0,
                  membershipTier: response.data.user.membershipTier,
                  role: response.data.user.role || 'Customer',
                };
                
                await setTokens(response.data.access_token, response.data.refresh_token);
                await setUser(userData);
                
                setSuccessMessage('Đăng nhập thành công!');
                setErrors({...errors, general: ''});
                
                // Nếu là admin, app sẽ tự động chuyển sang AdminNavigator
                // Nếu không phải admin, điều hướng như bình thường
                if (userData.role !== 'Admin') {
                  if (onClose) {
                    onClose();
                  } else {
                    // Điều hướng ngay lập tức về AccountMain và đảm bảo đang ở tab Account
                    const parent = navigation.getParent?.();
                    parent?.navigate('Account');
                    navigation.dispatch(
                      CommonActions.reset({ index: 0, routes: [{ name: 'AccountMain' }] })
                    );
                  }
                } else {
                  // Admin: App sẽ tự động render AdminNavigator
                  if (onClose) {
                    onClose();
                  }
                }
              }
            } catch (e: any) {
              const msg = e?.response?.data?.message || 'Email hoặc mật khẩu không đúng.';
              setErrors({...errors, general: Array.isArray(msg) ? msg.join('\n') : msg});
              setSuccessMessage('');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Text style={styles.primaryText}>{submitting ? 'Đang xử lý...' : 'Đăng nhập'}</Text>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Chưa có tài khoản? </Text>
          <TouchableOpacity
            onPress={() =>
              onGotoRegister ? onGotoRegister() : (navigation as any).navigate('Register')
            }
          >
            <Text style={styles.link}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerBg: {
    
    minHeight: 230,
    width: '100%'
  },
  headerTextWrap: {
    paddingLeft: 8,
    marginTop: 70,
    flex: 1,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    marginTop: 6,
  },
  /* headerImage removed per design change */
  backBtn: {
    padding: 4,
    marginTop: -80,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginRight: 8,
  },
  flag: {
    marginRight: 6,
    fontSize: 16,
  },
  countryText: {
    color: '#111827',
    marginRight: 2,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  refInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  primaryBtn: {
    backgroundColor: '#0f3c89',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  bottomText: {
    color: '#6B7280',
  },
  link: {
    color: '#2873e6',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 2,
    color: '#111827',
  },
  inputRowError: {
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 4,
  },
  generalErrorText: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  successText: {
    color: '#2873e6',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
    fontWeight: '600',
  },
});


