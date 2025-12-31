// Send Kudos Screen
// A friendly interface for recognizing colleagues

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLocale } from '../context/LocaleContext';
import { colors } from '../theme/colors';
import { api } from '../services/api';

interface Colleague {
  id: string;
  firstName: string;
  lastName: string;
}

interface Category {
  value: string;
  label: string;
  emoji: string;
}

const SendKudosScreen: React.FC = () => {
  const navigation = useNavigation();
  const { locale } = useLocale();
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedColleague, setSelectedColleague] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getText = (no: string, en: string) => (locale === 'no' ? no : en);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [colleaguesRes, categoriesRes] = await Promise.all([
        api.get('/employee/colleagues'),
        api.get('/people/kudos/categories'),
      ]);
      setColleagues(colleaguesRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredColleagues = colleagues.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!selectedColleague || !selectedCategory || message.length < 5) {
      Alert.alert(
        getText('Mangler informasjon', 'Missing information'),
        getText(
          'Velg en kollega, kategori og skriv en melding (minst 5 tegn)',
          'Select a colleague, category and write a message (at least 5 characters)'
        )
      );
      return;
    }

    setIsSending(true);
    try {
      await api.post('/people/kudos', {
        toUserId: selectedColleague,
        category: selectedCategory,
        message,
        isPublic,
      });

      Alert.alert(
        getText('Kudos sendt!', 'Kudos sent!'),
        getText('Din anerkjennelse er på vei!', 'Your recognition is on its way!'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        getText('Feil', 'Error'),
        getText('Kunne ikke sende kudos. Prøv igjen.', 'Could not send kudos. Please try again.')
      );
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {getText('Send ros til en kollega', 'Send kudos to a colleague')} ⭐
        </Text>
      </View>

      {/* Select Colleague */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {getText('Hvem vil du rose?', 'Who do you want to recognize?')}
        </Text>
        <TextInput
          style={styles.searchInput}
          placeholder={getText('Søk etter kollega...', 'Search for colleague...')}
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colleagueList}>
          {filteredColleagues.map((colleague) => (
            <TouchableOpacity
              key={colleague.id}
              style={[
                styles.colleagueChip,
                selectedColleague === colleague.id && styles.colleagueChipSelected,
              ]}
              onPress={() => setSelectedColleague(colleague.id)}
            >
              <View
                style={[
                  styles.colleagueAvatar,
                  selectedColleague === colleague.id && styles.colleagueAvatarSelected,
                ]}
              >
                <Text style={styles.colleagueInitials}>
                  {colleague.firstName[0]}{colleague.lastName[0]}
                </Text>
              </View>
              <Text
                style={[
                  styles.colleagueName,
                  selectedColleague === colleague.id && styles.colleagueNameSelected,
                ]}
                numberOfLines={1}
              >
                {colleague.firstName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Select Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {getText('Velg kategori', 'Select category')}
        </Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryChip,
                selectedCategory === category.value && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category.value)}
            >
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.value && styles.categoryLabelSelected,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Message */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {getText('Skriv en melding', 'Write a message')}
        </Text>
        <TextInput
          style={styles.messageInput}
          placeholder={getText(
            'Fortell hvorfor de fortjener ros...',
            'Tell them why they deserve recognition...'
          )}
          placeholderTextColor={colors.text.tertiary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{message.length}/500</Text>
      </View>

      {/* Public Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>
            {getText('Vis på teamets vegg', 'Show on team wall')}
          </Text>
          <Text style={styles.toggleHint}>
            {getText('Andre kan se og feire', 'Others can see and celebrate')}
          </Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: colors.neutral[300], true: colors.primary[200] }}
          thumbColor={isPublic ? colors.primary[500] : colors.neutral[100]}
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[
          styles.sendButton,
          (!selectedColleague || !selectedCategory || message.length < 5) &&
            styles.sendButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={isSending || !selectedColleague || !selectedCategory || message.length < 5}
      >
        {isSending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.sendButtonText}>
            {getText('Send kudos', 'Send kudos')} 🎉
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: colors.text.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 12,
  },
  colleagueList: {
    flexDirection: 'row',
  },
  colleagueChip: {
    alignItems: 'center',
    marginRight: 12,
    padding: 8,
    borderRadius: 12,
  },
  colleagueChipSelected: {
    backgroundColor: colors.primary[50],
  },
  colleagueAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  colleagueAvatarSelected: {
    backgroundColor: colors.primary[500],
  },
  colleagueInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  colleagueName: {
    fontSize: 13,
    color: colors.text.secondary,
    maxWidth: 60,
    textAlign: 'center',
  },
  colleagueNameSelected: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    margin: 4,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary[500],
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  categoryLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messageInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  toggleHint: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  sendButton: {
    backgroundColor: colors.primary[500],
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SendKudosScreen;
