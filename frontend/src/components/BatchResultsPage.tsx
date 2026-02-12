import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const statusMap: Record<string, { label: string; bg: string; color: string }> = {
    queued: { label: '排队中', bg: 'rgba(234, 179, 8, 0.2)', color: '#facc15' },
    processing: { label: '处理中', bg: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' },
    completed: { label: '已完成', bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399' },
    failed: { label: '失败', bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171' },
};

const docStatusMap: Record<string, string> = {
    queued: '排队中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
};

interface PlagiarismDetail {
    similar_document: string;
    similarity: number;
    matches: any[];
    source_type: string;
    library_name: string | null;
}

interface DocResult {
    document_id: string;
    filename: string;
    status: string;
    ai_analysis: {
        score: number;
        is_ai: boolean;
        confidence: number;
        provider: string | null;
    };
    plagiarism_analysis: PlagiarismDetail[];
}

const BatchResultsPage = () => {
    const { batchId } = useParams();
    const [results, setResults] = useState<DocResult[]>([]);
    const [batchStatus, setBatchStatus] = useState<string>('queued');
    const [totalDocs, setTotalDocs] = useState(0);
    const [processedDocs, setProcessedDocs] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchResults = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/v1/batches/${batchId}/results`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('获取结果失败');
            const data = await response.json();
            setResults(data.data || []);
            setBatchStatus(data.batch_status || 'queued');
            setTotalDocs(data.total_docs || 0);
            setProcessedDocs(data.processed_docs || 0);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!batchId) return;

        fetchResults();

        // 未完成时每3秒轮询
        const interval = setInterval(() => {
            fetchResults();
        }, 3000);

        return () => clearInterval(interval);
    }, [batchId]);

    // 当批次完成后不需要继续轮询（通过状态判断在UI中提示）
    const isFinished = batchStatus === 'completed' || batchStatus === 'failed';
    const progressPercent = totalDocs > 0 ? Math.round((processedDocs / totalDocs) * 100) : 0;
    const statusInfo = statusMap[batchStatus] || statusMap.queued;

    return (
        <div className="container fade-in" style={{ padding: '60px 0' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', marginBottom: '16px', display: 'inline-block' }}>
                    &larr; 返回控制台
                </Link>
                <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>
                    分析结果
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'monospace' }}>
                    批次 ID: {batchId}
                </p>
            </div>

            {isLoading && (
                <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>正在加载...</div>
                </div>
            )}

            {error && (
                <div className="glass" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '16px', marginBottom: '24px' }}>
                    <p style={{ color: 'var(--error)', fontWeight: 500 }}>错误: {error}</p>
                </div>
            )}

            {!isLoading && (
                <>
                    {/* Batch Status Card */}
                    <div className="glass" style={{ padding: '32px', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '16px', fontWeight: 600 }}>批次状态</span>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '100px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    background: statusInfo.bg,
                                    color: statusInfo.color,
                                }}>
                                    {statusInfo.label}
                                </span>
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                {processedDocs} / {totalDocs} 个文档
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{
                            width: '100%',
                            height: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '100px',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                width: `${progressPercent}%`,
                                height: '100%',
                                borderRadius: '100px',
                                background: isFinished
                                    ? (batchStatus === 'completed' ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #ef4444, #f87171)')
                                    : 'linear-gradient(90deg, #6366f1, #818cf8)',
                                transition: 'width 0.5s ease',
                            }} />
                        </div>

                        {!isFinished && (
                            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: statusInfo.color,
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                }} />
                                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    {batchStatus === 'queued'
                                        ? '任务已提交，正在等待处理...'
                                        : `正在分析文档，已完成 ${progressPercent}%...`
                                    }
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    {results.length > 0 ? (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {results.map((result) => (
                                <div key={result.document_id} className="glass card-hover" style={{ padding: '28px', borderRadius: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                                            {result.filename}
                                        </h3>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '100px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            background: (statusMap[result.status] || statusMap.queued).bg,
                                            color: (statusMap[result.status] || statusMap.queued).color,
                                        }}>
                                            {docStatusMap[result.status] || result.status}
                                        </span>
                                    </div>

                                    {result.status === 'queued' && (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                            等待分析...
                                        </div>
                                    )}

                                    {result.status === 'processing' && (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                            正在分析中...
                                        </div>
                                    )}

                                    {(result.status === 'completed' || result.status === 'failed') && (
                                        <>
                                            {/* AI Analysis */}
                                            {result.ai_analysis.provider && (
                                                <div style={{
                                                    padding: '16px',
                                                    background: 'rgba(236, 72, 153, 0.05)',
                                                    borderRadius: '12px',
                                                    marginBottom: '16px',
                                                    border: '1px solid rgba(236, 72, 153, 0.1)',
                                                }}>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                                                        AI 生成检测
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
                                                        <span>
                                                            评分: <strong style={{ color: result.ai_analysis.score > 0.7 ? '#f87171' : '#34d399' }}>
                                                                {(result.ai_analysis.score * 100).toFixed(1)}%
                                                            </strong>
                                                        </span>
                                                        <span>
                                                            判定: <strong style={{ color: result.ai_analysis.is_ai ? '#f87171' : '#34d399' }}>
                                                                {result.ai_analysis.is_ai ? '疑似AI生成' : '人工撰写'}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Plagiarism Analysis */}
                                            {result.plagiarism_analysis.length > 0 ? (
                                                <div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>
                                                        查重匹配 ({result.plagiarism_analysis.length} 条)
                                                    </div>
                                                    <div style={{ display: 'grid', gap: '8px' }}>
                                                        {result.plagiarism_analysis.map((match, i) => (
                                                            <div key={i} style={{
                                                                padding: '12px 16px',
                                                                background: 'rgba(255, 255, 255, 0.03)',
                                                                borderRadius: '10px',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                                            }}>
                                                                <div style={{ fontSize: '14px' }}>
                                                                    <span style={{
                                                                        padding: '2px 6px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '11px',
                                                                        fontWeight: 600,
                                                                        marginRight: '8px',
                                                                        background: match.source_type === 'library' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                                        color: match.source_type === 'library' ? '#a78bfa' : '#60a5fa',
                                                                    }}>
                                                                        {match.source_type === 'library' ? (match.library_name || '文档库') : '批次内'}
                                                                    </span>
                                                                    {match.similar_document}
                                                                </div>
                                                                <span style={{
                                                                    fontWeight: 700,
                                                                    fontSize: '14px',
                                                                    color: match.similarity > 0.7 ? '#f87171' : match.similarity > 0.4 ? '#facc15' : '#34d399',
                                                                }}>
                                                                    {(match.similarity * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                result.status === 'completed' && !result.ai_analysis.provider && (
                                                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                                        未发现相似内容
                                                    </div>
                                                )
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        !isFinished && (
                            <div className="glass" style={{ padding: '60px 40px', textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
                                    {batchStatus === 'queued' ? '⏳' : '🔍'}
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>
                                    {batchStatus === 'queued' ? '任务正在排队等待处理' : '文档正在分析中'}
                                </p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                    页面将自动刷新，请稍候...
                                </p>
                            </div>
                        )
                    )}

                    {isFinished && results.length === 0 && (
                        <div className="glass" style={{ padding: '60px 40px', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                                该批次没有分析结果。
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Pulse animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
};

export default BatchResultsPage;
