import React, { useState, useEffect } from 'react';
import { getDeliveryQueue, getReturnQueue } from '../../api/firestoreApi';

const DeliveryTab = () => {
    const [deliveryQueue, setDeliveryQueue] = useState<any[]>([]);
    const [returnQueue, setReturnQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [delivery, returns] = await Promise.all([
                getDeliveryQueue(),
                getReturnQueue()
            ]);
            setDeliveryQueue(delivery);
            setReturnQueue(returns);
        } catch (error) {
            console.error("Error fetching technician queues:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return <p>Loading technician queues...</p>;
    }

    return (
        <div className="tab-content">
            <div className="grid lg:grid-cols-2 gap-6 grid-mobile-1">
                <div className="card rounded-2xl p-6 text-slate-900">
                    <h3 className="text-lg font-semibold">รายการก่อนส่งมอบ (Pre-Delivery)</h3>
                    <div className="mt-4 overflow-auto max-h-[60vh]">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3">ID การยืม</th>
                                    <th scope="col" className="px-4 py-3">ผู้ยืม</th>
                                    <th scope="col" className="px-4 py-3">รายการอุปกรณ์</th>
                                    <th scope="col" className="px-4 py-3">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveryQueue.length > 0 ? deliveryQueue.map(b => (
                                    <tr key={b.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium text-slate-900">#{b.id.substring(0,6)}...</td>
                                        <td className="px-4 py-2">{b.user_name}</td>
                                        <td className="px-4 py-2"><ul className="list-disc list-inside text-xs">{b.equipment_requests?.map((eq:any) => `${eq.type} (${eq.quantity})`).join(', ')}</ul></td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col gap-1.5">
                                                <button className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600">ยืนยันส่งมอบ</button>
                                                <button className="px-3 py-1.5 text-xs rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300">ตรวจสภาพ/เปลี่ยน</button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={4} className="text-center p-4 text-slate-500">ไม่มีรายการรอส่งมอบ</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card rounded-2xl p-6 text-slate-900">
                    <h3 className="text-lg font-semibold">รายการรอตรวจสภาพ (หลังคืน)</h3>
                    <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                         {returnQueue.length > 0 ? returnQueue.map(b => (
                            <div key={b.id} className="p-3 rounded-lg border border-slate-200 text-sm">
                                <p><span className="font-semibold">{b.user_name}</span> คืนเครื่อง</p>
                                <ul className="text-slate-600 list-disc list-inside">{b.equipment_requests?.map((eq:any) => `${eq.type} (${eq.quantity})`).join(', ')}</ul>
                                <p className="text-slate-600">กำหนดคืน: {b.due_date}</p>
                                <button className="mt-2 w-full px-3 py-1 rounded bg-orange-500 text-white hover:bg-orange-600 text-xs">ดำเนินการคืน</button>
                            </div>
                         )) : <p className="text-slate-500">ไม่มีรายการรอตรวจสภาพ</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryTab;
