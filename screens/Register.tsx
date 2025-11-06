import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, ScrollView, ImageBackground } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Error states for each field
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const clearErrors = () => {
    setErrors({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      general: '',
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      general: '',
    };

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên.';
      isValid = false;
    }

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
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ImageBackground source={require('../assets/logout.jpg')} style={styles.headerBg} resizeMode="cover">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Xin chào</Text>
              <Text style={styles.headerSubtitle}>Đăng ký để tận hưởng nhiều ưu đãi</Text>
            </View>
        </View>
      </ImageBackground>

      {/* Form */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View>
          <View style={[styles.inputRow, errors.fullName && styles.inputRowError]}>
            <Icon name="account-outline" size={20} color={errors.fullName ? "#DC2626" : "#6B7280"} style={styles.inputIcon} />
            <TextInput
              placeholder="Họ và tên"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) {
                  setErrors({...errors, fullName: ''});
                }
              }}
            />
          </View>
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
        </View>

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
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        <View>
          <View style={[styles.inputRow, errors.confirmPassword && styles.inputRowError]}>
            <Icon name="lock-check-outline" size={20} color={errors.confirmPassword ? "#DC2626" : "#6B7280"} style={styles.inputIcon} />
            <TextInput
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              style={styles.input}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors({...errors, confirmPassword: ''});
                }
              }}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Icon 
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
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
              await axios.post(`${API_BASE}/users`, {
                name: fullName,
                email,
                password,
              });
              setSuccessMessage('Tạo tài khoản thành công. Hãy đăng nhập.');
              setErrors({...errors, general: ''});
              setTimeout(() => {
                (navigation as any).navigate('Login');
              }, 1500);
            } catch (e: any) {
              const msg = e?.response?.data?.message || e?.message || 'Có lỗi xảy ra';
              setErrors({...errors, general: Array.isArray(msg) ? msg.join('\n') : msg});
              setSuccessMessage('');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Text style={styles.primaryText}>{submitting ? 'Đang xử lý...' : 'Đăng ký'}</Text>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Bạn đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('Login')}>
            <Text style={styles.link}>Đăng nhập</Text>
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
  inputRowError: {
    borderColor: '#DC2626',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 2,
    color: '#111827',
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


