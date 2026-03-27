import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Логотип */}
        <Link to="/" className="navbar-brand">
          🧬 ПрофДНК
        </Link>

        {/* Навигация */}
        <div className="navbar-nav">
          {!user ? (
            <Link to="/login" style={{
              background: 'linear-gradient(135deg, #0369a1, #0d9488)',
              color: 'white',
              padding: '8px 20px',
              borderRadius: '50px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.9rem',
            }}>
              Войти
            </Link>
          ) : (
            <>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin" className="nav-link" style={isActive('/admin') ? { color: '#0369a1', background: '#e0f2fe' } : {}}>
                    Психологи
                  </Link>
                  <Link to="/admin/profile" className="nav-link" style={isActive('/admin/profile') ? { color: '#0369a1', background: '#e0f2fe' } : {}}>
                    Профиль
                  </Link>
                </>
              )}
              {user.role === 'psychologist' && (
                <>
                  <Link to="/psychologist" className="nav-link" style={isActive('/psychologist') ? { color: '#0369a1', background: '#e0f2fe' } : {}}>
                    Мои тесты
                  </Link>
                  <Link to="/psychologist/profile" className="nav-link" style={isActive('/psychologist/profile') ? { color: '#0369a1', background: '#e0f2fe' } : {}}>
                    Профиль
                  </Link>
                </>
              )}

              {/* Аватар + имя */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#f0f9ff', borderRadius: '50px',
                padding: '6px 14px 6px 6px',
              }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0369a1, #0d9488)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '700', fontSize: '0.8rem',
                }}>
                  {user.full_name?.charAt(0) || '?'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}>
                  {user.full_name?.split(' ')[0]}
                </span>
              </div>

              <button onClick={handleLogout} style={{
                background: '#fee2e2', color: '#991b1b',
                border: 'none', borderRadius: '50px',
                padding: '8px 16px', cursor: 'pointer',
                fontWeight: '600', fontSize: '0.85rem',
              }}>
                Выйти
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};