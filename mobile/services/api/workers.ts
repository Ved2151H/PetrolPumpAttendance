import { apiClient } from './client';

export const workersService = {
  getAll: async () => {
    const res: any = await apiClient.get('/workers');
    return res.data;
  },
  
  getById: async (id: string) => {
    const res: any = await apiClient.get(`/workers/${id}`);
    return res.data;
  },
  
  create: async (data: { name: string; phone?: string; joiningDate: string }) => {
    const res: any = await apiClient.post('/workers', data);
    return res.data;
  },
  
  update: async (id: string, data: { name?: string; phone?: string; joiningDate?: string }) => {
    const res: any = await apiClient.patch(`/workers/${id}`, data);
    return res.data;
  },
  
  remove: async (id: string) => {
    const res: any = await apiClient.delete(`/workers/${id}`);
    return res.data;
  }
};
