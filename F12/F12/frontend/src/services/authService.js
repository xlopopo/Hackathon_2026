import api from './api';

export const authService = {
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      const message = error.response?.data?.detail || 'Ошибка входа';
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.patch('/auth/me', data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  // ── Админские методы ──

  getAllPsychologists: async () => {
    const response = await api.get('/users/', {
      params: { role: 'psychologist', limit: 500 },
    });
    return response.data.users;
  },

  createPsychologist: async (email, password, full_name, accessDays = null) => {
    let access_until = null;
    if (accessDays && parseInt(accessDays) > 0) {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(accessDays));
      access_until = date.toISOString();
    }
    const response = await api.post('/auth/register', {
      email,
      password,
      full_name,
      role: 'psychologist',
      access_until,
    });
    return response.data;
  },

  updatePsychologist: async (id, updates) => {
    const response = await api.patch(`/users/${id}`, updates);
    return response.data;
  },

  deletePsychologist: async (id) => {
    await api.delete(`/users/${id}`);
  },

  blockPsychologist: async (id) => {
    const response = await api.patch(`/users/${id}`, { is_active: false });
    return response.data;
  },

  unblockPsychologist: async (id) => {
    const response = await api.patch(`/users/${id}`, { is_active: true });
    return response.data;
  },

  extendAccess: async (id, days) => {
    const response = await api.post(`/users/${id}/extend-access`, {
      days: parseInt(days),
    });
    return response.data;
  },

  setUnlimitedAccess: async (id) => {
    const response = await api.post(`/users/${id}/set-unlimited-access`);
    return response.data;
  },

  revokeAccess: async (id) => {
    const response = await api.post(`/users/${id}/revoke-access`);
    return response.data;
  },

  getExpiringAccess: async (days = 7) => {
    const response = await api.get('/users/expiring-access', {
      params: { days },
    });
    return response.data.users;
  },
};