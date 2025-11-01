import React, { useState, useEffect } from 'react';
import { getEquipmentList, deleteEquipment, deleteMultipleEquipment, updateStatusOfMultipleEquipment } from '../../api/firestoreApi';
import { statusMap } from '../../utils/helpers';
import { useAppContext } from '../../App';
import AddEquipmentForm from '../AddEquipmentForm';
import ImportModal from '../ImportModal';
import SummaryCards from './SummaryCards';
import UploadTypeImageModal from './UploadTypeImageModal';

const EquipmentTab = () => {
    const { user, showModal, hideModal } = useAppContext();
    const [equipment, setEquipment] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('date_desc');
    const [view, setView] = useState('grid');
    const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const fetchEquipment = () => {
        setLoading(true);
        getEquipmentList({ q: searchQuery, f: statusFilter, t: typeFilter })
            .then(list => {
                const [sortBy, direction] = sortOrder.split('_');
                const sortedList = [...list].sort((a, b) => {
                    if (sortBy === 'date') {
                        const dateA = a.createdAt?.seconds || 0;
                        const dateB = b.createdAt?.seconds || 0;
                        return direction === 'asc' ? dateA - dateB : dateB - dateA;
                    }
                    if (sortBy === 'name') {
                        const nameA = a.name || '';
                        const nameB = b.name || '';
                        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                    }
                    return 0;
                });
                setEquipment(sortedList);
            })
            .catch(error => console.error("Error fetching equipment:", error))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchEquipment();
    }, [searchQuery, statusFilter, typeFilter, sortOrder]);

    useEffect(() => {
        getEquipmentList().then(allEquipment => {
            const uniqueTypes = [...new Set(allEquipment.map((e: any) => e.type))];
            setEquipmentTypes(uniqueTypes.sort() as string[]);
        });
    }, []);

    const handleAddEquipment = () => {
        showModal('เพิ่มอุปกรณ์ใหม่', <AddEquipmentForm onSuccess={fetchEquipment} />);
    };

    const handleImport = () => {
        showModal('นำเข้าข้อมูลจากไฟล์', <ImportModal onSuccess={() => { fetchEquipment(); hideModal(); }} onClose={hideModal} />);
    };

    const handleUploadTypeImage = () => {
        showModal('อัปโหลดรูปภาพประเภทอุปกรณ์', <UploadTypeImageModal onSuccess={fetchEquipment} onClose={hideModal} />);
    };

    const handleDelete = async (id: string) => {
        const reason = window.prompt('โปรดระบุเหตุผลในการลบอุปกรณ์นี้:');
        if (reason) {
            try {
                await deleteEquipment(id, reason);
                fetchEquipment();
                alert('ลบอุปกรณ์และบันทึกเหตุผลเรียบร้อยแล้ว');
            } catch (error) {
                console.error("Failed to delete equipment:", error);
                alert('เกิดข้อผิดพลาดในการลบอุปกรณ์');
            }
        }
    };

    const handleDeleteSelected = async () => {
        const reason = window.prompt(`โปรดระบุเหตุผลในการลบอุปกรณ์ที่เลือกทั้งหมด ${selected.size} รายการ:`);
        if (reason) {
            try {
                await deleteMultipleEquipment([...selected], reason);
                setSelected(new Set());
                fetchEquipment();
                alert('ลบอุปกรณ์ที่เลือกและบันทึกเหตุผลเรียบร้อยแล้ว');
            } catch (error) {
                console.error("Failed to delete selected equipment:", error);
                alert('เกิดข้อผิดพลาดในการลบอุปกรณ์ที่เลือก');
            }
        }
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        if (!newStatus) return;

        if (window.confirm(`คุณแน่ใจหรือไม่ที่จะเปลี่ยนสถานะของ ${selected.size} รายการเป็น "${statusMap[newStatus]?.text || newStatus}"?`)) {
            try {
                await updateStatusOfMultipleEquipment([...selected], newStatus);
                setSelected(new Set());
                fetchEquipment();
                alert('อัปเดตสถานะเรียบร้อยแล้ว');
            } catch (error) {
                console.error("Failed to update status:", error);
                alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
            }
        }
        e.target.value = ""; // Reset dropdown
    };

    const handleSelectRow = (id: string) => {
        const newSelected = new Set(selected);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelected(newSelected);
    };

    const handleSelectAll = () => {
        if (selected.size === equipment.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(equipment.map(e => e.id)));
        }
    };

    const renderGridView = () => (
        <div id="dashEquipList" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {equipment.map(e => (
                <div key={e.id} className={`relative rounded-xl border p-4 bg-white ${selected.has(e.id) ? 'border-blue-500' : 'border-slate-200'} flex items-center gap-4`}>
                    {user?.role === 'admin' && (
                        <>
                            <input 
                                type="checkbox"
                                className="absolute top-3 left-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                onChange={() => handleSelectRow(e.id)}
                                checked={selected.has(e.id)}
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button onClick={() => handleDelete(e.id)} className="text-xs font-medium text-red-600 hover:underline">ลบ</button>
                            </div>
                        </>
                    )}
                    {e.typeImageUrl && (
                        <img src={e.typeImageUrl} alt={e.name} className="w-24 h-24 object-cover rounded-md" />
                    )}
                    <div>
                        <div className="font-semibold">{e.name}</div>
                        <div className="text-sm text-slate-500">S/N: {e.serial}</div>
                        <div className="text-xs text-slate-400 mt-1">{e.type}</div>
                        <span className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full ${statusMap[e.status]?.color || 'bg-gray-100'}`}>
                            {statusMap[e.status]?.text || e.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderTableView = () => (
        <div id="dashEquipTable" className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        {user?.role === 'admin' && (
                            <th scope="col" className="p-4">
                                <input type="checkbox"
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    onChange={handleSelectAll}
                                    checked={selected.size > 0 && selected.size === equipment.length}
                                />
                            </th>
                        )}
                        <th scope="col" className="px-4 py-3">ลำดับ</th>
                        <th scope="col" className="px-4 py-3">ชื่ออุปกรณ์</th>
                        <th scope="col" className="px-4 py-3">Serial No.</th>
                        <th scope="col" className="px-4 py-3">ประเภท</th>
                        <th scope="col" className="px-4 py-3">สถานะ</th>
                        {user?.role === 'admin' && <th scope="col" className="px-4 py-3">จัดการ</th>}
                    </tr>
                </thead>
                <tbody id="dashEquipTableBody">
                    {equipment.map((e, index) => (
                        <tr key={e.id} className={`bg-white border-b hover:bg-slate-50 ${selected.has(e.id) ? 'bg-blue-50' : ''}`}>
                            {user?.role === 'admin' && (
                                <td className="w-4 p-4">
                                    <input type="checkbox"
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        onChange={() => handleSelectRow(e.id)}
                                        checked={selected.has(e.id)}
                                    />
                                </td>
                            )}
                            <td className="px-4 py-2 font-medium text-slate-900">{index + 1}</td>
                            <td className="px-4 py-2 font-medium text-slate-900">{e.name}</td>
                            <td className="px-4 py-2">{e.serial}</td>
                            <td className="px-4 py-2">{e.type}</td>
                            <td className="px-4 py-2">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusMap[e.status]?.color || 'bg-gray-100'}`}>
                                    {statusMap[e.status]?.text || e.status}
                                </span>
                            </td>
                            {user?.role === 'admin' && (
                                <td className="px-4 py-2 flex items-center gap-2">
                                    <button onClick={() => handleDelete(e.id)} className="font-medium text-red-600 hover:underline">ลบ</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="tab-content">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 card rounded-2xl p-6 text-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <h3 className="text-lg font-semibold">รายการอุปกรณ์</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ค้นหา"
                                className="px-3 py-2 w-32 rounded-lg border border-slate-200" />
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200">
                                <option value="all">ดูทั้งหมด</option>
                                <option value="available">ว่าง</option>
                                <option value="borrowed">ถูกยืม</option>
                                <option value="under_maintenance">ซ่อมบำรุง</option>
                                <option value="pending_repair_approval">รออนุมัติซ่อม</option>
                                {user?.role === 'admin' && <option value="deleted">ถูกลบ (Admin)</option>}
                            </select>
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 max-w-xs overflow-x-auto">
                                <option value="">ทุกประเภท</option>
                                {equipmentTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200">
                                <option value="date_desc">วันที่นำเข้า: ใหม่สุด &gt; เก่าสุด</option>
                                <option value="date_asc">วันที่นำเข้า: เก่าสุด &gt; ใหม่สุด</option>
                                <option value="name_asc">ชื่ออุปกรณ์: A &gt; Z</option>
                                <option value="name_desc">ชื่ออุปกรณ์: Z &gt; A</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 min-h-[40px]">
                            {user?.role === 'admin' && view === 'grid' && equipment.length > 0 && selected.size > 0 && (
                                <div className="flex items-center p-2 rounded-lg border border-slate-200">
                                    <input id="select-all-checkbox" type="checkbox"
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        onChange={handleSelectAll}
                                        checked={selected.size > 0 && selected.size === equipment.length}
                                    />
                                    <label htmlFor="select-all-checkbox" className="ml-2 text-sm font-medium text-gray-900">เลือกทั้งหมด</label>
                                </div>
                            )}
                            {user?.role === 'admin' && selected.size > 0 && (
                                <>
                                    <select onChange={handleStatusChange} defaultValue="" className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
                                        <option value="" disabled>เปลี่ยนสถานะ...</option>
                                        <option value="available">ว่าง</option>
                                        <option value="borrowed">ถูกยืม</option>
                                        <option value="under_maintenance">ซ่อมบำรุง</option>
                                        <option value="pending_repair_approval">รออนุมัติซ่อม</option>
                                        <option value="deleted">ถูกลบ</option>
                                    </select>
                                    <button onClick={handleDeleteSelected} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">
                                        ลบ {selected.size} รายการที่เลือก
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setView('grid')} className={`p-1.5 text-sm rounded-md ${view === 'grid' ? 'bg-white shadow' : ''}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2-0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2-0 01-2-2v-2z" /></svg>
                                </button>
                                <button onClick={() => setView('table')} className={`p-1.5 text-sm rounded-md ${view === 'table' ? 'bg-white shadow' : ''}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                            {user?.role === 'admin' && (
                                <div className="flex gap-2">
                                    <button onClick={handleUploadTypeImage} className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm">อัปโหลดรูปภาพประเภท</button>
                                    <button onClick={handleImport} id="btnImportEquipDash" className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm">นำเข้าจากไฟล์</button>
                                    <button onClick={handleAddEquipment} id="btnAddEquipDash" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm">เพิ่มอุปกรณ์</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-[60vh] pr-2 -mr-2 mt-4">
                        {loading ? <p>Loading...</p> : (view === 'grid' ? renderGridView() : renderTableView())}
                    </div>
                </div>
                <div className="hidden xl:block xl:col-span-1">
                    <SummaryCards />
                </div>
            </div>
        </div>
    );
};

export default EquipmentTab;