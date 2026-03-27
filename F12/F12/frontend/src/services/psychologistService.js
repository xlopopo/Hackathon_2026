import api from './api';

export const psychologistService = {
  // Получить отчёт (HTML)
  getReportHtml: async (sessionId, type = 'client') => {
    const response = await api.get(
      `/reports/${sessionId}?type=${type}&format=html`,
      { responseType: 'text' }
    );
    return response.data;
  },

  // Скачать отчёт (DOCX)
  downloadReportDocx: async (sessionId, type = 'client') => {
    const response = await api.get(
      `/reports/${sessionId}?type=${type}&format=docx`,
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${sessionId}_${type}.docx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Отправить отчёт клиенту на email
  sendReportToClient: async (sessionId, reportType = 'client') => {
    const response = await api.post(`/reports/${sessionId}/send`, {
      report_type: reportType,
    });
    return response.data;
  },

  // Пересчитать результаты
  recalculateResults: async (sessionId) => {
    const response = await api.post(`/results/${sessionId}/recalculate`);
    return response.data;
  },

  // Получить все сессии психолога
  getMySessions: async (testId = null) => {
    const params = { limit: 500 };
    if (testId) params.test_id = testId;
    const response = await api.get('/sessions/', { params });
    return response.data.sessions;
  },

  // Получить детали сессии
  getSessionDetail: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },
};