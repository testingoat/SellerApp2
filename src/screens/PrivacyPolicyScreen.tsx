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

const PrivacyPolicyScreen: React.FC = () => {
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>Last Updated: October 3, 2025</Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. Introduction</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            GoatGoat ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Seller App. Please read this privacy policy carefully.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. Information We Collect</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We collect information that you provide directly to us, including:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Personal Information: Name, email address, phone number</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Business Information: Store name, address, GST number</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Financial Information: Bank account details, IFSC code</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Product Information: Product listings, images, descriptions, prices</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Transaction Data: Order history, sales data, payment information</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Device Information: Device type, operating system, unique device identifiers</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Location Data: Store location, delivery area</Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. How We Use Your Information</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We use the information we collect to:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Provide, maintain, and improve our services</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Process your transactions and send related information</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Send you technical notices, updates, and support messages</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Respond to your comments, questions, and customer service requests</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Monitor and analyze trends, usage, and activities</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Detect, prevent, and address technical issues and fraudulent activities</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Comply with legal obligations</Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. Information Sharing and Disclosure</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We may share your information in the following circumstances:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• With Customers: Your store name, location, and product information</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• With Service Providers: Third-party vendors who perform services on our behalf</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• For Legal Reasons: To comply with legal obligations or protect our rights</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• With Your Consent: When you explicitly agree to share information</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We do not sell your personal information to third parties.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>5. Data Security</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>6. Data Retention</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>7. Your Rights</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            You have the right to:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Access your personal information</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Correct inaccurate or incomplete information</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Request deletion of your information</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Object to processing of your information</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Request data portability</Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>• Withdraw consent at any time</Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>8. Push Notifications</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We may send you push notifications regarding orders, updates, and promotional offers. You can opt-out of receiving push notifications by changing your device settings or through the App settings.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>9. Location Information</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We collect and use your store location to display your store to nearby customers and facilitate order delivery. You can control location permissions through your device settings.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>10. Cookies and Tracking Technologies</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We use cookies and similar tracking technologies to track activity on our App and hold certain information. You can instruct your device to refuse all cookies or to indicate when a cookie is being sent.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>11. Third-Party Services</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            Our App may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>12. Children's Privacy</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            Our App is not intended for use by children under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>13. Changes to This Privacy Policy</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>14. Contact Us</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            If you have any questions about this Privacy Policy, please contact us at:
          </Text>
          <Text style={[styles.contactInfo, { color: theme.colors.primary }]}>Email: privacy@goatgoat.com</Text>
          <Text style={[styles.contactInfo, { color: theme.colors.primary }]}>Phone: +91 99 6738 9263</Text>
          <Text style={[styles.contactInfo, { color: theme.colors.primary }]}>Address: Belgaum, Karnataka, India</Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>15. Compliance with Indian Laws</Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            This Privacy Policy is designed to comply with the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
          </Text>

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

export default PrivacyPolicyScreen;

