import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { PassengersStepProps } from '../../types/booking-components';

export default function PassengersStep({ styles, adultExpanded, setAdultExpanded, passengersInfo, setPassengersInfo, baggageSelections, setBaggageSelections, onEditPassenger }: PassengersStepProps) {
  return (
    <View style={{ paddingHorizontal: 12 }}>
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.sectionIcon}><Icon name="account" size={16} color="#fff" /></View>
          <Text style={styles.sectionTitle}>Thông Tin Người Lớn</Text>
        </View>
        <TouchableOpacity onPress={() => setAdultExpanded((v: boolean) => !v)}>
          <Icon name={adultExpanded ? 'chevron-up' : 'chevron-down'} size={22} color="#2873e6" />
        </TouchableOpacity>
      </View>

      {adultExpanded && (
        <>
          {passengersInfo.map((p, idx) => (
            <View key={p.id} style={styles.cardBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.cardSubtitle}>Khách {idx + 1} - Người lớn</Text>
                <TouchableOpacity onPress={() => onEditPassenger(idx, p.name)}>
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
              setBaggageSelections((prev: number[]) => [...prev, 0]);
            }}
          >
            <Icon name="plus" size={18} color="#2873e6" />
            <Text style={styles.addInfoText}>Thêm thông tin</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}


