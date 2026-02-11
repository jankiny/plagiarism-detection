import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Metrics {
    num_batches: number;
    num_documents: number;
}

interface Batch {
    id: string;
    created_at: string;
    total_docs: number;
    status: string;
    analysis_type: string;
}

const DashboardPage = () => {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch Metrics
                const metricsRes = await fetch('/api/v1/users/me/dashboard', { headers });
                if (!metricsRes.ok) throw new Error('获取数据失败');
                const metricsData = await metricsRes.json();
                setMetrics(metricsData.data);

                // Fetch Batches
                const batchesRes = await fetch('/api/v1/batches', { headers });
                if (batchesRes.ok) {
                    const batchesData = await batchesRes.json();
                    setBatches(batchesData.data);
                }
            } catch (e: any) {
                setError(e.message);
            }
        };

        fetchData();
    }, []);

    const avg = metrics ? (metrics.num_documents / metrics.num_batches || 0).toFixed(1) : 0;

    return (
        <div className="container fade-in" style={{ padding: '60px 0' }}>
            <div style={{ marginBottom: '60px' }}>
                <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                    欢迎回来
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
                    以下是您的分析活动概览。
                </p>
            </div>

            {error && (
                <div className="glass" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '16px', marginBottom: '40px' }}>
                    <p style={{ color: 'var(--error)', fontWeight: 500 }}>⚠️ 错误: {error}</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', marginBottom: '60px' }}>
                {[
                    { label: '总批次数', value: metrics?.num_batches || 0, icon: '📦', color: 'var(--primary)' },
                    { label: '已分析文档', value: metrics?.num_documents || 0, icon: '📄', color: 'var(--secondary)' },
                    { label: '平均每批', value: avg, icon: '📊', color: 'var(--accent)' }
                ].map((stat, i) => (
                    <div key={i} className="glass card-hover" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            fontSize: '80px',
                            opacity: 0.05,
                            transform: 'rotate(15deg)'
                        }}>
                            {stat.icon}
                        </div>
                        <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                            {stat.label}
                        </h3>
                        <p style={{ fontSize: '48px', fontWeight: 800, color: 'white' }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', marginBottom: '60px' }}>
                <Link to="/upload" className="glass card-hover" style={{ textDecoration: 'none', color: 'inherit', padding: '40px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ fontSize: '40px', background: 'rgba(99, 102, 241, 0.1)', width: '80px', height: '80px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        📤
                    </div>
                    <div>
                        <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>上传文档</h3>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>检测抄袭与AI生成内容</p>
                    </div>
                </Link>

                <Link to="/ai-check" className="glass card-hover" style={{ textDecoration: 'none', color: 'inherit', padding: '40px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ fontSize: '40px', background: 'rgba(236, 72, 153, 0.1)', width: '80px', height: '80px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                        🤖
                    </div>
                    <div>
                        <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>AI检测</h3>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>分析文本是否由AI生成</p>
                    </div>
                </Link>
            </div>

            <div className="glass" style={{ padding: '40px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>最近检测记录</h3>
                {batches.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>暂无记录</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>ID</th>
                                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>时间</th>
                                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>文档数</th>
                                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>状态</th>
                                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map(batch => (
                                    <tr key={batch.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '16px', fontFamily: 'monospace' }}>{batch.id.substring(0, 8)}...</td>
                                        <td style={{ padding: '16px' }}>{new Date(batch.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '16px' }}>{batch.total_docs}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                background: batch.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                                                color: batch.status === 'completed' ? '#34d399' : '#818cf8'
                                            }}>
                                                {batch.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <Link to={`/batch/${batch.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                                                查看详情 &rarr;
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
