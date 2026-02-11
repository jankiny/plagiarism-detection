import { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("两次输入的密码不一致");
            return;
        }

        try {
            const response = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) throw new Error('注册失败');
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (success) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="glass" style={{ maxWidth: '420px', width: '100%', padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                    <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>账号创建成功！</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        现在可以登录您的账号了
                    </p>
                    <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                        去登录
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass" style={{ maxWidth: '420px', width: '100%', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
                    <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>创建账号</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        已有账号？ <Link to="/login" style={{ color: 'var(--primary)' }}>登录</Link>
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>邮箱</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>密码</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>确认密码</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="•••••••• "
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        创建账号
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
