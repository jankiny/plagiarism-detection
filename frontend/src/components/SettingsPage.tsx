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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-8">系统设置</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 平台基本信息区 */}
        <section className="glass p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-white/20 pb-2">平台基本信息区</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-gray-200 mb-2">平台名称</label>
              <input
                type="text"
                name="system_name"
                value={settings.system_name}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-white/30"
              />
            </div>
          </div>
        </section>

        {/* AI 服务配置区 */}
        <section className="glass p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-white/20 pb-2">AI 服务配置区</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-gray-200 mb-2">AI API 地址</label>
              <input
                type="text"
                name="ai_api_base_url"
                value={settings.ai_api_base_url}
                onChange={handleChange}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-white/30"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-200 mb-2">AI API 密钥</label>
              <input
                type="password"
                name="ai_api_key"
                value={settings.ai_api_key}
                onChange={handleChange}
                placeholder="sk-..."
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-white/30"
              />
            </div>
            <div>
              <label className="block text-gray-200 mb-2">聊天模型名称</label>
              <input
                type="text"
                name="ai_chat_model"
                value={settings.ai_chat_model}
                onChange={handleChange}
                placeholder="gpt-3.5-turbo"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-white/30"
              />
            </div>
            <div>
              <label className="block text-gray-200 mb-2">Embedding 模型名称</label>
              <input
                type="text"
                name="ai_embedding_model"
                value={settings.ai_embedding_model}
                onChange={handleChange}
                placeholder="text-embedding-3-small"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-white/30"
              />
            </div>
          </div>
        </section>

        {/* 查重参数配置区 */}
        <section className="glass p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-white/20 pb-2">查重参数配置区</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-gray-200 mb-2">
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
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-300">
                <span>0.0</span>
                <span>0.5</span>
                <span>1.0</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-200 mb-2">最大上传文件大小 (MB)</label>
              <input
                type="number"
                name="max_upload_size_mb"
                value={settings.max_upload_size_mb}
                onChange={handleChange}
                min="1"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-white/30"
              />
            </div>
            <div>
              <label className="block text-gray-200 mb-2">单次最大文件数</label>
              <input
                type="number"
                name="max_files_per_batch"
                value={settings.max_files_per_batch}
                onChange={handleChange}
                min="1"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-white/30"
              />
            </div>
          </div>
        </section>

        {message && (
          <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-500/20 text-green-200 border border-green-500/30' : 'bg-red-500/20 text-red-200 border border-red-500/30'}`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
