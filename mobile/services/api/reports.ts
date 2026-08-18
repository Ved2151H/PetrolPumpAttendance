import { apiClient } from './client';

export const reportsService = {
  downloadReport: async (startDate: string, endDate: string) => {
    // Note: for file downloads, Axios needs 'responseType: blob' or similar depending on environment
    // For React Native, we often use expo-file-system to download files instead.
    // This is a placeholder for the actual implementation which will handle binary data.
    const url = `/reports?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    // Implement expo-file-system logic here later.
    return url;
  }
};
