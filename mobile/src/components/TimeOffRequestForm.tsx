import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useLocale } from '../context/LocaleContext';
import api from '../services/api';

interface TimeOffRequestFormProps {
  onSuccess?: () => void;
}

export const TimeOffRequestForm: React.FC<TimeOffRequestFormProps> = ({
  onSuccess,
}) => {
  const { t } = useLocale();
  const [type, setType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeOffTypes = [
    { value: 'vacation', label: t('timeoff.vacation') },
    { value: 'sick', label: t('timeoff.sick') },
    { value: 'personal', label: t('timeoff.personal') },
  ];

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      Alert.alert(t('common.error'), 'Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.submitTimeOffRequest({
        type,
        startDate,
        endDate,
        reason,
      });

      Alert.alert(t('common.success'), 'Time off request submitted');

      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('timeoff.type')}</Text>
      <View style={styles.typeSelector}>
        {timeOffTypes.map((typeOption) => (
          <TouchableOpacity
            key={typeOption.value}
            style={[
              styles.typeButton,
              type === typeOption.value && styles.typeButtonActive,
            ]}
            onPress={() => setType(typeOption.value)}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === typeOption.value && styles.typeButtonTextActive,
              ]}
            >
              {typeOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('timeoff.startDate')}</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9E9E9E"
      />

      <Text style={styles.label}>{t('timeoff.endDate')}</Text>
      <TextInput
        style={styles.input}
        value={endDate}
        onChangeText={setEndDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9E9E9E"
      />

      <Text style={styles.label}>{t('timeoff.reason')} (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={reason}
        onChangeText={setReason}
        placeholder={t('timeoff.reason')}
        placeholderTextColor="#9E9E9E"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? t('common.loading') : t('timeoff.submit')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#616161',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TimeOffRequestForm;
