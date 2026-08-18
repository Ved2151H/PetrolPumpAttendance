import { apiClient } from './client';

export const attendanceService = {
  getByDate: async (dateStr: string) => {
    const res: any = await apiClient.get(`/attendance?date=${encodeURIComponent(dateStr)}`);
    return res.data;
  },
  
  save: async (dateStr: string, records: { workerId: string, status: 'PRESENT' | 'ABSENT' }[]) => {
    const res: any = await apiClient.post('/attendance', { date: dateStr, records });
    return res.data;
  }
};
