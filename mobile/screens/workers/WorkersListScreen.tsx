import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { workersService } from '../../services/api/workers';

export default function WorkersListScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: workers, isLoading, refetch } = useQuery({
    queryKey: ['workers'],
    queryFn: workersService.getAll
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredWorkers = workers?.filter((w: any) => {
    if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.phone?.includes(search)) {
      return false;
    }
    return true;
  });

  const handleRemove = (worker: any) => {
    Alert.alert(
      `Remove ${worker.name}?`,
      "They will be removed from the current worker list, but their attendance history will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove Worker", 
          style: "destructive",
          onPress: async () => {
            try {
              await workersService.remove(worker.id);
              queryClient.invalidateQueries({ queryKey: ['workers'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              Alert.alert("Success", "Worker removed successfully.");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to remove worker.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('WorkerProfile', { id: item.id })}
      className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 flex-row items-center shadow-sm"
    >
      <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
        <Text className="text-gray-600 font-bold text-lg">{item.name.charAt(0)}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-bold text-gray-900 text-lg mb-1">{item.name}</Text>
        <Text className="text-gray-500 text-sm">{item.phone || 'No phone'}</Text>
      </View>
      
      <View className="flex-row items-center gap-2">
        <TouchableOpacity 
          onPress={() => navigation.navigate('EditWorker', { worker: item })}
          className="p-2"
        >
          <Edit2 color="#9ca3af" size={20} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleRemove(item)}
          className="p-2"
        >
          <Trash2 color="#ef4444" size={20} />
        </TouchableOpacity>
        <ChevronRight color="#d1d5db" size={20} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 bg-white border-b border-gray-100 z-10 space-y-4 pb-6">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Workers</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('AddWorker')}
            className="flex-row items-center bg-green-600 px-4 py-2 rounded-xl"
          >
            <Plus color="#ffffff" size={20} />
            <Text className="text-white font-bold ml-1">Add Worker</Text>
          </TouchableOpacity>
        </View>

        <View className="relative flex-row items-center border border-gray-200 rounded-xl bg-gray-50 px-3 py-2">
          <Search color="#9ca3af" size={20} className="mr-2" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search workers..."
            className="flex-1 text-base text-gray-900 py-1"
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />}
          ListEmptyComponent={() => (
            <Text className="text-center text-gray-500 mt-8 font-medium">
              {search ? 'No workers found matching your search.' : 'No active workers found.'}
            </Text>
          )}
        />
      )}
    </View>
  );
}
