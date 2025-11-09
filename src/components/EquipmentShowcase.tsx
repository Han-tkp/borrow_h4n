import React, { useState, useEffect } from 'react';
import { getEquipmentList, getEquipmentTypes } from '../api/firestoreApi';

const EquipmentShowcase = () => {
    const [equipment, setEquipment] = useState<any[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    const fetchEquipmentAndTypes = async () => {
        setLoading(true);
        try {
            const [list, types] = await Promise.all([
                getEquipmentList({ q: searchQuery, f: statusFilter, t: typeFilter }),
                getEquipmentTypes()
            ]);
            setEquipment(list);
            setEquipmentTypes(types);
        } catch (error) {
            console.error("Error fetching equipment for showcase:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEquipmentAndTypes();
    }, [searchQuery, statusFilter, typeFilter]);

    return (
        <section id="equipmentShowcase" className="fade-in">
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
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ค้นหาชื่อหรือ Serial"
                            className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200">
                            <option value="">สถานะทั้งหมด</option>
                            <option value="available">ว่าง</option>
                            <option value="borrowed">ถูกยืม</option>
                            <option value="under_maintenance">ซ่อมบำรุง</option>
                        </select>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200">
                            <option value="">ทุกประเภท</option>
                            {equipmentTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    {/* The add equipment button is likely for admin, so it should be handled elsewhere or conditionally rendered */}
                    <button id="btnAddEquip"
                        className="hidden px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">เพิ่มอุปกรณ์</button>
                </div>
                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <p>กำลังโหลดอุปกรณ์...</p>
                    ) : equipment.length === 0 ? (
                        <p>ไม่พบอุปกรณ์</p>
                    ) : (
                        equipment.map(e => (
                            <div key={e.id} className="relative rounded-xl border p-4 bg-white border-slate-200 flex items-center gap-4 flex-row-reverse">
                                <div>
                                    <div className="font-semibold">{e.name}</div>
                                    <div className="text-sm text-slate-500">S/N: {e.serial}</div>
                                    <div className="text-xs text-slate-400 mt-1">{e.type}</div>
                                </div>
                                {e.typeImageUrl && (
                                    <img src={e.typeImageUrl} alt={e.name} className="w-24 h-24 object-cover rounded-md" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default EquipmentShowcase;
