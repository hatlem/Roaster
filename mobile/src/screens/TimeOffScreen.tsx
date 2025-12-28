import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocale } from '../context/LocaleContext';
import TimeOffRequestForm from '../components/TimeOffRequestForm';
import api from '../services/api';
import { format } from 'date-fns';

export const TimeOffScreen: React.FC = () => {
  const { t } = useLocale();
  const [requests, setRequests] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [requestsData, balancesData] = await Promise.all([
        api.getMyTimeOffRequests(),
        api.getAccrualBalances(),
      ]);
      setRequests(requestsData);
      setBalances(balancesData);
    } catch (error) {
      console.error('Error fetching time off data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleRequestSuccess = () => {
    setShowForm(false);
    fetchData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return t('timeoff.approved');
      case 'rejected':
        return t('timeoff.rejected');
      default:
        return t('timeoff.pending');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#2196F3']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('timeoff.title')}</Text>
      </View>

      {/* Balances */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('timeoff.balance')}</Text>
        {balances.map((balance, index) => (
          <View key={index} style={styles.balanceRow}>
            <Text style={styles.balanceType}>{balance.type}</Text>
            <Text style={styles.balanceValue}>
              {balance.accrued} {t('timeoff.days')}
            </Text>
          </View>
        ))}
      </View>

      {/* Request Form Toggle */}
      <TouchableOpacity
        style={styles.requestButton}
        onPress={() => setShowForm(!showForm)}
      >
        <Text style={styles.requestButtonText}>
          {showForm ? t('common.cancel') : t('timeoff.request')}
        </Text>
      </TouchableOpacity>

      {/* Request Form */}
      {showForm && (
        <View style={styles.card}>
          <TimeOffRequestForm onSuccess={handleRequestSuccess} />
        </View>
      )}

      {/* Requests List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Requests</Text>
        {requests.length === 0 ? (
          <Text style={styles.emptyText}>No time off requests</Text>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestItem}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestType}>{request.type}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(request.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(request.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.requestDates}>
                {format(new Date(request.startDate), 'MMM d')} -{' '}
                {format(new Date(request.endDate), 'MMM d, yyyy')}
              </Text>
              {request.reason && (
                <Text style={styles.requestReason}>{request.reason}</Text>
              )}
            </View>
          ))
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  balanceType: {
    fontSize: 16,
    color: '#212121',
    textTransform: 'capitalize',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  requestButton: {
    backgroundColor: '#2196F3',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingVertical: 16,
  },
  requestItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  requestDates: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 4,
  },
  requestReason: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
  },
});

export default TimeOffScreen;
