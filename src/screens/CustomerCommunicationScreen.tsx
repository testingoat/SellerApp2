import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

interface CustomerData {
  name: string;
  phone: string;
  orderId: string;
  image: string;
}

const CustomerCommunicationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get customer data from route params or use default
  const customerData: CustomerData = route.params?.customer || {
    name: 'Sophia Carter',
    phone: '+1 (555) 123-4567',
    orderId: '#123456789',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJBqFh46510iKZFPrdLzARQWIS4Rkzyzl0mHywgmmQDw-11DSk_sUqvvPd7GJfJ_hSArIQDMXDXJ5zLqlpPdy4EJpHZFxy6FtSGFVAWZ2yxRM69rwijXCYO00nEvaiWwZ0WI2GZSItefDbghccRPEhFVQbvMU_WfIEvvvcRT2mbiZ75a6xdlfNWxNN2jOKvO9JW4SM93_YhilH6gujkiB5uSaorK78chpihBg_XURZUIA5E8-b0PP8jNyQgcF45mLn6wkCqAnNp08',
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCall = async () => {
    try {
      const phoneNumber = customerData.phone.replace(/[^\d+]/g, '');
      const url = `tel:${phoneNumber}`;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to make phone call');
    }
  };

  const handleMessage = () => {
    Alert.alert(
      'Message Customer',
      'Messaging functionality will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Customer</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Customer Profile */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: customerData.image }}
            style={styles.profileImage}
          />
          <Text style={styles.customerName}>{customerData.name}</Text>
          <Text style={styles.orderId}>Order {customerData.orderId}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <Icon name="call" size={24} color="#112112" />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.messageButton}
            onPress={handleMessage}
            activeOpacity={0.8}
          >
            <Icon name="chat-bubble" size={24} color="#1f2937" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  profileImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    marginBottom: 24,
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    color: 'rgba(31, 41, 55, 0.7)',
  },
  actionsSection: {
    width: '100%',
    gap: 16,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3be340',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  callButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#112112',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 227, 64, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
});

export default CustomerCommunicationScreen;
