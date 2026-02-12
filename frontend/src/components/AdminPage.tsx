import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface UserItem {
    id: string;
    email: string;
    role: string;
    display_name: string | null;
    is_active: boolean;
    created_at: string;
}

interface Stats {
    total_users: number;
    active_users: number;
    inactive_users: number;
    admins: number;
    moderators: number;
    regular_users: number;
    libraries: number;
    library_documents: number;
}

const AdminPage = () => {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users');

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user', display_name: '' });
    const [creating, setCreating] = useState(false);

    const [resetPasswordUser, setResetPasswordUser] = useState<UserItem | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users', { headers });
            if (!res.ok) throw new Error('获取用户列表失败');
            const data = await res.json();
            setUsers(data);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats', { headers });
            if (!res.ok) throw new Error('获取统计信息失败');
            const data = await res.json();
            setStats(data);
        } catch (e: any) {
            setError(e.message);
        }
    };

    useEffect(() => {
        Promise.all([fetchUsers(), fetchStats()]).finally(() => setLoading(false));
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST', headers,
                body: JSON.stringify(newUser),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || '创建用户失败');
            }
            await fetchUsers();
            await fetchStats();
            setShowCreateForm(false);
            setNewUser({ email: '', password: '', role: 'user', display_name: '' });
        } catch (e: any) {
            alert(e.message);
        } finally {
            setCreating(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT', headers,
                body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || '更新角色失败');
            }
            await fetchUsers();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleToggleActive = async (userId: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE', headers,
            });
            if (!res.ok) throw new Error('操作失败');
            await fetchUsers();
            await fetchStats();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleReactivate = async (userId: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/reactivate`, {
                method: 'POST', headers,
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || '启用失败');
            }
            await fetchUsers();
            await fetchStats();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDeleteUser = async (user: UserItem) => {
        const confirmed = confirm(`⚠️ 确定要永久删除用户 ${user.email} 吗？\n\n此操作不可恢复，用户的所有数据将被清除。`);
        if (!confirmed) return;
        const doubleConfirm = confirm(`再次确认：永久删除 ${user.email}？`);
        if (!doubleConfirm) return;
        try {
            const res = await fetch(`/api/admin/users/${user.id}/permanent`, {
                method: 'DELETE', headers,
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || '删除失败');
            }
            await fetchUsers();
            await fetchStats();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleResetPassword = async () => {
        if (!resetPasswordUser || !newPassword) return;
        setResetting(true);
        try {
            const res = await fetch(`/api/admin/users/${resetPasswordUser.id}/reset-password`, {
                method: 'PUT', headers,
                body: JSON.stringify({ new_password: newPassword }),
            });
            if (!res.ok) throw new Error('重置密码失败');
            alert('密码重置成功');
            setResetPasswordUser(null);
            setNewPassword('');
        } catch (e: any) {
            alert(e.message);
        } finally {
            setResetting(false);
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return '#f59e0b';
            case 'moderator': return '#8b5cf6';
            default: return '#3b82f6';
        }
    };

    if (loading) return <div className="container" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>加载中...</div>;

    return (
        <div className="container fade-in" style={{ padding: '60px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>管理后台</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>管理用户和查看系统状态</p>
                </div>
                <Link to="/settings" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '14px' }}>
                    系统设置
                </Link>
            </div>

            {error && (
                <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: 'var(--error)', marginBottom: '24px' }}>
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                {(['users', 'stats'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            background: activeTab === tab ? 'var(--primary)' : 'transparent',
                            color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                            fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                        }}
                    >
                        {tab === 'users' ? '用户管理' : '系统概览'}
                    </button>
                ))}
            </div>

            {activeTab === 'stats' && stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {[
                        { label: '总用户数', value: stats.total_users, color: '#6366f1' },
                        { label: '活跃用户', value: stats.active_users, color: '#10b981' },
                        { label: '管理员', value: stats.admins, color: '#f59e0b' },
                        { label: '版主', value: stats.moderators, color: '#8b5cf6' },
                        { label: '普通用户', value: stats.regular_users, color: '#3b82f6' },
                        { label: '已停用', value: stats.inactive_users, color: '#ef4444' },
                        { label: '文档库', value: stats.libraries, color: '#14b8a6' },
                        { label: '库文档数', value: stats.library_documents, color: '#ec4899' },
                    ].map((stat, i) => (
                        <div key={i} className="glass card-hover" style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', fontWeight: 800, color: stat.color, marginBottom: '8px' }}>{stat.value}</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'users' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            style={{
                                padding: '10px 24px', background: 'var(--primary)', color: 'white',
                                border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            {showCreateForm ? '取消' : '+ 创建用户'}
                        </button>
                    </div>

                    {showCreateForm && (
                        <div className="glass" style={{ padding: '32px', marginBottom: '32px', borderRadius: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>创建新用户</h3>
                            <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>邮箱</label>
                                    <input type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>密码</label>
                                    <input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="设置密码" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>显示名称</label>
                                    <input type="text" value={newUser.display_name} onChange={e => setNewUser({ ...newUser, display_name: e.target.value })} placeholder="用户昵称（可选）" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>角色</label>
                                    <select
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                    >
                                        <option value="user">普通用户</option>
                                        <option value="moderator">版主</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary" style={{ padding: '10px 24px' }}>取消</button>
                                    <button type="submit" className="btn-primary" disabled={creating} style={{ padding: '10px 24px' }}>
                                        {creating ? '创建中...' : '确认创建'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="glass" style={{ padding: '8px', borderRadius: '24px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    {['邮箱', '显示名称', '角色', '状态', '操作'].map(h => (
                                        <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[...users].sort((a, b) => {
                                    if (a.is_active === b.is_active) return 0;
                                    return a.is_active ? -1 : 1;
                                }).map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: u.is_active ? 1 : 0.6 }}>
                                        <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 600 }}>{u.email}</td>
                                        <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-secondary)' }}>{u.display_name || '-'}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <select
                                                value={u.role}
                                                onChange={e => handleRoleChange(u.id, e.target.value)}
                                                style={{
                                                    padding: '4px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                                                    background: `${getRoleColor(u.role)}20`, color: getRoleColor(u.role),
                                                    border: `1px solid ${getRoleColor(u.role)}40`, cursor: 'pointer',
                                                }}
                                            >
                                                <option value="user">普通用户</option>
                                                <option value="moderator">版主</option>
                                                <option value="admin">管理员</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
                                                background: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: u.is_active ? '#10b981' : '#ef4444',
                                            }}>
                                                {u.is_active ? '活跃' : '已停用'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => { setResetPasswordUser(u); setNewPassword(''); }}
                                                    style={{
                                                        padding: '6px 12px', fontSize: '12px', borderRadius: '6px',
                                                        background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                                                        border: 'none', cursor: 'pointer', fontWeight: 600,
                                                    }}
                                                >
                                                    重置密码
                                                </button>
                                                {u.is_active && u.role !== 'admin' && (
                                                    <button
                                                        onClick={() => { if (confirm(`确定停用用户 ${u.email}？`)) handleToggleActive(u.id); }}
                                                        style={{
                                                            padding: '6px 12px', fontSize: '12px', borderRadius: '6px',
                                                            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                                            border: 'none', cursor: 'pointer', fontWeight: 600,
                                                        }}
                                                    >
                                                        停用
                                                    </button>
                                                )}
                                                {!u.is_active && (
                                                    <button
                                                        onClick={() => handleReactivate(u.id)}
                                                        style={{
                                                            padding: '6px 12px', fontSize: '12px', borderRadius: '6px',
                                                            background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                                            border: 'none', cursor: 'pointer', fontWeight: 600,
                                                        }}
                                                    >
                                                        启用
                                                    </button>
                                                )}
                                                {u.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u)}
                                                        style={{
                                                            padding: '6px 12px', fontSize: '12px', borderRadius: '6px',
                                                            background: 'rgba(239,68,68,0.05)', color: '#ef4444',
                                                            border: '1px dashed rgba(239,68,68,0.3)', cursor: 'pointer', fontWeight: 600,
                                                        }}
                                                    >
                                                        删除
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Reset Password Modal */}
            {resetPasswordUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999,
                }} onClick={() => setResetPasswordUser(null)}>
                    <div className="glass" style={{ padding: '36px', maxWidth: '420px', width: '100%', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>重置密码</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                            为用户 <strong>{resetPasswordUser.email}</strong> 设置新密码
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>新密码</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="输入新密码" required />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setResetPasswordUser(null)} className="btn-secondary" style={{ padding: '10px 24px' }}>取消</button>
                            <button onClick={handleResetPassword} className="btn-primary" disabled={!newPassword || resetting} style={{ padding: '10px 24px' }}>
                                {resetting ? '重置中...' : '确认重置'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
