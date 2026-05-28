import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../../hooks/useLocation';
import { serviceAPI } from '../../services/api';
import ServiceCard from '../../components/ServiceCard';
import CategoryChip from '../../components/CategoryChip';
import EmptyState from '../../components/EmptyState';
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
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  rating?: number;
  is_verified?: boolean;
}

interface SearchScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
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

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { latitude, longitude } = useLocation();
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [latitude, longitude, selectedCategory]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (latitude && longitude) {
        params.lat = latitude;
        params.lng = longitude;
        params.radius_km = 5;
      }
      if (selectedCategory) params.category = selectedCategory;
      const response = await serviceAPI.getServices(params as any);
      setServices(response.data);
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleServicePress = (id: string) => {
    navigation.navigate('ServiceDetail', { serviceId: id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('search.searchPlaceholder')}
          placeholderTextColor="#9E9E9E"
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
      </View>

      <View style={styles.categoriesRow}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          renderItem={({ item }) => (
            <CategoryChip
              label={t(item.label)}
              isSelected={selectedCategory === item.key}
              onPress={() =>
                setSelectedCategory(selectedCategory === item.key ? null : item.key)
              }
            />
          )}
        />
      </View>

      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            {t('search.listView')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
            {t('search.mapView')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : viewMode === 'list' ? (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ServiceCard
              id={item.id}
              title={item.title}
              description={item.description}
              category={item.category}
              distance_km={item.distance_km}
              rating={item.rating}
              is_verified={item.is_verified}
              onPress={handleServicePress}
            />
          )}
          ListEmptyComponent={<EmptyState message={t('search.noServicesFound')} icon="🔍" />}
          contentContainerStyle={filteredServices.length === 0 ? styles.emptyList : undefined}
        />
      ) : (
        <View style={styles.mapContainer}>
          {MapView && latitude && longitude ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {Marker &&
                filteredServices.map((service) => (
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
              <Text style={styles.mapPlaceholderLabel}>{t('search.mapView')}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 48,
    textAlign: 'right',
  },
  categoriesRow: {
    marginVertical: 8,
  },
  categoriesContent: {
    paddingHorizontal: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    minHeight: 48,
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#00897B',
  },
  toggleText: {
    fontSize: 14,
    color: '#616161',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  emptyList: {
    flex: 1,
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
  },
  mapPlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapPlaceholderLabel: {
    fontSize: 14,
    color: '#616161',
  },
});

export default SearchScreen;
