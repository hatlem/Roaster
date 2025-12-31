// Mood Check-In Prompt
// A gentle, friendly prompt for daily mood tracking

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  onSubmit: (mood: number, tags: string[]) => void;
  onDismiss: () => void;
  locale: string;
}

const MOOD_OPTIONS = [
  { score: 1, emoji: '😔', label: { no: 'Tung dag', en: 'Rough day' } },
  { score: 2, emoji: '😐', label: { no: 'Meh', en: 'Meh' } },
  { score: 3, emoji: '🙂', label: { no: 'OK', en: 'OK' } },
  { score: 4, emoji: '😊', label: { no: 'Bra!', en: 'Good!' } },
  { score: 5, emoji: '🤩', label: { no: 'Fantastisk!', en: 'Amazing!' } },
];

const TAG_OPTIONS = {
  no: ['Energisk', 'Rolig', 'Stresset', 'Motivert', 'Trøtt', 'Takknemlig'],
  en: ['Energized', 'Calm', 'Stressed', 'Motivated', 'Tired', 'Grateful'],
};

const MoodCheckInPrompt: React.FC<Props> = ({ onSubmit, onDismiss, locale }) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [step, setStep] = useState<'mood' | 'tags'>('mood');

  const getText = (no: string, en: string) => (locale === 'no' ? no : en);
  const tags = locale === 'no' ? TAG_OPTIONS.no : TAG_OPTIONS.en;

  const handleMoodSelect = (score: number) => {
    setSelectedMood(score);
    // Slight delay for feedback
    setTimeout(() => setStep('tags'), 300);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (selectedMood) {
      onSubmit(selectedMood, selectedTags);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
        <Text style={styles.dismissText}>×</Text>
      </TouchableOpacity>

      {step === 'mood' ? (
        <>
          <Text style={styles.question}>
            {getText('Hvordan har du det i dag?', 'How are you feeling today?')}
          </Text>

          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.score}
                style={[
                  styles.moodOption,
                  selectedMood === option.score && styles.moodOptionSelected,
                ]}
                onPress={() => handleMoodSelect(option.score)}
                activeOpacity={0.7}
              >
                <Text style={styles.moodEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    selectedMood === option.score && styles.moodLabelSelected,
                  ]}
                >
                  {option.label[locale === 'no' ? 'no' : 'en']}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.question}>
            {getText('Noe mer som beskriver deg?', 'Anything else describe you?')}
          </Text>

          <Text style={styles.subtext}>
            {getText('(valgfritt)', '(optional)')}
          </Text>

          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagOption,
                  selectedTags.includes(tag) && styles.tagOptionSelected,
                ]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>
              {getText('Ferdig!', 'Done!')} 👍
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.privacyNote}>
        {getText(
          'Dine svar er anonyme og brukes kun for teaminnsikt',
          'Your responses are anonymous and used only for team insights'
        )}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.secondary[100],
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 24,
    color: colors.text.tertiary,
    fontWeight: '300',
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  subtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: -16,
    marginBottom: 16,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moodOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
  },
  moodOptionSelected: {
    backgroundColor: colors.primary[50],
    transform: [{ scale: 1.1 }],
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  moodLabelSelected: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    marginHorizontal: -4,
  },
  tagOption: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
  },
  tagOptionSelected: {
    backgroundColor: colors.secondary[500],
  },
  tagText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  tagTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  privacyNote: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default MoodCheckInPrompt;
