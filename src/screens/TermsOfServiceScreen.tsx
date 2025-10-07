import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeTheme } from '../hooks/useSafeTheme';

const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useSafeTheme();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>Last Updated: October 3, 2025</Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            By accessing and using the GoatGoat Seller App ("the App"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use the App.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. Seller Registration</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            To use the App, you must register as a seller and provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. Seller Obligations</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            As a seller on our platform, you agree to:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Provide accurate product information and pricing</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Maintain adequate inventory levels</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Process orders promptly and efficiently</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Deliver products within the promised timeframe</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Comply with all applicable laws and regulations</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Maintain food safety standards (if applicable)</Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. Product Listings</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            You are solely responsible for the content of your product listings. All products must comply with Indian laws and regulations. We reserve the right to remove any product listing that violates our policies or applicable laws.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>5. Pricing and Payments</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            You are responsible for setting your product prices. GoatGoat will charge a commission on each sale as per the agreed rate. Payments will be processed according to our payment schedule. You agree to provide valid bank account details for receiving payments.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>6. Order Fulfillment</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            You must fulfill orders within the delivery timeframe specified. Failure to fulfill orders may result in penalties, suspension, or termination of your seller account. You must notify customers promptly of any delays or issues.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>7. Returns and Refunds</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            You must comply with our returns and refunds policy. Customers have the right to return products that are defective, damaged, or not as described. You are responsible for processing returns and issuing refunds as per our policy.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>8. Intellectual Property</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            You retain ownership of your product images and descriptions. However, by uploading content to the App, you grant GoatGoat a non-exclusive, worldwide license to use, display, and distribute your content for the purpose of operating the platform.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>9. Prohibited Activities</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            You agree not to:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Sell counterfeit, illegal, or prohibited products</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Engage in fraudulent activities</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Manipulate prices or ratings</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Violate any applicable laws or regulations</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Interfere with the operation of the platform</Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>10. Account Suspension and Termination</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We reserve the right to suspend or terminate your account at any time for violation of these Terms of Service, fraudulent activity, or any other reason we deem appropriate. You may also terminate your account at any time by contacting our support team.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>11. Limitation of Liability</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            GoatGoat shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the App. Our total liability shall not exceed the amount of commissions paid by you in the past 12 months.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>12. Indemnification</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            You agree to indemnify and hold harmless GoatGoat, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising from your use of the App or violation of these Terms.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>13. Governing Law</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>14. Changes to Terms</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We reserve the right to modify these Terms of Service at any time. We will notify you of any changes by posting the new Terms on the App. Your continued use of the App after such changes constitutes your acceptance of the new Terms.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>15. Contact Information</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            If you have any questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={[styles.contactInfo, { color: theme.colors.primary }]}>Email: support@goatgoat.com</Text>
          <Text style={[styles.contactInfo, { color: theme.colors.primary }]}>Phone: +91 99 6738 9263</Text>
          <Text style={[styles.contactInfo, { color: theme.colors.primary }]}>Address: Belgaum, Karnataka, India</Text>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
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
    borderBottomColor: 'rgba(31, 41, 55, 0.1)',
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
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(31, 41, 55, 0.6)',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: 'rgba(31, 41, 55, 0.8)',
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: 'rgba(31, 41, 55, 0.8)',
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 8,
  },
  contactInfo: {
    fontSize: 14,
    color: 'rgba(31, 41, 55, 0.8)',
    lineHeight: 22,
    marginBottom: 4,
    paddingLeft: 8,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default TermsOfServiceScreen;

