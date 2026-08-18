import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { attendanceService } from '../../services/api/attendance';
import { workersService } from '../../services/api/workers';

export default function AttendanceScreen() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Local state for edits before save
  const [localAttendance, setLocalAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});

  const dateStr = format(currentDate, "yyyy-MM-dd");

  const { data: workers, isLoading: workersLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: workersService.getAll
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', dateStr],
    queryFn: () => attendanceService.getByDate(dateStr)
  });

  // Sync server data to local state when date changes
  useEffect(() => {
    if (attendanceData) {
      const newAtt: Record<string, 'PRESENT' | 'ABSENT'> = {};
      attendanceData.forEach((record: any) => {
        newAtt[record.workerId] = record.status;
      });
      setLocalAttendance(newAtt);
    } else {
      setLocalAttendance({});
    }
  }, [attendanceData, dateStr]);

  const saveMutation = useMutation({
    mutationFn: (records: { workerId: string, status: 'PRESENT' | 'ABSENT' }[]) => 
      attendanceService.save(currentDate.toISOString(), records),
    onSuccess: () => {
      Alert.alert("Success", "Attendance saved successfully.");
      queryClient.invalidateQueries({ queryKey: ['attendance', dateStr] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to save attendance.");
    }
  });

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (selectedDate > new Date()) {
        Alert.alert("Invalid Date", "Cannot select future dates.");
      } else {
        setCurrentDate(selectedDate);
      }
    }
  };

  const toggleStatus = (workerId: string, status: 'PRESENT' | 'ABSENT') => {
    setLocalAttendance(prev => ({ ...prev, [workerId]: status }));
  };

  const markAllPresent = () => {
    if (!workers) return;
    const newAtt: Record<string, 'PRESENT' | 'ABSENT'> = { ...localAttendance };
    workers.forEach((w: any) => {
      newAtt[w.id] = 'PRESENT';
    });
    setLocalAttendance(newAtt);
  };

  const handleSave = () => {
    const records = Object.entries(localAttendance).map(([workerId, status]) => ({ workerId, status }));
    saveMutation.mutate(records);
  };

  const isLoading = workersLoading || attendanceLoading;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 bg-white border-b border-gray-100 z-10">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Attendance</Text>
        
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl flex-row items-center"
          >
            <Text className="text-gray-900 font-bold">{format(currentDate, "MMM dd, yyyy")}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={markAllPresent}
            disabled={isLoading || !workers?.length}
            className={`px-4 py-3 rounded-xl bg-green-50 ${isLoading ? 'opacity-50' : ''}`}
          >
            <Text className="text-green-700 font-bold">Mark All Present</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={currentDate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}
      </View>

      <ScrollView className="flex-1 px-4 pt-4 mb-24">
        {isLoading ? (
          <ActivityIndicator size="large" color="#16a34a" className="mt-8" />
        ) : !workers || workers.length === 0 ? (
          <Text className="text-center text-gray-500 mt-8">No active workers found.</Text>
        ) : (
          <View className="space-y-3 pb-8">
            {workers.map((worker: any) => {
              const currentStatus = localAttendance[worker.id];
              return (
                <View key={worker.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-row items-center justify-between">
                  <Text className="font-bold text-gray-900 flex-1" numberOfLines={1}>{worker.name}</Text>
                  
                  <View className="flex-row gap-2">
                    <TouchableOpacity 
                      onPress={() => toggleStatus(worker.id, 'PRESENT')}
                      className={`px-4 py-2 rounded-xl flex-row items-center border ${currentStatus === 'PRESENT' ? 'bg-green-600 border-green-600' : 'bg-white border-gray-200'}`}
                    >
                      <CheckCircle2 color={currentStatus === 'PRESENT' ? '#ffffff' : '#9ca3af'} size={20} />
                      <Text className={`ml-1 font-bold ${currentStatus === 'PRESENT' ? 'text-white' : 'text-gray-500'}`}>PRESENT</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => toggleStatus(worker.id, 'ABSENT')}
                      className={`px-4 py-2 rounded-xl flex-row items-center border ${currentStatus === 'ABSENT' ? 'bg-red-500 border-red-500' : 'bg-white border-gray-200'}`}
                    >
                      <XCircle color={currentStatus === 'ABSENT' ? '#ffffff' : '#9ca3af'} size={20} />
                      <Text className={`ml-1 font-bold ${currentStatus === 'ABSENT' ? 'text-white' : 'text-gray-500'}`}>ABSENT</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Save Button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-8">
        <TouchableOpacity 
          onPress={handleSave}
          disabled={saveMutation.isPending || isLoading || !workers?.length}
          className={`bg-green-600 rounded-xl py-4 items-center justify-center flex-row shadow-sm ${(saveMutation.isPending || isLoading) ? 'opacity-70' : ''}`}
        >
          {saveMutation.isPending ? <ActivityIndicator color="#ffffff" className="mr-2" /> : null}
          <Text className="text-white font-bold text-lg">{saveMutation.isPending ? 'Saving...' : 'Save Attendance'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
