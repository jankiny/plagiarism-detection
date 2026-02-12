import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Library {
    id: string;
    name: string;
    document_count: number;
}

interface WhitelistCollection {
    id: string;
    name: string;
    description: string;
    item_count: number;
}

const UploadForm = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [batchId, setBatchId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [analysisType, setAnalysisType] = useState('plagiarism');
    const [aiThreshold, setAiThreshold] = useState(0.5);
    const [compareMode, setCompareMode] = useState('library');
    const [libraries, setLibraries] = useState<Library[]>([]);
    const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
    const [whitelists, setWhitelists] = useState<WhitelistCollection[]>([]);
    const [selectedWhitelistIds, setSelectedWhitelistIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchLibraries = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/v1/libraries', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setLibraries(data.data || []);
                }
            } catch (e) {
                console.error('加载文档库列表失败', e);
            }
        };
        const fetchWhitelists = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/v1/whitelist', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setWhitelists(data.data || []);
                }
            } catch (e) {
                console.error('加载白名单列表失败', e);
            }
        };
        fetchLibraries();
        fetchWhitelists();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFiles(Array.from(e.target.files));
    };

    const toggleLibrary = (id: string) => {
        setSelectedLibraryIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleWhitelist = (id: string) => {
        setSelectedWhitelistIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return;

        if (compareMode !== 'internal' && selectedLibraryIds.length === 0) {
            setError('请至少选择一个文档库进行对比');
            return;
        }

        setIsUploading(true);
        setError(null);
        setBatchId(null);

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const options = {
            ai_threshold: aiThreshold,
            check_plagiarism: analysisType === 'plagiarism' || analysisType === 'both',
            check_ai: analysisType === 'ai' || analysisType === 'both'
        };
        formData.append('options', JSON.stringify(options));
        formData.append('library_ids', JSON.stringify(selectedLibraryIds));
        formData.append('whitelist_ids', JSON.stringify(selectedWhitelistIds));
        formData.append('compare_mode', compareMode);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/v1/analyze`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || '上传失败');
            }

            const data = await response.json();
            setBatchId(data.batch_id);
            setFiles([]);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="container fade-in" style={{ padding: '60px 0' }}>
            <div style={{ marginBottom: '60px', textAlign: 'center' }}>
                <h1 className="text-gradient" style={{ fontSize: '56px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                    查重检测
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
                    上传文档，选择对比文档库，开始深度分析。
                </p>
            </div>

            <div className="glass" style={{ padding: '48px', borderRadius: '32px', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                    {/* Analysis Type */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '20px', fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            分析模式
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            {[
                                { id: 'plagiarism', label: '查重检测', icon: '🔍' },
                                { id: 'ai', label: 'AI检测', icon: '🤖' },
                                { id: 'both', label: '全面扫描', icon: '✨' }
                            ].map(type => (
                                <label key={type.id} style={{ cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="analysisType"
                                        value={type.id}
                                        checked={analysisType === type.id}
                                        onChange={(e) => setAnalysisType(e.target.value)}
                                        style={{ display: 'none' }}
                                    />
                                    <div className={`glass card-hover ${analysisType === type.id ? 'active-card' : ''}`} style={{
                                        textAlign: 'center',
                                        padding: '24px 16px',
                                        borderRadius: '20px',
                                        transition: 'var(--transition)'
                                    }}>
                                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>{type.icon}</div>
                                        <span style={{ fontSize: '15px', fontWeight: 700 }}>{type.label}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Compare Mode */}
                    {(analysisType === 'plagiarism' || analysisType === 'both') && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '20px', fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                对比模式
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                {[
                                    { id: 'library', label: '文档库对比', desc: '与历史文档库对比' },
                                    { id: 'internal', label: '批次内对比', desc: '本次上传的文档互相对比' },
                                    { id: 'both', label: '全面对比', desc: '文档库+批次内都对比' },
                                ].map(mode => (
                                    <label key={mode.id} style={{ cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="compareMode"
                                            value={mode.id}
                                            checked={compareMode === mode.id}
                                            onChange={(e) => setCompareMode(e.target.value)}
                                            style={{ display: 'none' }}
                                        />
                                        <div className={`glass card-hover ${compareMode === mode.id ? 'active-card' : ''}`} style={{
                                            textAlign: 'center',
                                            padding: '20px 16px',
                                            borderRadius: '16px',
                                            transition: 'var(--transition)'
                                        }}>
                                            <span style={{ fontSize: '14px', fontWeight: 700 }}>{mode.label}</span>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{mode.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Library Selector */}
                    {(analysisType === 'plagiarism' || analysisType === 'both') && compareMode !== 'internal' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '20px', fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                选择对比文档库
                            </label>
                            {libraries.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                                    {libraries.map(lib => (
                                        <label key={lib.id} style={{ cursor: 'pointer' }}>
                                            <div
                                                onClick={() => toggleLibrary(lib.id)}
                                                className={`glass card-hover ${selectedLibraryIds.includes(lib.id) ? 'active-card' : ''}`}
                                                style={{
                                                    padding: '16px 20px',
                                                    borderRadius: '16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    transition: 'var(--transition)',
                                                }}
                                            >
                                                <div style={{
                                                    width: '20px', height: '20px', borderRadius: '6px',
                                                    border: selectedLibraryIds.includes(lib.id) ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.2)',
                                                    background: selectedLibraryIds.includes(lib.id) ? 'var(--primary)' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}>
                                                    {selectedLibraryIds.includes(lib.id) && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{lib.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lib.document_count} 个文档</div>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="glass" style={{ padding: '24px', textAlign: 'center', borderRadius: '16px' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>暂无可用的文档库，请联系版主创建。</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Whitelist Selector */}
                    {(analysisType === 'plagiarism' || analysisType === 'both') && whitelists.length > 0 && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '20px', fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                白名单过滤
                            </label>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                选择白名单清单后，清单中的所有条目（如封面、页眉页脚）将被自动跳过
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                                {whitelists.map(wl => (
                                    <label key={wl.id} style={{ cursor: 'pointer' }}>
                                        <div
                                            onClick={() => toggleWhitelist(wl.id)}
                                            className={`glass card-hover ${selectedWhitelistIds.includes(wl.id) ? 'active-card' : ''}`}
                                            style={{
                                                padding: '16px 20px',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                transition: 'var(--transition)',
                                            }}
                                        >
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '6px',
                                                border: selectedWhitelistIds.includes(wl.id) ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.2)',
                                                background: selectedWhitelistIds.includes(wl.id) ? '#10b981' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                {selectedWhitelistIds.includes(wl.id) && <span style={{ color: 'white', fontSize: '12px' }}>&#10003;</span>}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{wl.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    {wl.item_count} 个条目{wl.description ? ` · ${wl.description}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Threshold Slider */}
                    {(analysisType === 'ai' || analysisType === 'both') && (
                        <div>
                            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                <span>AI检测灵敏度</span>
                                <span>{Math.round(aiThreshold * 100)}%</span>
                            </label>
                            <input
                                type="range" min="0.1" max="0.9" step="0.05"
                                value={aiThreshold}
                                onChange={(e) => setAiThreshold(parseFloat(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--primary)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                <span>更宽松</span>
                                <span>更严格</span>
                            </div>
                        </div>
                    )}

                    {/* Upload Area */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '20px', fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            文档
                        </label>
                        <label className="glass upload-zone" style={{
                            display: 'block',
                            padding: '80px 40px',
                            border: '2px dashed var(--glass-border)',
                            borderRadius: '24px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'var(--transition)'
                        }}>
                            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📤</div>
                            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
                                <span className="text-gradient-primary">选择文件</span>或拖拽上传
                            </h3>
                            <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                                支持 PDF、DOCX、TXT、PNG、JPG、ZIP、TAR
                            </p>
                            <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                        </label>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    已选文件 ({files.length})
                                </p>
                                <button type="button" onClick={() => setFiles([])} style={{ fontSize: '13px', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                    清除全部
                                </button>
                            </div>
                            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'grid', gap: '12px', paddingRight: '8px' }}>
                                {files.map((file, i) => (
                                    <div key={i} className="glass" style={{
                                        padding: '16px 20px', fontSize: '14px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderRadius: '16px'
                                    }}>
                                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                            {file.name}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                            {(file.size / 1024).toFixed(1)} KB
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={files.length === 0 || isUploading} style={{
                        width: '100%', padding: '20px', fontSize: '18px', fontWeight: 800, borderRadius: '18px'
                    }}>
                        {isUploading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                                处理中...
                            </div>
                        ) : '开始检测'}
                    </button>
                </form>

                {batchId && (
                    <div className="fade-in" style={{ marginTop: '40px', padding: '32px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>✅</div>
                        <p style={{ fontSize: '18px', marginBottom: '24px', color: 'var(--success)', fontWeight: 700 }}>
                            上传成功！正在分析中。
                        </p>
                        <Link to={`/dashboard`} className="btn-secondary" style={{ display: 'inline-flex', padding: '14px 32px', borderRadius: '14px', textDecoration: 'none', fontWeight: 700 }}>
                            进入控制台 →
                        </Link>
                    </div>
                )}

                {error && (
                    <div className="fade-in" style={{ marginTop: '40px', padding: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '20px', color: 'var(--error)', fontSize: '15px', fontWeight: 600, textAlign: 'center' }}>
                        ⚠️ {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadForm;
