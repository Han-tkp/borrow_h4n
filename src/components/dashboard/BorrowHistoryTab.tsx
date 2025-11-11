import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getBorrowHistory, reauthenticate, clearBorrowHistory, getActivityLog } from '../../api/firestoreApi';
import { getBorrowStatusTextAndColor } from '../../utils/helpers';
import * as XLSX from 'xlsx';
import LogDetailModal from './LogDetailModal';

interface BorrowHistoryTabProps {
    userId: string | null;
}

const BorrowHistoryTab: React.FC<BorrowHistoryTabProps> = ({ userId }) => {
    const { user, showModal, hideModal } = useAppContext();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [activityLogs, setActivityLogs] = useState<any[]>([]);

    useEffect(() => {
        setLoading(true);
        try {
            const unsubscribe = getBorrowHistory(userId, (borrowHistory) => {
                setHistory(borrowHistory);
                setLoading(false);
            });
    
            // Cleanup subscription on component unmount
            return () => {
                if (unsubscribe) {
                    unsubscribe();
                }
            };
        } catch (error) {
            console.error("Error fetching borrow history:", error);
            setLoading(false);
        }
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
            } catch (error) {
                console.error("Error clearing borrow history:", error);
                alert("เกิดข้อผิดพลาดในการล้างประวัติ");
            }
        }
    };

    const showDetails = async (borrowId: string) => {
        const logs = await getActivityLog(undefined, undefined, undefined, borrowId);
        setActivityLogs(logs);
        showModal('รายละเอียดประวัติการยืม', 
            <div>
                {logs.map(log => (
                    <LogDetailModal log={log} key={log.id} />
                ))}
            </div>
        );
    };

    const filteredHistory = history.filter(b => {
        const statusFilter = () => {
            if (filter === 'all') return true;
            if (filter === 'borrowed') return ['pending_borrow_approval', 'pending_delivery', 'borrowed'].includes(b.status);
            if (filter === 'returned') return ['returned', 'returned_pending_assessment', 'completed'].includes(b.status);
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
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[var(--text-color-dark)]">ประวัติการยืม-คืน{userId ? `สำหรับผู้ใช้: ${userId}` : `ทั้งหมด`}</h3>
                <div className="flex items-center justify-between flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <input 
                            type="date" 
                            value={dateFilter} 
                            onChange={e => setDateFilter(e.target.value)} 
                            className="px-3 py-2 h-full rounded-lg border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-gray-50"
                        />
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-[var(--primary-color)] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>ทั้งหมด</button>
                            <button onClick={() => setFilter('borrowed')} className={`px-3 py-1 text-sm rounded-md ${filter === 'borrowed' ? 'bg-[var(--primary-color)] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>กำลังยืม</button>
                            <button onClick={() => setFilter('returned')} className={`px-3 py-1 text-sm rounded-md ${filter === 'returned' ? 'bg-[var(--primary-color)] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>คืนแล้ว</button>
                        </div>
                        {isAdmin && (
                            <>
                                </>
                        )}
                    </div>
                </div>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {filteredHistory.length === 0 ? <p className="text-gray-500">ไม่มีประวัติ</p> : filteredHistory.map(b => {
                        const { text, color } = getBorrowStatusTextAndColor(b.status);
                        return (
                            <div key={b.id} className="p-3 rounded-lg border border-[var(--border-color)] text-sm bg-white shadow-sm">
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-[var(--text-color-dark)]">คำขอยืม #{b.id.substring(0, 6)}... ({b.equipment_requests?.reduce((acc, req) => acc + req.quantity, 0) || 0} เครื่อง)</span>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{text}</span>
                                </div>
                                <p className="text-gray-600 mt-1">ยืม: {b.borrow_date} | โดย: {b.user_name}</p>
                                <div className="text-right mt-1">
                                    <button onClick={() => showDetails(b.id)} className="text-xs text-[var(--primary-color)] hover:underline">ดูรายละเอียด</button>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default BorrowHistoryTab;
