// Simple validation script to check if all modules are correctly imported
import React from 'react';
import { useAuthStore } from '../state/authStore';
import { httpClient } from '../services/httpClient';
import { authService } from '../services/authService';
import { API_ENDPOINTS } from '../config';

console.log('✅ All imports successful');
console.log('Auth Store:', useAuthStore);
console.log('HTTP Client:', httpClient);
console.log('Auth Service:', authService);
console.log('API Endpoints:', API_ENDPOINTS);