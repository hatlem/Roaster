// Quick Actions Widget
// Personalized shortcuts to common tasks

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

interface QuickAction {
  type: string;
  label: string;
  icon: string;
  badge?: number;
  isAvailable: boolean;
}

interface Props {
  actions: QuickAction[];
  locale: string;
}

// Icon mapping (using emoji for simplicity - could be replaced with icon library)
const ICONS: Record<string, string> = {
  'calendar-plus': '📅',
  'swap-horizontal': '🔄',
  'hand-raised': '✋',
  'star': '⭐',
  'calendar': '📆',
  'wallet': '💰',
  'login': '🟢',
  'logout': '🔴',
  'chat': '💬',
  'people': '👥',
};

const QuickActionsWidget: React.FC<Props> = ({ actions, locale }) => {
  const navigation = useNavigation();

  const handleActionPress = (action: QuickAction) => {
    // Navigate based on action type
    switch (action.type) {
      case 'VIEW_SCHEDULE':
        navigation.navigate('Schedule' as never);
        break;
      case 'REQUEST_TIME_OFF':
        navigation.navigate('TimeOff' as never);
        break;
      case 'CLAIM_OPEN_SHIFT':
        navigation.navigate('Marketplace' as never);
        break;
      case 'SEND_KUDOS':
        navigation.navigate('SendKudos' as never);
        break;
      case 'CHECK_BALANCE':
        navigation.navigate('TimeOff' as never);
        break;
      case 'VIEW_TEAM':
        navigation.navigate('Team' as never);
        break;
      case 'SWAP_SHIFT':
        navigation.navigate('SwapShift' as never);
        break;
      case 'MESSAGE_MANAGER':
        navigation.navigate('Messages' as never);
        break;
      default:
        console.log('Action not mapped:', action.type);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {locale === 'no' ? 'Snarveier' : 'Quick Actions'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.type}
            style={[
              styles.actionButton,
              !action.isAvailable && styles.actionDisabled,
            ]}
            onPress={() => handleActionPress(action)}
            disabled={!action.isAvailable}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{ICONS[action.icon] || '📌'}</Text>
              {action.badge && action.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {action.badge > 99 ? '99+' : action.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingLeft: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  scrollContent: {
    paddingRight: 20,
  },
  actionButton: {
    width: 80,
    alignItems: 'center',
    marginRight: 12,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary[500],
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default QuickActionsWidget;
