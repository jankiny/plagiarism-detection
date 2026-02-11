import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.display_name) {
      setDisplayName(user.display_name);
    }
  }, [user]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'moderator':
        return '版主';
      case 'user':
        return '普通用户';
      default:
        return role;
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ display_name: displayName })
      });

      if (!response.ok) {
        throw new Error('更新个人信息失败');
      }

      setMessage({ type: 'success', text: '个人信息更新成功' });
      // Reload strictly strictly speaking isn't necessary if we had a setUser in context,
      // but to be safe and simple:
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || '密码修改失败');
      }

      setMessage({ type: 'success', text: '密码修改成功' });
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '修改失败，请检查旧密码是否正确' });
    } finally {
      setLoading(false);
    }
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    padding: '2rem',
    color: 'white',
    maxWidth: '600px',
    margin: '2rem auto'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    outline: 'none'
  };

  const buttonStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontWeight: 'bold',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    marginTop: '0.5rem'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    opacity: 0.9
  };

  if (!user) return <div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>加载中...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="glass-card" style={glassStyle}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>个人中心</h2>

        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            background: message.type === 'success' ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)',
            border: `1px solid ${message.type === 'success' ? '#2ed573' : '#ff4757'}`,
            textAlign: 'center'
          }}>
            {message.text}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem' }}>基本信息</h3>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ opacity: 0.7, marginRight: '1rem' }}>邮箱:</span>
            <span>{user.email}</span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ opacity: 0.7, marginRight: '1rem' }}>角色:</span>
            <span style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.1)',
              fontSize: '0.9rem'
            }}>
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem' }}>修改资料</h3>

          <div>
            <label style={labelStyle}>显示名称</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="请输入昵称"
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            更新资料
          </button>
        </form>

        <form onSubmit={handlePasswordUpdate}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem' }}>修改密码</h3>

          <div>
            <label style={labelStyle}>当前密码</label>
            <input
              type="password"
              value={passwordForm.old_password}
              onChange={(e) => setPasswordForm({...passwordForm, old_password: e.target.value})}
              placeholder="请输入当前密码"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>新密码</label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
              placeholder="请输入新密码"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>确认新密码</label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
              placeholder="请再次输入新密码"
              style={inputStyle}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            修改密码
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
