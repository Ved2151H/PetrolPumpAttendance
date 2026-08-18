import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Calendar, CheckCircle2, XCircle, Activity, AlertCircle, Edit2 } from 'lucide-react-native';
import { workersService } from '../../services/api/workers';
import { format } from 'date-fns';

export default function WorkerProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;

  const { data: worker, isLoading, error } = useQuery({
    queryKey: ['worker', id],
    queryFn: () => workersService.getById(id)
  });

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (error || !worker) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <AlertCircle color="#b91c1c" size={48} className="mb-4" />
        <Text className="text-center text-red-700 font-bold mb-4">Unable to load worker profile</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 space-y-6">
        
        {/* Profile Header */}
        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 items-center">
          <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl font-bold text-green-700">{worker.name.charAt(0)}</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-1">{worker.name}</Text>
          <Text className="text-gray-500 mb-4">{worker.phone || "No phone number"}</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('EditWorker', { worker })}
            className="flex-row items-center px-4 py-2 bg-blue-50 rounded-xl mb-4"
          >
            <Edit2 color="#2563eb" size={16} />
            <Text className="text-blue-700 font-bold ml-2">Edit Profile</Text>
          </TouchableOpacity>

          {worker.deletedAt && (
            <View className="px-4 py-2 rounded-full bg-gray-100 mb-4">
              <Text className="text-gray-600 font-bold text-xs">Removed on: {format(new Date(worker.deletedAt), 'MMM dd, yyyy')}</Text>
            </View>
          )}

          <View className="w-full pt-4 border-t border-gray-100">
            <Text className="text-xs font-bold text-gray-400 mb-1">JOINING DATE</Text>
            <Text className="font-bold text-gray-900">{format(new Date(worker.joiningDate), 'MMMM dd, yyyy')}</Text>
          </View>
        </View>

        {/* Statistics */}
        <View className="flex-row flex-wrap justify-between">
          <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center gap-2 mb-2">
              <Calendar color="#9ca3af" size={16} />
              <Text className="text-sm font-medium text-gray-500">Recorded Days</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">{worker.stats.totalRecordedDays}</Text>
          </View>
          
          <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center gap-2 mb-2">
              <CheckCircle2 color="#22c55e" size={16} />
              <Text className="text-sm font-medium text-gray-500">Present</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">{worker.stats.presentDays}</Text>
          </View>

          <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center gap-2 mb-2">
              <XCircle color="#ef4444" size={16} />
              <Text className="text-sm font-medium text-gray-500">Absent</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">{worker.stats.absentDays}</Text>
          </View>

          <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center gap-2 mb-2">
              <Activity color="#f59e0b" size={16} />
              <Text className="text-sm font-medium text-gray-500">Attendance</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">{worker.stats.attendancePercentage}%</Text>
          </View>
        </View>

        {/* Attendance History */}
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-4">Attendance History</Text>
          
          {!worker.attendances || worker.attendances.length === 0 ? (
            <Text className="text-center text-gray-500 py-4">No attendance records found.</Text>
          ) : (
            <View className="space-y-3">
              {worker.attendances.map((record: any) => (
                <View key={record.id} className="flex-row justify-between items-center p-3 border border-gray-100 rounded-xl">
                  <Text className="font-bold text-gray-900">
                    {format(new Date(record.date), "MMM dd, yyyy")}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${record.status === 'PRESENT' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`text-xs font-bold ${record.status === 'PRESENT' ? 'text-green-700' : 'text-red-700'}`}>
                      {record.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}
