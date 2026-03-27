import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formService } from '../services/formService';
import { psychologistService } from '../services/psychologistService';

export const PsychologistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tests');
  const [tests, setTests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [sendingReport, setSendingReport] = useState(null);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [allTests, allSessions] = await Promise.all([
        formService.getMyForms(),
        psychologistService.getMySessions(),
      ]);
      setTests(allTests);
      setSessions(allSessions);
    } catch (err) {
      showMsg(err.message || 'Ошибка загрузки', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handlePublish = async (test) => {
    try {
      await formService.updateForm(test.id, { is_published: !test.is_published });
      showMsg(test.is_published ? 'Тест снят с публикации' : '✅ Тест опубликован');
      await loadData();
    } catch {
      showMsg('Ошибка', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить тест? Все данные прохождений будут потеряны.')) {
      try {
        await formService.deleteForm(id);
        showMsg('🗑 Тест удалён');
        await loadData();
      } catch {
        showMsg('Ошибка удаления', 'error');
      }
    }
  };

  const handleCopyLink = (uniqueLink) => {
    const link = `${window.location.origin}/form/${uniqueLink}`;
    navigator.clipboard.writeText(link);
    showMsg('📋 Ссылка скопирована!');
  };

  const handleDownloadReport = async (sessionId, type = 'psychologist') => {
    try {
      await psychologistService.downloadReportDocx(sessionId, type);
    } catch {
      showMsg('Ошибка скачивания отчёта', 'error');
    }
  };

  const handleSendReport = async (session) => {
    if (!session.client_email) {
      showMsg('❌ У клиента не указан email', 'error');
      return;
    }
    if (!window.confirm(
      `Отправить отчёт клиенту ${session.client_name} на ${session.client_email}?`
    )) return;

    setSendingReport(session.id);
    try {
      const result = await psychologistService.sendReportToClient(session.id, 'client');
      showMsg(`✅ ${result.message}`);
    } catch (err) {
      showMsg(
        err.response?.data?.detail || 'Ошибка отправки отчёта',
        'error'
      );
    } finally {
      setSendingReport(null);
    }
  };

  const getTestSessions = (testId) =>
    sessions.filter(s => s.test_id === testId);

  const getTestTitle = (testId) => {
    const test = tests.find(t => t.id === testId);
    return test?.title || 'Неизвестно';
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ color: '#64748b', marginTop: '12px' }}>Загрузка...</p>
      </div>
    </div>
  );

  const hasAccess = (() => {
    if (!user?.is_active) return false;
    if (user?.role === 'admin') return true;
    if (!user?.access_until) return true;
    return new Date(user.access_until) > new Date();
  })();

  const accessUntil = user?.access_until ? new Date(user.access_until) : null;
  const daysLeft = accessUntil
    ? Math.ceil((accessUntil - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div style={{ background: '#f0f9ff', minHeight: '100vh', padding: '32px 0' }}>
      <div className="container">

        {/* Заголовок */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>
            Добро пожаловать, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Личный кабинет психолога</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        {/* Статус подписки */}
        <div style={{
          background: hasAccess
            ? (daysLeft !== null && daysLeft <= 7 ? '#fef9c3' : 'white')
            : '#fee2e2',
          borderRadius: '20px', padding: '20px 24px', marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: hasAccess
            ? (daysLeft !== null && daysLeft <= 7 ? '2px solid #f59e0b' : '1px solid #e0f2fe')
            : '2px solid #fca5a5',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {!hasAccess ? '⛔' : (daysLeft !== null && daysLeft <= 7 ? '⚠️' : '✅')}
            </span>
            <div>
              <div style={{ fontWeight: '700', color: '#1e293b' }}>
                {!hasAccess
                  ? 'Подписка неактивна'
                  : daysLeft !== null && daysLeft <= 7
                    ? `Подписка истекает через ${daysLeft} дн.!`
                    : 'Подписка активна'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {accessUntil
                  ? `До ${accessUntil.toLocaleDateString('ru-RU')} (осталось ${daysLeft} дн.)`
                  : 'Бессрочный доступ'}
              </div>
            </div>
          </div>
          {daysLeft !== null && daysLeft <= 7 && hasAccess && (
            <div style={{
              background: '#f59e0b', color: 'white',
              padding: '8px 16px', borderRadius: '50px',
              fontSize: '0.8rem', fontWeight: '700',
            }}>
              Обратитесь к администратору
            </div>
          )}
        </div>

        {/* Статистика */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px', marginBottom: '32px',
        }}>
          {[
            { emoji: '📝', label: 'Тестов', value: tests.length, color: '#e0f2fe' },
            { emoji: '✅', label: 'Опубликовано', value: tests.filter(t => t.is_published).length, color: '#f0fdf4' },
            { emoji: '📊', label: 'Прохождений', value: completedSessions.length, color: '#fef9c3' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'white', borderRadius: '20px', padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: stat.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.4rem',
              }}>{stat.emoji}</div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Табы */}
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '24px',
          background: 'white', borderRadius: '16px', padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          {[
            { id: 'tests', label: `📋 Тесты (${tests.length})` },
            { id: 'sessions', label: `📊 Прохождения (${completedSessions.length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem',
              transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, #0369a1, #0d9488)'
                : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(3,105,161,0.3)' : 'none',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ТЕСТЫ */}
        {activeTab === 'tests' && (
          <div style={{
            background: 'white', borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h2 style={{ fontWeight: '700', color: '#1e293b' }}>Мои тесты</h2>
              <button
                onClick={() => navigate('/psychologist/constructor/new')}
                className="btn btn-primary"
              >
                + Создать тест
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              {tests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
                  <p>У вас пока нет тестов.</p>
                  <button
                    onClick={() => navigate('/psychologist/constructor/new')}
                    className="btn btn-primary"
                    style={{ marginTop: '16px' }}
                  >
                    Создать первый тест
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tests.map(test => (
                    <div key={test.id} style={{
                      background: '#f8fafc', borderRadius: '16px', padding: '20px',
                      border: '1px solid #e2e8f0',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <h3 style={{ fontWeight: '700', color: '#1e293b', margin: 0 }}>
                            {test.title}
                          </h3>
                          <span style={{
                            background: test.is_published ? '#dcfce7' : '#f1f5f9',
                            color: test.is_published ? '#166534' : '#64748b',
                            padding: '2px 10px', borderRadius: '50px',
                            fontSize: '0.75rem', fontWeight: '600',
                          }}>
                            {test.is_published ? '✅ Опубликован' : '📝 Черновик'}
                          </span>
                        </div>
                        {test.description && (
                          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>
                            {test.description}
                          </p>
                        )}
                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '16px' }}>
                          <span>❓ {test.questions_count || 0} вопросов</span>
                          <span>📊 {getTestSessions(test.id).length} прохождений</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => navigate(`/psychologist/constructor/${test.id}`)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem' }}
                        >
                          ✏️ Редактировать
                        </button>
                        {test.is_published && test.unique_link && (
                          <button
                            onClick={() => handleCopyLink(test.unique_link)}
                            className="btn btn-outline"
                            style={{ fontSize: '0.8rem' }}
                          >
                            📋 Ссылка
                          </button>
                        )}
                        <button
                          onClick={() => handlePublish(test)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem' }}
                        >
                          {test.is_published ? '⏸ Снять' : '▶ Опубликовать'}
                        </button>
                        <button
                          onClick={() => handleDelete(test.id)}
                          className="btn btn-danger"
                          style={{ fontSize: '0.8rem' }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ПРОХОЖДЕНИЯ */}
        {activeTab === 'sessions' && (
          <div style={{
            background: 'white', borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontWeight: '700', color: '#1e293b' }}>Прохождения тестов</h2>
            </div>

            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📊</div>
                <p>Прохождений пока нет.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Клиент</th>
                      <th>Тест</th>
                      <th>Статус</th>
                      <th>Дата</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(sess => (
                      <tr key={sess.id}>
                        <td>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {sess.client_name || 'Аноним'}
                          </div>
                          {sess.client_email ? (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              {sess.client_email}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                              email не указан
                            </div>
                          )}
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                          {getTestTitle(sess.test_id)}
                        </td>
                        <td>
                          <span style={{
                            background: sess.status === 'completed' ? '#dcfce7' : '#fef9c3',
                            color: sess.status === 'completed' ? '#166534' : '#92400e',
                            padding: '3px 10px', borderRadius: '50px',
                            fontSize: '0.75rem', fontWeight: '600',
                          }}>
                            {sess.status === 'completed' ? '✅ Завершён' : '⏳ В процессе'}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {sess.completed_at
                            ? new Date(sess.completed_at).toLocaleString('ru-RU')
                            : new Date(sess.created_at).toLocaleString('ru-RU')}
                        </td>
                        <td>
                          {sess.status === 'completed' && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {/* Скачать отчёт психолога */}
                              <button
                                onClick={() => handleDownloadReport(sess.id, 'psychologist')}
                                style={{
                                  background: '#e0f2fe', color: '#0369a1',
                                  border: 'none', borderRadius: '50px',
                                  padding: '6px 12px', fontSize: '0.8rem',
                                  fontWeight: '600', cursor: 'pointer',
                                  fontFamily: 'Inter, sans-serif',
                                }}
                                title="Скачать отчёт психолога"
                              >
                                📄 Скачать
                              </button>

                              {/* Отправить клиенту */}
                              <button
                                onClick={() => handleSendReport(sess)}
                                disabled={sendingReport === sess.id || !sess.client_email}
                                style={{
                                  background: sess.client_email ? '#f0fdf4' : '#f1f5f9',
                                  color: sess.client_email ? '#059669' : '#94a3b8',
                                  border: 'none', borderRadius: '50px',
                                  padding: '6px 12px', fontSize: '0.8rem',
                                  fontWeight: '600', cursor: sess.client_email ? 'pointer' : 'not-allowed',
                                  fontFamily: 'Inter, sans-serif',
                                  opacity: sendingReport === sess.id ? 0.6 : 1,
                                }}
                                title={sess.client_email
                                  ? 'Отправить отчёт клиенту на email'
                                  : 'Email клиента не указан'}
                              >
                                {sendingReport === sess.id ? '⏳' : '📧'} Отправить клиенту
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};