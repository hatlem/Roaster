import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { useLocale } from '../context/LocaleContext';
import ComplianceIndicator from './ComplianceIndicator';

interface ShiftCardProps {
  shift: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    location: string;
    role: string;
    compliance: {
      status: 'compliant' | 'warning' | 'violation';
      issues: string[];
    };
  };
  onPress?: () => void;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({ shift, onPress }) => {
  const { t } = useLocale();

  const getComplianceColor = () => {
    switch (shift.compliance.status) {
      case 'compliant':
        return '#E8F5E9'; // Light green
      case 'warning':
        return '#FFF3E0'; // Light orange
      case 'violation':
        return '#FFEBEE'; // Light red
      default:
        return '#F5F5F5';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: getComplianceColor() }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.date}>
          {format(new Date(shift.date), 'EEE, MMM d')}
        </Text>
        <Text style={styles.duration}>
          {shift.duration} {t('schedule.hours')}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.time}>
          {shift.startTime} - {shift.endTime}
        </Text>
        <Text style={styles.location}>{shift.location}</Text>
        <Text style={styles.role}>{shift.role}</Text>
      </View>

      <ComplianceIndicator
        status={shift.compliance.status}
        issues={shift.compliance.issues}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  duration: {
    fontSize: 14,
    color: '#757575',
  },
  content: {
    marginBottom: 8,
  },
  time: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: '#757575',
  },
});

export default ShiftCard;
