import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useLocale } from '../context/LocaleContext';
import ComplianceIndicator from '../components/ComplianceIndicator';

export const ShiftDetailScreen: React.FC = () => {
  const route = useRoute();
  const { t } = useLocale();
  const { shift } = route.params as any;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('shift.details')}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>{t('shift.date')}</Text>
          <Text style={styles.value}>
            {format(new Date(shift.date), 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('shift.time')}</Text>
          <Text style={styles.value}>
            {shift.startTime} - {shift.endTime}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('shift.duration')}</Text>
          <Text style={styles.value}>
            {shift.duration} {t('schedule.hours')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('shift.location')}</Text>
          <Text style={styles.value}>{shift.location}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{shift.role}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('shift.compliance')}</Text>
        <ComplianceIndicator
          status={shift.compliance.status}
          issues={shift.compliance.issues}
        />

        {shift.compliance.status === 'compliant' && (
          <Text style={styles.complianceDescription}>
            This shift is compliant with Norwegian labor laws including:
            {'\n'}• Minimum rest period (11 hours)
            {'\n'}• Maximum weekly hours (40 hours)
            {'\n'}• Overtime regulations
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  complianceDescription: {
    fontSize: 14,
    color: '#616161',
    marginTop: 12,
    lineHeight: 20,
  },
});

export default ShiftDetailScreen;
