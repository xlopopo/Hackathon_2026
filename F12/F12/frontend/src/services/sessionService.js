const SESSIONS_KEY = 'psych_sessions';

export const sessionService = {
  getAllSessions: () => {
    const sessions = localStorage.getItem(SESSIONS_KEY);
    return sessions ? JSON.parse(sessions) : [];
  },

  createSession: (clientName, testId, testTitle, psychologistId) => {
    const sessions = sessionService.getAllSessions();
    const newSession = {
      id: Date.now().toString(),
      clientName,
      testId,
      testTitle,
      psychologistId,
      status: 'in_progress',
      startDate: new Date().toISOString(),
      endDate: null,
      answers: []
    };
    sessions.push(newSession);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return newSession;
  },

  completeSession: (sessionId, answers) => {
    const sessions = sessionService.getAllSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index].status = 'completed';
      sessions[index].endDate = new Date().toISOString();
      sessions[index].answers = answers;
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      return sessions[index];
    }
    return null;
  }
};