import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Library {
    id: string;
    name: string;
    description: string;
    document_count: number;
    created_at: string;
    status: string;
}

const LibraryManagePage = () => {
    const [libraries, setLibraries] = useState<Library[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchLibraries = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/libraries', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('获取文档库列表失败');

            const data = await res.json();
            setLibraries(data.data || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLibraries();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const body = new FormData();
            body.append('name', formData.name);
            body.append('description', formData.description);
            const res = await fetch('/api/v1/libraries', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body
            });

            if (!res.ok) throw new Error('创建文档库失败');

            await fetchLibraries();
            setShowForm(false);
            setFormData({ name: '', description: '' });
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!confirm('确定要停用该文档库吗？')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/libraries/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('停用文档库失败');

            await fetchLibraries();
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading && libraries.length === 0) {
        return (
            <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)' }}>加载中...</div>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ padding: '60px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>
                        文档库管理
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                        管理用于对比检测的文档库集合
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: '12px 24px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {showForm ? '取消创建' : '+ 创建文档库'}
                </button>
            </div>

            {error && (
                <div className="glass" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '16px', marginBottom: '40px' }}>
                    <p style={{ color: 'var(--error)', fontWeight: 500 }}>⚠️ 错误: {error}</p>
                </div>
            )}

            {showForm && (
                <div className="glass" style={{ padding: '32px', marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>新建文档库</h3>
                    <form onSubmit={handleCreate}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>名称</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-primary)',
                                    fontSize: '16px'
                                }}
                                required
                                placeholder="输入文档库名称"
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>描述</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-primary)',
                                    fontSize: '16px',
                                    minHeight: '100px',
                                    resize: 'vertical'
                                }}
                                placeholder="输入文档库描述（可选）"
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                style={{
                                    padding: '12px 24px',
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    padding: '12px 24px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    opacity: submitting ? 0.7 : 1
                                }}
                            >
                                {submitting ? '创建中...' : '确认创建'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {libraries.map(lib => (
                    <div key={lib.id} className="glass card-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                                <Link to={`/libraries/${lib.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {lib.name}
                                </Link>
                            </h3>
                            <span style={{
                                fontSize: '12px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: lib.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: lib.status === 'active' ? '#10b981' : '#ef4444'
                            }}>
                                {lib.status === 'active' ? '活跃' : '已停用'}
                            </span>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', flex: 1 }}>
                            {lib.description || '无描述'}
                        </p>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>文档数量:</span>
                                <span style={{ fontWeight: 600 }}>{lib.document_count}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>创建时间:</span>
                                <span style={{ fontWeight: 600 }}>{new Date(lib.created_at).toLocaleDateString()}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Link
                                    to={`/libraries/${lib.id}`}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        textAlign: 'center',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        color: 'var(--primary)',
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        fontWeight: 500
                                    }}
                                >
                                    管理文档
                                </Link>
                                {lib.status === 'active' && (
                                    <button
                                        onClick={() => handleDeactivate(lib.id)}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 500
                                        }}
                                    >
                                        停用
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && libraries.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    暂无文档库，请创建一个。
                </div>
            )}
        </div>
    );
};

export default LibraryManagePage;
