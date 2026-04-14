import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { routeAPI, locationAPI } from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [routeActive, setRouteActive] = useState(false);
  const [busInfo, setBusInfo] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pickedUp: 0,
    droppedOff: 0,
    onBus: 0,
  });
  const [loading, setLoading] = useState(true);
  const [locationWatcher, setLocationWatcher] = useState(null);

  useEffect(() => {
    fetchRouteData();
    return () => {
      if (locationWatcher) {
        locationWatcher.remove();
      }
    };
  }, []);

  const fetchRouteData = async () => {
    try {
      const response = await routeAPI.getCurrentRoute();
      const data = response.data?.data || response.data || {};
      setStats({
        totalStudents: data.totalStudents ?? 0,
        pickedUp: data.pickedUp ?? 0,
        droppedOff: data.droppedOff ?? 0,
        onBus: data.onBus ?? 0,
      });
      setRouteActive(data.active || false);
      setBusInfo(data.bus || null);
    } catch (error) {
      console.error('Failed to fetch route:', error);
      setStats({ totalStudents: 0, pickedUp: 0, droppedOff: 0, onBus: 0 });
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for tracking');
      return;
    }

    const watcher = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 50,
      },
      async (location) => {
        try {
          await locationAPI.updateLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed || 0,
            heading: location.coords.heading || 0,
          });
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      }
    );

    setLocationWatcher(watcher);
  };

  const handleStartRoute = async () => {
    try {
      await routeAPI.startRoute();
      setRouteActive(true);
      await startLocationTracking();
      Alert.alert('Success', 'Route started! Location tracking is now active.');
    } catch (error) {
      console.error('Failed to start route:', error);
      Alert.alert('Error', 'Failed to start route. Please try again.');
    }
  };

  const handleEndRoute = async () => {
    Alert.alert(
      'End Route',
      'Are you sure you want to end your route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Route',
          style: 'destructive',
          onPress: async () => {
            try {
              await routeAPI.endRoute();
              setRouteActive(false);
              if (locationWatcher) {
                locationWatcher.remove();
                setLocationWatcher(null);
              }
              Alert.alert('Success', 'Route ended successfully.');
            } catch (error) {
              console.error('Failed to end route:', error);
              setRouteActive(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Driver'}!</Text>
            <Text style={styles.subGreeting}>
              {busInfo
                ? `Bus ${busInfo.busNumber} · ${busInfo.routeName}`
                : routeActive
                ? 'Route in progress'
                : 'Ready to start your route?'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Route Status Card */}
        <View style={[styles.statusCard, routeActive ? styles.statusCardActive : styles.statusCardInactive]}>
          <View style={styles.statusIconContainer}>
            <Ionicons
              name={routeActive ? 'bus' : 'bus-outline'}
              size={32}
              color="#fff"
            />
          </View>
          <Text style={styles.statusTitle}>
            {routeActive ? 'Route Active' : 'Route Inactive'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {routeActive ? 'Location is being shared with parents' : 'Tap below to start tracking'}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="people" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="bus" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statNumber}>{stats.onBus}</Text>
            <Text style={styles.statLabel}>On Bus</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="arrow-up-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{stats.pickedUp}</Text>
            <Text style={styles.statLabel}>Picked Up</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="school" size={24} color="#6366F1" />
            </View>
            <Text style={styles.statNumber}>{stats.droppedOff}</Text>
            <Text style={styles.statLabel}>At School</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!routeActive ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStartRoute}>
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Start Route</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.endButton} onPress={handleEndRoute}>
              <Ionicons name="stop-circle" size={24} color="#fff" />
              <Text style={styles.endButtonText}>End Route</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('Scan')}
          >
            <Ionicons name="scan" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Student</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Students')}
          >
            <Ionicons name="list" size={24} color="#3B82F6" />
            <Text style={styles.secondaryButtonText}>View Student List</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subGreeting: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statusCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  statusCardActive: {
    backgroundColor: '#10B981',
  },
  statusCardInactive: {
    backgroundColor: '#6B7280',
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 12,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  endButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
