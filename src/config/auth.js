// config/auth.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './config';

const storeUserData = async (userData) => {
  try {
    await AsyncStorage.setItem('userId', String(userData.user_id));
    await AsyncStorage.setItem('username', userData.username);
    await AsyncStorage.setItem('role', userData.role);
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

const getUserId = async () => {
  try {
    return await AsyncStorage.getItem('userId');
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

const clearUserData = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { // No /api prefix
      username,
      password
    });
    
    if (response.data.message === 'Login successful') {
      await storeUserData(response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error.response?.data?.error || 'Login failed';
  }
};

export const register = async (username, password, name, gender, age, salary) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { // No /api prefix
      username,
      password,
      name,
      gender,
      age,
      salary
    });
    
    if (response.data.message === 'User registered successfully') {
      return response.data;
    }
  } catch (error) {
    console.error('Register error:', error.response?.data || error.message);
    throw error.response?.data?.error || 'Registration failed';
  }
};

export const logout = async () => {
  await clearUserData();
};

export { getUserId };