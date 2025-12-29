import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocale } from '../context/LocaleContext';

interface ComplianceIndicatorProps {
  status: 'compliant' | 'warning' | 'violation';
  issues?: string[];
}

export const ComplianceIndicator: React.FC<ComplianceIndicatorProps> = ({
  status,
  issues = [],
}) => {
  const { t } = useLocale();

  const getStatusColor = () => {
    switch (status) {
      case 'compliant':
        return '#4CAF50'; // Green
      case 'warning':
        return '#FF9800'; // Orange
      case 'violation':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'compliant':
        return t('compliance.compliant');
      case 'warning':
        return t('compliance.warning');
      case 'violation':
        return t('compliance.violation');
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.badgeText}>{getStatusText()}</Text>
      </View>
      {issues.length > 0 && (
        <View style={styles.issuesContainer}>
          {issues.map((issue, index) => (
            <Text key={index} style={styles.issueText}>
              • {issue}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  issuesContainer: {
    marginTop: 8,
    paddingLeft: 4,
  },
  issueText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
});

export default ComplianceIndicator;
