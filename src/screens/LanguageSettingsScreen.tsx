import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { changeLanguage, AVAILABLE_LANGUAGES, getCurrentLanguage } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import httpClient from '../services/httpClient';

const LanguageSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLang) {
      return;
    }

    setLoading(true);
    try {
      // Change language in app
      const success = await changeLanguage(languageCode);

      if (success) {
        // Update language preference on server
        try {
          await httpClient.put('/seller/profile', {
            languagePreference: languageCode,
          });
          console.log('✅ Language preference saved to server');
        } catch (serverError) {
          console.warn('⚠️ Failed to save language to server:', serverError);
          // Continue anyway - local change was successful
        }

        setCurrentLang(languageCode);
        Alert.alert(
          t('common.success'),
          t('language.languageChanged'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(t('common.error'), t('language.languageChangeFailed'));
      }
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.error'), t('language.languageChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBarStyle as any} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('language.selectLanguage')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('language.currentLanguage')}: {AVAILABLE_LANGUAGES.find(l => l.code === currentLang)?.nativeName}
          </Text>

          <View style={styles.languageList}>
            {AVAILABLE_LANGUAGES.map((language) => {
              const isSelected = language.code === currentLang;

              return (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isSelected && { borderColor: theme.primary, backgroundColor: theme.primary + '20' },
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <View style={styles.languageInfo}>
                    <Text style={[
                      styles.languageName,
                      { color: theme.text },
                      isSelected && { color: theme.primary, fontWeight: '600' },
                    ]}>
                      {language.nativeName}
                    </Text>
                    <Text style={[styles.languageCode, { color: theme.textSecondary }]}>
                      {language.name}
                    </Text>
                  </View>

                  {isSelected && (
                    <Icon name="check-circle" size={24} color={theme.primary} />
                  )}

                  {loading && language.code !== currentLang && (
                    <ActivityIndicator size="small" color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.infoBox, { backgroundColor: theme.primary + '20' }]}>
            <Icon name="info" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Language changes will take effect immediately. Your preference will be saved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  languageList: {
    gap: 12,
    marginTop: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageCode: {
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginTop: 24,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default LanguageSettingsScreen;
