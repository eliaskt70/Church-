import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import RatingStars from './RatingStars';
import TrustBadge from './TrustBadge';

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  distance_km?: number;
  rating?: number;
  is_verified?: boolean;
  onPress: (id: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  title,
  description,
  category,
  distance_km,
  rating,
  is_verified,
  onPress,
}) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(id)} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {is_verified && <TrustBadge type="verified" />}
      </View>
      <Text style={styles.category}>{category}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
      <View style={styles.footer}>
        {rating != null && <RatingStars rating={rating} size={14} />}
        {distance_km != null && (
          <Text style={styles.distance}>
            {t('search.distance', { distance: distance_km.toFixed(1) })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'right',
    flex: 1,
  },
  category: {
    fontSize: 12,
    color: '#00897B',
    marginBottom: 6,
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'right',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    fontSize: 12,
    color: '#9E9E9E',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
});

export default ServiceCard;
