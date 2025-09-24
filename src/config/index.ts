// SellerApp2 Environment Configuration
// This file configures the staging server for SellerApp2

const API_BASE_URL = 'https://staging.goatgoat.tech/api';
const SELLER_API_URL = `${API_BASE_URL}/seller`;

export const API_ENDPOINTS = {
  // Authentication endpoints
  LOGIN: `${SELLER_API_URL}/login`,
  VERIFY_OTP: `${SELLER_API_URL}/verify-otp`,
  RESEND_OTP: `${SELLER_API_URL}/resend-otp`,
  LOGOUT: `${SELLER_API_URL}/logout`,

  // Seller profile endpoints
  PROFILE: `${SELLER_API_URL}/profile`,
  UPDATE_PROFILE: `${SELLER_API_URL}/profile`,

  // Store registration and management endpoints  
  STORE_REGISTER: `${SELLER_API_URL}/register`, // Use register endpoint for completing seller registration
  STORE: `${SELLER_API_URL}/profile`,
  UPDATE_STORE: `${SELLER_API_URL}/register`,

  // Products endpoints (for future use)
  PRODUCTS: `${SELLER_API_URL}/products`,
  ADD_PRODUCT: `${SELLER_API_URL}/products`,
  UPDATE_PRODUCT: `${SELLER_API_URL}/products`,
  DELETE_PRODUCT: `${SELLER_API_URL}/products`,
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'seller_auth_token',
  USER_DATA: 'seller_user_data',
  STORE_DATA: 'seller_store_data',
} as const;

export const CONFIG = {
  API_TIMEOUT: 30000, // 30 seconds
  OTP_RESEND_DELAY: 30, // 30 seconds
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes in milliseconds
} as const;