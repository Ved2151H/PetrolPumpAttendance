import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { workersService } from '../../services/api/workers';

export default function EditWorkerScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const { worker } = route.params;

  const [name, setName] = useState(worker.name);
  const [phone, setPhone] = useState(worker.phone || '');
  const [joiningDate, setJoiningDate] = useState(new Date(worker.joiningDate));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: any) => workersService.update(worker.id, data),
    onSuccess: () => {
      Alert.alert("Success", "Worker details updated successfully.");
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker', worker.id] });
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update worker.");
    }
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Name is required.");
      return;
    }
    mutation.mutate({
      name: name.trim(),
      phone: phone.trim() || undefined,
      joiningDate: joiningDate.toISOString().split('T')[0]
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setJoiningDate(selectedDate);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50 p-4"
    >
      <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        
        <View className="space-y-4 mb-8">
          <View>
            <Text className="text-sm font-bold text-gray-700 mb-2">Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-base text-gray-900"
            />
          </View>

          <View>
            <Text className="text-sm font-bold text-gray-700 mb-2">Phone Number</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-base text-gray-900"
            />
          </View>

          <View>
            <Text className="text-sm font-bold text-gray-700 mb-2">Joining Date *</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3"
            >
              <Text className="text-base text-gray-900">{format(joiningDate, "MMM dd, yyyy")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={joiningDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        <View className="flex-row gap-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="flex-1 py-4 border border-gray-200 rounded-xl items-center"
          >
            <Text className="text-gray-700 font-bold text-lg">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSave}
            disabled={mutation.isPending}
            className={`flex-1 bg-blue-600 rounded-xl py-4 items-center justify-center flex-row ${mutation.isPending ? 'opacity-70' : ''}`}
          >
            {mutation.isPending && <ActivityIndicator color="#ffffff" className="mr-2" />}
            <Text className="text-white font-bold text-lg">{mutation.isPending ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
