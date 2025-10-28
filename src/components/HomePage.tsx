import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAppContext();

    const handleStart = () => {
        // If user is logged in, go to dashboard, otherwise go to login
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <section id="home" className="fade-in">
            <div className="grid md:grid-cols-2 gap-8 items-start md-stack">
                <div>
                    <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tighter">ระบบจอง ยืม-คืน
                        และซ่อมบำรุง</h1>
                    <p className="mt-4 text-lg text-white/90">ลดขั้นตอนงานเอกสาร เพิ่มประสิทธิภาพการทำงาน
                        ติดตามสถานะอุปกรณ์ได้แบบเรียลไทม์</p>
                    <div className="mt-8 flex flex-wrap gap-4">
                        <button onClick={handleStart}
                            className="px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:opacity-90 transition-transform hover:scale-105">เริ่มต้นใช้งาน</button>
                        <button onClick={() => navigate('/equipment')}
                            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition">ทดสอบระบบ (ดูอุปกรณ์)</button>
                    </div>
                    <div className="mt-6 flex items-center gap-3 text-sm">
                        <span className="chip px-3 py-1 rounded-full">Responsive</span>
                        <span className="chip px-3 py-1 rounded-full">Role-based</span>
                        <span className="chip px-3 py-1 rounded-full">Real-time</span>
                    </div>
                </div>
                <div className="card rounded-2xl p-6 text-slate-900 shadow-xl">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">คู่มือใช้งานอย่างย่อ</p>
                        <span
                            className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">Demo</span>
                    </div>
                    <ol className="mt-4 space-y-2.5 text-sm text-slate-700 list-decimal list-inside">
                        <li><strong>ลงทะเบียน:</strong> ผู้ใช้ใหม่ลงทะเบียน → สถานะเป็น “รอตรวจสอบ”</li>
                        <li><strong>อนุมัติบัญชี:</strong> ผู้อนุมัติทำการอนุมัติ → ผู้ใช้จึงจะเข้าสู่ระบบได้</li>
                        <li><strong>ส่งคำขอยืม:</strong> ผู้ใช้ทั่วไปส่งคำขอยืม (สามารถเลือกได้หลายเครื่อง)</li>
                        <li><strong>อนุมัติการยืม:</strong> ผู้อนุมัติอนุมัติคำขอ → ช่างตรวจสภาพก่อนส่งมอบ</li>
                        <li><strong>คืนอุปกรณ์:</strong> เมื่อคืนอุปกรณ์ ช่างจะตรวจสภาพและตัดสินว่า “เสีย/ไม่เสีย”</li>
                        <li><strong>ขั้นตอนการซ่อม:</strong> หากเสีย → สร้างคำขอซ่อม → อนุมัติซ่อม → ซ่อมเสร็จ →
                            อุปกรณ์กลับมา “ว่าง”</li>
                    </ol>
                    <div className="mt-5 p-3 rounded-lg bg-slate-50 border text-sm text-slate-600">
                        <strong>บัญชีทดสอบ (รหัสผ่าน: password)</strong>
                        <ul className="list-disc list-inside mt-1">
                            <li>admin@nrt.web.app (ผู้ดูแลระบบ)</li>
                            <li>approver@nrt.web.app (ผู้อนุมัติ)</li>
                            <li>tech@nrt.web.app (ช่างเทคนิค)</li>
                            <li>user@nrt.web.app (ผู้ใช้ทั่วไป)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomePage;