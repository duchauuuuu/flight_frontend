import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Flight } from '../types/flight';

export default function PassengerInfoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { flight, passengers = 1, pricing } = route.params || ({} as { flight: Flight; passengers: number; pricing?: { base: number; taxesAndFees?: number; total: number } });

  const [adultExpanded, setAdultExpanded] = useState(true);
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
  const [passengersInfo, setPassengersInfo] = useState<Array<{ id: number; name: string }>>([{ id: 1, name: '' }]);
  const [baggageSelections, setBaggageSelections] = useState<number[]>([0]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(0);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [country, setCountry] = useState('Việt Nam');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+84');
  const [phoneNumber, setPhoneNumber] = useState('');

  const formatHm = (iso: string | Date) => {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const totalPriceText = useMemo(() => {
    const baggagePriceByKg: Record<number, number> = { 0: 0, 15: 150000, 20: 200000, 25: 250000, 30: 300000 };
    const baggageFee = (baggageSelections || []).reduce((sum, kg) => sum + (baggagePriceByKg[kg] || 0), 0);

    if (pricing && typeof pricing.total === 'number') {
      const base = pricing.base ?? pricing.total;
      const taxFee = pricing.taxesAndFees ?? 0;
      const total = base + taxFee + baggageFee;
      return { base, taxFee, baggageFee, total } as { base: number; taxFee: number; baggageFee: number; total: number };
    }
    const base = (flight?.price || 0) * (passengers || 1);
    const taxFee = 0;
    const total = base + taxFee + baggageFee;
    return { base, taxFee, baggageFee, total } as { base: number; taxFee: number; baggageFee: number; total: number };
  }, [pricing, flight?.price, passengers, baggageSelections]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin hành khách</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + 24) }}>
        {/* Stepper - 3 giai đoạn */}
        <View style={styles.stepperContainer}>
          {[0,1,2].map((i) => {
            const active = i === currentStep; // bước hiện tại
            const icons: Array<keyof typeof Icon.glyphMap> = ['account','briefcase','credit-card'] as any;
            return (
              <View key={i} style={styles.stepItem}>
                <View style={[styles.stepCircle, active ? styles.stepCircleActive : styles.stepCircleInactive]}>
                  <Icon name={icons[i] || 'checkbox-blank-circle-outline'} size={16} color={active ? '#fff' : '#9CA3AF'} />
                </View>
                {i < 2 && <View style={[styles.stepLine, active ? styles.stepLineActive : styles.stepLineInactive]} />}
              </View>
            );
          })}
        </View>

        {/* Adult info section (Step 0) */}
        {currentStep === 0 && (
        <View style={{ paddingHorizontal: 12 }}>
          <View style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.sectionIcon}><Icon name="account" size={16} color="#fff" /></View>
              <Text style={styles.sectionTitle}>Thông Tin Người Lớn</Text>
            </View>
            <TouchableOpacity onPress={() => setAdultExpanded((v) => !v)}>
              <Icon name={adultExpanded ? 'chevron-up' : 'chevron-down'} size={22} color="#2873e6" />
            </TouchableOpacity>
          </View>

          {adultExpanded && (
            <>
              {passengersInfo.map((p, idx) => (
                <View key={p.id} style={styles.cardBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.cardSubtitle}>Khách {idx + 1} - Người lớn</Text>
                    <TouchableOpacity onPress={() => { setEditingIndex(idx); setFullName(p.name); setShowEditModal(true); }}>
                      <Icon name="pencil-outline" size={18} color="#2873e6" />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.passengerName, !p.name ? { color: '#9CA3AF', fontWeight: '400' } : undefined]}>
                    {p.name ? p.name : 'Nhập thông tin'}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addInfoBtn}
                onPress={() => {
                  const nextId = (passengersInfo[passengersInfo.length - 1]?.id || 0) + 1;
                  setPassengersInfo([...passengersInfo, { id: nextId, name: '' }]);
                  setBaggageSelections((prev) => [...prev, 0]);
                }}
              >
                <Icon name="plus" size={18} color="#2873e6" />
                <Text style={styles.addInfoText}>Thêm thông tin</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        )}

        {/* Baggage section (Step 1) */}
        {currentStep === 1 && (
        <View style={{ paddingHorizontal: 12 }}>
          <View style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.sectionIcon}><Icon name="briefcase" size={16} color="#fff" /></View>
              <Text style={styles.sectionTitle}>Hành lý ký gửi</Text>
            </View>
          </View>

          {passengersInfo.map((p, idx) => (
            <View key={p.id} style={styles.cardBox}>
              <Text style={styles.cardSubtitle}>Khách {idx + 1} - {p.name || 'Chưa có tên'}</Text>
              <View style={styles.chipsRow}>
                {[0, 15, 20, 25, 30].map((kg) => {
                  const selected = baggageSelections[idx] === kg;
                  return (
                    <TouchableOpacity
                      key={kg}
                      style={[styles.chip, selected && styles.chipActive]}
                      onPress={() => {
                        const next = [...baggageSelections];
                        next[idx] = kg;
                        setBaggageSelections(next);
                      }}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{kg === 0 ? '0 kg' : `${kg} kg`}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
        )}

        {/* Flight detail section removed as per request */}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.totalBase}>{totalPriceText.base.toLocaleString('vi-VN')}</Text>
            {totalPriceText.taxFee > 0 ? (
              <>
                <Icon name="plus" size={16} color="#2873e6" style={{ marginHorizontal: 6 }} />
                <Text style={styles.totalTax}>{totalPriceText.taxFee.toLocaleString('vi-VN')} VND</Text>
              </>
            ) : null}
            {totalPriceText.baggageFee > 0 ? (
              <>
                <Icon name="plus" size={16} color="#2873e6" style={{ marginHorizontal: 6 }} />
                <Text style={styles.totalTax}>{totalPriceText.baggageFee.toLocaleString('vi-VN')} VND</Text>
              </>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => {
            if (currentStep < 2) {
              setCurrentStep((s) => (s + 1) as 0 | 1 | 2);
              return;
            }
            navigation.navigate('MyTickets');
          }}
        >
          <Text style={styles.ctaText}>Tiếp tục</Text>
        </TouchableOpacity>
      </View>

      {/* Modal nhập thông tin hành khách */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { paddingBottom: Math.max(16, insets.bottom) }]}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Thêm thông tin hành khách</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Icon name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              {/* Bỏ tiêu đề "Thông tin chi tiết" theo yêu cầu */}
              <View style={{ height: 8 }} />

              <TouchableOpacity style={styles.selectRow} activeOpacity={0.8} onPress={() => setShowGenderPicker(true)}>
                <Text style={styles.selectLabel}>{gender}</Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <View style={styles.separator} />

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên<Text style={{ color: '#EF4444' }}>*</Text></Text>
                <TextInput
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.textInput}
                />
              </View>

              <TouchableOpacity style={styles.selectRow} activeOpacity={0.8}>
                <Text style={styles.selectTitle}>{country}</Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <View style={styles.separator} />

              <Text style={styles.modalSectionTitle}>Thông tin liên hệ</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email<Text style={{ color: '#EF4444' }}>*</Text></Text>
                <TextInput
                  placeholder="Nhập email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại<Text style={{ color: '#EF4444' }}>*</Text></Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity style={styles.countryCode} activeOpacity={0.8}>
                    <Text style={{ color: '#111827' }}>{phoneCode}</Text>
                    <Icon name="chevron-down" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                  <TextInput
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    style={[styles.textInput, { flex: 1 }]}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.ctaBtn, { opacity: fullName.trim() ? 1 : 0.5 }]}
                disabled={!fullName.trim()}
                onPress={() => {
                  const updated = [...passengersInfo];
                  updated[editingIndex] = { ...updated[editingIndex], name: fullName.trim() };
                  setPassengersInfo(updated);
                  setShowEditModal(false);
                }}
              >
                <Text style={styles.ctaText}>Tiếp tục</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Gender picker */}
      <Modal visible={showGenderPicker} transparent animationType="fade" onRequestClose={() => setShowGenderPicker(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.genderBox}>
            {(['Nam','Nữ','Khác'] as const).map((g) => (
              <TouchableOpacity key={g} style={styles.genderItem} onPress={() => { setGender(g); setShowGenderPicker(false); }}>
                <Text style={[styles.genderText, gender === g ? { color: '#2873e6', fontWeight: '700' } : undefined]}>{g}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.genderItem, { borderTopWidth: 1, borderTopColor: '#E5E7EB' }]} onPress={() => setShowGenderPicker(false)}>
              <Text style={[styles.genderText, { color: '#EF4444' }]}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  stepItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 4 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: '#2873e6' },
  stepCircleInactive: { backgroundColor: '#F3F4F6' },
  stepLine: { height: 4, width: 40, borderRadius: 2, marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#2873e6' },
  stepLineInactive: { backgroundColor: '#E5E7EB' },

  sectionCard: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectionIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#2873e6', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sectionTitle: { color: '#111827', fontWeight: '700' },
  cardBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginTop: 8 },
  cardSubtitle: { color: '#6B7280' },
  passengerName: { color: '#111827', fontWeight: '700', marginTop: 8 },
  formHint: { color: '#6B7280', fontSize: 12 },

  

  flightCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginTop: 8 },
  flightRoute: { color: '#111827', fontWeight: '700', fontSize: 16 },
  flightAirline: { color: '#6B7280' },
  flightTime: { color: '#111827', fontWeight: '700' },
  flightCode: { color: '#6B7280' },
  flightPrice: { color: '#111827', fontWeight: '700', marginTop: 8 },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingHorizontal: 12, paddingTop: 10 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#6B7280', fontSize: 12 },
  totalBase: { color: '#2873e6', fontWeight: '700', fontSize: 16 },
  totalTax: { color: '#6B7280' },
  ctaBtn: { marginTop: 8, backgroundColor: '#2873e6', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: '#fff', borderTopLeftRadius: 14, borderTopRightRadius: 14, maxHeight: '85%' },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalHeaderTitle: { color: '#111827', fontWeight: '700', fontSize: 16 },
  modalSectionTitle: { color: '#111827', fontWeight: '700', marginBottom: 8 },
  inlineBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  selfText: { color: '#6B7280' },
  separator: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  selectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  selectLabel: { color: '#111827', fontWeight: '700' },
  selectTitle: { color: '#111827', fontWeight: '700' },
  inputGroup: { marginBottom: 14 },
  inputLabel: { color: '#111827', fontWeight: '600', marginBottom: 6 },
  textInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#111827' },
  inputWithIcon: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryCode: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, marginRight: 8 },
  addInfoBtn: { marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EAF2FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addInfoText: { color: '#2873e6', fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  chipActive: { borderColor: '#2873e6', backgroundColor: '#EAF2FF' },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#2873e6', fontWeight: '700' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  genderBox: { backgroundColor: '#fff', borderRadius: 12, width: '80%', overflow: 'hidden' },
  genderItem: { paddingVertical: 14, paddingHorizontal: 16 },
  genderText: { color: '#111827', textAlign: 'center' },
});


