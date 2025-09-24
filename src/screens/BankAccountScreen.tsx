import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

interface BankAccountData {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  documentType: string;
}

const BankAccountScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<BankAccountData>({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    documentType: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const documentTypes = [
    { label: 'Select document type', value: '' },
    { label: 'Bank Passbook First Page', value: 'passbook' },
    { label: 'Bank Statement', value: 'statement' },
    { label: 'Cancelled Cheque', value: 'cheque' },
  ];

  const updateFormData = (field: keyof BankAccountData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.bankName.trim()) {
      Alert.alert('Error', 'Please enter bank name');
      return false;
    }
    if (!formData.accountNumber.trim()) {
      Alert.alert('Error', 'Please enter account number');
      return false;
    }
    if (!formData.ifscCode.trim()) {
      Alert.alert('Error', 'Please enter IFSC code');
      return false;
    }
    if (!formData.accountHolderName.trim()) {
      Alert.alert('Error', 'Please enter account holder name');
      return false;
    }
    if (!formData.documentType) {
      Alert.alert('Error', 'Please select document type');
      return false;
    }
    return true;
  };

  const handleAddAccount = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Success',
        'Bank account added successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  const handleUploadDocument = () => {
    Alert.alert('Upload Document', 'Document upload functionality will be implemented');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Bank Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Bank Name */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter bank name"
              placeholderTextColor="#648765"
              value={formData.bankName}
              onChangeText={(text) => updateFormData('bankName', text)}
            />
          </View>

          {/* Account Number */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter account number"
              placeholderTextColor="#648765"
              value={formData.accountNumber}
              onChangeText={(text) => updateFormData('accountNumber', text)}
              keyboardType="numeric"
            />
          </View>

          {/* IFSC Code */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>IFSC Code</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter IFSC code"
              placeholderTextColor="#648765"
              value={formData.ifscCode}
              onChangeText={(text) => updateFormData('ifscCode', text.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>

          {/* Account Holder Name */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter account holder name"
              placeholderTextColor="#648765"
              value={formData.accountHolderName}
              onChangeText={(text) => updateFormData('accountHolderName', text)}
            />
          </View>

          {/* Document Type */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Bank Proof Document</Text>
            <TouchableOpacity style={styles.pickerContainer}>
              <Text style={[styles.pickerText, !formData.documentType && styles.placeholderText]}>
                {formData.documentType ? 
                  documentTypes.find(doc => doc.value === formData.documentType)?.label :
                  'Select document type'
                }
              </Text>
              <Icon name="keyboard-arrow-down" size={24} color="#3be340" />
            </TouchableOpacity>
          </View>

          {/* Upload Document */}
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadDocument}>
            <Icon name="upload-file" size={24} color="#3be340" />
            <Text style={styles.uploadButtonText}>Upload Document</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Account Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.addButton, isLoading && styles.addButtonDisabled]}
          onPress={handleAddAccount}
          disabled={isLoading}
        >
          <Text style={styles.addButtonText}>
            {isLoading ? 'Adding Account...' : 'Add Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111712',
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
    gap: 24,
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111712',
  },
  textInput: {
    backgroundColor: '#f0f4f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111712',
    height: 56,
  },
  pickerContainer: {
    backgroundColor: '#f0f4f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  pickerText: {
    fontSize: 16,
    color: '#111712',
  },
  placeholderText: {
    color: '#648765',
  },
  uploadButton: {
    backgroundColor: '#f0f4f0',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#3be340',
    borderStyle: 'dashed',
    height: 56,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3be340',
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
  addButton: {
    backgroundColor: '#3be340',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: '#112112',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default BankAccountScreen;
