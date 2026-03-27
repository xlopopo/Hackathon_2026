import api from './api';

export const reportTemplateService = {
  // Получить шаблоны для теста
  getTemplates: async (testId) => {
    const response = await api.get(`/report-templates/test/${testId}`);
    return response.data;
  },

  // Получить список metric_key для теста
  getMetrics: async (testId) => {
    const response = await api.get(`/report-templates/test/${testId}/metrics`);
    return response.data.metrics || [];
  },

  // Обновить шаблон
  updateTemplate: async (templateId, data) => {
    const response = await api.patch(`/report-templates/${templateId}`, data);
    return response.data;
  },
};