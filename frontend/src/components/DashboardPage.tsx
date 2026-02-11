import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Metrics {
    num_batches: number;
    num_documents: number;
}

const DashboardPage = () => {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/v1/users/me/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) throw new Error('获取数据失败');
                const data = await response.json();
                setMetrics(data.data);
            } catch (e: any) {
                setError(e.message);
            }
        };

        fetchMetrics();
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

            <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
                <button
                    onClick={() => {
                        alert("请前往具体批次页面导出结果。");
                    }}
                    className="btn-secondary"
                    style={{ padding: '12px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <span>📄</span> 导出PDF报告
                </button>
                <button
                    onClick={() => alert("请前往具体批次页面导出结果。")}
                    className="btn-secondary"
                    style={{ padding: '12px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <span>📊</span> 导出CSV数据
                </button>
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
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
        </div>
    );
};

export default DashboardPage;
