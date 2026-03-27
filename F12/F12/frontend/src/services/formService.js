import api from './api';

export const formService = {
  // Получить все тесты (для админа)
  getAllForms: async () => {
    const response = await api.get('/tests/');
    return response.data.tests;
  },

  // Получить тесты текущего психолога
  getMyForms: async () => {
    const response = await api.get('/tests/');
    return response.data.tests;
  },

  // Получить тест по ID (для конструктора — с подробностями)
  getFormById: async (id) => {
    const response = await api.get(`/tests/${id}`);
    return response.data;
  },

  // Получить тест по публичной ссылке (для клиента)
  getFormByLink: async (link) => {
    const response = await api.get(`/tests/by-link/${link}`);
    return response.data;
  },

  // Создать тест
  createForm: async (data) => {
    const response = await api.post('/tests/', data);
    return response.data;
  },

  // Обновить тест
  updateForm: async (id, data) => {
    const response = await api.patch(`/tests/${id}`, data);
    return response.data;
  },

  // Удалить тест
  deleteForm: async (id) => {
    await api.delete(`/tests/${id}`);
  },

  // Сгенерировать новую ссылку
  regenerateLink: async (id) => {
    const response = await api.post(`/tests/${id}/regenerate-link`);
    return response.data;
  },

  // Вопросы
  getQuestions: async (testId) => {
    const response = await api.get(`/tests/${testId}/questions`);
    return response.data;
  },

  addQuestion: async (testId, data) => {
    const response = await api.post(`/tests/${testId}/questions`, data);
    return response.data;
  },

  updateQuestions: async (testId, questions) => {
    const response = await api.put(`/tests/${testId}/questions/bulk`, questions);
    return response.data;
  },

  // Все сессии (прохождения)
  getAllResponses: async () => {
    const response = await api.get('/sessions/');
    return response.data.sessions;
  },

  // Сессии по тесту
  getResponsesByTest: async (testId) => {
    const response = await api.get(`/sessions/?test_id=${testId}`);
    return response.data.sessions;
  },

  // Детали сессии
  getResponseDetail: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },
};