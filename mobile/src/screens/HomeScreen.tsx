// People-First Home Screen
// A warm, human-centric dashboard focused on connection and wellbeing

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../context/LocaleContext';
import { colors } from '../theme/colors';
import QuickActionsWidget from '../components/QuickActionsWidget';
import TodayAtAGlance from '../components/TodayAtAGlance';
import TeamPulseCard from '../components/TeamPulseCard';
import CelebrationsBanner from '../components/CelebrationsBanner';
import KudosFeed from '../components/KudosFeed';
import WellnessCard from '../components/WellnessCard';
import MoodCheckInPrompt from '../components/MoodCheckInPrompt';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

interface PersonalDashboard {
  greeting: string;
  todayAtAGlance: any;
  upcomingShifts: any[];
  quickActions: any[];
  teamPulse: any;
  celebrations: any[];
  kudosFeed: any[];
  wellnessSummary: any;
  personalStats: any;
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const [dashboard, setDashboard] = useState<PersonalDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await api.get('/people/dashboard');
      setDashboard(response.data.data);

      // Show mood prompt once per day
      const lastMoodCheck = await getLastMoodCheck();
      if (!lastMoodCheck || !isToday(new Date(lastMoodCheck))) {
        setShowMoodPrompt(true);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
  };

  const handleMoodSubmit = async (mood: number, tags: string[]) => {
    try {
      await api.post('/people/mood', { moodScore: mood, tags });
      setShowMoodPrompt(false);
      // Refresh to get updated team pulse
      fetchDashboard();
    } catch (error) {
      console.error('Error submitting mood:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>
          {locale === 'no' ? 'Laster inn...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary[500]]}
          tintColor={colors.primary[500]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{dashboard?.greeting}</Text>
        <Text style={styles.dateText}>
          {format(new Date(), "EEEE d. MMMM", { locale: locale === 'no' ? nb : undefined })}
        </Text>
      </View>

      {/* Mood Check-in Prompt */}
      {showMoodPrompt && (
        <MoodCheckInPrompt
          onSubmit={handleMoodSubmit}
          onDismiss={() => setShowMoodPrompt(false)}
          locale={locale}
        />
      )}

      {/* Today At A Glance */}
      <TodayAtAGlance
        data={dashboard?.todayAtAGlance}
        locale={locale}
        onPress={() => navigation.navigate('Schedule' as never)}
      />

      {/* Quick Actions */}
      <QuickActionsWidget
        actions={dashboard?.quickActions || []}
        locale={locale}
      />

      {/* Celebrations Banner */}
      {dashboard?.celebrations && dashboard.celebrations.length > 0 && (
        <CelebrationsBanner
          celebrations={dashboard.celebrations}
          locale={locale}
        />
      )}

      {/* Team Pulse */}
      <TeamPulseCard
        pulse={dashboard?.teamPulse}
        locale={locale}
      />

      {/* Wellness Summary */}
      <WellnessCard
        wellness={dashboard?.wellnessSummary}
        locale={locale}
      />

      {/* Kudos Feed */}
      <KudosFeed
        kudos={dashboard?.kudosFeed || []}
        locale={locale}
        onSendKudos={() => navigation.navigate('SendKudos' as never)}
      />

      {/* Personal Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>
          {locale === 'no' ? 'Din statistikk' : 'Your Stats'}
        </Text>
        <View style={styles.statsGrid}>
          <StatCard
            value={dashboard?.personalStats?.shiftsThisMonth || 0}
            label={locale === 'no' ? 'Skift denne måneden' : 'Shifts this month'}
            color={colors.primary[500]}
          />
          <StatCard
            value={dashboard?.personalStats?.hoursThisMonth || 0}
            label={locale === 'no' ? 'Timer' : 'Hours'}
            suffix="t"
            color={colors.secondary[500]}
          />
          <StatCard
            value={dashboard?.personalStats?.kudosReceived || 0}
            label={locale === 'no' ? 'Kudos mottatt' : 'Kudos received'}
            color={colors.accent[500]}
          />
          <StatCard
            value={dashboard?.personalStats?.vacationDaysRemaining || 0}
            label={locale === 'no' ? 'Feriedager igjen' : 'Vacation days left'}
            color={colors.success.main}
          />
        </View>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

// Stat Card Component
interface StatCardProps {
  value: number;
  label: string;
  suffix?: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, suffix, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>
      {value}{suffix}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Helper functions
const getLastMoodCheck = async (): Promise<string | null> => {
  // In a real app, this would use AsyncStorage
  return null;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});

export default HomeScreen;
