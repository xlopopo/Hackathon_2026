import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

export const PsychologistProfile = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    telegram: '',
    education_level: '',
    bio: '',
  });

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const loadProfile = async () => {
    try {
      const data = await authService.getMe();
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        telegram: data.telegram || '',
        education_level: data.education_level || '',
        bio: data.bio || '',
      });
      if (setUser) setUser(data);
    } catch {
      showMsg('Ошибка загрузки профиля', 'error');
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await authService.updateProfile(formData);
      setProfile(updated);
      if (setUser) setUser(updated);
      setEditing(false);
      showMsg('✅ Профиль сохранён');
    } catch {
      showMsg('Ошибка сохранения', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const updated = await authService.uploadAvatar(file);
      setProfile(updated);
      if (setUser) setUser(updated);
      showMsg('✅ Фото обновлено');
    } catch {
      showMsg('Ошибка загрузки фото', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ color: '#64748b', marginTop: '12px' }}>Загрузка...</p>
      </div>
    </div>
  );

  const avatarSrc = profile.avatar_url
    ? `http://localhost:8000${profile.avatar_url}`
    : null;

  const accessUntil = profile.access_until ? new Date(profile.access_until) : null;
  const hasAccess = (() => {
    if (!profile.is_active) return false;
    if (profile.role === 'admin') return true;
    if (!profile.access_until) return true;
    return new Date(profile.access_until) > new Date();
  })();
  const daysLeft = accessUntil
    ? Math.ceil((accessUntil - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div style={{ background: '#f0f9ff', minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>

        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }}>
          Мой профиль
        </h1>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        {/* Основная карточка */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px',
        }}>
          {/* Аватар и имя */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" style={{
                  width: '100px', height: '100px', borderRadius: '24px', objectFit: 'cover',
                }} />
              ) : (
                <div style={{
                  width: '100px', height: '100px', borderRadius: '24px',
                  background: 'linear-gradient(135deg, #0369a1, #0d9488)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.2rem', fontWeight: '800', color: 'white',
                }}>
                  {profile.full_name?.charAt(0) || '?'}
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()} style={{
                position: 'absolute', bottom: '-8px', right: '-8px',
                background: 'white', border: '2px solid #e2e8f0',
                borderRadius: '50%', width: '32px', height: '32px',
                cursor: 'pointer', fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                📷
              </button>
              <input
                type="file" ref={fileInputRef} style={{ display: 'none' }}
                accept="image/*" onChange={handleAvatarChange}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>
                {profile.full_name}
              </h2>
              <p style={{ color: '#64748b', marginTop: '4px' }}>{profile.email}</p>
              <span style={{
                background: '#e0f2fe', color: '#0369a1',
                padding: '4px 12px', borderRadius: '50px',
                fontSize: '0.75rem', fontWeight: '700',
                display: 'inline-block', marginTop: '8px',
              }}>
                🧠 Психолог
              </span>
            </div>

            <div>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="btn btn-primary">
                  ✏️ Редактировать
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSave} disabled={loading} className="btn btn-primary">
                    {loading ? '...' : '💾 Сохранить'}
                  </button>
                  <button onClick={() => setEditing(false)} className="btn btn-outline">
                    Отмена
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Поля */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {[
              { label: 'ФИО', field: 'full_name', emoji: '👤', type: 'text' },
              { label: 'Телефон', field: 'phone', emoji: '📱', type: 'tel' },
              { label: 'Telegram', field: 'telegram', emoji: '💬', type: 'text' },
              { label: 'Образование', field: 'education_level', emoji: '🎓', type: 'text' },
            ].map(item => (
              <div key={item.field} style={{
                background: '#f8fafc', borderRadius: '14px', padding: '16px',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
                  {item.emoji} {item.label}
                </div>
                {editing ? (
                  <input
                    type={item.type}
                    value={formData[item.field]}
                    onChange={e => setFormData({ ...formData, [item.field]: e.target.value })}
                    style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                  />
                ) : (
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>
                    {profile[item.field] || <span style={{ color: '#94a3b8' }}>Не указано</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* О себе */}
          <div style={{
            background: '#f8fafc', borderRadius: '14px', padding: '16px',
            border: '1px solid #e2e8f0', marginTop: '16px',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
              📝 О себе
            </div>
            {editing ? (
              <textarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Расскажите о вашем опыте..."
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.9rem' }}
              />
            ) : (
              <div style={{ color: '#1e293b', lineHeight: '1.6' }}>
                {profile.bio || <span style={{ color: '#94a3b8' }}>Не заполнено</span>}
              </div>
            )}
          </div>
        </div>

        {/* Статус подписки */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}>
          <h3 style={{ fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>
            📅 Статус подписки
          </h3>
          <div style={{
            background: hasAccess ? '#f0fdf4' : '#fee2e2',
            borderRadius: '14px', padding: '16px',
            border: `2px solid ${hasAccess ? '#86efac' : '#fca5a5'}`,
          }}>
            <div style={{ fontWeight: '700', color: hasAccess ? '#166534' : '#991b1b' }}>
              {hasAccess ? '✅ Подписка активна' : '❌ Подписка неактивна'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
              {accessUntil
                ? `До ${accessUntil.toLocaleDateString('ru-RU')} (осталось ${daysLeft} дн.)`
                : 'Бессрочный доступ'}
            </div>
            {!hasAccess && (
              <div style={{ fontSize: '0.85rem', color: '#991b1b', marginTop: '8px', fontWeight: '600' }}>
                Обратитесь к администратору для продления
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};