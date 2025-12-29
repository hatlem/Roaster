import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { useLocale } from '../context/LocaleContext';

interface MarketplaceListingCardProps {
  listing: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    location: string;
    role: string;
    compensation?: number;
  };
  onClaim: () => void;
}

export const MarketplaceListingCard: React.FC<MarketplaceListingCardProps> = ({
  listing,
  onClaim,
}) => {
  const { t } = useLocale();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>
          {format(new Date(listing.date), 'EEE, MMM d')}
        </Text>
        <Text style={styles.duration}>
          {listing.duration} {t('schedule.hours')}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.time}>
          {listing.startTime} - {listing.endTime}
        </Text>
        <Text style={styles.location}>{listing.location}</Text>
        <Text style={styles.role}>{listing.role}</Text>
        {listing.compensation && (
          <Text style={styles.compensation}>
            +{listing.compensation}% bonus
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.claimButton} onPress={onClaim}>
        <Text style={styles.claimButtonText}>{t('marketplace.claim')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
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
    marginBottom: 12,
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
    marginBottom: 4,
  },
  compensation: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  claimButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MarketplaceListingCard;
