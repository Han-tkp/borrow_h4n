import React, { useState, useEffect } from 'react';
import { 
    getPendingUsers, approveUser, rejectUser,
    getBorrowRequests, approveBorrow, rejectBorrow, 
    getRepairRequests, approveRepair, rejectRepair
} from '../../api/firestoreApi';
import { useAppContext } from '../../App';
import BorrowRequestDetailModal from './BorrowRequestDetailModal';
import RepairRequestDetailModal from './RepairRequestDetailModal';

const ApprovalTab = () => {
    const { showModal, hideModal } = useAppContext();
    const [borrowRequests, setBorrowRequests] = useState<any[]>([]);
    const [repairRequests, setRepairRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [borrows, repairs] = await Promise.all([
                getBorrowRequests(),
                getRepairRequests()
            ]);
            setBorrowRequests(borrows);
            setRepairRequests(repairs);
        } catch (error) {
            console.error("Error fetching approval data:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (action: Function, id: string, successMessage: string) => {
        try {
            await action(id);
            alert(successMessage);
            fetchData();
        } catch (error) {
            console.error("Action failed:", error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    };

    const showBorrowDetails = (borrow: any) => {
        showModal('รายละเอียดคำขอยืม', <BorrowRequestDetailModal borrow={borrow} onClose={hideModal} />);
    };

    const showRepairDetails = (repair: any) => {
        showModal('รายละเอียดคำขอซ่อม', <RepairRequestDetailModal repair={repair} onClose={hideModal} />);
    };

    if (loading) {
        return <div className="text-center p-4">Loading approval queues...</div>;
    }

    return (
        <div className="tab-content">
            <div className="grid lg:grid-cols-2 gap-6 grid-mobile-1">


                {/* Borrow Approvals */}
                <div className="bg-white rounded-2xl p-6 text-[var(--text-color-dark)]">
                    <h3 className="text-lg font-semibold">อนุมัติการยืม</h3>
                    <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                        {borrowRequests.length === 0 
                            ? <p className="text-gray-500">ไม่มีคำขอยืมรออนุมัติ</p> 
                            : borrowRequests.map(b => (
                                <div key={b.id} className="p-3 rounded-lg border border-[var(--border-color)]">
                                    <p><span className="font-semibold">{b.user_name}</span> ขอยืม <span className="font-semibold">{b.equipment_requests?.reduce((acc, req) => acc + req.quantity, 0) || 0} เครื่อง</span></p>
                                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md mt-1">
                                        <p><strong>วัตถุประสงค์:</strong> {b.purpose}</p>
                                        <p><strong>รายการ:</strong></p>
                                        <ul className="list-disc pl-5">
                                            {b.equipment_requests.map(req => (
                                                <li key={req.type}>{req.type} (จำนวน: {req.quantity})</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="mt-2 flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(approveBorrow, b.id, 'อนุมัติการยืมสำเร็จ')} className="px-3 py-1 text-sm rounded bg-[var(--success-color)] text-white hover:opacity-90">อนุมัติ</button>
                                            <button onClick={() => handleAction(rejectBorrow, b.id, 'ปฏิเสธการยืมเรียบร้อย')} className="px-3 py-1 text-sm rounded bg-[var(--danger-color)] text-white hover:opacity-90">ไม่อนุมัติ</button>
                                        </div>
                                        <button onClick={() => showBorrowDetails(b)} className="text-xs text-[var(--primary-color)] hover:underline">ดูรายละเอียด</button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Repair Approvals */}
                <div className="bg-white rounded-2xl p-6 text-[var(--text-color-dark)]">
                    <h3 className="text-lg font-semibold">อนุมัติการซ่อม</h3>
                    <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                        {repairRequests.length === 0 
                            ? <p className="text-gray-500">ไม่มีคำขอซ่อมรออนุมัติ</p> 
                            : repairRequests.map(r => (
                                <div key={r.id} className="p-3 rounded-lg border border-[var(--border-color)]">
                                    <p>คำขอซ่อม <span className="font-semibold">{r.equipment_name}</span></p>
                                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md mt-1">
                                        <p className="truncate"><strong>อาการ:</strong> {r.damage_description}</p>
                                        {r.cost && <p><strong>ประเมินค่าซ่อม:</strong> {r.cost.toLocaleString()} บาท</p>}
                                    </div>
                                    <div className="mt-2 flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(approveRepair, r.id, 'อนุมัติการซ่อมสำเร็จ')} className="px-3 py-1 text-sm rounded bg-[var(--success-color)] text-white hover:opacity-90">อนุมัติ</button>
                                            <button onClick={() => handleAction(rejectRepair, r.id, 'ปฏิเสธการซ่อมเรียบร้อย')} className="px-3 py-1 text-sm rounded bg-[var(--danger-color)] text-white hover:opacity-90">ไม่อนุมัติ</button>
                                        </div>
                                        <button onClick={() => showRepairDetails(r)} className="text-xs text-[var(--primary-color)] hover:underline">ดูรายละเอียดฉบับเต็ม</button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalTab;