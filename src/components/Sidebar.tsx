import React from 'react';

const Sidebar = () => {
    return (
        <div id="sidebar" className="fixed inset-0 z-40 md:hidden hidden">
            <div id="sidebarBackdrop" className="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-300"></div>
            <div id="sidebarContent"
                className="relative z-10 w-64 bg-gradient-to-b from-[var(--primary-color)] to-[var(--primary-dark-color)] text-white h-full p-4 flex flex-col transform -translate-x-full transition-transform duration-300 ease-in-out">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg">เมนู</h3>
                    <button id="sidebarCloseBtn" className="p-2 text-2xl leading-none">&times;</button>
                </div>
                <nav id="sidebarNav" className="flex flex-col gap-2"></nav>
                <div className="mt-auto pt-6 border-t border-white/10">
                    <div id="sidebarUserInfo" className="hidden flex-col items-start gap-1">
                        <span id="sidebarUserNameDisplay" className="text-sm font-semibold"></span>
                        <span id="sidebarUserRoleDisplay"
                            className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white"></span>
                        <button id="reportProblemBtn"
                            className="mt-4 text-left w-full text-sm text-slate-300 hover:text-white">แจ้งปัญหาระบบ</button>
                        <button id="sidebarBtnLogout"
                            className="mt-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-100 hover:bg-red-500/40 transition text-sm w-full">ออกจากระบบ</button>
                    </div>
                    <div id="sidebarLoginActions">
                        <button id="sidebarBtnLogin"
                            className="w-full px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">เข้าสู่ระบบ</button>
                        <button id="sidebarBtnRegister"
                            className="mt-2 w-full px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold hover:opacity-90 transition">ลงทะเบียน</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
