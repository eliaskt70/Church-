import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';

interface OTPScreenProps {
  route: {
    params: { phone: string };
  };
  navigation: {
    navigate: (screen: string) => void;
  };
}

const OTPScreen: React.FC<OTPScreenProps> = ({ route }) => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await login(phone, code);
    } catch {
      Alert.alert(t('common.error'), t('common.retry'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authAPI.requestOtp(phone);
      setResendTimer(60);
    } catch {
      Alert.alert(t('common.error'), t('common.retry'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.otpTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.enterOtp')}</Text>
      <Text style={styles.phone}>{phone}</Text>

      <TextInput
        style={styles.codeInput}
        value={code}
        onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="000000"
        placeholderTextColor="#9E9E9E"
        textAlign="center"
      />

      <TouchableOpacity
        style={[styles.button, (loading || code.length !== 6) && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading || code.length !== 6}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {loading ? t('common.loading') : t('auth.verifyOtp')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResend}
        disabled={resendTimer > 0}
        activeOpacity={0.7}
      >
        <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
          {resendTimer > 0
            ? t('auth.resendIn', { seconds: resendTimer })
            : t('auth.resendOtp')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#00897B',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  codeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    letterSpacing: 8,
    color: '#212121',
    textAlign: 'center',
    marginBottom: 24,
    minHeight: 56,
  },
  button: {
    backgroundColor: '#00897B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#00897B',
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: '#9E9E9E',
  },
});

export default OTPScreen;
