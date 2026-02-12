import { useState, useEffect } from 'react';

interface WhitelistCollection {
    id: string;
    name: string;
    description: string;
    item_count: number;
    created_by: string;
    created_at: string;
}

interface WhitelistItem {
    id: string;
    collection_id: string;
    content: string;
    label: string;
    created_at: string;
}

const WhitelistManagePage = () => {
    const [collections, setCollections] = useState<WhitelistCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 新建清单表单
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // 展开的清单（查看条目）
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [items, setItems] = useState<WhitelistItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);

    // 新建条目表单
    const [showItemForm, setShowItemForm] = useState(false);
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemContent, setNewItemContent] = useState('');
    const [itemSubmitting, setItemSubmitting] = useState(false);

    const token = () => localStorage.getItem('token');

    const fetchCollections = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/whitelist', {
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            if (!res.ok) throw new Error('获取白名单清单失败');
            const data = await res.json();
            setCollections(data.data || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async (collectionId: string) => {
        try {
            setItemsLoading(true);
            const res = await fetch(`/api/v1/whitelist/${collectionId}/items`, {
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            if (!res.ok) throw new Error('获取条目列表失败');
            const data = await res.json();
            setItems(data.data || []);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setItemsLoading(false);
        }
    };

    useEffect(() => { fetchCollections(); }, []);

    const handleCreateCollection = async () => {
        if (!newName.trim()) { alert('清单名称不能为空'); return; }
        try {
            setSubmitting(true);
            const res = await fetch('/api/v1/whitelist/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
            });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || '创建失败'); }
            setNewName(''); setNewDesc(''); setShowCreateForm(false);
            await fetchCollections();
        } catch (e: any) { alert(e.message); }
        finally { setSubmitting(false); }
    };

    const handleDeleteCollection = async (id: string) => {
        if (!confirm('确定要删除此白名单清单及其所有条目吗？')) return;
        try {
            const res = await fetch(`/api/v1/whitelist/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            if (!res.ok) throw new Error('删除失败');
            if (expandedId === id) { setExpandedId(null); setItems([]); }
            await fetchCollections();
        } catch (e: any) { alert(e.message); }
    };

    const handleToggleExpand = async (id: string) => {
        if (expandedId === id) {
            setExpandedId(null); setItems([]); setShowItemForm(false);
        } else {
            setExpandedId(id); setShowItemForm(false);
            await fetchItems(id);
        }
    };

    const handleAddItem = async () => {
        if (!newItemContent.trim()) { alert('条目内容不能为空'); return; }
        if (!expandedId) return;
        try {
            setItemSubmitting(true);
            const res = await fetch(`/api/v1/whitelist/${expandedId}/items`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newItemContent.trim(), label: newItemLabel.trim() }),
            });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || '添加失败'); }
            setNewItemLabel(''); setNewItemContent(''); setShowItemForm(false);
            await fetchItems(expandedId);
            await fetchCollections(); // 更新 item_count
        } catch (e: any) { alert(e.message); }
        finally { setItemSubmitting(false); }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!expandedId) return;
        if (!confirm('确定删除此条目吗？')) return;
        try {
            const res = await fetch(`/api/v1/whitelist/${expandedId}/items/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            if (!res.ok) throw new Error('删除失败');
            await fetchItems(expandedId);
            await fetchCollections();
        } catch (e: any) { alert(e.message); }
    };

    if (loading && collections.length === 0) {
        return (
            <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)' }}>加载中...</div>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ padding: '60px 0' }}>
            {/* 头部 */}
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>白名单管理</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                        创建白名单清单，向清单中添加多个条目。检测时按清单为单位选择。
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}
                    style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {showCreateForm ? '取消' : '+ 新建清单'}
                </button>
            </div>

            {/* 新建清单表单 */}
            {showCreateForm && (
                <div className="glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>新建白名单清单</h3>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>清单名称 *</label>
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                            placeholder="例如：论文封面模板、通用页眉页脚"
                            className="glass" style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: '1px solid var(--glass-border)', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>描述（可选）</label>
                        <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                            placeholder="清单用途说明"
                            className="glass" style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: '1px solid var(--glass-border)', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => { setShowCreateForm(false); setNewName(''); setNewDesc(''); }}
                            style={{ padding: '10px 20px', fontSize: '14px' }}>取消</button>
                        <button className="btn-primary" onClick={handleCreateCollection} disabled={submitting}
                            style={{ padding: '10px 20px', fontSize: '14px', opacity: submitting ? 0.6 : 1 }}>
                            {submitting ? '创建中...' : '确认创建'}
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="glass" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '16px', marginBottom: '40px' }}>
                    <p style={{ color: 'var(--error)', fontWeight: 500 }}>错误: {error}</p>
                </div>
            )}

            {/* 清单列表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {collections.map(col => (
                    <div key={col.id} className="glass" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                        {/* 清单头部 */}
                        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleToggleExpand(col.id)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '20px', flexShrink: 0,
                                }}>📋</div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{col.name}</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                                        {col.description || '暂无描述'} · {col.item_count} 个条目 · {new Date(col.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{
                                    fontSize: '12px', padding: '4px 12px', borderRadius: '6px',
                                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600,
                                }}>{col.item_count} 条</span>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); }}
                                    style={{
                                        padding: '6px 14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                                    }}>删除</button>
                                <span style={{ fontSize: '16px', transform: expandedId === col.id ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }}>▼</span>
                            </div>
                        </div>

                        {/* 展开区域：条目列表 */}
                        {expandedId === col.id && (
                            <div style={{ borderTop: '1px solid var(--glass-border)', padding: '24px' }}>
                                {/* 添加条目按钮 */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-secondary)' }}>条目列表</h4>
                                    <button className="btn-secondary" onClick={() => setShowItemForm(!showItemForm)}
                                        style={{ padding: '6px 16px', fontSize: '13px' }}>
                                        {showItemForm ? '取消' : '+ 添加条目'}
                                    </button>
                                </div>

                                {/* 新建条目表单 */}
                                {showItemForm && (
                                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--glass-border)' }}>
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>标签（可选）</label>
                                            <input type="text" value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)}
                                                placeholder="例如：封面标题、页脚声明"
                                                style={{ width: '100%', padding: '10px 14px', fontSize: '13px', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>文本内容 *</label>
                                            <textarea value={newItemContent} onChange={e => setNewItemContent(e.target.value)}
                                                placeholder="粘贴需要加白的文本内容"
                                                rows={4}
                                                style={{ width: '100%', padding: '10px 14px', fontSize: '13px', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', lineHeight: '1.6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                            <button className="btn-secondary" onClick={() => { setShowItemForm(false); setNewItemLabel(''); setNewItemContent(''); }}
                                                style={{ padding: '8px 16px', fontSize: '13px' }}>取消</button>
                                            <button className="btn-primary" onClick={handleAddItem} disabled={itemSubmitting}
                                                style={{ padding: '8px 16px', fontSize: '13px', opacity: itemSubmitting ? 0.6 : 1 }}>
                                                {itemSubmitting ? '添加中...' : '确认添加'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 条目列表 */}
                                {itemsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>加载中...</div>
                                ) : items.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '14px' }}>
                                        暂无条目，点击"添加条目"开始添加
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {items.map(item => (
                                            <div key={item.id} style={{
                                                padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                                                border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
                                            }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {item.label && (
                                                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>{item.label}</div>
                                                    )}
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', wordBreak: 'break-all', maxHeight: '80px', overflow: 'auto' }}>
                                                        {item.content}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteItem(item.id)}
                                                    style={{
                                                        padding: '4px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, flexShrink: 0,
                                                    }}>删除</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!loading && collections.length === 0 && (
                <div className="glass" style={{ textAlign: 'center', padding: '60px 40px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>暂无白名单清单</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        点击"新建清单"创建一个白名单清单，然后向其中添加需要加白的文本条目
                    </p>
                </div>
            )}
        </div>
    );
};

export default WhitelistManagePage;
