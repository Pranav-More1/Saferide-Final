import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { routeAPI, scanAPI } from '../services/api';

// Four-Step Commute status mapping
const STATUS_CONFIG = {
  not_boarded: { label: 'Not Boarded', color: '#6B7280', bg: '#F3F4F6', icon: 'time' },
  morning_picked_up: { label: 'Picked Up', color: '#F59E0B', bg: '#FEF3C7', icon: 'sunny' },
  at_school: { label: 'At School', color: '#10B981', bg: '#D1FAE5', icon: 'school' },
  evening_picked_up: { label: 'Going Home', color: '#8B5CF6', bg: '#EDE9FE', icon: 'partly-sunny' },
  dropped_home: { label: 'Home', color: '#3B82F6', bg: '#DBEAFE', icon: 'home' },
  absent: { label: 'Absent', color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle' },
};

export default function StudentsScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await routeAPI.getStudentsList();
      // Backend returns { success: true, students: [...] }
      const list = response.data?.students || response.data?.data || [];
      setStudents(list);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);

    } finally {
      setLoading(false);
    }
  };

  // Determine the next scan type based on current status
  const getNextScanType = (status) => {
    switch (status) {
      case 'not_boarded': return 'morning_pickup';
      case 'morning_picked_up': return 'morning_dropoff';
      case 'at_school': return 'evening_pickup';
      case 'evening_picked_up': return 'evening_dropoff';
      default: return null; // Already completed or absent
    }
  };

  const handleQuickAction = async (student) => {
    const nextScanType = getNextScanType(student.boardingStatus);
    
    if (!nextScanType) {
      Alert.alert('Complete', `${student.name}'s commute is complete for today`);
      return;
    }

    const scanTypeDisplay = nextScanType.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());
    
    try {
      await scanAPI.manualAttendance({
        studentId: student._id,
        scanType: nextScanType,
        reason: 'Quick action from student list',
      });
      
      // Update local state with new status
      const statusMapping = {
        morning_pickup: 'morning_picked_up',
        morning_dropoff: 'at_school',
        evening_pickup: 'evening_picked_up',
        evening_dropoff: 'dropped_home',
      };
      
      setStudents((prev) =>
        prev.map((s) => 
          s._id === student._id 
            ? { ...s, boardingStatus: statusMapping[nextScanType] } 
            : s
        )
      );
      
      Alert.alert('Success', `${student.name} - ${scanTypeDisplay} recorded`);
    } catch (error) {
      console.error('Action failed:', error);
      Alert.alert('Error', 'Failed to record attendance');
    }
  };

  const getStatusInfo = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.not_boarded;
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStudent = ({ item }) => {
    const statusInfo = getStatusInfo(item.boardingStatus);
    const nextScanType = getNextScanType(item.boardingStatus);

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentGrade}>{item.grade} Grade</Text>
            <Text style={styles.studentAddress} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        </View>

        <View style={styles.studentActions}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            {nextScanType && item.boardingStatus !== 'absent' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: STATUS_CONFIG[item.boardingStatus === 'not_boarded' ? 'morning_picked_up' : 'at_school']?.color || '#3B82F6' }]}
                onPress={() => handleQuickAction(item)}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
              </TouchableOpacity>
            )}
            {!nextScanType && item.boardingStatus !== 'absent' && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
            )}
          </View>
        </View>
      </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student List</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats - Four-Step Progress */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {students.filter((s) => s.boardingStatus === 'not_boarded').length}
          </Text>
          <Text style={styles.statLabel}>Waiting</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
            {students.filter((s) => s.boardingStatus === 'morning_picked_up' || s.boardingStatus === 'evening_picked_up').length}
          </Text>
          <Text style={styles.statLabel}>On Bus</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>
            {students.filter((s) => s.boardingStatus === 'at_school').length}
          </Text>
          <Text style={styles.statLabel}>At School</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>
            {students.filter((s) => s.boardingStatus === 'dropped_home').length}
          </Text>
          <Text style={styles.statLabel}>Home</Text>
        </View>
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        }
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  studentGrade: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  studentAddress: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  studentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupButton: {
    backgroundColor: '#10B981',
  },
  dropoffButton: {
    backgroundColor: '#6366F1',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
