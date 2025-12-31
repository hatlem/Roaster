// Team Pulse Card
// Shows how the team is doing - mood, who's working, recent activity

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  department: string;
  shiftTime: string;
}

interface TeamPulse {
  teamMood: number;
  teamMoodTrend: 'up' | 'down' | 'stable';
  workingToday: TeamMember[];
  recentKudos: number;
  upcomingCelebrations: number;
}

interface Props {
  pulse?: TeamPulse;
  locale: string;
}

const MOOD_EMOJIS = ['😔', '😐', '🙂', '😊', '🤩'];

const TeamPulseCard: React.FC<Props> = ({ pulse, locale }) => {
  if (!pulse) return null;

  const getText = (no: string, en: string) => (locale === 'no' ? no : en);
  const moodIndex = Math.round(pulse.teamMood) - 1;
  const moodEmoji = MOOD_EMOJIS[Math.max(0, Math.min(4, moodIndex))] || '🙂';

  const getTrendText = () => {
    switch (pulse.teamMoodTrend) {
      case 'up':
        return getText('↑ Stigende', '↑ Rising');
      case 'down':
        return getText('↓ Synkende', '↓ Declining');
      default:
        return getText('→ Stabil', '→ Stable');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {getText('Teamets puls', 'Team Pulse')}
      </Text>

      <View style={styles.content}>
        {/* Team Mood */}
        <View style={styles.moodSection}>
          <Text style={styles.moodEmoji}>{moodEmoji}</Text>
          <View style={styles.moodInfo}>
            <Text style={styles.moodScore}>{pulse.teamMood.toFixed(1)}</Text>
            <Text style={styles.moodTrend}>{getTrendText()}</Text>
          </View>
          <Text style={styles.moodLabel}>
            {getText('Teamets humør', 'Team mood')}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Working Today */}
        <View style={styles.workingSection}>
          <Text style={styles.workingTitle}>
            {getText('På jobb i dag', 'Working today')}
          </Text>

          <View style={styles.avatarRow}>
            {pulse.workingToday.slice(0, 5).map((member, index) => (
              <View
                key={member.id}
                style={[
                  styles.avatar,
                  { marginLeft: index > 0 ? -8 : 0, zIndex: 5 - index },
                ]}
              >
                <Text style={styles.avatarText}>{member.initials}</Text>
              </View>
            ))}
            {pulse.workingToday.length > 5 && (
              <View style={[styles.avatar, styles.moreAvatar, { marginLeft: -8 }]}>
                <Text style={styles.moreText}>+{pulse.workingToday.length - 5}</Text>
              </View>
            )}
          </View>

          {pulse.workingToday.length > 0 && (
            <Text style={styles.workingSubtext}>
              {pulse.workingToday.slice(0, 2).map((m) => m.name.split(' ')[0]).join(', ')}
              {pulse.workingToday.length > 2 && ` +${pulse.workingToday.length - 2}`}
            </Text>
          )}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>⭐ {pulse.recentKudos}</Text>
          <Text style={styles.statLabel}>
            {getText('kudos denne uken', 'kudos this week')}
          </Text>
        </View>
        {pulse.upcomingCelebrations > 0 && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>🎉 {pulse.upcomingCelebrations}</Text>
            <Text style={styles.statLabel}>
              {getText('feiringer snart', 'celebrations soon')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodSection: {
    flex: 1,
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  moodInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  moodScore: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: 8,
  },
  moodTrend: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  moodLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  divider: {
    width: 1,
    height: 80,
    backgroundColor: colors.neutral[200],
    marginHorizontal: 16,
  },
  workingSection: {
    flex: 1.2,
  },
  workingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  moreAvatar: {
    backgroundColor: colors.neutral[300],
  },
  moreText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  workingSubtext: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
});

export default TeamPulseCard;
