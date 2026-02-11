import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useRef, useEffect } from 'react';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            查重检测系统
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}>控制台</Link>
              <Link to="/upload" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}>查重检测</Link>
              <Link to="/ai-check" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}>AI检测</Link>
              {user && (user.role === 'admin' || user.role === 'moderator') && (
                <Link to="/libraries" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}>文档库</Link>
              )}
              {user && user.role === 'admin' && (
                <Link to="/admin" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}>管理</Link>
              )}
              {/* 用户头像下拉菜单 */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white' }}>
                    {(user?.display_name || user?.email || '?')[0].toUpperCase()}
                  </span>
                  <span>{user?.display_name || user?.email?.split('@')[0]}</span>
                  <span style={{ fontSize: '10px' }}>▼</span>
                </button>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    minWidth: '160px',
                    background: 'rgba(17, 24, 39, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '8px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  }}>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'block', padding: '10px 16px', textDecoration: 'none',
                        color: 'var(--text-primary)', borderRadius: '8px', fontSize: '14px',
                      }}
                    >
                      个人中心
                    </Link>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                    <button
                      onClick={() => { setShowUserMenu(false); logout(); window.location.href = '/'; }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px',
                        background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer',
                        borderRadius: '8px', fontSize: '14px',
                      }}
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 20px', fontSize: '14px' }}>登录</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
