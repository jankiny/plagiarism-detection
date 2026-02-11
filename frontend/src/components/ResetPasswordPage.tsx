import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("两次输入的密码不一致");
            return;
        }

        if (!token) {
            setError("未找到重置令牌。");
            return;
        }

        try {
            const response = await fetch('/api/v1/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || '重置密码失败');
            }

            setSuccess(true);
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('发生意外错误');
            }
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-full max-w-md p-8 space-y-8 bg-surface rounded-lg shadow-lg text-center">
                    <h2 className="text-3xl font-bold text-text-primary">密码重置成功</h2>
                    <p className="text-text-secondary">
                        现在可以使用新密码{' '}
                        <Link to="/login" className="font-medium text-primary hover:underline">
                            登录
                        </Link>
                        {' '}了。
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-8 bg-color-surface rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center text-color-text-primary">重置密码</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-color-text-secondary">
                            新密码
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="appearance-none block w-full px-3 py-2 border border-color-border rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-color-primary focus:border-color-primary sm:text-sm bg-color-background"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-color-text-secondary">
                            确认新密码
                        </label>
                        <div className="mt-1">
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="appearance-none block w-full px-3 py-2 border border-color-border rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-color-primary focus:border-color-primary sm:text-sm bg-color-background"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-color-primary hover:bg-color-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-color-primary"
                        >
                            重置密码
                        </button>
                    </div>
                </form>
                {error && (
                    <div className="mt-4 p-4 bg-red-900 bg-opacity-50 rounded-lg">
                        <p className="text-sm font-medium text-red-400">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
