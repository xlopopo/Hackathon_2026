import { useAuth } from '../contexts/AuthContext';

export const AdminProfile = () => {
  const { user } = useAuth();

  if (!user) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ color: '#64748b', marginTop: '12px' }}>Загрузка...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f0f9ff', minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '700px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }}>
          Мой профиль
        </h1>

        <div style={{
          background: 'white', borderRadius: '24px', padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
            <div style={{
              width: '90px', height: '90px', borderRadius: '24px',
              background: 'linear-gradient(135deg, #0369a1, #0d9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', fontWeight: '800', color: 'white', flexShrink: 0,
            }}>
              {user.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b' }}>
                {user.full_name}
              </h2>
              <p style={{ color: '#64748b', marginTop: '4px', fontSize: '0.95rem' }}>
                {user.email}
              </p>
              <span style={{
                background: 'linear-gradient(135deg, #e0f2fe, #f0fdf4)',
                color: '#0369a1', padding: '5px 14px', borderRadius: '50px',
                fontSize: '0.8rem', fontWeight: '700',
                display: 'inline-block', marginTop: '10px',
                border: '1px solid #bae6fd',
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
                background: '#f8fafc', borderRadius: '14px', padding: '18px',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
                  {item.emoji} {item.label}
                </div>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};