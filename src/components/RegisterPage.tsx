import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerWithEmail } from '../api/firestoreApi';
import { handleGoogleLogin } from '../api/firebase';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        agency: '',
        email: '',
        address: '',
        phone_number: '',
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
        if (formData.phone_number.length !== 10 || !/^\d+$/.test(formData.phone_number)) {
            alert('เบอร์โทรศัพท์ต้องมี 10 ตัวเลข');
            return;
        }
        try {
            await registerWithEmail(formData.email, formData.password, formData.full_name, {
                agency: formData.agency,
                address: formData.address,
                phone_number: formData.phone_number,
            });
            alert('ลงทะเบียนสำเร็จ! คุณสามารถเข้าสู่ระบบได้เลย');
            navigate('/dashboard'); // Navigate to dashboard after successful registration
        } catch (err: any) {
            console.error("Registration failed:", err);
            if (err.code === 'auth/email-already-in-use') {
                alert('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น');
            } else {
                alert(`ลงทะเบียนไม่สำเร็จ: ${err.message}`);
            }
        }
    };

    return (
        <section className="fade-in py-12">
            <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-[var(--border-color)]">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[var(--text-color)]">ลงทะเบียนผู้ใช้งานใหม่</h2>
                    <button onClick={() => navigate('/login')} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">กลับ</button>
                </div>
                
                <div className="my-4 flex items-center">
                    <div className="flex-grow border-t border-[var(--border-color)]"></div>
                    <span className="mx-4 text-gray-500 text-sm">ลงทะเบียนด้วยอีเมล</span>
                    <div className="flex-grow border-t border-[var(--border-color)]"></div>
                </div>

                <form onSubmit={handleRegister} className="mt-2 grid sm:grid-cols-2 gap-4">
                    <input name="full_name" required placeholder="ชื่อ-สกุล" value={formData.full_name} onChange={handleChange} className="px-4 py-3 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                    <input name="agency" required placeholder="หน่วยงาน" value={formData.agency} onChange={handleChange} className="px-4 py-3 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                    <input name="email" type="email" required placeholder="อีเมล" value={formData.email} onChange={handleChange} className="px-4 py-3 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                    <input name="phone_number" type="tel" required placeholder="เบอร์โทรศัพท์" value={formData.phone_number} onChange={handleChange} className="px-4 py-3 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                    <textarea name="address" placeholder="ที่อยู่หน่วยงาน" value={formData.address} onChange={handleChange} rows={2} className="sm:col-span-2 px-4 py-3 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"></textarea>
                    <input name="password" type="password" required placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" value={formData.password} onChange={handleChange} minLength={8} className="sm:col-span-2 px-4 py-3 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                    <button type="submit" className="sm:col-span-2 px-4 py-3 rounded-lg bg-[#4F46E5] text-white font-semibold hover:opacity-90 transition">ยืนยันการลงทะเบียน</button>
                </form>
            </div>
        </section>
    );
};

export default RegisterPage;