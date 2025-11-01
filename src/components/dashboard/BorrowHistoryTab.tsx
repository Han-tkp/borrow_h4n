import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../App';
import { getBorrowHistory, reauthenticate, clearBorrowHistory } from '../../api/firestoreApi';
import { getBorrowStatusTextAndColor } from '../../utils/helpers';
import * as XLSX from 'xlsx';
import Modal from '../Modal'; // Import the Modal component

interface BorrowHistoryTabProps {
    userId: string;
}

const BorrowHistoryTab: React.FC<BorrowHistoryTabProps> = ({ userId }) => {
    const { user } = useAppContext();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedBorrow, setSelectedBorrow] = useState<any | null>(null);

    const fetchData = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const borrowHistory = await getBorrowHistory(userId);
            setHistory(borrowHistory);
        } catch (error) {
            console.error("Error fetching borrow history:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    const handleExport = () => {
        const worksheet = XLSX.utils.json_to_sheet(history.map(b => ({
            BorrowId: b.id,
            EquipmentCount: b.equipment_requests?.reduce((acc, req) => acc + req.quantity, 0) || 0,
            BorrowDate: b.borrow_date,
            UserName: b.user_name,
            Status: b.status,
            Details: JSON.stringify(b.equipment_requests, null, 2)
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Borrow History");
        XLSX.writeFile(workbook, "borrow_history.xlsx");
    };

    const handleClearHistory = async () => {
        const password = prompt("โปรดยืนยันรหัสผ่านของคุณเพื่อล้างประวัติ:");
        if (!password) return;

        try {
            await reauthenticate(password);
        } catch (error) {
            alert("การยืนยันตัวตนล้มเหลว โปรดตรวจสอบรหัสผ่านของคุณ");
            return;
        }

        if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการยืม-คืนทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
            try {
                await clearBorrowHistory();
                alert("ล้างประวัติการยืม-คืนทั้งหมดเรียบร้อยแล้ว");
                fetchData(); // Refresh the data
            } catch (error) {
                console.error("Error clearing borrow history:", error);
                alert("เกิดข้อผิดพลาดในการล้างประวัติ");
            }
        }
    };

    const filteredHistory = history.filter(b => {
        const statusFilter = () => {
            if (filter === 'all') return true;
            if (filter === 'borrowed') return ['pending_borrow_approval', 'pending_delivery', 'borrowed'].includes(b.status);
            if (filter === 'returned') return !['pending_borrow_approval', 'pending_delivery', 'borrowed'].includes(b.status);
            return true;
        }
        const dateMatches = () => {
            if (!dateFilter) return true;
            const borrowDate = b.borrow_date;
            return borrowDate === dateFilter;
        }
        return statusFilter() && dateMatches();
    });

    if (loading) return <p>Loading borrow history...</p>;

    const isAdmin = user?.role === 'admin';

    return (
        <div className="tab-content">
            <div className="card rounded-2xl p-6 text-slate-900">
                <h3 className="text-lg font-semibold">ประวัติการยืม-คืนสำหรับผู้ใช้: {userId}</h3>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <input 
                            type="date" 
                            value={dateFilter} 
                            onChange={e => setDateFilter(e.target.value)} 
                            className="px-3 py-2 h-full rounded-lg border border-slate-200 text-sm"
                        />
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-white shadow' : ''}`}>ทั้งหมด</button>
                            <button onClick={() => setFilter('borrowed')} className={`px-3 py-1 text-sm rounded-md ${filter === 'borrowed' ? 'bg-white shadow' : ''}`}>กำลังยืม</button>
                            <button onClick={() => setFilter('returned')} className={`px-3 py-1 text-sm rounded-md ${filter === 'returned' ? 'bg-white shadow' : ''}`}>คืนแล้ว</button>
                        </div>
                        {isAdmin && (
                            <>
                                <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm">Export to Excel</button>
                                <button onClick={handleClearHistory} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">Clear History</button>
                            </>
                        )}
                    </div>
                </div>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {filteredHistory.length === 0 ? <p className="text-slate-500">ไม่มีประวัติ</p> : filteredHistory.map(b => {
                        const { text, color } = getBorrowStatusTextAndColor(b.status);
                        return (
                            <div key={b.id} className="p-3 rounded-lg border border-slate-200 text-sm">
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold">คำขอยืม #{b.id.substring(0, 6)}... ({b.equipment_requests?.reduce((acc, req) => acc + req.quantity, 0) || 0} เครื่อง)</span>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{text}</span>
                                </div>
                                <p className="text-slate-600 mt-1">ยืม: {b.borrow_date} | โดย: {b.user_name}</p>
                                <div className="text-right mt-1">
                                    <button onClick={() => setSelectedBorrow(b)} className="text-xs text-indigo-600 hover:underline">ดูรายละเอียด</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Debugging: Display raw history */}
                <h4 className="text-lg font-semibold mt-4">Raw History (for debugging):</h4>
                <pre className="bg-slate-100 p-2 rounded-lg text-xs overflow-auto max-h-40">
                    {JSON.stringify(history, null, 2)}
                </pre>
            </div>

            <Modal isOpen={selectedBorrow !== null} onClose={() => setSelectedBorrow(null)} title={`รายละเอียดคำขอยืม #${selectedBorrow?.id.substring(0, 6)}...`}>
                {selectedBorrow && (
                    <div className="space-y-3">
                        <p><strong>สถานะ:</strong> {getBorrowStatusTextAndColor(selectedBorrow.status).text}</p>
                        <p><strong>วันที่ยืม:</strong> {selectedBorrow.borrow_date}</p>
                        <p><strong>ผู้ยืม:</strong> {selectedBorrow.user_name}</p>
                        <p><strong>วัตถุประสงค์:</strong> {selectedBorrow.purpose}</p>
                        <p><strong>ผู้ประสานงาน:</strong> {selectedBorrow.contact_name} ({selectedBorrow.contact_phone})</p>
                        {selectedBorrow.notes && <p><strong>รายละเอียดเพิ่มเติม:</strong> {selectedBorrow.notes}</p>}
                        <div>
                            <p className="font-semibold">รายการอุปกรณ์:</p>
                            <ul className="list-disc pl-5 mt-1">
                                {selectedBorrow.equipment_requests.map(req => (
                                    <li key={req.type}>{req.type} (จำนวน: {req.quantity})</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default BorrowHistoryTab;
