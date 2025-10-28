import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setupRecaptcha, signInWithPhoneNumber } from '../api/firebase';
import { signInWithEmail } from '../api/firestoreApi';

const LoginPage = () => {
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
    const navigate = useNavigate();
    const location = useLocation();

    // Check for navigation state to default to phone login
    useEffect(() => {
        if (location.state?.method === 'phone') {
            setLoginMethod('phone');
        }
    }, [location.state]);

    // --- State for Email Login ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');

    // --- State for Phone Login ---
    const [phoneStep, setPhoneStep] = useState('enter-phone'); // 'enter-phone' or 'enter-otp'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [phoneError, setPhoneError] = useState('');
    const [loading, setLoading] = useState(false);

    // Setup reCAPTCHA for phone auth when the method is selected
    useEffect(() => {
        if (loginMethod === 'phone') {
            try {
                setupRecaptcha('recaptcha-container');
            } catch (err) {
                console.error("reCAPTCHA setup failed", err);
                setPhoneError("ไม่สามารถเริ่มต้นระบบยืนยันตัวตนได้");
            }
        }
    }, [loginMethod]);

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

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setPhoneError('');
        setLoading(true);
        if (!phoneNumber.match(/^0[0-9]{9}$/)) {
            setPhoneError("กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง (เช่น 0812345678)");
            setLoading(false);
            return;
        }
        const formattedPhoneNumber = `+66${phoneNumber.substring(1)}`;
        try {
            const result = await signInWithPhoneNumber(formattedPhoneNumber);
            setConfirmationResult(result);
            setPhoneStep('enter-otp');
        } catch (err: any) {
            console.error("SMS send error:", err);
            setPhoneError(`เกิดข้อผิดพลาด: ${err.message}`);
        }
        setLoading(false);
    };

    const handleConfirmCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setPhoneError('');
        setLoading(true);
        if (!confirmationResult) {
            setPhoneError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
            setLoading(false);
            return;
        }
        try {
            await confirmationResult.confirm(otp);
            // onAuthStateChanged will handle navigation
        } catch (err: any) {
            console.error("OTP confirm error:", err);
            setPhoneError(`รหัส OTP ไม่ถูกต้อง`);
        }
        setLoading(false);
    };

    return (
        <section className="fade-in">
            <div id="recaptcha-container"></div>
            <div className="max-w-md mx-auto card rounded-2xl p-8 text-slate-900 shadow-xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">เข้าสู่ระบบ</h2>
                    <button onClick={() => navigate('/')} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm">กลับ</button>
                </div>

                {loginMethod === 'email' ? (
                    <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
                        <input type="email" required placeholder="อีเมล" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200" />
                        <input type="password" required placeholder="รหัสผ่าน" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200" />
                        {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                        <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-lg bg-indigo-600 text-white font-semibold transition disabled:opacity-50">{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
                    </form>
                ) : (
                    phoneStep === 'enter-phone' ? (
                        <form onSubmit={handleSendCode} className="mt-6 space-y-4">
                            <p className="text-sm text-slate-600">กรอกเบอร์โทรศัพท์ของคุณเพื่อรับรหัส OTP</p>
                            <input type="tel" required placeholder="เช่น 0812345678" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200" />
                            {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
                            <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-lg bg-indigo-600 text-white font-semibold transition disabled:opacity-50">{loading ? 'กำลังส่ง...' : 'ขอรหัส OTP'}</button>
                        </form>
                    ) : (
                        <form onSubmit={handleConfirmCode} className="mt-6 space-y-4">
                            <p className="text-sm text-slate-600">กรอกรหัส OTP 6 หลักที่คุณได้รับ</p>
                            <input type="text" required placeholder="รหัส OTP 6 หลัก" value={otp} onChange={e => setOtp(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200" />
                            {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
                            <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold transition disabled:opacity-50">{loading ? 'กำลังตรวจสอบ...' : 'ยืนยันและเข้าสู่ระบบ'}</button>
                            <button onClick={() => { setPhoneStep('enter-phone'); setPhoneError(''); }} type="button" className="text-sm text-slate-600 hover:underline text-center w-full">กลับไปแก้ไขเบอร์โทรศัพท์</button>
                        </form>
                    )
                )}

                <div className="my-4 flex items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="mx-4 text-slate-500 text-sm">หรือ</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button onClick={() => setLoginMethod(loginMethod === 'email' ? 'phone' : 'email')} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                    <span className="text-xl">{loginMethod === 'email' ? '📱' : '✉️'}</span>
                    <span className="font-medium text-slate-700">{loginMethod === 'email' ? 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์' : 'เข้าสู่ระบบด้วยอีเมล'}</span>
                </button>

                <p className="mt-6 text-sm text-center text-slate-600">ยังไม่มีบัญชี? <a href="#" onClick={() => navigate('/register')} className="font-medium text-indigo-600 hover:underline">ลงทะเบียนที่นี่</a></p>
            </div>
        </section>
    );
};

export default LoginPage;