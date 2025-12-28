import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useLocale } from '../context/LocaleContext';
import { useShifts } from '../hooks/useShifts';
import ShiftCard from '../components/ShiftCard';

export const ScheduleScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useLocale();
  const [currentDate] = useState(new Date());

  const startDate = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const endDate = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { shifts, isLoading, refetch } = useShifts(startDate, endDate);

  const handleShiftPress = (shift: any) => {
    navigation.navigate('ShiftDetail' as never, { shift } as never);
  };

  if (isLoading && shifts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('schedule.title')}</Text>
        <Text style={styles.dateRange}>
          {format(new Date(startDate), 'MMM d')} -{' '}
          {format(new Date(endDate), 'MMM d, yyyy')}
        </Text>
      </View>

      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ShiftCard shift={item} onPress={() => handleShiftPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={['#2196F3']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('schedule.noShifts')}</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 14,
    color: '#757575',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
});

export default ScheduleScreen;
