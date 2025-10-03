import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { changeLanguage, AVAILABLE_LANGUAGES, getCurrentLanguage } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import httpClient from '../services/httpClient';

const LanguageSelectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
  const [loading, setLoading] = useState(false);

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
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t('language.selectLanguage')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('language.currentLanguage')}: {AVAILABLE_LANGUAGES.find(l => l.code === currentLang)?.nativeName}
          </Text>
        </View>

        <View style={styles.languageList}>
          {AVAILABLE_LANGUAGES.map((language) => {
            const isSelected = language.code === currentLang;
            
            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  { backgroundColor: theme.card },
                  isSelected && { backgroundColor: theme.primary + '20' },
                ]}
                onPress={() => handleLanguageChange(language.code)}
                disabled={loading}
              >
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, { color: theme.text }]}>
                    {language.nativeName}
                  </Text>
                  <Text style={[styles.languageCode, { color: theme.textSecondary }]}>
                    {language.name}
                  </Text>
                </View>

                {isSelected && (
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color={theme.primary}
                  />
                )}

                {loading && language.code !== currentLang && (
                  <ActivityIndicator size="small" color={theme.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            The app will restart to apply the language change. Your preference will be saved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  languageList: {
    padding: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    margin: 16,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default LanguageSelectionScreen;

