import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { serviceAPI, ratingAPI } from '../../services/api';
import RatingStars from '../../components/RatingStars';
import TrustBadge from '../../components/TrustBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ServiceDetailScreenProps {
  route: {
    params: { serviceId: string };
  };
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  photos: string[];
  user_id: string;
  user_name?: string;
  rating_avg?: number;
  is_verified?: boolean;
  distance_km?: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  user_name?: string;
  created_at: string;
}

const ServiceDetailScreen: React.FC<ServiceDetailScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { serviceId } = route.params;
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [serviceId]);

  const loadData = async () => {
    try {
      const [serviceRes, ratingsRes] = await Promise.all([
        serviceAPI.getService(serviceId),
        ratingAPI.getServiceRatings(serviceId),
      ]);
      setService(serviceRes.data);
      setReviews(ratingsRes.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (service) {
      navigation.navigate('Chat', { userId: service.user_id, userName: service.user_name });
    }
  };

  if (loading || !service) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.photosPlaceholder}>
        <Text style={styles.photosIcon}>📸</Text>
        <Text style={styles.photosLabel}>{t('service.photos')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{service.title}</Text>
          {service.is_verified && <TrustBadge type="verified" />}
        </View>

        <Text style={styles.category}>{service.category}</Text>

        {service.user_name && (
          <Text style={styles.provider}>
            {t('service.provider')}: {service.user_name}
          </Text>
        )}

        {service.rating_avg != null && (
          <View style={styles.ratingRow}>
            <RatingStars rating={service.rating_avg} showValue />
          </View>
        )}

        {service.distance_km != null && (
          <Text style={styles.distance}>
            {t('service.distance')}: {service.distance_km.toFixed(1)} {t('search.distance', { distance: '' })}
          </Text>
        )}

        <Text style={styles.sectionTitle}>{t('service.description')}</Text>
        <Text style={styles.description}>{service.description}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleContact}>
            <Text style={styles.primaryButtonText}>{t('service.contactNow')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{t('service.requestService')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t('service.reviews')}</Text>
        {reviews.length === 0 ? (
          <Text style={styles.noReviews}>{t('service.noReviews')}</Text>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <RatingStars rating={review.rating} size={12} />
                {review.user_name && (
                  <Text style={styles.reviewAuthor}>{review.user_name}</Text>
                )}
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  photosPlaceholder: {
    height: 200,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photosIcon: {
    fontSize: 48,
  },
  photosLabel: {
    fontSize: 14,
    color: '#616161',
    marginTop: 8,
  },
  content: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'right',
    flex: 1,
  },
  category: {
    fontSize: 14,
    color: '#00897B',
    textAlign: 'right',
    marginBottom: 8,
  },
  provider: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'right',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  distance: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'right',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'right',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'right',
    lineHeight: 22,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#00897B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00897B',
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#00897B',
    fontSize: 16,
    fontWeight: '600',
  },
  noReviews: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingVertical: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewAuthor: {
    fontSize: 12,
    color: '#616161',
  },
  reviewComment: {
    fontSize: 13,
    color: '#212121',
    textAlign: 'right',
    lineHeight: 20,
  },
});

export default ServiceDetailScreen;
