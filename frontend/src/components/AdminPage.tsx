import { useState, useEffect } from 'react';

const AdminPage = () => {
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Fetch stats
            const statsResponse = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
            }
            
            // Fetch users
            const usersResponse = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                setUsers(usersData);
            }
            
        } catch (err) {
            setError('加载管理数据失败');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPassword,
                }),
            });
            
            if (response.ok) {
                alert('用户创建成功');
                setNewUserEmail('');
                setNewUserPassword('');
                setShowCreateForm(false);
                fetchData(); // Refresh data
            } else {
                const errorData = await response.json();
                alert(`错误: ${errorData.detail || '创建用户失败'}`);
            }
        } catch (err) {
            alert('创建用户失败');
            console.error(err);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: newRole,
                }),
            });
            
            if (response.ok) {
                alert('用户角色更新成功');
                fetchData(); // Refresh data
            } else {
                const errorData = await response.json();
                alert(`错误: ${errorData.detail || '更新角色失败'}`);
            }
        } catch (err) {
            alert('更新用户角色失败');
            console.error(err);
        }
    };

    const handleDeactivateUser = async (userId: string, userEmail: string) => {
        if (!window.confirm(`确定要停用用户 ${userEmail} 吗？`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (response.ok) {
                alert('用户已停用');
                fetchData(); // Refresh data
            } else {
                const errorData = await response.json();
                alert(`错误: ${errorData.detail || '停用用户失败'}`);
            }
        } catch (err) {
            alert('停用用户失败');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto', border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>正在加载管理数据...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '40px 0' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 className="text-gradient-primary" style={{ fontSize: '36px', fontWeight: 700, marginBottom: '8px' }}>管理后台</h1>
                <p style={{ color: 'var(--text-secondary)' }}>系统管理面板</p>
            </div>

            {error && (
                <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            {/* Stats Section */}
            {stats && (
                <div className="glass" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '20px' }}>系统统计</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{stats.total_users}</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>总用户数</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>{stats.active_users}</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>活跃用户</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{stats.admins}</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>管理员</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6' }}>{stats.regular_users}</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>普通用户</div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Management Section */}
            <div className="glass" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 600 }}>用户管理</h2>
                    <button 
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                        {showCreateForm ? '取消' : '添加用户'}
                    </button>
                </div>

                {/* Create User Form */}
                {showCreateForm && (
                    <div className="glass" style={{ padding: '20px', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>创建新用户</h3>
                        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>邮箱</label>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>密码</label>
                                <input
                                    type="password"
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                    placeholder="请输入密码"
                                />
                            </div>
                            <button type="submit" className="btn-primary" style={{ padding: '12px', fontWeight: 600 }}>
                                创建用户
                            </button>
                        </form>
                    </div>
                )}

                {/* Users List */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>邮箱</th>
                                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>角色</th>
                                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>状态</th>
                                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', fontSize: '14px' }}>{user.email}</td>
                                    <td style={{ padding: '12px', fontSize: '14px' }}>
                                        <select 
                                            value={user.role}
                                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', color: 'white' }}
                                        >
                                            <option value="user">用户</option>
                                            <option value="moderator">版主</option>
                                            <option value="admin">管理员</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '14px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            backgroundColor: user.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: user.is_active ? '#10b981' : '#ef4444',
                                        }}>
                                            {user.is_active ? '活跃' : '已停用'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button 
                                            onClick={() => handleDeactivateUser(user.id, user.email)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.2)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#ef4444',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                            }}
                                        >
                                            停用
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;