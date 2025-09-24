// Test utilities for development and debugging
import { useAuthStore } from '../state/authStore';

export interface TestUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  isVerified: boolean;
  profileCompleted: boolean;
}

export const testUsers = {
  existingUser: {
    id: '12345',
    name: 'John Seller',
    phone: '+91 9876543210',
    role: 'seller',
    isVerified: true,
    profileCompleted: true,
  },
  newUser: {
    id: '67890',
    name: 'New Seller',
    phone: '+91 1234567890',
    role: 'seller',
    isVerified: true,
    profileCompleted: false,
  },
};

// Force new user flow for testing
export const simulateNewUserOTPVerification = async (phone: string, otp: string) => {
  const { setLoading } = useAuthStore.getState();
  
  try {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if this is a "new" test phone number
    const isNewUser = phone.endsWith('1111') || phone.includes('new');
    
    console.log('🧪 Test Mode: Simulating OTP verification for', phone, 'isNewUser:', isNewUser);
    
    if (isNewUser) {
      // Simulate new user response
      useAuthStore.setState({
        user: {
          id: testUsers.newUser.id,
          name: testUsers.newUser.name,
          phone: phone,
          role: testUsers.newUser.role,
          isVerified: true,
          profileCompleted: false,
        },
        token: 'test-token-new-user-' + Date.now(),
        isAuthenticated: true,
        isLoading: false,
        isNewUser: true,
        tempPhone: null,
      });
    } else {
      // Simulate existing user response
      useAuthStore.setState({
        user: {
          id: testUsers.existingUser.id,
          name: testUsers.existingUser.name,
          phone: phone,
          role: testUsers.existingUser.role,
          isVerified: true,
          profileCompleted: true,
        },
        token: 'test-token-existing-user-' + Date.now(),
        isAuthenticated: true,
        isLoading: false,
        isNewUser: false,
        tempPhone: null,
      });
    }
    
    return { success: true, isNewUser };
  } catch (error) {
    setLoading(false);
    throw error;
  }
};

// Force new user state for testing store registration flow
export const forceNewUserState = () => {
  console.log('🧪 Test Mode: Forcing new user state');
  useAuthStore.setState({
    isNewUser: true,
    user: {
      id: testUsers.newUser.id,
      name: 'Test New Seller',
      phone: '+91 1111111111',
      role: 'seller',
      isVerified: true,
      profileCompleted: false,
    },
    token: 'test-token-forced-new-user',
    isAuthenticated: true,
    isLoading: false,
    tempPhone: null,
  });
};

// Check if we're in development mode and should enable test features
export const isDevelopmentMode = () => __DEV__;

// Test phone numbers that will trigger new user flow
export const testPhoneNumbers = {
  newUser: '+91 1111111111',
  existingUser: '+91 9999999999',
  newUser2: '+91 2222222222',
  newUser3: '+91 3333333333',
};

export const isTestPhoneNumber = (phone: string): boolean => {
  return Object.values(testPhoneNumbers).includes(phone);
};

export const shouldTriggerNewUserFlow = (phone: string): boolean => {
  return phone === testPhoneNumbers.newUser || 
         phone === testPhoneNumbers.newUser2 || 
         phone === testPhoneNumbers.newUser3 ||
         phone.includes('new') ||
         phone.endsWith('1111');
};