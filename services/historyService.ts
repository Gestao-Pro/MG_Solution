import { apiFetch } from './api';
import { getAuthToken } from './authService';
import { History, AnalysisSession } from '../types';

export const getHistory = async (): Promise<History> => {
  const token = getAuthToken();
  if (!token) return { sessions: [] };

  try {
    const res = await apiFetch('/api/history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      console.error('Falha ao buscar histórico:', res.statusText);
      return { sessions: [] };
    }

    const data = await res.json();
    return { sessions: data.sessions || [] };
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return { sessions: [] };
  }
};

export const saveSession = async (session: AnalysisSession): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await apiFetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(session)
    });

    return res.ok;
  } catch (error) {
    console.error('Erro ao salvar sessão:', error);
    return false;
  }
};

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await apiFetch(`/api/history/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return res.ok;
  } catch (error) {
    console.error('Erro ao deletar sessão:', error);
    return false;
  }
};
