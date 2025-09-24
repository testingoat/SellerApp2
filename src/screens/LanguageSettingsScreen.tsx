import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

interface Language {
  id: string;
  name: string;
  code: string;
}

const LanguageSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const languages: Language[] = [
    { id: 'en', name: 'English', code: 'en' },
    { id: 'es', name: 'Spanish', code: 'es' },
    { id: 'fr', name: 'French', code: 'fr' },
    { id: 'de', name: 'German', code: 'de' },
    { id: 'it', name: 'Italian', code: 'it' },
    { id: 'pt', name: 'Portuguese', code: 'pt' },
    { id: 'zh', name: 'Chinese', code: 'zh' },
    { id: 'ja', name: 'Japanese', code: 'ja' },
    { id: 'ko', name: 'Korean', code: 'ko' },
    { id: 'ar', name: 'Arabic', code: 'ar' },
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguage(languageId);
  };

  const handleSave = () => {
    const selectedLang = languages.find(lang => lang.id === selectedLanguage);
    Alert.alert(
      'Language Updated',
      `Language changed to ${selectedLang?.name}. Please restart the app for changes to take effect.`,
      [{ text: 'OK' }]
    );
  };

  const renderLanguageOption = (language: Language) => (
    <TouchableOpacity
      key={language.id}
      style={[
        styles.languageOption,
        selectedLanguage === language.id && styles.selectedLanguageOption,
      ]}
      onPress={() => handleLanguageSelect(language.id)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.languageName,
        selectedLanguage === language.id && styles.selectedLanguageName,
      ]}>
        {language.name}
      </Text>
      <View style={[
        styles.radioButton,
        selectedLanguage === language.id && styles.selectedRadioButton,
      ]}>
        {selectedLanguage === language.id && (
          <View style={styles.radioButtonInner} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Select Language</Text>
          <View style={styles.languageList}>
            {languages.map(renderLanguageOption)}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f6f8f6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 227, 64, 0.2)',
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
    color: '#1f2937',
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
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  languageList: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 227, 64, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedLanguageOption: {
    borderColor: '#3be340',
    backgroundColor: 'rgba(59, 227, 64, 0.1)',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  selectedLanguageName: {
    color: '#3be340',
    fontWeight: '600',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(59, 227, 64, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioButton: {
    borderColor: '#3be340',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3be340',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f6f8f6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: '#3be340',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#112112',
  },
});

export default LanguageSettingsScreen;
