import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmail } from '../api/firestoreApi';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // --- State for Email Login ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');
        setLoading(true);
        try {
            await signInWithEmail(email, password);
            // onAuthStateChanged in App.tsx will handle navigation
        } catch (err: any) {
            console.error("Email login failed:", err);
            setEmailError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
        setLoading(false);
    };

        return (

            <section className="fade-in py-12">

                <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-sm border border-[var(--border-color)]">

                    <div className="flex items-center justify-between">

                        <h2 className="text-2xl font-bold text-[var(--text-color)]">เข้าสู่ระบบ</h2>

                        <button onClick={() => navigate('/')} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">กลับ</button>

                    </div>

    

                    <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">

                        <input type="email" required placeholder="อีเมล" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />

                        <input type="password" required placeholder="รหัสผ่าน" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />

                        {emailError && <p className="text-sm text-[var(--danger-color)]">{emailError}</p>}

                        <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-lg bg-[#4F46E5] text-white font-semibold transition disabled:opacity-50 hover:opacity-90">{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>

                    </form>

    

                    <p className="mt-6 text-sm text-center text-gray-600">ยังไม่มีบัญชี? <a href="#" onClick={() => navigate('/register')} className="font-medium text-[var(--primary-color)] hover:underline">ลงทะเบียนที่นี่</a></p>

                </div>

            </section>

        );
};

export default LoginPage;