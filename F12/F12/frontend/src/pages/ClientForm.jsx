import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { formService } from '../services/formService';
import api from '../services/api';

const DEFAULT_FIELDS = [
  { key: 'full_name', label: 'ФИО', required: true, enabled: true },
  { key: 'email', label: 'Email', required: false, enabled: true },
];

export const ClientForm = () => {
  const { formId } = useParams();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [clientData, setClientData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadForm = async () => {
      try {
        const data = await formService.getFormByLink(formId);
        setTest(data);
      } catch {
        setError('Тест не найден или не опубликован');
      } finally {
        setLoading(false);
      }
    };
    loadForm();
  }, [formId]);

  const clientFields = test?.client_fields?.fields?.filter(f => f.enabled) || DEFAULT_FIELDS;

  const handleClientDataChange = (key, value) => {
    setClientData(prev => ({ ...prev, [key]: value }));
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultipleChange = (questionId, optionId, checked) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, optionId] };
      } else {
        return { ...prev, [questionId]: current.filter(id => id !== optionId) };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (const field of clientFields) {
      if (field.required && !clientData[field.key]?.trim()) {
        alert(`Пожалуйста, заполните поле "${field.label}"`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const sessionRes = await api.post(`/sessions/start/${formId}`);
      const sessionId = sessionRes.data.id;

      const answersArray = [];
      for (const question of test.questions) {
        const answer = answers[question.id];
        const answerObj = { question_id: question.id };

        if (question.question_type === 'single_choice') {
          answerObj.selected_option_id = answer || null;
        } else if (question.question_type === 'multiple_choice') {
          answerObj.selected_option_ids = answer || [];
        } else if (question.question_type === 'text') {
          answerObj.text_value = answer || '';
        } else if (question.question_type === 'scale') {
          answerObj.scale_value = answer ? parseInt(answer) : null;
        }

        answersArray.push(answerObj);
      }

      await api.post(`/sessions/${sessionId}/submit`, {
        client_name: clientData['full_name'] || 'Аноним',
        client_email: clientData['email'] || null,
        answers: answersArray,
      });

      setSubmitted(true);
    } catch (err) {
      alert('Ошибка при отправке: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ color: '#64748b', marginTop: '12px' }}>Загрузка теста...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
      <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Тест не найден</h2>
      <p style={{ color: '#64748b' }}>{error}</p>
    </div>
  );

  if (submitted) return (
    <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 20px' }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
        <h2 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '1.5rem', fontWeight: '800' }}>
          Спасибо за участие!
        </h2>
        <p style={{ color: '#64748b', lineHeight: '1.6' }}>
          Ваши ответы успешно получены.<br />
          Психолог обработает результаты и свяжется с вами.
        </p>
        <div style={{
          marginTop: '24px', background: '#f0f9ff', borderRadius: '16px',
          padding: '16px 20px', fontSize: '0.85rem', color: '#0369a1',
          border: '1px solid #bae6fd',
        }}>
          📧 Результаты будут отправлены вам психологом
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px 60px' }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
          {test.title}
        </h1>
        {test.description && (
          <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
            {test.description}
          </p>
        )}

        <form onSubmit={handleSubmit}>

          {/* Поля клиента */}
          <div style={{
            background: '#f8fafc', borderRadius: '16px', padding: '20px',
            marginBottom: '24px', border: '1px solid #e2e8f0',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
              👤 Ваши данные
            </h3>
            {clientFields.map(field => (
              <div key={field.key} className="form-group">
                <label>
                  {field.label}
                  {field.required && <span style={{ color: '#ef4444' }}> *</span>}
                </label>
                {field.key === 'birth_date' ? (
                  <input
                    type="date"
                    value={clientData[field.key] || ''}
                    onChange={(e) => handleClientDataChange(field.key, e.target.value)}
                    required={field.required}
                  />
                ) : field.key === 'email' ? (
                  <input
                    type="email"
                    value={clientData[field.key] || ''}
                    onChange={(e) => handleClientDataChange(field.key, e.target.value)}
                    required={field.required}
                    placeholder="email@example.com"
                  />
                ) : field.key === 'phone' ? (
                  <input
                    type="tel"
                    value={clientData[field.key] || ''}
                    onChange={(e) => handleClientDataChange(field.key, e.target.value)}
                    required={field.required}
                    placeholder="+7 (999) 999-99-99"
                  />
                ) : (
                  <input
                    type="text"
                    value={clientData[field.key] || ''}
                    onChange={(e) => handleClientDataChange(field.key, e.target.value)}
                    required={field.required}
                    placeholder={`Введите ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>

          <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

          {/* Вопросы */}
          {test.questions.map((q, idx) => (
            <div key={q.id} style={{
              marginBottom: '20px', padding: '20px',
              background: '#f8fafc', borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}>
              <label style={{
                fontWeight: '700', color: '#1e293b',
                marginBottom: '12px', display: 'block',
              }}>
                {idx + 1}. {q.text}
                {q.is_required && <span style={{ color: '#ef4444' }}> *</span>}
              </label>

              {q.question_type === 'single_choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map(opt => (
                    <label key={opt.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                      background: answers[q.id] === opt.id ? '#e0f2fe' : 'white',
                      border: `2px solid ${answers[q.id] === opt.id ? '#0369a1' : '#e2e8f0'}`,
                      transition: 'all 0.2s',
                    }}>
                      <input
                        type="radio" name={`q_${q.id}`}
                        checked={answers[q.id] === opt.id}
                        onChange={() => handleAnswerChange(q.id, opt.id)}
                      />
                      {opt.text}
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === 'multiple_choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map(opt => (
                    <label key={opt.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                      background: (answers[q.id] || []).includes(opt.id) ? '#e0f2fe' : 'white',
                      border: `2px solid ${(answers[q.id] || []).includes(opt.id) ? '#0369a1' : '#e2e8f0'}`,
                      transition: 'all 0.2s',
                    }}>
                      <input
                        type="checkbox"
                        checked={(answers[q.id] || []).includes(opt.id)}
                        onChange={(e) => handleMultipleChange(q.id, opt.id, e.target.checked)}
                      />
                      {opt.text}
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === 'text' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  rows={3}
                  placeholder="Введите ваш ответ..."
                  style={{ resize: 'vertical' }}
                  required={q.is_required}
                />
              )}

              {q.question_type === 'scale' && (
                <div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: '8px', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {q.scale_config?.min ?? 1}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0369a1' }}>
                      {answers[q.id] ?? q.scale_config?.min ?? 1}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {q.scale_config?.max ?? 10}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={q.scale_config?.min ?? 1}
                    max={q.scale_config?.max ?? 10}
                    value={answers[q.id] || q.scale_config?.min || 1}
                    onChange={(e) => handleAnswerChange(q.id, parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              width: '100%', padding: '14px',
              fontSize: '1rem', opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? '⏳ Отправка...' : '📤 Отправить ответы'}
          </button>
        </form>
      </div>
    </div>
  );
};