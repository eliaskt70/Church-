import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { serviceAPI } from '../../services/api';
import CategoryChip from '../../components/CategoryChip';
import TrustBadge from '../../components/TrustBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

let MapView: React.ComponentType<any> | null = null;
let Marker: React.ComponentType<any> | null = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch {
    // Maps not available
  }
}

interface Service {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  is_verified?: boolean;
}

const CATEGORIES = [
  { key: 'homeMaintenance', label: 'categories.homeMaintenance' },
  { key: 'educational', label: 'categories.educational' },
  { key: 'handcrafts', label: 'categories.handcrafts' },
  { key: 'homeCooking', label: 'categories.homeCooking' },
  { key: 'delivery', label: 'categories.delivery' },
  { key: 'beauty', label: 'categories.beauty' },
  { key: 'techSupport', label: 'categories.techSupport' },
];

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { latitude, longitude, loading: locationLoading } = useLocation();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      fetchServices();
    }
  }, [latitude, longitude, selectedCategory]);

  const fetchServices = async () => {
    if (!latitude || !longitude) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        lat: latitude,
        lng: longitude,
        radius_km: 2,
      };
      if (selectedCategory) params.category = selectedCategory;
      const response = await serviceAPI.getServices(params as any);
      setServices(response.data);
    } catch {
      // handle error silently for now
    } finally {
      setLoading(false);
    }
  };

  if (locationLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          {t('home.welcome')} {user?.name || ''}
        </Text>
        <Text style={styles.neighborhood}>{t('home.nearbyServices')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.key}
            label={t(cat.label)}
            isSelected={selectedCategory === cat.key}
            onPress={() =>
              setSelectedCategory(selectedCategory === cat.key ? null : cat.key)
            }
          />
        ))}
      </ScrollView>

      <View style={styles.mapContainer}>
        {MapView && latitude && longitude ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {Marker &&
              services.map((service) => (
                <Marker
                  key={service.id}
                  coordinate={{
                    latitude: service.latitude,
                    longitude: service.longitude,
                  }}
                  title={service.title}
                />
              ))}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>🗺️</Text>
            <Text style={styles.mapPlaceholderLabel}>{t('home.nearbyServices')}</Text>
            {services.map((service) => (
              <View key={service.id} style={styles.serviceItem}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                {service.is_verified && <TrustBadge type="verified" />}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'right',
  },
  neighborhood: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'right',
    marginTop: 4,
  },
  categoriesScroll: {
    maxHeight: 56,
    marginVertical: 8,
  },
  categoriesContent: {
    paddingHorizontal: 12,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  mapPlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapPlaceholderLabel: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
    justifyContent: 'flex-end',
  },
  serviceTitle: {
    fontSize: 14,
    color: '#212121',
    marginLeft: 8,
  },
});

export default HomeScreen;
