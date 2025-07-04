// Core type definitions

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface VirtualMachine {
  id: string;
  name: string;
  username: string;
  status: 'creating' | 'running' | 'stopped' | 'failed';
  cpuCount: number;
  ramSize: number;
  storageSize: number;
  gpuEnabled: boolean;
  osType: 'windows11' | 'custom';
  ipAddress?: string;
  createdAt: string;
  userId: string;
}

export interface VMCreationParams {
  name: string;
  username: string;
  password: string; // Will be encrypted before storing
  cpuCount: number;
  gpuEnabled: boolean;
  osType: 'windows11' | 'custom';
  customIsoId?: string; // If using custom ISO
}

export interface AuthResponse {
  user: User;
  token: string;
}