import React, { useState, useEffect } from 'react';
import { 
    getPendingUsers, approveUser, rejectUser,
    getBorrowRequests, approveBorrow, rejectBorrow, 
    getRepairRequests, approveRepair, rejectRepair
} from '../../api/firestoreApi';

const ApprovalTab = () => {
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [borrowRequests, setBorrowRequests] = useState<any[]>([]);
    const [repairRequests, setRepairRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [users, borrows, repairs] = await Promise.all([
                getPendingUsers(),
                getBorrowRequests(),
                getRepairRequests()
            ]);
            setPendingUsers(users);
            setBorrowRequests(borrows);
            setRepairRequests(repairs);
        } catch (error) {
            console.error("Error fetching approval data:", error);
            // In a real app, show a toast notification
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (action: Function, id: string, successMessage: string) => {
        try {
            await action(id);
            alert(successMessage); // Replace with a proper toast notification
            fetchData(); // Refresh all data
        } catch (error) {
            console.error("Action failed:", error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    };

    if (loading) {
        return <div className="text-center p-4">Loading approval queues...</div>;
    }

    return (
        <div className="tab-content">
            <div className="grid lg:grid-cols-2 gap-6 grid-mobile-1">
                {/* User Approvals */}
                <div className="card rounded-2xl p-6 text-slate-900">
                    <h3 className="text-lg font-semibold">อนุมัติบัญชีผู้ใช้ใหม่</h3>
                    <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                        {pendingUsers.length === 0 
                            ? <p className="text-slate-500">ไม่มีบัญชีรออนุมัติ</p> 
                            : pendingUsers.map(user => (
                                <div key={user.id} className="p-3 rounded-lg border border-slate-200">
                                    <p className="font-semibold">{user.full_name} ({user.agency})</p>
                                    <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md mt-1">
                                        <p><strong>อีเมล:</strong> {user.email}</p>
                                        <p><strong>โทรศัพท์:</strong> {user.phone}</p>
                                        <p><strong>ที่อยู่:</strong> {user.address}</p>
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        <button onClick={() => handleAction(approveUser, user.id, 'อนุมัติผู้ใช้สำเร็จ')} className="px-3 py-1 text-sm rounded bg-emerald-500 text-white hover:bg-emerald-600">อนุมัติ</button>
                                        <button onClick={() => handleAction(rejectUser, user.id, 'ปฏิเสธผู้ใช้เรียบร้อย')} className="px-3 py-1 text-sm rounded bg-rose-500 text-white hover:bg-rose-600">ไม่อนุมัติ</button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Borrow Approvals */}
                <div className="card rounded-2xl p-6 text-slate-900">
                    <h3 className="text-lg font-semibold">อนุมัติการยืม</h3>
                    <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                        {borrowRequests.length === 0 
                            ? <p className="text-slate-500">ไม่มีคำขอยืมรออนุมัติ</p> 
                            : borrowRequests.map(b => (
                                <div key={b.id} className="p-3 rounded-lg border border-slate-200">
                                    <p><span className="font-semibold">{b.user_name}</span> ขอยืม <span className="font-semibold">{b.equipment_requests?.reduce((acc, req) => acc + req.quantity, 0) || 0} เครื่อง</span></p>
                                    <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md mt-1">
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
                                            <button onClick={() => handleAction(approveBorrow, b.id, 'อนุมัติการยืมสำเร็จ')} className="px-3 py-1 text-sm rounded bg-emerald-500 text-white hover:bg-emerald-600">อนุมัติ</button>
                                            <button onClick={() => handleAction(rejectBorrow, b.id, 'ปฏิเสธการยืมเรียบร้อย')} className="px-3 py-1 text-sm rounded bg-rose-500 text-white hover:bg-rose-600">ไม่อนุมัติ</button>
                                        </div>
                                        <button className="text-xs text-indigo-600 hover:underline">ดูรายละเอียด</button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Repair Approvals */}
                <div className="card rounded-2xl p-6 text-slate-900 lg:col-span-2">
                    <h3 className="text-lg font-semibold">อนุมัติการซ่อม</h3>
                    <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                        {repairRequests.length === 0 
                            ? <p className="text-slate-500">ไม่มีคำขอซ่อมรออนุมัติ</p> 
                            : repairRequests.map(r => (
                                <div key={r.id} className="p-3 rounded-lg border border-slate-200">
                                    <p>คำขอซ่อม <span className="font-semibold">{r.equipment_name}</span></p>
                                    <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md mt-1">
                                        <p className="truncate"><strong>อาการ:</strong> {r.damage_description}</p>
                                        {r.cost && <p><strong>ประเมินค่าซ่อม:</strong> {r.cost.toLocaleString()} บาท</p>}
                                    </div>
                                    <div className="mt-2 flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(approveRepair, r.id, 'อนุมัติการซ่อมสำเร็จ')} className="px-3 py-1 text-sm rounded bg-emerald-500 text-white hover:bg-emerald-600">อนุมัติ</button>
                                            <button onClick={() => handleAction(rejectRepair, r.id, 'ปฏิเสธการซ่อมเรียบร้อย')} className="px-3 py-1 text-sm rounded bg-rose-500 text-white hover:bg-rose-600">ไม่อนุมัติ</button>
                                        </div>
                                        <button className="text-xs text-indigo-600 hover:underline">ดูรายละเอียดฉบับเต็ม</button>
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
