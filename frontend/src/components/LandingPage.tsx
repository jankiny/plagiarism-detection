import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const steps = [
    { num: 1, title: '建立文档库', role: '版主', desc: '创建文档库并上传历史材料作为对比基准', icon: '📁' },
    { num: 2, title: '上传待检文档', role: '用户', desc: '选择目标文档库，上传需要查重的文档', icon: '📤' },
    { num: 3, title: '系统自动检测', role: '系统', desc: 'AI语义分析，与文档库中的历史文档逐一比对', icon: '🔬' },
    { num: 4, title: '查看检测报告', role: '用户', desc: '查看相似度、匹配来源和具体重合段落详情', icon: '📊' },
  ];

  const roles = [
    { title: '管理员', desc: '负责账号管理，创建和管理所有用户', icon: '👑', color: '#f59e0b' },
    { title: '版主', desc: '负责文档库管理，建立和维护历史文档库', icon: '📚', color: '#8b5cf6' },
    { title: '普通用户', desc: '负责日常查重，上传文档并查看报告', icon: '👤', color: '#3b82f6' },
  ];

  const features = [
    { icon: '🔍', title: '语义查重', desc: '基于语义向量分析文档相似度，超越简单词汇匹配。' },
    { icon: '🤖', title: 'AI内容检测', desc: '识别由大语言模型生成的文本内容。' },
    { icon: '🖼️', title: 'OCR支持', desc: '支持扫描PDF和图片的文字提取与分析。' },
    { icon: '📁', title: '文档库管理', desc: '建立历史文档库，支持跨库比对和长期积累。' },
  ];

  return (
    <div className="container fade-in" style={{ padding: '60px 0' }}>
      {/* Hero 标题区 */}
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '20px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          文档<span className="text-gradient-primary">查重检测</span>平台
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '36px', maxWidth: '600px', margin: '0 auto 36px' }}>
          公司内部材料查重平台，检测新提交文档与历史文档的重复情况，支持语义分析和AI检测。
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 36px', fontSize: '16px' }}>
              进入控制台
            </Link>
          ) : (
            <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 36px', fontSize: '16px' }}>
              登录
            </Link>
          )}
        </div>
      </div>

      {/* 业务流程图 */}
      <div style={{ marginBottom: '80px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, marginBottom: '48px' }}>
          平台使用流程
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'start', position: 'relative' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="glass card-hover" style={{ padding: '28px 20px', textAlign: 'center', width: '100%', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)',
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 800, color: 'white',
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: '36px', marginBottom: '12px', marginTop: '8px' }}>{step.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{step.title}</h3>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: '100px',
                  fontSize: '12px', fontWeight: 600, marginBottom: '10px',
                  background: step.role === '版主' ? 'rgba(139,92,246,0.2)' : step.role === '系统' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)',
                  color: step.role === '版主' ? '#8b5cf6' : step.role === '系统' ? '#10b981' : '#3b82f6',
                }}>
                  {step.role}
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>{step.desc}</p>
              </div>
              {/* 箭头 */}
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute', right: '-16px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '20px', color: 'var(--text-muted)', zIndex: 2,
                }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 角色说明区 */}
      <div style={{ marginBottom: '80px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, marginBottom: '48px' }}>
          三种角色，各司其职
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {roles.map((role, i) => (
            <div key={i} className="glass card-hover" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{
                fontSize: '40px', marginBottom: '16px',
                width: '72px', height: '72px', margin: '0 auto 16px',
                background: `${role.color}15`,
                borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${role.color}30`,
              }}>
                {role.icon}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: role.color }}>{role.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{role.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 功能特性 */}
      <div style={{ marginBottom: '64px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, marginBottom: '48px' }}>
          核心功能
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {features.map((feature, i) => (
            <div key={i} className="glass card-hover" style={{ padding: '32px', textAlign: 'left' }}>
              <div style={{
                fontSize: '36px', marginBottom: '16px',
                width: '64px', height: '64px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--glass-border)'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
        <div style={{ marginBottom: '8px' }}>
          <Link to="/guide" style={{ color: 'var(--text-muted)', textDecoration: 'underline', marginRight: '16px' }}>使用说明</Link>
        </div>
        © {new Date().getFullYear()} 三门公司
      </div>
    </div>
  );
};

export default LandingPage;
