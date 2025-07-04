import axios from 'axios';
import { AuthResponse, User, VirtualMachine, VMCreationParams } from '../types/types';

// Create axios instance with auth header handling
const api = axios.create({
  baseURL: '/api',
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { username, email, password });
    return response.data;
  },
  
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  }
};

// VM services
export const vmService = {
  listVMs: async (): Promise<VirtualMachine[]> => {
    const response = await api.get<VirtualMachine[]>('/vms');
    return response.data;
  },
  
  getVM: async (id: string): Promise<VirtualMachine> => {
    const response = await api.get<VirtualMachine>(`/vms/${id}`);
    return response.data;
  },
  
  createVM: async (vmParams: VMCreationParams): Promise<VirtualMachine> => {
    const response = await api.post<VirtualMachine>('/vms', vmParams);
    return response.data;
  },
  
  startVM: async (id: string): Promise<VirtualMachine> => {
    const response = await api.post<VirtualMachine>(`/vms/${id}/start`);
    return response.data;
  },
  
  stopVM: async (id: string): Promise<VirtualMachine> => {
    const response = await api.post<VirtualMachine>(`/vms/${id}/stop`);
    return response.data;
  },
  
  deleteVM: async (id: string): Promise<void> => {
    await api.delete(`/vms/${id}`);
  },
  
  // For custom ISO uploads
  uploadIso: async (file: File): Promise<{ id: string }> => {
    const formData = new FormData();
    formData.append('iso', file);
    
    const response = await api.post<{ id: string }>('/vms/iso-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

// KVM console connection service
export const kvmService = {
  getConsoleUrl: async (vmId: string): Promise<{ url: string; token: string }> => {
    const response = await api.get<{ url: string; token: string }>(`/vms/${vmId}/console`);
    return response.data;
  }
};