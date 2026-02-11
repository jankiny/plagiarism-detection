import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container fade-in" style={{ padding: '80px 0' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '100px', position: 'relative' }}>
        <div style={{
          display: 'inline-block',
          padding: '10px 24px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '100px',
          marginBottom: '32px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--primary)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          ✨ 新一代检测引擎
        </div>

        <h1 style={{ fontSize: '72px', fontWeight: 800, marginBottom: '28px', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          守护学术诚信<br />
          <span className="text-gradient-primary">智能AI检测</span>
        </h1>

        <p style={{ fontSize: '22px', color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '700px', margin: '0 auto 48px', fontWeight: 400 }}>
          终极开源查重与AI生成内容检测方案。快速、安全、精准无比。
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '16px 40px', fontSize: '18px' }}>
              进入控制台 →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '16px 40px', fontSize: '18px' }}>
                免费开始使用
              </Link>
              <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', padding: '16px 40px', fontSize: '18px' }}>
                登录
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '100px' }}>
        {[
          { icon: '🔍', title: '语义分析', desc: '超越简单词汇匹配，深入理解文档的含义和上下文。', color: 'var(--primary)' },
          { icon: '🤖', title: 'AI内容检测', desc: '高置信度识别由GPT-4、Claude等先进模型生成的文本。', color: 'var(--secondary)' },
          { icon: '🖼️', title: '完整OCR支持', desc: '内置Tesseract引擎，轻松分析扫描PDF和图片。', color: 'var(--accent)' }
        ].map((feature, i) => (
          <div key={i} className="glass card-hover" style={{ padding: '40px', textAlign: 'left' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '24px',
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--glass-border)'
            }}>
              {feature.icon}
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>{feature.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.7 }}>{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <div className="glass" style={{ padding: '60px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          {[
            { label: '准确率', value: '99.9%' },
            { label: '处理时间', value: '< 2s' },
            { label: '支持格式', value: '15+' },
            { label: '开源', value: '100%' }
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: '40px', fontWeight: 800, marginBottom: '8px', color: 'white' }}>{stat.value}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
