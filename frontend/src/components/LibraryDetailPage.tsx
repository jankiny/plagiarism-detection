import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Document {
    id: string;
    filename: string;
    status: 'processing' | 'ready' | 'failed';
    created_at: string;
    file_size?: number;
}

interface Library {
    id: string;
    name: string;
    description: string;
    document_count: number;
    documents?: Document[];
}

const LibraryDetailPage = () => {
    const { libraryId } = useParams<{ libraryId: string }>();
    const [library, setLibrary] = useState<Library | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Upload state
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const fetchLibraryDetails = async () => {
        if (!libraryId) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/v1/libraries/${libraryId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setLibrary(data);
                // Assuming the API returns documents inside the library object or we might need to fetch them separately
                // Based on requirements, I'll assume standard REST design where detail includes children or we fetch them.
                // If the API matches typical patterns, data might contain the library fields.
                // Let's assume data has documents or we fetch /documents endpoint.
                // However, requirement says "Display list of documents in the library", usually detail endpoint returns it or separate.
                // Let's assume it is in the detail for now, or fetch separately if needed.
                // Given the prompt "Fetch library detail from GET /api/v1/libraries/{libraryId}", I'll assume it returns everything.
                if (data.documents) {
                    setDocuments(data.documents);
                } else {
                    // Fallback if documents are not in detail, maybe fetch from sub-resource?
                    // But usually details include it. Let's stick to detail response.
                    setDocuments([]);
                }
            } else {
                throw new Error('获取文档库详情失败');
            }
        } catch (e) {
            setError('加载文档库详情失败');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLibraryDetails();
    }, [libraryId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            setUploadError(null);
            setUploadSuccess(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0 || !libraryId) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(false);

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/v1/libraries/${libraryId}/documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || '上传失败');
            }

            setUploadSuccess(true);
            setFiles([]);
            // Refresh list
            fetchLibraryDetails();
        } catch (e: any) {
            setUploadError(e.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!window.confirm('确定要删除这个文档吗？') || !libraryId) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/v1/libraries/${libraryId}/documents/${docId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                setDocuments(prev => prev.filter(d => d.id !== docId));
                // Update count if possible
                if (library) {
                    setLibrary({
                        ...library,
                        document_count: Math.max(0, library.document_count - 1)
                    });
                }
            } else {
                alert('删除失败');
            }
        } catch (e) {
            console.error('删除文档出错', e);
            alert('删除文档出错');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string, color: string, text: string }> = {
            'processing': { bg: 'rgba(234, 179, 8, 0.2)', color: '#fbbf24', text: '处理中' },
            'ready': { bg: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', text: '已就绪' },
            'failed': { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', text: '失败' },
        };
        const style = styles[status] || { bg: 'rgba(255, 255, 255, 0.1)', color: '#fff', text: status };

        return (
            <span style={{
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: style.bg,
                color: style.color,
                fontSize: '12px',
                fontWeight: 600
            }}>
                {style.text}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="container" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px' }} />
                <p>正在加载文档库详情...</p>
            </div>
        );
    }

    if (error || !library) {
        return (
            <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
                <div className="glass" style={{ padding: '40px', borderRadius: '24px', color: 'var(--error)' }}>
                    <h2>⚠️ {error || '未找到文档库'}</h2>
                    <Link to="/dashboard" className="btn-secondary" style={{ marginTop: '20px', display: 'inline-block' }}>
                        返回控制台
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ padding: '40px 0 80px' }}>
            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
                <Link to="/dashboard" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '20px',
                    fontSize: '14px', fontWeight: 600, transition: 'var(--transition)'
                }}>
                    ← 返回文档库列表
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: '42px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                            {library.name}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px' }}>
                            {library.description || '暂无描述'}
                        </p>
                    </div>
                    <div className="glass" style={{ padding: '12px 24px', borderRadius: '16px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>文档总数</span>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>{library.document_count}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
                {/* Documents List */}
                <div className="glass" style={{ padding: '32px', borderRadius: '32px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: 'white' }}>文档列表</h2>

                    {documents.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {documents.map(doc => (
                                <div key={doc.id} className="glass card-hover" style={{
                                    padding: '20px', borderRadius: '16px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '60%' }}>
                                        <div style={{ fontWeight: 600, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {doc.filename}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            上传于 {new Date(doc.created_at).toLocaleString('zh-CN')}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {getStatusBadge(doc.status)}
                                        <button
                                            onClick={() => handleDeleteDocument(doc.id)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--text-muted)', fontSize: '18px', padding: '8px',
                                                transition: 'color 0.2s'
                                            }}
                                            title="删除文档"
                                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--error)'}
                                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <p>该文档库暂无文档</p>
                        </div>
                    )}
                </div>

                {/* Upload Sidebar */}
                <div className="glass" style={{ padding: '32px', borderRadius: '32px', height: 'fit-content' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: 'white' }}>上传文档</h2>

                    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <label className="glass upload-zone" style={{
                            display: 'block',
                            padding: '40px 20px',
                            border: '2px dashed var(--glass-border)',
                            borderRadius: '20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'var(--transition)'
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
                            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                                点击选择文件
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                支持多种文档格式
                            </p>
                            <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                        </label>

                        {files.length > 0 && (
                            <div className="fade-in">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>已选 {files.length} 个文件</span>
                                    <button type="button" onClick={() => setFiles([])} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>清除</button>
                                </div>
                                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {files.map((file, i) => (
                                        <div key={i} style={{
                                            fontSize: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>
                                            {file.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={files.length === 0 || isUploading}
                            style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: 700 }}
                        >
                            {isUploading ? '上传中...' : '确认上传'}
                        </button>
                    </form>

                    {uploadError && (
                        <div className="fade-in" style={{ marginTop: '20px', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', fontSize: '13px' }}>
                            {uploadError}
                        </div>
                    )}

                    {uploadSuccess && (
                        <div className="fade-in" style={{ marginTop: '20px', padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontSize: '13px', textAlign: 'center' }}>
                            上传成功！
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LibraryDetailPage;
