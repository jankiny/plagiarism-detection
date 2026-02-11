import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)',
      maxWidth: '1200px',
      zIndex: 1000,
      padding: '12px 24px',
      borderRadius: '20px',
      background: 'rgba(17, 24, 39, 0.7)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}>
            <span style={{ fontSize: '18px' }}>🛡️</span>
          </div>
          <span className="text-gradient" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            三门科数
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}>控制台</Link>
              <Link to="/upload" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}>上传</Link>
              <Link to="/ai-check" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}>AI检测</Link>
              {user && user.role === 'admin' && (
                <Link to="/admin" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}>管理</Link>
              )}
              <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px', color: 'var(--error)' }} onClick={() => { logout(); window.location.href = '/'; }}>退出</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}>登录</Link>
              <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 20px', fontSize: '14px' }}>开始使用</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;