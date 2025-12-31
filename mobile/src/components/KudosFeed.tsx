// Kudos Feed Component
// Shows recent recognition between team members

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { colors } from '../theme/colors';

interface KudosFeedItem {
  id: string;
  fromName: string;
  fromInitials: string;
  toName: string;
  toInitials: string;
  category: string;
  categoryEmoji: string;
  message: string;
  celebrationCount: number;
  timeAgo: string;
  isOwnKudos: boolean;
}

interface Props {
  kudos: KudosFeedItem[];
  locale: string;
  onSendKudos: () => void;
}

const KudosFeed: React.FC<Props> = ({ kudos, locale, onSendKudos }) => {
  const getText = (no: string, en: string) => (locale === 'no' ? no : en);

  const renderKudosItem = ({ item }: { item: KudosFeedItem }) => (
    <View style={[styles.kudosCard, item.isOwnKudos && styles.kudosCardHighlight]}>
      <View style={styles.kudosHeader}>
        <View style={styles.avatarGroup}>
          <View style={[styles.avatar, styles.fromAvatar]}>
            <Text style={styles.avatarText}>{item.fromInitials}</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>
          <View style={[styles.avatar, styles.toAvatar]}>
            <Text style={styles.avatarText}>{item.toInitials}</Text>
          </View>
        </View>
        <Text style={styles.timeAgo}>{item.timeAgo}</Text>
      </View>

      <View style={styles.kudosContent}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryEmoji}>{item.categoryEmoji}</Text>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>

        <Text style={styles.names}>
          <Text style={styles.nameHighlight}>{item.fromName.split(' ')[0]}</Text>
          {getText(' ga kudos til ', ' gave kudos to ')}
          <Text style={styles.nameHighlight}>{item.toName.split(' ')[0]}</Text>
        </Text>

        <Text style={styles.message}>"{item.message}"</Text>
      </View>

      <TouchableOpacity style={styles.celebrateButton}>
        <Text style={styles.celebrateEmoji}>🎉</Text>
        <Text style={styles.celebrateCount}>
          {item.celebrationCount > 0 ? item.celebrationCount : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {getText('Anerkjennelser', 'Recognition')} ⭐
        </Text>
        <TouchableOpacity style={styles.sendButton} onPress={onSendKudos}>
          <Text style={styles.sendButtonText}>
            {getText('Send ros', 'Send kudos')}
          </Text>
        </TouchableOpacity>
      </View>

      {kudos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌟</Text>
          <Text style={styles.emptyText}>
            {getText(
              'Ingen kudos denne uken ennå. Vær den første!',
              'No kudos this week yet. Be the first!'
            )}
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={onSendKudos}>
            <Text style={styles.emptyButtonText}>
              {getText('Send første kudos', 'Send first kudos')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={kudos.slice(0, 5)}
          renderItem={renderKudosItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sendButton: {
    backgroundColor: colors.accent[500],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  sendButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  kudosCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kudosCardHighlight: {
    borderWidth: 2,
    borderColor: colors.accent[200],
    backgroundColor: colors.accent[50],
  },
  kudosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fromAvatar: {
    backgroundColor: colors.primary[500],
  },
  toAvatar: {
    backgroundColor: colors.secondary[500],
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  arrowContainer: {
    marginHorizontal: 6,
  },
  arrow: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  timeAgo: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  kudosContent: {
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  names: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  nameHighlight: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  message: {
    fontSize: 15,
    color: colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  celebrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  celebrateEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  celebrateCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  emptyState: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default KudosFeed;
