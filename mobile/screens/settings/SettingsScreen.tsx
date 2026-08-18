import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LogOut, User, Server } from 'lucide-react-native';
import { AuthContext } from '../../App';
import { authService } from '../../services/api/auth';
import { apiClient } from '../../services/api/client';

export default function SettingsScreen() {
  const { signOut } = useContext(AuthContext);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: authService.me
  });

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              await authService.logout();
            } catch (e) {
              // Ignore errors on logout
            } finally {
              signOut();
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50 p-4 space-y-6">
      
      <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-row items-center">
        <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4">
          <User color="#2563eb" size={32} />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">{user?.name || 'Admin'}</Text>
          <Text className="text-gray-500">{user?.email || 'admin@example.com'}</Text>
        </View>
      </View>

      <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <View className="flex-row items-center mb-4">
          <Server color="#9ca3af" size={20} className="mr-2" />
          <Text className="text-gray-700 font-bold">API Connection</Text>
        </View>
        <Text className="text-gray-500 text-sm">{apiClient.defaults.baseURL}</Text>
      </View>

      <TouchableOpacity 
        onPress={handleLogout}
        className="bg-white p-4 rounded-2xl border border-red-100 flex-row items-center justify-center mt-4 shadow-sm"
      >
        <LogOut color="#ef4444" size={20} className="mr-2" />
        <Text className="text-red-500 font-bold text-lg">Logout</Text>
      </TouchableOpacity>

    </View>
  );
}
