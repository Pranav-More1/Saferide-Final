import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { scanAPI } from '../services/api';

// Four-Step Commute scan types
const SCAN_TYPES = [
  { id: 'morning_pickup', label: 'Morning Pickup', icon: 'sunny', color: '#F59E0B', description: 'Pick up from home' },
  { id: 'morning_dropoff', label: 'School Dropoff', icon: 'school', color: '#10B981', description: 'Drop at school' },
  { id: 'evening_pickup', label: 'Evening Pickup', icon: 'partly-sunny', color: '#8B5CF6', description: 'Pick up from school' },
  { id: 'evening_dropoff', label: 'Home Dropoff', icon: 'home', color: '#3B82F6', description: 'Drop at home' },
];

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanType, setScanType] = useState('morning_pickup');
  const cameraRef = useRef(null);

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Please allow camera access to scan students for pickup/dropoff verification
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || scanning) return;

    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      // Send to API with Four-Step scan type
      const response = await scanAPI.scanFace({
        imageBase64: photo.base64,
        scanType: scanType,
      });
      
      if (response.data?.found) {
        setScanResult({
          success: true,
          student: response.data.data.student,
          scanType: scanType,
          validationError: false,
        });
      } else if (response.data?.validationError) {
        // Four-Step validation failed
        setScanResult({
          success: false,
          validationError: true,
          message: response.data.message,
          student: response.data.data?.student,
        });
      } else {
        setScanResult({
          success: false,
          message: response.data?.message || 'Student not recognized',
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        success: false,
        message: error.response?.data?.message || 'Face scanning service is offline. Please use manual attendance.',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleConfirm = async () => {
    if (!scanResult?.student) return;

    try {
      // Record the scan (already done during face recognition)
      const currentScanType = SCAN_TYPES.find(t => t.id === scanType);
      Alert.alert(
        'Success!',
        `${scanResult.student.name} - ${currentScanType?.label || scanType} recorded!`
      );
      setScanResult(null);
    } catch (error) {
      console.error('Record error:', error);
      const currentScanType = SCAN_TYPES.find(t => t.id === scanType);
      Alert.alert(
        'Success',
        `${scanResult.student.name} - ${currentScanType?.label || scanType} recorded!`
      );
      setScanResult(null);
    }
  };

  const handleRetry = () => {
    setScanResult(null);
  };

  // Get current scan type info
  const currentScanType = SCAN_TYPES.find(t => t.id === scanType);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Student</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Four-Step Scan Type Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scanTypeScroll}
        contentContainerStyle={styles.scanTypeContainer}
      >
        {SCAN_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.scanTypeButton,
              scanType === type.id && { backgroundColor: type.color },
            ]}
            onPress={() => setScanType(type.id)}
          >
            <Ionicons
              name={type.icon}
              size={24}
              color={scanType === type.id ? '#fff' : type.color}
            />
            <Text
              style={[
                styles.scanTypeLabel,
                scanType === type.id && styles.scanTypeLabelActive,
              ]}
            >
              {type.label}
            </Text>
            <Text
              style={[
                styles.scanTypeDesc,
                scanType === type.id && styles.scanTypeDescActive,
              ]}
            >
              {type.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Current Step Indicator */}
      <View style={[styles.stepIndicator, { backgroundColor: currentScanType?.color + '20' }]}>
        <Ionicons name={currentScanType?.icon || 'scan'} size={20} color={currentScanType?.color} />
        <Text style={[styles.stepIndicatorText, { color: currentScanType?.color }]}>
          Step: {currentScanType?.label}
        </Text>
      </View>

      {/* Camera or Result */}
      {scanResult ? (
        <View style={styles.resultContainer}>
          {scanResult.validationError ? (
            // Validation Error (Four-Step sequence issue)
            <>
              <View style={styles.warningIcon}>
                <Ionicons name="warning" size={64} color="#F59E0B" />
              </View>
              <Text style={styles.resultTitle}>Sequence Error</Text>
              <Text style={styles.validationMessage}>{scanResult.message}</Text>
              {scanResult.student && (
                <View style={styles.studentCard}>
                  <View style={[styles.studentAvatar, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.studentAvatarText}>
                      {scanResult.student.name?.charAt(0) || 'S'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{scanResult.student.name}</Text>
                    <Text style={styles.studentInfo}>Student ID: {scanResult.student.studentId}</Text>
                  </View>
                </View>
              )}
              <TouchableOpacity style={styles.retryButtonFull} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Try Different Scan Type</Text>
              </TouchableOpacity>
            </>
          ) : scanResult.success ? (
            <>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              </View>
              <Text style={styles.resultTitle}>Student Identified!</Text>
              <View style={styles.studentCard}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>
                    {scanResult.student.name?.charAt(0) || 'S'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.studentName}>{scanResult.student.name}</Text>
                  <Text style={styles.studentInfo}>{scanResult.student.grade} Grade</Text>
                  <Text style={styles.studentInfo}>
                    {currentScanType?.label} Recorded ✓
                  </Text>
                </View>
              </View>
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>Scan Next</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: currentScanType?.color || '#10B981' },
                  ]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.errorIcon}>
                <Ionicons name="close-circle" size={64} color="#EF4444" />
              </View>
              <Text style={styles.resultTitle}>Not Recognized</Text>
              <Text style={styles.resultSubtitle}>{scanResult.message}</Text>
              <TouchableOpacity style={styles.retryButtonFull} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanInstruction}>
                Position student's face within the frame
              </Text>
            </View>
          </CameraView>

          <TouchableOpacity
            style={[styles.captureButton, scanning && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
        </View>
      )}
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
  // Four-Step Scan Type Selector Styles
  scanTypeScroll: {
    maxHeight: 100,
    marginBottom: 8,
  },
  scanTypeContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  scanTypeButton: {
    width: 100,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 4,
  },
  scanTypeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  scanTypeLabelActive: {
    color: '#fff',
  },
  scanTypeDesc: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  scanTypeDescActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  stepIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Legacy toggle styles (kept for reference)
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  toggleButtonActiveBlue: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#fff',
  },
  // Validation error styles
  warningIcon: {
    marginBottom: 16,
  },
  validationMessage: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 24,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 300,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanInstruction: {
    marginTop: 24,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  captureButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  errorIcon: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  studentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  studentInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonFull: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonBlue: {
    backgroundColor: '#3B82F6',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
