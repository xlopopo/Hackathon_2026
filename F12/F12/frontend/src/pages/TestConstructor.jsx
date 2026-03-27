import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formService } from '../services/formService';

const QUESTION_TYPES = [
  { value: 'single_choice', label: '⭕ Один вариант' },
  { value: 'multiple_choice', label: '☑️ Несколько вариантов' },
  { value: 'text', label: '✍️ Свободный текст' },
  { value: 'scale', label: '📊 Шкала' },
];

const DEFAULT_CLIENT_FIELDS = [
  { key: 'full_name', label: 'ФИО', required: true, enabled: true, removable: false },
  { key: 'email', label: 'Email', required: false, enabled: true, removable: true },
];

const EXTRA_FIELDS = [
  { key: 'phone', label: 'Телефон' },
  { key: 'birth_date', label: 'Дата рождения' },
  { key: 'age', label: 'Возраст' },
  { key: 'city', label: 'Город' },
  { key: 'education', label: 'Образование' },
  { key: 'profession', label: 'Профессия' },
];

export const TestConstructor = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [testSettings, setTestSettings] = useState({
    title: '',
    description: '',
    is_published: false,
    show_result_to_client: false,
  });
  const [clientFields, setClientFields] = useState(DEFAULT_CLIENT_FIELDS);

  const isNew = !testId || testId === 'new';

  const loadTest = useCallback(async () => {
    if (isNew) {
      setLoading(false);
      return;
    }
    try {
      const t = await formService.getFormById(testId);
      setTestSettings({
        title: t.title,
        description: t.description || '',
        is_published: t.is_published,
        show_result_to_client: t.show_result_to_client,
      });

      // Загружаем поля клиента
      if (t.client_fields?.fields) {
        setClientFields(t.client_fields.fields);
      }

      try {
        const qs = await formService.getQuestions(testId);
        setQuestions(
          qs.map((q) => ({
            ...q,
            _key: Math.random().toString(36).slice(2),
          }))
        );
      } catch {
        setQuestions([]);
      }
    } catch {
      setMessage('❌ Ошибка загрузки теста');
    } finally {
      setLoading(false);
    }
  }, [testId, isNew]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  /* ── Поля клиента ── */
  const toggleField = (key) => {
    setClientFields(prev =>
      prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f)
    );
  };

  const toggleRequired = (key) => {
    setClientFields(prev =>
      prev.map(f => f.key === key ? { ...f, required: !f.required } : f)
    );
  };

  const addExtraField = (field) => {
    if (clientFields.find(f => f.key === field.key)) return;
    setClientFields(prev => [
      ...prev,
      { ...field, required: false, enabled: true, removable: true },
    ]);
  };

  const removeField = (key) => {
    setClientFields(prev => prev.filter(f => f.key !== key));
  };

  /* ── Вопросы ── */
  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        _key: Math.random().toString(36).slice(2),
        text: '',
        question_type: 'single_choice',
        order: prev.length,
        is_required: true,
        scale_config: null,
        branching_rules: null,
        options: [
          { text: '', order: 0, score: 0, metric_key: '' },
          { text: '', order: 1, score: 0, metric_key: '' },
        ],
      },
    ]);
  };

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx, dir) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((q, i) => ({ ...q, order: i }));
    });
  };

  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  /* ── Варианты ── */
  const addOption = (qIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: [
                ...q.options,
                { text: '', order: q.options.length, score: 0, metric_key: '' },
              ],
            }
          : q
      )
    );
  };

  const removeOption = (qIdx, oIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.filter((_, j) => j !== oIdx) }
          : q
      )
    );
  };

  const updateOption = (qIdx, oIdx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((o, j) =>
                j === oIdx ? { ...o, [field]: value } : o
              ),
            }
          : q
      )
    );
  };

  /* ── Сохранение ── */
  const handleSave = async () => {
    if (!testSettings.title.trim()) {
      showMsg('❌ Введите название теста');
      return;
    }

    setSaving(true);
    try {
      let currentTestId = testId;

      const testData = {
        title: testSettings.title,
        description: testSettings.description,
        is_published: isNew ? false : testSettings.is_published,
        show_result_to_client: testSettings.show_result_to_client,
        client_fields: { fields: clientFields },
      };

      if (isNew) {
        const created = await formService.createForm(testData);
        currentTestId = created.id;
      } else {
        await formService.updateForm(currentTestId, testData);
      }

      if (questions.length > 0) {
        const payload = questions.map((q, i) => ({
          text: q.text,
          question_type: q.question_type,
          order: i,
          is_required: q.is_required,
          scale_config: q.scale_config,
          branching_rules: q.branching_rules,
          options: (q.options || []).map((o, j) => ({
            text: o.text,
            order: j,
            score: parseFloat(o.score) || 0,
            metric_key: o.metric_key || null,
          })),
        }));
        await formService.updateQuestions(currentTestId, payload);
      }

      showMsg('✅ Тест сохранён!');

      if (isNew) {
        navigate(`/psychologist/constructor/${currentTestId}`, { replace: true });
      }
    } catch (err) {
      showMsg('❌ Ошибка: ' + (err.response?.data?.detail || err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>⏳</div>
          <p style={{ color: '#64748b', marginTop: '12px' }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f9ff', minHeight: '100vh', padding: '32px 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1rem' }}>

        {/* Сообщение */}
        {message && (
          <div style={{
            background: message.includes('✅') ? '#dcfce7' : '#fee2e2',
            color: message.includes('✅') ? '#166534' : '#991b1b',
            padding: '12px 16px', borderRadius: 12, marginBottom: 16,
            textAlign: 'center', fontWeight: '600',
          }}>
            {message}
          </div>
        )}

        {/* Верхняя панель */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
        }}>
          <button
            onClick={() => navigate('/psychologist')}
            style={{
              background: 'white', border: '1px solid #e2e8f0', borderRadius: '50px',
              padding: '10px 20px', cursor: 'pointer', fontSize: '0.9rem',
              fontWeight: '600', color: '#64748b', fontFamily: 'Inter, sans-serif',
            }}
          >
            ← Назад к тестам
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #0369a1, #0d9488)',
              color: 'white', border: 'none', borderRadius: '50px',
              padding: '10px 24px', cursor: 'pointer', fontSize: '0.9rem',
              fontWeight: '700', fontFamily: 'Inter, sans-serif',
              opacity: saving ? 0.6 : 1,
              boxShadow: '0 4px 15px rgba(3,105,161,0.3)',
            }}
          >
            {saving ? '⏳ Сохранение...' : '💾 Сохранить тест'}
          </button>
        </div>

        {/* Настройки теста */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }}>
            {isNew ? '🆕 Новый тест' : `✏️ ${testSettings.title || 'Редактирование'}`}
          </h2>

          <div className="form-group">
            <label>Название теста *</label>
            <input
              type="text"
              value={testSettings.title}
              onChange={(e) => setTestSettings({ ...testSettings, title: e.target.value })}
              placeholder="Например: Тест на тип личности"
            />
          </div>

          <div className="form-group">
            <label>Описание (видит клиент)</label>
            <textarea
              value={testSettings.description}
              onChange={(e) => setTestSettings({ ...testSettings, description: e.target.value })}
              rows={3}
              placeholder="Краткое описание теста"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {!isNew && (
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={testSettings.is_published}
                  onChange={(e) => setTestSettings({ ...testSettings, is_published: e.target.checked })}
                />
                Опубликован (доступен по ссылке)
              </label>
            )}
          </div>
        </div>

        {/* Кнопка шаблонов отчётов (только для существующих тестов) */}
        {!isNew && (
          <div style={{
                        background: 'white', borderRadius: '24px', padding: '24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                         }}>
                          <div>
                            <h3 style={{ fontWeight: '700', color: '#1e293b', margin: 0 }}>📄 Шаблоны отчётов</h3>
                             <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                              Настройте какие блоки показывать в отчётах для клиента и психолога
                              </p>
                              </div>
                               <button
                               onClick={() => navigate(`/psychologist/reports/${testId}`)}
                               className="btn btn-outline"
                               >
                                ✏️ Настроить
                                </button>
                                </div>
                              )}
                              
        {/* Поля клиента */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
            👤 Данные клиента
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
            Выберите какие данные клиент заполнит перед прохождением теста.
            ФИО всегда обязательно.
          </p>

          {/* Текущие поля */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {clientFields.map(field => (
              <div key={field.key} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '12px',
                background: field.enabled ? '#f0f9ff' : '#f8fafc',
                border: `1px solid ${field.enabled ? '#bae6fd' : '#e2e8f0'}`,
                flexWrap: 'wrap',
              }}>
                {/* Включить/выключить */}
                <input
                  type="checkbox"
                  checked={field.enabled}
                  onChange={() => field.removable && toggleField(field.key)}
                  disabled={!field.removable}
                  style={{ width: '16px', height: '16px', cursor: field.removable ? 'pointer' : 'default' }}
                />

                {/* Название поля */}
                <span style={{
                  fontWeight: '600', color: field.enabled ? '#1e293b' : '#94a3b8',
                  flex: 1, minWidth: '100px',
                }}>
                  {field.label}
                  {!field.removable && (
                    <span style={{
                      marginLeft: '8px', fontSize: '0.7rem',
                      background: '#e0f2fe', color: '#0369a1',
                      padding: '2px 8px', borderRadius: '50px',
                    }}>
                      обязательно
                    </span>
                  )}
                </span>

                {/* Обязательное */}
                {field.enabled && field.removable && (
                  <label style={{ display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={() => toggleRequired(field.key)}
                    />
                    Обязательное
                  </label>
                )}

                {/* Удалить */}
                {field.removable && (
                  <button
                    onClick={() => removeField(field.key)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94a3b8', fontSize: '1rem', padding: '0 4px',
                    }}
                    title="Удалить поле"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Добавить дополнительное поле */}
          <div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px', fontWeight: '600' }}>
              + Добавить поле:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EXTRA_FIELDS
                .filter(f => !clientFields.find(cf => cf.key === f.key))
                .map(field => (
                  <button
                    key={field.key}
                    onClick={() => addExtraField(field)}
                    style={{
                      background: '#f0f9ff', border: '1px dashed #0369a1',
                      borderRadius: '50px', padding: '6px 14px',
                      cursor: 'pointer', fontSize: '0.8rem',
                      color: '#0369a1', fontFamily: 'Inter, sans-serif',
                      fontWeight: '600',
                    }}
                  >
                    + {field.label}
                  </button>
                ))}
              {EXTRA_FIELDS.every(f => clientFields.find(cf => cf.key === f.key)) && (
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Все поля добавлены
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Вопросы */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontWeight: '700', color: '#1e293b', margin: 0 }}>
              ❓ Вопросы ({questions.length})
            </h2>
            <button onClick={addQuestion} className="btn btn-primary">
              + Добавить вопрос
            </button>
          </div>

          {questions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📝</div>
              <p>Нет вопросов. Нажмите «+ Добавить вопрос».</p>
            </div>
          )}

          {questions.map((q, qIdx) => (
            <div key={q._key || qIdx} style={{
              background: '#f8fafc', borderRadius: '16px', padding: '20px',
              border: '1px solid #e2e8f0', marginBottom: '16px',
            }}>
              {/* Заголовок вопроса */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '16px',
              }}>
                <span style={{ fontWeight: '700', color: '#0369a1', fontSize: '0.9rem' }}>
                  Вопрос #{qIdx + 1}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => moveQuestion(qIdx, -1)} disabled={qIdx === 0}
                    className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>↑</button>
                  <button onClick={() => moveQuestion(qIdx, 1)} disabled={qIdx === questions.length - 1}
                    className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>↓</button>
                  <button onClick={() => removeQuestion(qIdx)}
                    className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>🗑</button>
                </div>
              </div>

              {/* Текст вопроса */}
              <div className="form-group">
                <label>Текст вопроса *</label>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                  placeholder="Введите текст вопроса"
                />
              </div>

              {/* Тип и обязательность */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '0.85rem' }}>
                    Тип вопроса
                  </label>
                  <select
                    value={q.question_type}
                    onChange={(e) => updateQuestion(qIdx, 'question_type', e.target.value)}
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <label style={{
                  display: 'flex', gap: '8px', alignItems: 'center',
                  cursor: 'pointer', marginTop: '20px', fontSize: '0.9rem',
                }}>
                  <input
                    type="checkbox"
                    checked={q.is_required}
                    onChange={(e) => updateQuestion(qIdx, 'is_required', e.target.checked)}
                  />
                  Обязательный
                </label>
              </div>

              {/* Варианты ответов */}
              {(q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && (
                <div>
                  <label style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                    Варианты ответов:
                  </label>
                  {(q.options || []).map((opt, oIdx) => (
                    <div key={oIdx} style={{
                      display: 'flex', gap: '8px', marginBottom: '8px',
                      alignItems: 'center', flexWrap: 'wrap',
                    }}>
                      <input
                        type="text" value={opt.text}
                        onChange={(e) => updateOption(qIdx, oIdx, 'text', e.target.value)}
                        placeholder={`Вариант ${oIdx + 1}`}
                        style={{ flex: 3, minWidth: '150px' }}
                      />
                      <input
                        type="number" value={opt.score}
                        onChange={(e) => updateOption(qIdx, oIdx, 'score', e.target.value)}
                        placeholder="Балл"
                        style={{ flex: 1, minWidth: '70px' }}
                      />
                      <input
                        type="text" value={opt.metric_key || ''}
                        onChange={(e) => updateOption(qIdx, oIdx, 'metric_key', e.target.value)}
                        placeholder="Метрика"
                        style={{ flex: 1.5, minWidth: '100px' }}
                      />
                      <button onClick={() => removeOption(qIdx, oIdx)}
                        className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => addOption(qIdx)} style={{
                    background: 'none', border: '1px dashed #94a3b8', borderRadius: '8px',
                    padding: '6px 16px', cursor: 'pointer', color: '#0369a1',
                    fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', marginTop: '4px',
                  }}>
                    + Добавить вариант
                  </button>
                </div>
              )}

              {/* Шкала */}
              {q.question_type === 'scale' && (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ width: '100px' }}>
                    <label>Мин</label>
                    <input
                      type="number" value={q.scale_config?.min ?? 1}
                      onChange={(e) => updateQuestion(qIdx, 'scale_config', {
                        ...(q.scale_config || {}), min: parseInt(e.target.value),
                      })}
                    />
                  </div>
                  <div className="form-group" style={{ width: '100px' }}>
                    <label>Макс</label>
                    <input
                      type="number" value={q.scale_config?.max ?? 10}
                      onChange={(e) => updateQuestion(qIdx, 'scale_config', {
                        ...(q.scale_config || {}), max: parseInt(e.target.value),
                      })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                    <label>Метрика</label>
                    <input
                      type="text" value={q.scale_config?.metric_key || ''}
                      onChange={(e) => updateQuestion(qIdx, 'scale_config', {
                        ...(q.scale_config || {}), metric_key: e.target.value,
                      })}
                      placeholder="metric_key"
                    />
                  </div>
                </div>
              )}

              {/* Текст */}
              {q.question_type === 'text' && (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Клиент введёт свободный текст.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Нижняя панель */}
        <div style={{
          display: 'flex', gap: '12px', justifyContent: 'center',
          marginBottom: '60px',
        }}>
          <button
            onClick={() => navigate('/psychologist')}
            className="btn btn-outline"
            style={{ padding: '12px 28px' }}
          >
            ← Назад
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '12px 36px', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? '⏳ Сохранение...' : '💾 Сохранить тест'}
          </button>
        </div>
      </div>
    </div>
  );
};