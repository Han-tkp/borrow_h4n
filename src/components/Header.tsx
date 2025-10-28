import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../App';

const Header = () => {
    const { user, handleLogout } = useAppContext();

    return (
        <header className="sticky top-0 z-30 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <span className="text-2xl text-white">🔄</span>
                    </div>
                    <div>
                        <p className="font-semibold text-lg">Yonchuw</p>
                        <p className="text-white/80 text-xs -mt-0.5">ระบบบริหารจัดการเครื่องพ่นหมอกควัน</p>
                    </div>
                </Link>
                <div className="flex items-center gap-4">
                    {user && (
                        <div id="notificationArea" className="relative">
                            {/* Notification logic would go here */}
                        </div>
                    )}
                    <nav className="hidden md:flex items-center gap-2">
                        {!user ? (
                            <>
                                <Link to="/login" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">เข้าสู่ระบบ</Link>
                                <Link to="/register" className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold hover:opacity-90 transition">ลงทะเบียน</Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">{user.name}</span>
                                <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-100 hover:bg-red-500/40 transition text-sm">ออกจากระบบ</button>
                            </div>
                        )}
                    </nav>
                    <button id="hamburgerBtn" className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-2xl">
                        <span>☰</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
