import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface TrustBadgeProps {
  type: 'verified' | 'neighbor';
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ type }) => {
  const { t } = useTranslation();

  const label = type === 'verified' ? t('trust.verified') : t('trust.neighbor');

  return (
    <View style={styles.badge}>
      <Text style={styles.icon}>✓</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  icon: {
    color: '#2E7D32',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  label: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '500',
  },
});

export default TrustBadge;
