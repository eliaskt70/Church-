import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { serviceAPI } from '../../services/api';
import TrustBadge from '../../components/TrustBadge';

interface Service {
  id: string;
  title: string;
  category: string;
}

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [myServices, setMyServices] = useState<Service[]>([]);

  useEffect(() => {
    if (user?.account_type === 'provider') {
      loadMyServices();
    }
  }, [user]);

  const loadMyServices = async () => {
    try {
      const response = await serviceAPI.getServices();
      setMyServices(response.data);
    } catch {
      // handle error
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0) || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || ''}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.accountTypeBadge}>
            <Text style={styles.accountTypeText}>
              {user?.account_type === 'provider'
                ? t('profile.provider')
                : t('profile.seeker')}
            </Text>
          </View>
          <TrustBadge type="neighbor" />
        </View>
      </View>

      <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
        <Text style={styles.menuItemText}>{t('profile.editProfile')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
        <Text style={styles.menuItemText}>{t('profile.settings')}</Text>
      </TouchableOpacity>

      {user?.account_type === 'provider' && (
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>{t('profile.myServices')}</Text>
          {myServices.map((service) => (
            <View key={service.id} style={styles.serviceItem}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceCategory}>{service.category}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
            <Text style={styles.addButtonText}>{t('profile.addService')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00897B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountTypeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accountTypeText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '500',
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    minHeight: 48,
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 15,
    color: '#212121',
    textAlign: 'right',
  },
  servicesSection: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'right',
    marginBottom: 12,
  },
  serviceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  serviceTitle: {
    fontSize: 14,
    color: '#212121',
    textAlign: 'right',
  },
  serviceCategory: {
    fontSize: 12,
    color: '#00897B',
    textAlign: 'right',
    marginTop: 2,
  },
  addButton: {
    marginTop: 12,
    backgroundColor: '#00897B',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    margin: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  logoutText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileScreen;
