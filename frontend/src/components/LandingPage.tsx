import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container fade-in" style={{ padding: '60px 0' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '20px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          查重 & <span className="text-gradient-primary">AI检测</span> 平台
        </h1>

        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '36px', maxWidth: '560px', margin: '0 auto 36px' }}>
          支持文档查重与AI生成内容识别，快速、安全。
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 36px', fontSize: '16px' }}>
              进入控制台
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 36px', fontSize: '16px' }}>
                注册
              </Link>
              <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', padding: '14px 36px', fontSize: '16px' }}>
                登录
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '64px' }}>
        {[
          { icon: '🔍', title: '语义查重', desc: '基于语义向量分析文档相似度，超越简单词汇匹配。' },
          { icon: '🤖', title: 'AI内容检测', desc: '识别由大语言模型生成的文本内容。' },
          { icon: '🖼️', title: 'OCR支持', desc: '支持扫描PDF和图片的文字提取与分析。' }
        ].map((feature, i) => (
          <div key={i} className="glass card-hover" style={{ padding: '32px', textAlign: 'left' }}>
            <div style={{
              fontSize: '36px',
              marginBottom: '16px',
              width: '64px',
              height: '64px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--glass-border)'
            }}>
              {feature.icon}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>{feature.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} 三门公司
      </div>
    </div>
  );
};

export default LandingPage;
