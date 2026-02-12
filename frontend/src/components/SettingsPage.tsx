import React, { useState, useEffect } from 'react';

interface SystemSettings {
  ai_api_base_url: string;
  ai_api_key: string;
  ai_chat_model: string;
  ai_embedding_model: string;
  similarity_threshold: number;
  max_upload_size_mb: number;
  max_files_per_batch: number;
  system_name: string;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    ai_api_base_url: '',
    ai_api_key: '',
    ai_chat_model: '',
    ai_embedding_model: '',
    similarity_threshold: 0.75,
    max_upload_size_mb: 10,
    max_files_per_batch: 5,
    system_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(prev => ({
        ...prev,
        ...data
      }));
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ text: '无法加载设置', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setMessage({ text: '设置已保存', type: 'success' });
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ text: '保存设置失败', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span className="ml-2">加载设置中...</span>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <h1 className="text-gradient-primary" style={{ fontSize: '2rem', fontWeight: 700 }}>系统设置</h1>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '32px' }}>
        {/* 平台基本信息区 */}
        <section className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>平台基本信息区</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px' }}>平台名称</label>
              <input
                type="text"
                name="system_name"
                value={settings.system_name}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* AI 服务配置区 */}
        <section className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>AI 服务配置区</h2>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px' }}>AI API 地址</label>
              <input
                type="text"
                name="ai_api_base_url"
                value={settings.ai_api_base_url}
                onChange={handleChange}
                placeholder="https://api.openai.com/v1"
                className="w-full"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px' }}>AI API 密钥</label>
              <input
                type="password"
                name="ai_api_key"
                value={settings.ai_api_key}
                onChange={handleChange}
                placeholder="sk-..."
                className="w-full"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px' }}>聊天模型名称</label>
              <input
                type="text"
                name="ai_chat_model"
                value={settings.ai_chat_model}
                onChange={handleChange}
                placeholder="gpt-3.5-turbo"
                className="w-full"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px' }}>Embedding 模型名称</label>
              <input
                type="text"
                name="ai_embedding_model"
                value={settings.ai_embedding_model}
                onChange={handleChange}
                placeholder="text-embedding-3-small"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* 查重参数配置区 */}
        <section className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>查重参数配置区</h2>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px' }}>
                相似度阈值: {settings.similarity_threshold}
              </label>
              <input
                type="range"
                name="similarity_threshold"
                min="0"
                max="1"
                step="0.01"
                value={settings.similarity_threshold}
                onChange={handleChange}
                style={{ accentColor: 'var(--primary)', width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#d1d5db', marginTop: '4px' }}>
                <span>0.0</span>
                <span>0.5</span>
                <span>1.0</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px' }}>最大上传文件大小 (MB)</label>
              <input
                type="number"
                name="max_upload_size_mb"
                value={settings.max_upload_size_mb}
                onChange={handleChange}
                min="1"
                className="w-full"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '8px' }}>单次最大文件数</label>
              <input
                type="number"
                name="max_files_per_batch"
                value={settings.max_files_per_batch}
                onChange={handleChange}
                min="1"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {message && (
          <div style={{
            padding: '16px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: message.type === 'success' ? '#bbf7d0' : '#fecaca',
            border: message.type === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default SettingsPage;
