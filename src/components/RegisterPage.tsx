import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerWithEmail } from '../api/firestoreApi';
import { handleGoogleLogin } from '../api/firebase';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        agency: '',
        phone: '',
        email: '',
        address: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password.length < 8) {
            alert('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
            return;
        }
        try {
            await registerWithEmail(formData.email, formData.password, formData.full_name, {
                agency: formData.agency,
                phone: formData.phone,
                address: formData.address,
            });
            alert('ลงทะเบียนสำเร็จ! คุณสามารถเข้าสู่ระบบได้เลย');
            navigate('/dashboard'); // Navigate to dashboard after successful registration
        } catch (err: any) {
            console.error("Registration failed:", err);
            alert(`ลงทะเบียนไม่สำเร็จ: ${err.message}`);
        }
    };

    return (
        <section className="fade-in">
            <div className="max-w-xl mx-auto card rounded-2xl p-8 text-slate-900 shadow-xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">ลงทะเบียนผู้ใช้งานใหม่</h2>
                    <button onClick={() => navigate('/login')} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm">กลับ</button>
                </div>
                
                <div className="my-4 flex items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="mx-4 text-slate-500 text-sm">ลงทะเบียนด้วยช่องทางอื่น</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="mt-2">
                    <button onClick={() => navigate('/login', { state: { method: 'phone' } })} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                        <span className="text-xl">📱</span>
                        <span className="font-medium text-slate-700">ลงทะเบียนด้วยเบอร์โทรศัพท์</span>
                    </button>
                </div>

                <div className="my-4 flex items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="mx-4 text-slate-500 text-sm">หรือลงทะเบียนด้วยอีเมล</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <form onSubmit={handleRegister} className="mt-2 grid sm:grid-cols-2 gap-4">
                    <input name="full_name" required placeholder="ชื่อ-สกุล" value={formData.full_name} onChange={handleChange} className="px-4 py-3 rounded-lg border border-slate-200" />
                    <input name="agency" required placeholder="หน่วยงาน" value={formData.agency} onChange={handleChange} className="px-4 py-3 rounded-lg border border-slate-200" />
                    <input name="phone" type="tel" required placeholder="เบอร์โทรศัพท์" value={formData.phone} onChange={handleChange} className="px-4 py-3 rounded-lg border border-slate-200" />
                    <input name="email" type="email" required placeholder="อีเมล" value={formData.email} onChange={handleChange} className="px-4 py-3 rounded-lg border border-slate-200" />
                    <textarea name="address" placeholder="ที่อยู่หน่วยงาน" value={formData.address} onChange={handleChange} rows={2} className="sm:col-span-2 px-4 py-3 rounded-lg border border-slate-200"></textarea>
                    <input name="password" type="password" required placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" value={formData.password} onChange={handleChange} minLength={8} className="sm:col-span-2 px-4 py-3 rounded-lg border border-slate-200" />
                    <button type="submit" className="sm:col-span-2 px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition">ยืนยันการลงทะเบียน</button>
                </form>
            </div>
        </section>
    );
};

export default RegisterPage;