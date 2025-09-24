import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DayHours {
  isOpen: boolean;
  openTime: Date;
  closeTime: Date;
}

interface BusinessHours {
  [key: string]: DayHours;
}

const BusinessHoursManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const [showTimePicker, setShowTimePicker] = useState<{
    day: string;
    type: 'open' | 'close';
  } | null>(null);

  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    Monday: { isOpen: false, openTime: new Date(0, 0, 0, 9, 0), closeTime: new Date(0, 0, 0, 18, 0) },
    Tuesday: { isOpen: true, openTime: new Date(0, 0, 0, 9, 0), closeTime: new Date(0, 0, 0, 18, 0) },
    Wednesday: { isOpen: true, openTime: new Date(0, 0, 0, 9, 0), closeTime: new Date(0, 0, 0, 18, 0) },
    Thursday: { isOpen: true, openTime: new Date(0, 0, 0, 9, 0), closeTime: new Date(0, 0, 0, 18, 0) },
    Friday: { isOpen: true, openTime: new Date(0, 0, 0, 9, 0), closeTime: new Date(0, 0, 0, 18, 0) },
    Saturday: { isOpen: true, openTime: new Date(0, 0, 0, 10, 0), closeTime: new Date(0, 0, 0, 16, 0) },
    Sunday: { isOpen: false, openTime: new Date(0, 0, 0, 9, 0), closeTime: new Date(0, 0, 0, 18, 0) },
  });

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleDay = (day: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen,
      },
    }));
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (showTimePicker && selectedTime) {
      const { day, type } = showTimePicker;
      setBusinessHours(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          [type === 'open' ? 'openTime' : 'closeTime']: selectedTime,
        },
      }));
    }
    setShowTimePicker(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSave = () => {
    Alert.alert(
      'Success',
      'Business hours saved successfully!',
      [{ text: 'OK' }]
    );
  };

  const renderDayRow = (day: string, hours: DayHours) => (
    <View key={day} style={styles.dayContainer}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayName}>{day}</Text>
        <View style={styles.dayControls}>
          {hours.isOpen ? (
            <Text style={styles.hoursText}>
              {formatTime(hours.openTime)} - {formatTime(hours.closeTime)}
            </Text>
          ) : (
            <Text style={styles.closedText}>Closed</Text>
          )}
          <Switch
            value={hours.isOpen}
            onValueChange={() => toggleDay(day)}
            trackColor={{ false: '#e5e7eb', true: '#3be340' }}
            thumbColor={hours.isOpen ? '#ffffff' : '#ffffff'}
            ios_backgroundColor="#e5e7eb"
          />
        </View>
      </View>
      
      {hours.isOpen && (
        <View style={styles.timeInputs}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker({ day, type: 'open' })}
          >
            <Text style={styles.timeButtonText}>{formatTime(hours.openTime)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker({ day, type: 'close' })}
          >
            <Text style={styles.timeButtonText}>{formatTime(hours.closeTime)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Hours</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.hoursContainer}>
            {Object.entries(businessHours).map(([day, hours]) => 
              renderDayRow(day, hours)
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={
            showTimePicker.type === 'open'
              ? businessHours[showTimePicker.day].openTime
              : businessHours[showTimePicker.day].closeTime
          }
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f6f8f6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  hoursContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  dayControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3be340',
  },
  closedText: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeInputs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#f0f4f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 227, 64, 0.3)',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f6f8f6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: '#3be340',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#112112',
  },
});

export default BusinessHoursManagementScreen;
