import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Image } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { PaymentStepProps, PaymentMethod } from '../../types/booking-components';

export default function PaymentStep({ styles, paymentMethod, setPaymentMethod, selectedBank, setSelectedBank, cardNumber, setCardNumber, cardExpiry, setCardExpiry, cardCvv, setCardCvv, totalPriceText }: PaymentStepProps) {
  return (
    <View style={{ paddingHorizontal: 12 }}>
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.sectionIcon}><Icon name="credit-card-outline" size={16} color="#fff" /></View>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
        </View>
      </View>

      <View style={styles.cardBox}>
        <Text style={styles.cardSubtitle}>Chọn phương thức</Text>
        <View style={styles.chipsRow}>
          {(['MoMo','VNPay','Thẻ'] as PaymentMethod[]).map((pm) => (
            <TouchableOpacity key={pm} style={[styles.chip, paymentMethod === pm && styles.chipActive]} onPress={() => setPaymentMethod(pm)}>
              <Text style={[styles.chipText, paymentMethod === pm && styles.chipTextActive]}>{pm}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {paymentMethod === 'MoMo' && (
        <View style={styles.cardBox}>
          <Text style={styles.cardSubtitle}>Quét mã QR MoMo</Text>
          <View style={styles.qrBox}>
            <Image source={require('../../assets/qr.png')} style={{ width: 140, height: 140, resizeMode: 'contain' }} />
          </View>
          <Text style={styles.helperText}>Mở ứng dụng MoMo → Quét QR → Xác nhận thanh toán.</Text>
        </View>
      )}

      {paymentMethod === 'VNPay' && (
        <View style={styles.cardBox}>
          <Text style={styles.cardSubtitle}>Chọn ngân hàng</Text>
          <View style={styles.bankGrid}>
            {['Vietcombank','VietinBank','BIDV','Agribank','TPBank','Techcombank'].map((b) => (
              <TouchableOpacity key={b} style={[styles.bankItem, selectedBank === b && styles.bankItemActive]} onPress={() => setSelectedBank(b)}>
                <Text style={[styles.bankText, selectedBank === b && styles.bankTextActive]} numberOfLines={1}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!selectedBank && <Text style={styles.helperText}>Vui lòng chọn ngân hàng để tiếp tục.</Text>}
        </View>
      )}

      {paymentMethod === 'Thẻ' && (
        <View style={styles.cardBox}>
          <Text style={styles.cardSubtitle}>Thông tin thẻ</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số thẻ</Text>
            <TextInput placeholder="#### #### #### ####" placeholderTextColor="#9CA3AF" keyboardType="number-pad" maxLength={19} value={cardNumber} onChangeText={setCardNumber} style={styles.textInput} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.inputGroup, { flex: 1 }]}> 
              <Text style={styles.inputLabel}>Hết hạn</Text>
              <TextInput placeholder="MM/YY" placeholderTextColor="#9CA3AF" keyboardType="number-pad" maxLength={5} value={cardExpiry} onChangeText={setCardExpiry} style={styles.textInput} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}> 
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput placeholder="***" placeholderTextColor="#9CA3AF" keyboardType="number-pad" maxLength={4} secureTextEntry value={cardCvv} onChangeText={setCardCvv} style={styles.textInput} />
            </View>
          </View>
          <Text style={styles.helperText}>Chúng tôi mã hóa thông tin thẻ theo chuẩn PCI-DSS.</Text>
        </View>
      )}

      <View style={styles.cardBox}>
        <Text style={styles.cardSubtitle}>Tóm tắt</Text>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Giá vé</Text><Text style={styles.summaryValue}>{totalPriceText.base.toLocaleString('vi-VN')} VND</Text></View>
        {totalPriceText.taxFee > 0 && (
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Thuế & phí</Text><Text style={styles.summaryValue}>{totalPriceText.taxFee.toLocaleString('vi-VN')} VND</Text></View>
        )}
        {totalPriceText.baggageFee > 0 && (
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Hành lý</Text><Text style={styles.summaryValue}>{totalPriceText.baggageFee.toLocaleString('vi-VN')} VND</Text></View>
        )}
        <View style={[styles.summaryRow, { marginTop: 6 }]}><Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Tổng cộng</Text><Text style={[styles.summaryValue, { color: '#2873e6', fontWeight: '700' }]}>{totalPriceText.total.toLocaleString('vi-VN')} VND</Text></View>
      </View>
    </View>
  );
}


