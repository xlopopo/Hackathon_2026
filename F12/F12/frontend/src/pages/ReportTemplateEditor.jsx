import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportTemplateService } from '../services/reportTemplateService';
import { formService } from '../services/formService';
import { psychologistService } from '../services/psychologistService';

const AVAILABLE_BLOCKS = {
  client: [
    { type: 'total_score', title: '📊 Общий результат', description: 'Показывает общий балл' },
    { type: 'metrics', title: '📈 Метрики', description: 'Детализация по метрикам' },
    { type: 'interpretation', title: '📝 Интерпретация', description: 'Диапазоны → текст' },
    { type: 'recommendations', title: '💬 Рекомендации', description: 'Произвольный текст' },
    { type: 'computed', title: '🧮 Вычисляемые показатели', description: 'Формулы из scoring_config' },
  ],
  psychologist: [
    { type: 'total_score', title: '📊 Общий балл', description: 'Итоговый балл' },
    { type: 'metrics', title: '📈 Метрики', description: 'Все метрики' },
    { type: 'answers_detail', title: '📋 Детализация ответов', description: 'Таблица вопрос-ответ' },
    { type: 'raw_data', title: '🧾 Сырые данные', description: 'JSON результатов' },
    { type: 'interpretation', title: '📝 Интерпретация', description: 'Диапазоны → текст' },
    { type: 'computed', title: '🧮 Вычисляемые', description: 'Формулы' },
  ],
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const ReportTemplateEditor = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [activeType, setActiveType] = useState('client');

  const [availableMetrics, setAvailableMetrics] = useState([]);
  const [metricToAdd, setMetricToAdd] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // preview
  const [sessions, setSessions] = useState([]);
  const [previewSessionId, setPreviewSessionId] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const loadData = async () => {
    try {
      const [testData, templatesData, sess, metrics] = await Promise.all([
        formService.getFormById(testId),
        reportTemplateService.getTemplates(testId),
        psychologistService.getMySessions(testId),
        reportTemplateService.getMetrics(testId),
      ]);

      setTest(testData);
      setTemplates(templatesData);
      setAvailableMetrics(metrics || []);

      const completed = (sess || []).filter(s => s.status === 'completed');
      setSessions(completed);
      setPreviewSessionId(completed[0]?.id ? String(completed[0].id) : '');
    } catch {
      setMessage('❌ Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const currentTemplate = templates.find(t => t.report_type === activeType);
  const currentBlocks = currentTemplate?.blocks || [];
  const currentInterpretations = currentTemplate?.interpretations || {};

  const updateTemplateLocal = (patch) => {
    setTemplates(prev =>
      prev.map(t => (t.report_type === activeType ? { ...t, ...patch } : t))
    );
  };

  const updateBlocks = (newBlocks) => updateTemplateLocal({ blocks: newBlocks });

  const toggleBlock = (blockType) => {
    if (!currentTemplate) return;

    if (currentBlocks.find(b => b.type === blockType)) {
      updateBlocks(currentBlocks.map(b => b.type === blockType ? { ...b, enabled: !b.enabled } : b));
      return;
    }

    const available = AVAILABLE_BLOCKS[activeType].find(b => b.type === blockType);
    if (!available) return;

    updateBlocks([
      ...currentBlocks,
      { type: blockType, enabled: true, title: available.title.replace(/^[^\s]+ /, ''), config: {} },
    ]);
  };

  const updateBlockTitle = (blockType, title) => {
    updateBlocks(currentBlocks.map(b => b.type === blockType ? { ...b, title } : b));
  };

  const updateBlockConfig = (blockType, configPatch) => {
    updateBlocks(currentBlocks.map(b =>
      b.type === blockType ? { ...b, config: { ...(b.config || {}), ...configPatch } } : b
    ));
  };

  const moveBlock = (idx, dir) => {
    const arr = [...currentBlocks];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    updateBlocks(arr);
  };

  // ----- Интерпретации -----
  const setInterpretations = (value) => updateTemplateLocal({ interpretations: value });

  const hasInterpretationBlockEnabled =
    !!currentBlocks.find(b => b.type === 'interpretation' && b.enabled);

  const observedRangeForMetric = (metricKey) => {
    const vals = (sessions || [])
      .map(s => s?.results?.metrics?.[metricKey])
      .filter(v => v !== undefined && v !== null)
      .map(v => Number(v))
      .filter(v => !Number.isNaN(v));

    if (!vals.length) return { min: 0, max: 10 };

    let min = Math.min(...vals);
    let max = Math.max(...vals);

    // если все одинаковые — расширяем диапазон
    if (min === max) {
      min = 0;
      max = Math.max(10, max);
    }

    return { min: round2(min), max: round2(max) };
  };

  const autoRangesForMetric = (metricKey) => {
    const { min, max } = observedRangeForMetric(metricKey);
    const span = max - min;

    // на всякий случай
    if (span <= 0) {
      return [
        { min, max, level: 'средний', text: 'Средний показатель' },
      ];
    }

    const p1 = round2(min + span / 3);
    const p2 = round2(min + (2 * span) / 3);

    const eps = 0.01; // чтобы интервалы не пересекались из-за <=
    return [
      { min: round2(min), max: round2(p1), level: 'низкий', text: 'Низкий показатель' },
      { min: round2(p1 + eps), max: round2(p2), level: 'средний', text: 'Средний показатель' },
      { min: round2(p2 + eps), max: round2(max), level: 'высокий', text: 'Высокий показатель' },
    ];
  };

  const addMetricKey = (key) => {
    const mk = (key || '').trim();
    if (!mk) return;

    if (currentInterpretations[mk]) {
      showMsg('⚠️ Такая метрика уже добавлена');
      return;
    }

    // ✅ Автогенерация сразу
    const ranges = autoRangesForMetric(mk);
    setInterpretations({ ...currentInterpretations, [mk]: ranges });
    showMsg(`✅ Метрика ${mk} добавлена (автодиапазоны)`);
  };

  const addMetricFromInput = () => {
    if (!hasInterpretationBlockEnabled) return;
    const mk = (metricToAdd || '').trim();
    if (!mk) {
      showMsg('⚠️ Выберите или введите metric_key');
      return;
    }
    addMetricKey(mk);
    setMetricToAdd('');
  };

  const addAllMetrics = () => {
    if (!hasInterpretationBlockEnabled) return;

    const toAdd = (availableMetrics || []).filter(m => !currentInterpretations[m]);
    if (toAdd.length === 0) {
      showMsg('ℹ️ Все метрики уже добавлены');
      return;
    }

    const copy = { ...currentInterpretations };
    for (const mk of toAdd) {
      copy[mk] = autoRangesForMetric(mk); // ✅ авто
    }
    setInterpretations(copy);
    showMsg(`✅ Добавлено метрик: ${toAdd.length} (с автодиапазонами)`);
  };

  const removeMetric = (key) => {
    if (!window.confirm(`Удалить интерпретации для метрики "${key}"?`)) return;
    const copy = { ...currentInterpretations };
    delete copy[key];
    setInterpretations(copy);
  };

  const addRange = (metricKey) => {
    const ranges = currentInterpretations[metricKey] || [];
    setInterpretations({ ...currentInterpretations, [metricKey]: [...ranges, { min: 0, max: 0, level: '', text: '' }] });
  };

  const removeRange = (metricKey, idx) => {
    const ranges = currentInterpretations[metricKey] || [];
    const next = ranges.filter((_, i) => i !== idx);
    setInterpretations({ ...currentInterpretations, [metricKey]: next });
  };

  const updateRange = (metricKey, idx, field, value) => {
    const ranges = currentInterpretations[metricKey] || [];
    const next = ranges.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    setInterpretations({ ...currentInterpretations, [metricKey]: next });
  };

  const regenerateAutoRanges = (metricKey) => {
    if (!hasInterpretationBlockEnabled) return;
    if (!window.confirm(`Перегенерировать автодиапазоны для "${metricKey}"? Текущие значения будут перезаписаны.`)) return;
    setInterpretations({ ...currentInterpretations, [metricKey]: autoRangesForMetric(metricKey) });
    showMsg(`✅ Перегенерировано: ${metricKey}`);
  };

  // ----- Сохранение -----
  const handleSave = async () => {
    if (!currentTemplate) return;
    setSaving(true);
    try {
      await reportTemplateService.updateTemplate(currentTemplate.id, {
        blocks: currentBlocks,
        interpretations: currentInterpretations,
      });
      showMsg('✅ Шаблон сохранён!');
    } catch (err) {
      showMsg(err.response?.data?.detail || '❌ Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  // ----- Предпросмотр -----
  const handlePreview = async () => {
    if (!previewSessionId) {
      showMsg('⚠️ Нет завершённых сессий для предпросмотра');
      return;
    }
    setPreviewLoading(true);
    try {
      const html = await psychologistService.getReportHtml(parseInt(previewSessionId), activeType);
      setPreviewHtml(html);
      setPreviewOpen(true);
    } catch (err) {
      showMsg(err.response?.data?.detail || '❌ Ошибка предпросмотра');
    } finally {
      setPreviewLoading(false);
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

        {/* Верх */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
        }}>
          <button
            onClick={() => navigate(`/psychologist/constructor/${testId}`)}
            style={{
              background: 'white', border: '1px solid #e2e8f0', borderRadius: '50px',
              padding: '10px 20px', cursor: 'pointer', fontSize: '0.9rem',
              fontWeight: '600', color: '#64748b', fontFamily: 'Inter, sans-serif',
            }}
          >
            ← Назад к тесту
          </button>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handlePreview}
              disabled={previewLoading}
              className="btn btn-outline"
              style={{ padding: '10px 20px' }}
            >
              {previewLoading ? '⏳' : '👁'} Предпросмотр
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '10px 24px', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? '⏳...' : '💾 Сохранить шаблон'}
            </button>
          </div>
        </div>

        {/* Заголовок */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '20px',
        }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
            📄 Шаблоны отчётов
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Тест: <strong>{test?.title}</strong>
          </p>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            {[
              { id: 'client', label: '👤 Для клиента' },
              { id: 'psychologist', label: '🧠 Для психолога' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveType(tab.id)} style={{
                padding: '10px 16px', borderRadius: '12px', border: 'none',
                cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
                fontFamily: 'Inter, sans-serif',
                background: activeType === tab.id
                  ? 'linear-gradient(135deg, #0369a1, #0d9488)' : '#f1f5f9',
                color: activeType === tab.id ? 'white' : '#64748b',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
              Сессия для предпросмотра
            </label>
            <select
              value={previewSessionId}
              onChange={(e) => setPreviewSessionId(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 12,
                border: '1px solid #e2e8f0', background: 'white',
              }}
            >
              {sessions.length === 0 && <option value="">Нет завершённых сессий</option>}
              {sessions.map(s => (
                <option key={s.id} value={String(s.id)}>
                  #{s.id} — {s.client_name || 'Аноним'} ({s.client_email || 'без email'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Интерпретации */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '60px',
          opacity: hasInterpretationBlockEnabled ? 1 : 0.5,
        }}>
          <h2 style={{ fontWeight: '800', color: '#1e293b', margin: 0 }}>📝 Интерпретации</h2>
          <p style={{ color: '#64748b', marginTop: 6 }}>
            Нажми <strong>+ A</strong> — и диапазоны сгенерируются автоматически сразу.
          </p>

          <div style={{
            marginTop: 12,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 16,
          }}>
            <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
              Автометрики из теста
            </div>

            {availableMetrics.length === 0 ? (
              <div style={{ color: '#94a3b8' }}>
                Метрики не найдены. Добавь metric_key у вариантов ответа или в scale_config у шкалы.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {availableMetrics.map(mk => (
                  <button
                    key={mk}
                    onClick={() => addMetricKey(mk)}
                    disabled={!hasInterpretationBlockEnabled || !!currentInterpretations[mk]}
                    style={{
                      background: currentInterpretations[mk] ? '#dcfce7' : '#e0f2fe',
                      color: currentInterpretations[mk] ? '#166534' : '#0369a1',
                      border: 'none',
                      borderRadius: 999,
                      padding: '6px 12px',
                      fontWeight: 900,
                      cursor: currentInterpretations[mk] ? 'default' : 'pointer',
                      opacity: !hasInterpretationBlockEnabled ? 0.6 : 1,
                    }}
                  >
                    {currentInterpretations[mk] ? `✓ ${mk}` : `+ ${mk}`}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
              <button
                className="btn btn-outline"
                onClick={addAllMetrics}
                disabled={!hasInterpretationBlockEnabled}
              >
                + Добавить все (с автодиапазонами)
              </button>

              <input
                type="text"
                value={metricToAdd}
                onChange={(e) => setMetricToAdd(e.target.value)}
                disabled={!hasInterpretationBlockEnabled}
                placeholder="или введи metric_key вручную"
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  minWidth: 260,
                }}
              />

              <button
                className="btn btn-outline"
                onClick={addMetricFromInput}
                disabled={!hasInterpretationBlockEnabled}
              >
                + Метрика
              </button>
            </div>
          </div>

          {Object.keys(currentInterpretations).length === 0 ? (
            <div style={{ color: '#94a3b8', padding: '12px 0' }}>
              Пока нет интерпретаций. Добавь метрику выше.
            </div>
          ) : (
            Object.entries(currentInterpretations).map(([metricKey, ranges]) => (
              <div key={metricKey} style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 900, color: '#0369a1' }}>
                    metric_key: {metricKey}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={() => regenerateAutoRanges(metricKey)} disabled={!hasInterpretationBlockEnabled}>
                      ⚡ Автодиапазоны заново
                    </button>
                    <button className="btn btn-outline" onClick={() => addRange(metricKey)} disabled={!hasInterpretationBlockEnabled}>
                      + Диапазон
                    </button>
                    <button className="btn btn-danger" onClick={() => removeMetric(metricKey)} disabled={!hasInterpretationBlockEnabled}>
                      Удалить метрику
                    </button>
                  </div>
                </div>

                {(ranges || []).map((r, idx) => (
                  <div key={idx} style={{
                    marginTop: 12,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: 16,
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 120px 160px 1fr', gap: 10, alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>min</label>
                        <input
                          type="number"
                          value={r.min}
                          onChange={(e) => updateRange(metricKey, idx, 'min', Number(e.target.value))}
                          style={{ width: '100%', padding: 8, borderRadius: 12, border: '1px solid #e2e8f0' }}
                          disabled={!hasInterpretationBlockEnabled}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>max</label>
                        <input
                          type="number"
                          value={r.max}
                          onChange={(e) => updateRange(metricKey, idx, 'max', Number(e.target.value))}
                          style={{ width: '100%', padding: 8, borderRadius: 12, border: '1px solid #e2e8f0' }}
                          disabled={!hasInterpretationBlockEnabled}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>level</label>
                        <input
                          type="text"
                          value={r.level || ''}
                          onChange={(e) => updateRange(metricKey, idx, 'level', e.target.value)}
                          style={{ width: '100%', padding: 8, borderRadius: 12, border: '1px solid #e2e8f0' }}
                          disabled={!hasInterpretationBlockEnabled}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>text</label>
                        <input
                          type="text"
                          value={r.text || ''}
                          onChange={(e) => updateRange(metricKey, idx, 'text', e.target.value)}
                          style={{ width: '100%', padding: 8, borderRadius: 12, border: '1px solid #e2e8f0' }}
                          disabled={!hasInterpretationBlockEnabled}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <button
                        onClick={() => removeRange(metricKey, idx)}
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        disabled={!hasInterpretationBlockEnabled}
                      >
                        Удалить диапазон
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Modal Preview */}
        {previewOpen && (
          <div
            onClick={() => setPreviewOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20, zIndex: 9999,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(1100px, 95vw)',
                height: 'min(80vh, 900px)',
                background: 'white',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{
                padding: 12,
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ fontWeight: 900, color: '#1e293b' }}>
                  👁 Предпросмотр ({activeType})
                </div>
                <button className="btn btn-outline" onClick={() => setPreviewOpen(false)}>
                  Закрыть
                </button>
              </div>
              <div style={{ padding: 0, flex: 1, overflow: 'auto' }}>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};