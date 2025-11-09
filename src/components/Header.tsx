import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../App';

const Header = () => {
    const { user, handleLogout } = useAppContext();

    return (
        <header className="sticky top-0 z-30 bg-gradient-to-r from-[#14B1FF] to-[#4C5EFF] shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 cursor-pointer">
                    <img src="/src/img/logo/logoDDC.png" alt="Logo DDC" className="h-16" />
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
                                <Link to="/login" className="px-4 py-2 rounded-lg hover:bg-white/10 transition text-white">เข้าสู่ระบบ</Link>
                                <Link to="/register" className="px-4 py-2 rounded-lg bg-[var(--primary-color)] text-white font-semibold hover:opacity-90 transition">ลงทะเบียน</Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-white">{user.name}</span>
                                <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-[var(--danger-color)] text-white hover:opacity-90 transition text-sm">ออกจากระบบ</button>
                            </div>
                        )}
                    </nav>
                    <button id="hamburgerBtn" className="md:hidden p-2 rounded-lg hover:bg-white/10 text-2xl text-white">
                        <span>☰</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;