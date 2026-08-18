import { apiClient } from './client';

export const dashboardService = {
  getStats: async () => {
    const res: any = await apiClient.get('/dashboard');
    return res.data;
  }
};
