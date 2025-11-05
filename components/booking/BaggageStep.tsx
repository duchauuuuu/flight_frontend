import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { BaggageStepProps } from '../../types/booking-components';

export default function BaggageStep({ styles, passengersInfo, baggageSelections, setBaggageSelections }: BaggageStepProps) {
  return (
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
  );
}


