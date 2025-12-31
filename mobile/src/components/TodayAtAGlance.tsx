// Today At A Glance Component
// Shows a quick summary of today's status in a friendly, visual way

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';

interface TodayData {
  hasShiftToday: boolean;
  shift?: {
    startTime: string;
    endTime: string;
    location: string;
    department: string;
    hoursUntilStart?: number;
  };
  teamMembersWorking: number;
  openShiftsAvailable: number;
  unreadNotifications: number;
  pendingRequests: number;
}

interface Props {
  data?: TodayData;
  locale: string;
  onPress: () => void;
}

const TodayAtAGlance: React.FC<Props> = ({ data, locale, onPress }) => {
  if (!data) return null;

  const getText = (no: string, en: string) => (locale === 'no' ? no : en);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {data.hasShiftToday && data.shift ? (
        // Has shift today
        <View style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <View style={styles.shiftIndicator} />
            <Text style={styles.shiftLabel}>
              {getText('Din vakt i dag', 'Your shift today')}
            </Text>
          </View>

          <Text style={styles.shiftTime}>
            {data.shift.startTime} - {data.shift.endTime}
          </Text>

          {data.shift.location && (
            <Text style={styles.shiftLocation}>
              {data.shift.location}
              {data.shift.department && ` • ${data.shift.department}`}
            </Text>
          )}

          {data.shift.hoursUntilStart !== undefined && data.shift.hoursUntilStart > 0 && (
            <View style={styles.countdown}>
              <Text style={styles.countdownText}>
                {getText('Starter om', 'Starts in')} {data.shift.hoursUntilStart}{getText('t', 'h')}
              </Text>
            </View>
          )}
        </View>
      ) : (
        // No shift today
        <View style={styles.freeDay}>
          <Text style={styles.freeDayEmoji}>🌴</Text>
          <Text style={styles.freeDayText}>
            {getText('Ingen vakt i dag - nyt dagen!', 'No shift today - enjoy your day!')}
          </Text>
        </View>
      )}

      {/* Quick stats row */}
      <View style={styles.statsRow}>
        <QuickStat
          value={data.teamMembersWorking}
          label={getText('kolleger på jobb', 'colleagues working')}
          icon="👥"
        />
        {data.openShiftsAvailable > 0 && (
          <QuickStat
            value={data.openShiftsAvailable}
            label={getText('ledige skift', 'open shifts')}
            icon="📋"
            highlight
          />
        )}
        {data.unreadNotifications > 0 && (
          <QuickStat
            value={data.unreadNotifications}
            label={getText('uleste', 'unread')}
            icon="🔔"
            highlight
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

interface QuickStatProps {
  value: number;
  label: string;
  icon: string;
  highlight?: boolean;
}

const QuickStat: React.FC<QuickStatProps> = ({ value, label, icon, highlight }) => (
  <View style={[styles.quickStat, highlight && styles.quickStatHighlight]}>
    <Text style={styles.quickStatIcon}>{icon}</Text>
    <Text style={[styles.quickStatValue, highlight && styles.quickStatValueHighlight]}>
      {value}
    </Text>
    <Text style={styles.quickStatLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  shiftCard: {
    padding: 20,
    backgroundColor: colors.primary[500],
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  shiftLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  shiftTime: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  shiftLocation: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  countdown: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  countdownText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  freeDay: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.secondary[50],
  },
  freeDayEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  freeDayText: {
    fontSize: 16,
    color: colors.secondary[700],
    fontWeight: '600',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.background.secondary,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  quickStatHighlight: {
    backgroundColor: colors.accent[50],
    borderRadius: 12,
    marginHorizontal: 4,
  },
  quickStatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  quickStatValueHighlight: {
    color: colors.accent[600],
  },
  quickStatLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default TodayAtAGlance;
