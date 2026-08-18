import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Download, Share2, FileSpreadsheet } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import { format } from 'date-fns';
import { reportsService } from '../../services/api/reports';
import { apiClient } from '../../services/api/client';

export default function ReportsScreen() {
  const [downloading, setDownloading] = useState(false);
  const [downloadedFileUrl, setDownloadedFileUrl] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadedFileUrl(null);
    try {
      const startDate = format(new Date(), 'yyyy-MM-01');
      const endDate = format(new Date(), 'yyyy-MM-dd');
      
      const endpoint = await reportsService.downloadReport(startDate, endDate);
      
      // We must construct the full URL since Expo FileSystem doesn't use Axios
      const fullUrl = `${apiClient.defaults.baseURL}${endpoint}`;
      
      const token = await SecureStore.getItemAsync('auth_token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fileUri = `${FileSystem.documentDirectory}Attendance_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      
      const downloadRes = await FileSystem.downloadAsync(
        fullUrl,
        fileUri,
        { headers }
      );
      
      if (downloadRes.status !== 200) {
        throw new Error("Failed to generate report from server.");
      }

      setDownloadedFileUrl(downloadRes.uri);
      Alert.alert("Success", "Report downloaded successfully!");
      
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to download the report.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!downloadedFileUrl) return;
    
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Not Available", "Sharing is not available on this device");
        return;
      }
      
      await Sharing.shareAsync(downloadedFileUrl, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Share Attendance Report',
        UTI: 'com.microsoft.excel.xls'
      });
    } catch (err: any) {
      Alert.alert("Error", "Could not share the file.");
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-1 justify-center items-center">
        
        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
          <FileSpreadsheet color="#16a34a" size={48} />
        </View>
        
        <Text className="text-2xl font-bold text-gray-900 mb-2">Monthly Report</Text>
        <Text className="text-gray-500 text-center mb-10 px-4">
          Generate an Excel spreadsheet containing attendance records for the current month.
        </Text>

        {downloading ? (
          <View className="items-center py-4">
            <ActivityIndicator size="large" color="#16a34a" className="mb-4" />
            <Text className="font-bold text-green-700">Generating report...</Text>
          </View>
        ) : (
          <View className="w-full space-y-4">
            <TouchableOpacity 
              onPress={handleDownload}
              className="bg-green-600 rounded-xl py-4 flex-row justify-center items-center"
            >
              <Download color="#ffffff" size={20} className="mr-2" />
              <Text className="text-white font-bold text-lg">Download Excel</Text>
            </TouchableOpacity>

            {downloadedFileUrl && (
              <TouchableOpacity 
                onPress={handleShare}
                className="bg-blue-600 rounded-xl py-4 flex-row justify-center items-center"
              >
                <Share2 color="#ffffff" size={20} className="mr-2" />
                <Text className="text-white font-bold text-lg">Share / Open</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      </View>
    </View>
  );
}
