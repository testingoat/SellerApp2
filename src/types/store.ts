// Store Registration Types and Interfaces
import { LocationData } from './location';

export interface StoreRegistrationData {
  storeName: string;
  ownerName: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  gstNumber?: string;
  bankAccount?: string;
  ifscCode?: string;
  // Location data for store coordinates
  storeLocation?: LocationData;
}

export interface StoreRegistrationRequest extends StoreRegistrationData {
  phone: string; // Will be added from auth state
}

export interface StoreRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    storeId: string;
    storeName: string;
    status: 'pending' | 'approved' | 'rejected';
    profileCompleted: boolean;
  };
  error?: string;
}

export interface BankAccountInfo {
  bankName?: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName?: string;
}

export interface StoreInfo {
  id: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  gstNumber?: string;
  bankAccounts: BankAccountInfo[];
  isActive: boolean;
  isVerified: boolean;
  profileCompleted: boolean;
  businessHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  deliveryAreas?: string[];
  createdAt: string;
  updatedAt: string;
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  validationErrors?: ValidationError[];
}