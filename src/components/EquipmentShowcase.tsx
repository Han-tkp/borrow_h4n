import React from 'react';

const EquipmentShowcase = () => {
    return (
        <section id="equipmentShowcase" className="hidden fade-in">
            <div className="flex items-center justify-between mb-6">
                <button id="backFromEquip"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
                    <span className="text-lg">←</span>
                    กลับหน้าหลัก
                </button>
                <h2 className="text-xl font-semibold">รายการอุปกรณ์ทั้งหมด</h2>
                <div></div>
            </div>
            <div className="card rounded-2xl p-6 text-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <input id="equipSearch" placeholder="ค้นหาชื่อหรือ Serial"
                            className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <select id="equipFilter" className="px-3 py-2 rounded-lg border border-slate-200">
                            <option value="">สถานะทั้งหมด</option>
                            <option value="available">ว่าง</option>
                            <option value="borrowed">ถูกยืม</option>
                            <option value="under_maintenance">ซ่อมบำรุง</option>
                        </select>
                    </div>
                    <button id="btnAddEquip"
                        className="hidden px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">เพิ่มอุปกรณ์</button>
                </div>
                <div id="equipList" className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-mobile-1"></div>
            </div>
        </section>
    );
};

export default EquipmentShowcase;
