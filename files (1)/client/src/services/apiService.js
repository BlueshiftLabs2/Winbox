import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

// Error handler
const handleError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const errorMessage = error.response.data.error || 'An unexpected error occurred';
    throw new Error(errorMessage);
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('No response received from server. Please check your connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error(error.message);
  }
};

// ISO related functions
export const getISOList = async () => {
  try {
    const response = await api.get('/isos');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const uploadISO = async (formData, progressCallback) => {
  try {
    const response = await api.post('/isos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        progressCallback(percentCompleted);
      }
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// VM related functions
export const createVM = async (vmData) => {
  try {
    const response = await api.post('/vms', vmData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getAllVMs = async () => {
  try {
    const response = await api.get('/vms');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getVM = async (id) => {
  try {
    const response = await api.get(`/vms/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const powerOnVM = async (id) => {
  try {
    const response = await api.put(`/vms/${id}/power`, { state: 'on' });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const powerOffVM = async (id) => {
  try {
    const response = await api.put(`/vms/${id}/power`, { state: 'off' });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const connectToVM = async (id) => {
  try {
    const response = await api.get(`/vms/${id}/connect`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const installVGPUDriver = async (id, driverData) => {
  try {
    const response = await api.post(`/vms/${id}/install-vgpu`, driverData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};