import { useState, useEffect } from 'react';

interface WhitelistItem {
    id: string;
    content: string;
    label: string;
    created_by: string;
    created_at: string;
}

const WhitelistManagePage = () => {
    const [items, setItems] = useState<WhitelistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newContent, setNewContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchWhitelists = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/whitelist', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('获取白名单列表失败');

            const data = await res.json();
            setItems(data.data || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWhitelists();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除该白名单条目吗？')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/whitelist/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('删除白名单条目失败');

            await fetchWhitelists();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleCreate = async () => {
        if (!newContent.trim()) {
            alert('白名单内容不能为空');
            return;
        }
        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/whitelist/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newContent.trim(), label: newLabel.trim() }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || '创建白名单条目失败');
            }
            setNewLabel('');
            setNewContent('');
            setShowForm(false);
            await fetchWhitelists();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && items.length === 0) {
        return (
            <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)' }}>加载中...</div>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ padding: '60px 0' }}>
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>
                        白名单管理
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                        管理查重白名单条目，被加白的模板内容在检测时将被自动跳过
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowForm(!showForm)}
                    style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                    {showForm ? '取消' : '+ 新增白名单'}
                </button>
            </div>

            {showForm && (
                <div className="glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>新增白名单条目</h3>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>标签名称</label>
                        <input
                            type="text"
                            value={newLabel}
                            onChange={e => setNewLabel(e.target.value)}
                            placeholder="例如：通用模板、论文格式"
                            className="glass"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                fontSize: '14px',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>白名单内容</label>
                        <textarea
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            placeholder="输入需要加白的文本内容，检测时匹配到的片段将被自动跳过"
                            rows={5}
                            className="glass"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                fontSize: '14px',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                resize: 'vertical',
                                lineHeight: '1.6',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            className="btn-secondary"
                            onClick={() => { setShowForm(false); setNewLabel(''); setNewContent(''); }}
                            style={{ padding: '10px 20px', fontSize: '14px' }}
                        >
                            取消
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleCreate}
                            disabled={submitting}
                            style={{ padding: '10px 20px', fontSize: '14px', opacity: submitting ? 0.6 : 1 }}
                        >
                            {submitting ? '提交中...' : '确认添加'}
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="glass" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '16px', marginBottom: '40px' }}>
                    <p style={{ color: 'var(--error)', fontWeight: 500 }}>错误: {error}</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {items.map(item => (
                    <div key={item.id} className="glass card-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                                {item.label || '未命名'}
                            </h3>
                            <span style={{
                                fontSize: '12px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                flexShrink: 0,
                            }}>
                                白名单
                            </span>
                        </div>

                        <div style={{
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            flex: 1,
                            maxHeight: '120px',
                            overflow: 'auto',
                        }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', wordBreak: 'break-all', margin: 0 }}>
                                {item.content}
                            </p>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>创建时间:</span>
                                <span style={{ fontWeight: 600 }}>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>

                            <button
                                onClick={() => handleDelete(item.id)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    textAlign: 'center',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                }}
                            >
                                删除
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && items.length === 0 && (
                <div className="glass" style={{ textAlign: 'center', padding: '60px 40px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>
                        暂无白名单条目
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        在检测结果页中，点击匹配片段的"加白"按钮即可添加
                    </p>
                </div>
            )}
        </div>
    );
};

export default WhitelistManagePage;
