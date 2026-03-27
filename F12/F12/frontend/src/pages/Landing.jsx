import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Landing = () => {
  const { user } = useAuth();

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", color: '#2d3748' }}>
      
      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 50%, #fef9c3 100%)',
        padding: '80px 20px 100px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Декоративные круги */}
        <div style={{
          position: 'absolute', top: '-60px', left: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'rgba(167, 243, 208, 0.3)', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', right: '-40px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'rgba(186, 230, 253, 0.3)', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '50px',
            padding: '6px 18px',
            fontSize: '0.85rem',
            color: '#0369a1',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.8)',
          }}>
            🧬 Платформа для профориентологов
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: '800',
            lineHeight: '1.2',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #0369a1, #0d9488)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Откройте призвание<br />каждого клиента
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: '#64748b',
            marginBottom: '40px',
            lineHeight: '1.7',
            maxWidth: '520px',
            margin: '0 auto 40px',
          }}>
            ПрофДНК — цифровой помощник психолога.<br />
            Создавайте тесты, анализируйте результаты<br />
            и помогайте людям находить себя.
          </p>

          {!user ? (
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" style={{
                background: 'linear-gradient(135deg, #0369a1, #0d9488)',
                color: 'white',
                padding: '14px 36px',
                borderRadius: '50px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1rem',
                boxShadow: '0 8px 25px rgba(3, 105, 161, 0.3)',
                transition: 'transform 0.2s',
              }}>
                Войти в систему
              </Link>
              <a href="#features" style={{
                background: 'rgba(255,255,255,0.8)',
                color: '#0369a1',
                padding: '14px 36px',
                borderRadius: '50px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1rem',
                border: '2px solid rgba(3, 105, 161, 0.2)',
                backdropFilter: 'blur(10px)',
              }}>
                Узнать больше ↓
              </a>
            </div>
          ) : (
            <Link to={user.role === 'admin' ? '/admin' : '/psychologist'} style={{
              background: 'linear-gradient(135deg, #0369a1, #0d9488)',
              color: 'white',
              padding: '14px 36px',
              borderRadius: '50px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '1rem',
              boxShadow: '0 8px 25px rgba(3, 105, 161, 0.3)',
            }}>
              Перейти в кабинет →
            </Link>
          )}
        </div>

        {/* Статистика */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          marginTop: '60px',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1,
        }}>
          {[
            { num: '100+', label: 'Психологов' },
            { num: '50+', label: 'Методик' },
            { num: '1000+', label: 'Клиентов' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '20px',
              padding: '20px 32px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.9)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0369a1' }}>{stat.num}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{
        padding: '80px 20px',
        background: '#fafafa',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b' }}>
            Всё что нужно психологу
          </h2>
          <p style={{ color: '#64748b', marginTop: '12px', fontSize: '1.05rem' }}>
            Один инструмент — полный цикл диагностики
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {[
            {
              emoji: '🧩',
              color: '#e0f2fe',
              accent: '#0369a1',
              title: 'Конструктор тестов',
              text: 'Создавайте опросники любой сложности без программиста. Разные типы вопросов, логика ветвления, собственные метрики.',
            },
            {
              emoji: '🔗',
              color: '#f0fdf4',
              accent: '#059669',
              title: 'Уникальная ссылка',
              text: 'Клиент получает ссылку и проходит тест без регистрации. Просто, удобно и без лишних шагов.',
            },
            {
              emoji: '📊',
              color: '#fef9c3',
              accent: '#b45309',
              title: 'Автоматический расчёт',
              text: 'Система сама считает баллы по вашим формулам. Вы видите готовые метрики сразу после прохождения.',
            },
            {
              emoji: '📄',
              color: '#fdf2f8',
              accent: '#9333ea',
              title: 'Два типа отчётов',
              text: 'Клиентский — понятный и мотивирующий. Профессиональный — детальный, с данными для анализа.',
            },
            {
              emoji: '🔒',
              color: '#fff7ed',
              accent: '#ea580c',
              title: 'Контроль доступа',
              text: 'Администратор управляет доступом психологов, настраивает подписки и следит за активностью платформы.',
            },
            {
              emoji: '💬',
              color: '#f0f9ff',
              accent: '#0284c7',
              title: 'Живое общение',
              text: 'Платформа берёт рутину на себя. Вы сосредоточены на главном — живом контакте с клиентом.',
            },
          ].map((card) => (
            <div key={card.title} style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.04)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
              }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: card.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.8rem', marginBottom: '20px',
              }}>
                {card.emoji}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>
                {card.title}
              </h3>
              <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '0.95rem' }}>
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* КАК ЭТО РАБОТАЕТ */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
            Как это работает
          </h2>
          <p style={{ color: '#64748b', marginBottom: '56px', fontSize: '1.05rem' }}>
            Три простых шага до результата
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px',
          }}>
            {[
              { step: '01', emoji: '🎨', title: 'Создайте тест', text: 'Соберите опросник в конструкторе. Добавьте вопросы, настройте логику и метрики.' },
              { step: '02', emoji: '📨', title: 'Отправьте ссылку', text: 'Клиент получает уникальную ссылку и проходит тест в удобное время.' },
              { step: '03', emoji: '✨', title: 'Получите отчёт', text: 'Система автоматически считает результаты и формирует красивый отчёт.' },
            ].map((item) => (
              <div key={item.step} style={{
                background: 'white',
                borderRadius: '24px',
                padding: '36px 28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: '20px', right: '20px',
                  fontSize: '0.75rem', fontWeight: '800', color: '#cbd5e1',
                  letterSpacing: '1px',
                }}>
                  {item.step}
                </div>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{item.emoji}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ЦЕНЫ */}
      <section style={{
        padding: '80px 20px',
        background: '#fafafa',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
            Тарифы
          </h2>
          <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '1.05rem' }}>
            Доступ предоставляется администратором платформы
          </p>
          <div style={{
            background: '#fff7ed',
            borderRadius: '16px',
            padding: '12px 24px',
            display: 'inline-block',
            color: '#92400e',
            fontSize: '0.85rem',
            border: '1px solid #fed7aa',
            marginBottom: '48px',
          }}>
            ⚠️ Не является публичной офертой
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
          }}>
            {[
              { period: '1 месяц', price: '990 ₽', color: '#e0f2fe', accent: '#0369a1' },
              { period: '3 месяца', price: '2 490 ₽', color: '#f0fdf4', accent: '#059669', popular: true },
              { period: '1 год', price: '7 990 ₽', color: '#fef9c3', accent: '#b45309' },
            ].map((plan) => (
              <div key={plan.period} style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px 24px',
                boxShadow: plan.popular ? '0 12px 40px rgba(5, 150, 105, 0.15)' : '0 4px 20px rgba(0,0,0,0.06)',
                border: plan.popular ? `2px solid ${plan.accent}` : '1px solid rgba(0,0,0,0.04)',
                position: 'relative',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                    background: plan.accent, color: 'white', padding: '4px 16px',
                    borderRadius: '50px', fontSize: '0.75rem', fontWeight: '700',
                    whiteSpace: 'nowrap',
                  }}>
                    Популярный
                  </div>
                )}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: plan.color, margin: '0 auto 16px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                }}>
                  {plan.period === '1 месяц' ? '🌱' : plan.period === '3 месяца' ? '🌿' : '🌳'}
                </div>
                <h3 style={{ fontSize: '1rem', color: '#64748b', marginBottom: '8px' }}>{plan.period}</h3>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: plan.accent }}>{plan.price}</div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px' }}>
                  Доступ к платформе
                </p>
              </div>
            ))}
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '24px' }}>
            Для подключения свяжитесь с администратором платформы
          </p>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{
          padding: '80px 20px',
          background: 'linear-gradient(135deg, #0369a1, #0d9488)',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🧬</div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '16px' }}>
              Готовы начать?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '36px', fontSize: '1.05rem' }}>
              Войдите в систему и начните помогать клиентам находить своё призвание
            </p>
            <Link to="/login" style={{
              background: 'white',
              color: '#0369a1',
              padding: '16px 48px',
              borderRadius: '50px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '1.05rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              display: 'inline-block',
            }}>
              Войти в ПрофДНК →
            </Link>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer style={{
        background: '#1e293b',
        color: '#94a3b8',
        padding: '40px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
          🧬 ПрофДНК
        </div>
        <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
          Платформа для профориентологов
        </p>
        <p style={{ fontSize: '0.8rem' }}>
          © 2026 ПрофДНК. Все права защищены.
        </p>
      </footer>

    </div>
  );
};