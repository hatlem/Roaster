// API Service for Mobile App
// Connects to Roster SaaS backend

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_URL = __DEV__
  ? 'http://localhost:3000/api'  // Development
  : 'https://api.roster-saas.com/api';  // Production

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, logout
          await AsyncStorage.removeItem('auth_token');
          // Navigate to login screen (handled by navigation)
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    const { token, user } = response.data;
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  }

  async logout() {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data.user;
  }

  // Schedule
  async getMyShifts(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await this.client.get(`/employee/shifts?${params}`);
    return response.data.shifts;
  }

  async getMyRosters() {
    const response = await this.client.get('/employee/rosters');
    return response.data.rosters;
  }

  // Marketplace
  async getAvailableShifts() {
    const response = await this.client.get('/marketplace/shifts');
    return response.data.listings;
  }

  async claimShift(listingId: string) {
    const response = await this.client.post(`/marketplace/shifts/${listingId}/claim`);
    return response.data;
  }

  // Time Off
  async submitTimeOffRequest(data: {
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    const response = await this.client.post('/timeoff/requests', data);
    return response.data.request;
  }

  async getMyTimeOffRequests() {
    const response = await this.client.get('/timeoff/requests');
    return response.data.requests;
  }

  async getAccrualBalances(year?: number) {
    const params = year ? `?year=${year}` : '';
    const response = await this.client.get(`/timeoff/balance${params}`);
    return response.data.balances;
  }

  // Notifications
  async getNotifications() {
    const response = await this.client.get('/employee/notifications');
    return response.data.notifications;
  }

  async markNotificationRead(notificationId: string) {
    await this.client.post(`/employee/notifications/${notificationId}/read`);
  }

  async markAllNotificationsRead() {
    await this.client.post('/employee/notifications/read-all');
  }

  // Preferences
  async getPreferences() {
    const response = await this.client.get('/employee/preferences');
    return response.data.preferences;
  }

  async updatePreferences(preferences: any) {
    const response = await this.client.post('/employee/preferences', preferences);
    return response.data.preference;
  }
}

export const api = new ApiService();
export default api;
