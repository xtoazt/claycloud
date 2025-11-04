import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Session {
  id: string;
  status: 'creating' | 'ready' | 'error';
  vmUrl?: string;
  accountEmail?: string;
  error?: string;
}

export const sessionsApi = {
  create: async (): Promise<Session> => {
    const response = await api.post<Session>('/api/sessions/create');
    return response.data;
  },
  
  get: async (sessionId: string): Promise<Session> => {
    const response = await api.get<Session>(`/api/sessions/${sessionId}`);
    return response.data;
  },
  
  complete: async (sessionId: string, email: string): Promise<Session> => {
    const response = await api.post<Session>(`/api/sessions/${sessionId}/complete`, { email });
    return response.data;
  },
  
  delete: async (sessionId: string): Promise<void> => {
    await api.delete(`/api/sessions/${sessionId}`);
  },
};

