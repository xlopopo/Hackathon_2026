import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { formService } from '../services/formService';
import { psychologistService } from '../services/psychologistService';

const StatCard = ({ emoji, label, value, color }) => (
  <div style={{
    background: 'white', borderRadius: '20px', padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
    display: 'flex', alignItems: 'center', gap: '16px',
  }}>
    <div style={{
      width: '52px', height: '52px', borderRadius: '14px',
      background: color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0,
    }}>
      {emoji}
    </div>
    <div>
      <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{label}</div>
    </div>
  </div>
);

const Badge = ({ active }) => (
  <span style={{
    background: active ? '#dcfce7' : '#fee2e2',
    color: active ? '#166534' : '#991b1b',
    padding: '3px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '600',
  }}>
    {active ? '✓ Активен' : '✕ Заблокирован'}
  </span>
);

const AccessBadge = ({ accessUntil }) => {
  if (!accessUntil) return (
    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>∞ Бессрочно</span>
  );

  const date = new Date(accessUntil);
  const now = new Date();
  const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const isWarning = daysLeft > 0 && daysLeft <= 7;

  return (
    <div>
      <div style={{
        fontSize: '0.85rem', fontWeight: '600',
        color: isExpired ? '#991b1b' : isWarning ? '#92400e' : '#1e293b',
      }}>
        📅 {date.toLocaleDateString('ru-RU')}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: isExpired ? '#ef4444' : isWarning ? '#f59e0b' : '#94a3b8',
      }}>
        {isExpired ? '⛔ Истёк' : isWarning ? `⚠️ ${daysLeft} дн.` : `${daysLeft} дн.`}
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [psychologists, setPsychologists] = useState([]);
  const [tests, setTests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [editingPsych, setEditingPsych] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPsych, setNewPsych] = useState({
    email: '', password: '', full_name: '', accessDays: '30',
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [psychs, allTests, allSessions] = await Promise.all([
        authService.getAllPsychologists(),
        formService.getAllForms(),
        formService.getAllResponses(),
      ]);
      setPsychologists(psychs);
      setTests(allTests);
      setSessions(allSessions);
    } catch (err) {
      showMsg(err.message || 'Ошибка загрузки', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await authService.createPsychologist(
        newPsych.email,
        newPsych.password,
        newPsych.full_name,
        newPsych.accessDays || null,
      );
      showMsg('✅ Психолог создан');
      setNewPsych({ email: '', password: '', full_name: '', accessDays: '30' });
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      showMsg(err.response?.data?.detail || err.message || 'Ошибка создания', 'error');
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await authService.updatePsychologist(id, updates);
      showMsg('✅ Данные обновлены');
      setEditingPsych(null);
      await loadData();
    } catch {
      showMsg('Ошибка обновления', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить психолога? Все его тесты и данные будут удалены.')) {
      try {
        await authService.deletePsychologist(id);
        showMsg('✅ Психолог удалён');
        await loadData();
      } catch {
        showMsg('Ошибка удаления', 'error');
      }
    }
  };

  const handleBlock = async (id, isActive) => {
    try {
      if (isActive) await authService.blockPsychologist(id);
      else await authService.unblockPsychologist(id);
      showMsg(isActive ? '🔒 Заблокирован' : '🔓 Разблокирован');
      await loadData();
    } catch {
      showMsg('Ошибка', 'error');
    }
  };

  const handleExtend = async (id) => {
    const days = prompt('На сколько дней продлить доступ?', '30');
    if (days && parseInt(days) > 0) {
      try {
        const result = await authService.extendAccess(id, parseInt(days));
        showMsg(`✅ ${result.message}`);
        await loadData();
      } catch {
        showMsg('Ошибка продления', 'error');
      }
    }
  };

  const handleSetUnlimited = async (id) => {
    if (window.confirm('Установить бессрочный доступ?')) {
      try {
        await authService.setUnlimitedAccess(id);
        showMsg('✅ Бессрочный доступ установлен');
        await loadData();
      } catch {
        showMsg('Ошибка', 'error');
      }
    }
  };

  const handleRevoke = async (id) => {
    if (window.confirm('Отозвать доступ немедленно?')) {
      try {
        await authService.revokeAccess(id);
        showMsg('🔒 Доступ отозван');
        await loadData();
      } catch {
        showMsg('Ошибка', 'error');
      }
    }
  };

  const handleReport = async (sessionId) => {
    try {
      await psychologistService.downloadReportDocx(sessionId, 'psychologist');
    } catch {
      showMsg('Ошибка генерации отчёта', 'error');
    }
  };

  const getPsychName = (ownerId) => {
    const p = psychologists.find(p => p.id === ownerId);
    return p ? p.full_name : 'Неизвестно';
  };

  const tabs = [
    { id: 'profile', label: '👤 Профиль' },
    { id: 'psychologists', label: `👥 Психологи (${psychologists.length})` },
    { id: 'tests', label: `📋 Тесты (${tests.length})` },
    { id: 'sessions', label: `📊 Сессии (${sessions.length})` },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Загрузка данных...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f0f9ff', minHeight: '100vh', padding: '32px 0' }}>
      <div className="container">

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>
            Панель администратора
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            Управление платформой ПрофДНК
          </p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        {/* Статистика */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px', marginBottom: '32px',
        }}>
          <StatCard emoji="👥" label="Психологов" value={psychologists.length} color="#e0f2fe" />
          <StatCard emoji="📋" label="Тестов" value={tests.length} color="#f0fdf4" />
          <StatCard emoji="✅" label="Прохождений" value={sessions.filter(s => s.status === 'completed').length} color="#fef9c3" />
          <StatCard emoji="⏳" label="В процессе" value={sessions.filter(s => s.status === 'in_progress').length} color="#fdf2f8" />
        </div>

        {/* Табы */}
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '24px',
          background: 'white', borderRadius: '16px', padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexWrap: 'wrap',
        }}>
          {tabs.map(tab => (
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

        {/* ПРОФИЛЬ */}
        {activeTab === 'profile' && user && (
          <div style={{
            background: 'white', borderRadius: '24px',
            padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '24px',
                background: 'linear-gradient(135deg, #0369a1, #0d9488)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: '800', color: 'white', flexShrink: 0,
              }}>
                {user.full_name?.charAt(0) || 'A'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>
                  {user.full_name}
                </h2>
                <p style={{ color: '#64748b', marginTop: '4px' }}>{user.email}</p>
                <span style={{
                  background: '#e0f2fe', color: '#0369a1',
                  padding: '4px 12px', borderRadius: '50px',
                  fontSize: '0.75rem', fontWeight: '700',
                  display: 'inline-block', marginTop: '8px',
                }}>
                  👑 Администратор
                </span>
              </div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}>
              {[
                { label: 'Email', value: user.email, emoji: '📧' },
                { label: 'Роль', value: 'Администратор', emoji: '👑' },
                { label: 'Статус', value: 'Активен', emoji: '✅' },
                { label: 'Регистрация', value: new Date(user.created_at).toLocaleDateString('ru-RU'), emoji: '📅' },
              ].map(item => (
                <div key={item.label} style={{
                  background: '#f8fafc', borderRadius: '14px', padding: '16px',
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginBottom: '4px' }}>
                    {item.emoji} {item.label}
                  </div>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ПСИХОЛОГИ */}
        {activeTab === 'psychologists' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <button onClick={() => setShowCreateForm(!showCreateForm)} style={{
                background: 'linear-gradient(135deg, #0369a1, #0d9488)',
                color: 'white', border: 'none', borderRadius: '50px',
                padding: '12px 28px', fontWeight: '700', fontSize: '0.9rem',
                cursor: 'pointer', boxShadow: '0 4px 15px rgba(3,105,161,0.3)',
                fontFamily: 'Inter, sans-serif',
              }}>
                + Добавить психолога
              </button>
            </div>

            {showCreateForm && (
              <div style={{
                background: 'white', borderRadius: '24px', padding: '32px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '24px',
                border: '2px solid #e0f2fe',
              }}>
                <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: '700' }}>
                  👤 Новый психолог
                </h3>
                <form onSubmit={handleCreate}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-group">
                      <label>Email *</label>
                      <input type="email" value={newPsych.email}
                        onChange={e => setNewPsych({ ...newPsych, email: e.target.value })}
                        required placeholder="email@example.com" />
                    </div>
                    <div className="form-group">
                      <label>Пароль *</label>
                      <input type="password" value={newPsych.password}
                        onChange={e => setNewPsych({ ...newPsych, password: e.target.value })}
                        required placeholder="Минимум 8 символов" />
                    </div>
                    <div className="form-group">
                      <label>ФИО *</label>
                      <input type="text" value={newPsych.full_name}
                        onChange={e => setNewPsych({ ...newPsych, full_name: e.target.value })}
                        required placeholder="Иванов Иван Иванович" />
                    </div>
                    <div className="form-group">
                      <label>Дней доступа</label>
                      <input
                        type="number"
                        value={newPsych.accessDays}
                        onChange={e => setNewPsych({ ...newPsych, accessDays: e.target.value })}
                        placeholder="Пусто = бессрочно"
                        min="1" max="3650"
                      />
                      <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        Оставьте пустым для бессрочного доступа
                      </small>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="submit" className="btn btn-primary">✅ Создать</button>
                    <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-outline">
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div style={{
              background: 'white', borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden',
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontWeight: '700', color: '#1e293b' }}>Список психологов</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Психолог</th>
                      <th>Статус</th>
                      <th>Доступ до</th>
                      <th>Регистрация</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {psychologists.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '10px',
                              background: 'linear-gradient(135deg, #e0f2fe, #f0fdf4)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: '700', color: '#0369a1', fontSize: '0.9rem', flexShrink: 0,
                            }}>
                              {p.full_name?.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1e293b' }}>{p.full_name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{p.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><Badge active={p.is_active} /></td>
                        <td><AccessBadge accessUntil={p.access_until} /></td>
                        <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {new Date(p.created_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td>
                          {editingPsych === p.id ? (
                            <EditPsychForm
                              psych={p}
                              onSave={(updates) => handleUpdate(p.id, updates)}
                              onCancel={() => setEditingPsych(null)}
                            />
                          ) : (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button onClick={() => setEditingPsych(p.id)}
                                className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                ✏️
                              </button>
                              <button onClick={() => handleBlock(p.id, p.is_active)}
                                className={`btn ${p.is_active ? 'btn-danger' : 'btn-success'}`}
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                title={p.is_active ? 'Заблокировать' : 'Разблокировать'}>
                                {p.is_active ? '🔒' : '🔓'}
                              </button>
                              <button onClick={() => handleExtend(p.id)}
                                className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                title="Продлить доступ">
                                📅
                              </button>
                              <button onClick={() => handleSetUnlimited(p.id)}
                                className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                title="Бессрочный доступ">
                                ∞
                              </button>
                              <button onClick={() => handleRevoke(p.id)}
                                className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                title="Отозвать доступ">
                                ⛔
                              </button>
                              <button onClick={() => handleDelete(p.id)}
                                className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                title="Удалить">
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {psychologists.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
                          Психологов пока нет. Нажмите «+ Добавить психолога»
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ТЕСТЫ */}
        {activeTab === 'tests' && (
          <div style={{
            background: 'white', borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight: '700', color: '#1e293b' }}>Все тесты платформы</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Автор</th>
                    <th>Статус</th>
                    <th>Вопросов</th>
                    <th>Прохождений</th>
                    <th>Создан</th>
                    <th>Ссылка</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map(test => (
                    <tr key={test.id}>
                      <td style={{ fontWeight: '600', color: '#1e293b' }}>{test.title}</td>
                      <td style={{ color: '#64748b' }}>{getPsychName(test.owner_id)}</td>
                      <td>
                        <span style={{
                          background: test.is_published ? '#dcfce7' : '#f1f5f9',
                          color: test.is_published ? '#166534' : '#64748b',
                          padding: '3px 10px', borderRadius: '50px',
                          fontSize: '0.75rem', fontWeight: '600',
                        }}>
                          {test.is_published ? '✅ Опубликован' : '📝 Черновик'}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{test.questions_count || 0}</td>
                      <td style={{ color: '#64748b' }}>{test.sessions_count || 0}</td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {new Date(test.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td>
                        {test.unique_link ? (
                          <a href={`${window.location.origin}/form/${test.unique_link}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ color: '#0369a1', fontSize: '0.85rem', fontWeight: '500' }}>
                            🔗 Открыть
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                  {tests.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                        Тестов пока нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* СЕССИИ */}
        {activeTab === 'sessions' && (
          <div style={{
            background: 'white', borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight: '700', color: '#1e293b' }}>Все прохождения</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Клиент</th>
                    <th>Тест</th>
                    <th>Статус</th>
                    <th>Начало</th>
                    <th>Завершение</th>
                    <th>Отчёт</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(sess => {
                    const test = tests.find(t => t.id === sess.test_id);
                    return (
                      <tr key={sess.id}>
                        <td>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {sess.client_name || 'Аноним'}
                          </div>
                          {sess.client_email && (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              {sess.client_email}
                            </div>
                          )}
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                          {test?.title || 'Неизвестно'}
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
                          {new Date(sess.created_at).toLocaleString('ru-RU')}
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {sess.completed_at
                            ? new Date(sess.completed_at).toLocaleString('ru-RU')
                            : '—'}
                        </td>
                        <td>
                          {sess.status === 'completed' && (
                            <button onClick={() => handleReport(sess.id)} style={{
                              background: '#e0f2fe', color: '#0369a1',
                              border: 'none', borderRadius: '50px',
                              padding: '6px 14px', fontSize: '0.8rem',
                              fontWeight: '600', cursor: 'pointer',
                              fontFamily: 'Inter, sans-serif',
                            }}>
                              📄 Скачать
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
                        Прохождений пока нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EditPsychForm = ({ psych, onSave, onCancel }) => {
  const [full_name, setFullName] = useState(psych.full_name);
  const [email, setEmail] = useState(psych.email);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ full_name, email });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
      <input type="text" value={full_name} onChange={e => setFullName(e.target.value)}
        placeholder="ФИО" style={{ width: '130px', padding: '6px 10px', fontSize: '0.85rem' }} />
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Email" style={{ width: '150px', padding: '6px 10px', fontSize: '0.85rem' }} />
      <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>💾</button>
      <button type="button" onClick={onCancel} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>✖</button>
    </form>
  );
};