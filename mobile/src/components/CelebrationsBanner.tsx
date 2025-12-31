// Celebrations Banner
// Shows upcoming birthdays, work anniversaries, and milestones

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';

interface Celebration {
  id: string;
  type: 'birthday' | 'anniversary' | 'milestone';
  personName: string;
  personInitials: string;
  title: string;
  date: string;
  daysUntil: number;
  canCelebrate: boolean;
}

interface Props {
  celebrations: Celebration[];
  locale: string;
}

const TYPE_EMOJIS = {
  birthday: '🎂',
  anniversary: '🎉',
  milestone: '🏆',
};

const CelebrationsBanner: React.FC<Props> = ({ celebrations, locale }) => {
  const getText = (no: string, en: string) => (locale === 'no' ? no : en);

  const getDaysText = (days: number) => {
    if (days === 0) return getText('I dag!', 'Today!');
    if (days === 1) return getText('I morgen', 'Tomorrow');
    return getText(`Om ${days} dager`, `In ${days} days`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {getText('Kommende feiringer', 'Upcoming Celebrations')} 🎊
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {celebrations.map((celebration) => (
          <TouchableOpacity
            key={celebration.id}
            style={[
              styles.card,
              celebration.daysUntil === 0 && styles.cardToday,
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>
                {TYPE_EMOJIS[celebration.type]}
              </Text>
            </View>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {celebration.personInitials}
              </Text>
            </View>

            <Text style={styles.name} numberOfLines={1}>
              {celebration.personName}
            </Text>

            <Text style={styles.eventTitle} numberOfLines={1}>
              {celebration.title}
            </Text>

            <View style={[
              styles.dateBadge,
              celebration.daysUntil === 0 && styles.dateBadgeToday,
            ]}>
              <Text style={[
                styles.dateText,
                celebration.daysUntil === 0 && styles.dateTextToday,
              ]}>
                {getDaysText(celebration.daysUntil)}
              </Text>
            </View>

            {celebration.canCelebrate && (
              <TouchableOpacity style={styles.celebrateButton}>
                <Text style={styles.celebrateText}>
                  {getText('Gratulér', 'Celebrate')} 🎈
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  card: {
    width: 150,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardToday: {
    backgroundColor: colors.accent[50],
    borderWidth: 2,
    borderColor: colors.accent[200],
  },
  emojiContainer: {
    position: 'absolute',
    top: -8,
    right: 12,
  },
  emoji: {
    fontSize: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  dateBadge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  dateBadgeToday: {
    backgroundColor: colors.accent[500],
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  dateTextToday: {
    color: '#FFFFFF',
  },
  celebrateButton: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  celebrateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
  },
});

export default CelebrationsBanner;
