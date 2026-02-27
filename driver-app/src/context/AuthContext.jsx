import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const savedUser = await AsyncStorage.getItem('driver_user');
      
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { user: userData, tokens } = response.data.data;
    
    if (userData.role !== 'driver') {
      throw new Error('Access denied. Driver account required.');
    }
    
    await AsyncStorage.setItem('driver_token', tokens.accessToken);
    await AsyncStorage.setItem('driver_refreshToken', tokens.refreshToken);
    await AsyncStorage.setItem('driver_user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('driver_token');
    await AsyncStorage.removeItem('driver_refreshToken');
    await AsyncStorage.removeItem('driver_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
