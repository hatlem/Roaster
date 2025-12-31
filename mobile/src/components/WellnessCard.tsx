// Wellness Card Component
// Shows work-life balance insights in a friendly, encouraging way

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';

interface WellnessSummary {
  workLifeBalanceScore: number;
  scoreLabel: string;
  scoreColor: string;
  weeklyHours: number;
  weeklyHoursStatus: 'healthy' | 'moderate' | 'high';
  averageRestHours: number;
  restStatus: 'good' | 'ok' | 'needs-attention';
  insight: string;
  recommendation: string;
}

interface Props {
  wellness?: WellnessSummary;
  locale: string;
}

const WellnessCard: React.FC<Props> = ({ wellness, locale }) => {
  if (!wellness) return null;

  const getText = (no: string, en: string) => (locale === 'no' ? no : en);

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '👍';
    if (score >= 40) return '⚠️';
    return '💤';
  };

  const getHoursStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return colors.success.main;
      case 'moderate':
        return colors.warning.main;
      case 'high':
        return colors.error.main;
      default:
        return colors.text.secondary;
    }
  };

  const getRestStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return colors.success.main;
      case 'ok':
        return colors.warning.main;
      case 'needs-attention':
        return colors.error.main;
      default:
        return colors.text.secondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {getText('Din balanse', 'Your Balance')} 🧘
        </Text>
      </View>

      <View style={styles.content}>
        {/* Score Circle */}
        <View style={styles.scoreSection}>
          <View style={[styles.scoreCircle, { borderColor: wellness.scoreColor }]}>
            <Text style={styles.scoreEmoji}>{getScoreEmoji(wellness.workLifeBalanceScore)}</Text>
            <Text style={[styles.scoreValue, { color: wellness.scoreColor }]}>
              {wellness.workLifeBalanceScore}
            </Text>
          </View>
          <Text style={[styles.scoreLabel, { color: wellness.scoreColor }]}>
            {wellness.scoreLabel}
          </Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsSection}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>
              {getText('Timer denne uken', 'Hours this week')}
            </Text>
            <Text style={[
              styles.metricValue,
              { color: getHoursStatusColor(wellness.weeklyHoursStatus) },
            ]}>
              {wellness.weeklyHours}t
            </Text>
            <ProgressBar
              value={Math.min(wellness.weeklyHours / 45, 1)}
              color={getHoursStatusColor(wellness.weeklyHoursStatus)}
            />
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>
              {getText('Snitt hvile', 'Avg rest')}
            </Text>
            <Text style={[
              styles.metricValue,
              { color: getRestStatusColor(wellness.restStatus) },
            ]}>
              {wellness.averageRestHours}t
            </Text>
            <ProgressBar
              value={Math.min(wellness.averageRestHours / 16, 1)}
              color={getRestStatusColor(wellness.restStatus)}
            />
          </View>
        </View>
      </View>

      {/* Insights */}
      <View style={styles.insightSection}>
        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>💡</Text>
          <Text style={styles.insightText}>{wellness.insight}</Text>
        </View>

        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationIcon}>✨</Text>
          <Text style={styles.recommendationText}>{wellness.recommendation}</Text>
        </View>
      </View>
    </View>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  value: number;
  color: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, color }) => (
  <View style={styles.progressContainer}>
    <View
      style={[
        styles.progressFill,
        { width: `${Math.max(0, Math.min(100, value * 100))}%`, backgroundColor: color },
      ]}
    />
  </View>
);

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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  content: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  scoreSection: {
    alignItems: 'center',
    marginRight: 24,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    marginBottom: 8,
  },
  scoreEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricsSection: {
    flex: 1,
    justifyContent: 'center',
  },
  metric: {
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressContainer: {
    height: 6,
    backgroundColor: colors.neutral[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightSection: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: 16,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral[50],
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.secondary[50],
    padding: 12,
    borderRadius: 12,
  },
  recommendationIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: colors.secondary[700],
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default WellnessCard;
