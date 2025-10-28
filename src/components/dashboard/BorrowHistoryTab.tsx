import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../App';
import { getBorrowHistory } from '../../api/firestoreApi';
import { getBorrowStatusTextAndColor } from '../../utils/helpers';

const BorrowHistoryTab = () => {
    const { user } = useAppContext();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!user?.uid) return;
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const borrowHistory = await getBorrowHistory(user.uid);
                setHistory(borrowHistory);
            } catch (error) {
                console.error("Error fetching borrow history:", error);
            }
            setLoading(false);
        };
        fetchHistory();
    }, [user]);

    const filteredHistory = history.filter(b => {
        if (filter === 'all') return true;
        if (filter === 'borrowed') return ['pending_borrow_approval', 'pending_delivery', 'borrowed'].includes(b.status);
        if (filter === 'returned') return !['pending_borrow_approval', 'pending_delivery', 'borrowed'].includes(b.status);
        return true;
    });

    if (loading) return <p>Loading borrow history...</p>;

    return (
        <div className="tab-content">
            <div className="card rounded-2xl p-6 text-slate-900">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">ประวัติการยืม-คืน</h3>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-white shadow' : ''}`}>ทั้งหมด</button>
                        <button onClick={() => setFilter('borrowed')} className={`px-3 py-1 text-sm rounded-md ${filter === 'borrowed' ? 'bg-white shadow' : ''}`}>กำลังยืม</button>
                        <button onClick={() => setFilter('returned')} className={`px-3 py-1 text-sm rounded-md ${filter === 'returned' ? 'bg-white shadow' : ''}`}>คืนแล้ว</button>
                    </div>
                </div>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {filteredHistory.length === 0 ? <p className="text-slate-500">ไม่มีประวัติ</p> : filteredHistory.map(b => {
                        const { text, color } = getBorrowStatusTextAndColor(b.status);
                        return (
                            <div key={b.id} className="p-3 rounded-lg border border-slate-200 text-sm">
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold">คำขอยืม #{b.id.substring(0, 6)}... ({b.equipment_requests?.length || 0} ประเภท)</span>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{text}</span>
                                </div>
                                <p className="text-slate-600 mt-1">ยืม: {b.borrow_date} | โดย: {b.user_name}</p>
                                <div className="text-right mt-1">
                                    <button className="text-xs text-indigo-600 hover:underline">ดูรายละเอียด</button>
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
