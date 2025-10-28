import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../App';
import { getEquipmentList, createBorrowRequest } from '../../api/firestoreApi';

const BorrowTab = () => {
    const { user } = useAppContext();
    const [availableTypes, setAvailableTypes] = useState<any>({});
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [borrowDate, setBorrowDate] = useState(new Date().toISOString().slice(0, 10));
    const [purpose, setPurpose] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [notes, setNotes] = useState('');
    
    // State for managing selections
    const [checkedTypes, setCheckedTypes] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<{[key: string]: number}>({});

    useEffect(() => {
        const fetchAvailable = async () => {
            setLoading(true);
            try {
                const allEquipment = await getEquipmentList({ f: 'available' });
                const types = allEquipment.reduce((acc: any, equip: any) => {
                    if(equip.type) acc[equip.type] = (acc[equip.type] || 0) + 1;
                    return acc;
                }, {});
                setAvailableTypes(types);
            } catch (error) {
                console.error("Error fetching available equipment types:", error);
            }
            setLoading(false);
        };
        fetchAvailable();
    }, []);

    const handleCheckboxChange = (type: string) => {
        const currentIndex = checkedTypes.indexOf(type);
        const newChecked = [...checkedTypes];

        if (currentIndex === -1) {
            newChecked.push(type);
        } else {
            newChecked.splice(currentIndex, 1);
            // Also remove quantity when unchecked
            const newQuantities = { ...quantities };
            delete newQuantities[type];
            setQuantities(newQuantities);
        }
        setCheckedTypes(newChecked);
    };

    const handleQuantityChange = (type: string, quantity: number) => {
        const maxQuantity = availableTypes[type] || 0;
        const validQuantity = Math.max(0, Math.min(quantity, maxQuantity));
        setQuantities({ ...quantities, [type]: validQuantity });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("กรุณาล็อกอินก่อนทำรายการ");
            return;
        }

        const equipment_requests = Object.entries(quantities)
            .map(([type, quantity]) => ({ type, quantity }))
            .filter(item => item.quantity > 0);

        if (equipment_requests.length === 0) {
            alert("กรุณาเลือกอุปกรณ์และจำนวนที่ต้องการยืม");
            return;
        }

        const borrowData = { borrow_date: borrowDate, purpose, contact_name: contactName, contact_phone: contactPhone, notes, equipment_requests };

        try {
            await createBorrowRequest(borrowData);
            alert('ส่งคำขอยืมสำเร็จ! กรุณารอการอนุมัติ');
            // Reset form
            setPurpose('');
            setContactName('');
            setContactPhone('');
            setNotes('');
            setQuantities({});
            setCheckedTypes([]);
        } catch (error: any) {
            console.error("Error creating borrow request:", error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    };

    if (loading) return <p>Loading available equipment...</p>;

    return (
        <div className="tab-content">
            <div className="card rounded-2xl p-6 text-slate-900">
                <h3 className="text-lg font-semibold">สร้างคำขอยืมอุปกรณ์</h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                        <p className="text-sm font-medium mb-2">เลือกประเภทเครื่องที่ต้องการยืม:</p>
                        <div className="space-y-3">
                            {Object.keys(availableTypes).length > 0 ? Object.entries(availableTypes).map(([type, count]) => (
                                <div key={type}>
                                    <label className="flex items-center space-x-3">
                                        <input 
                                            type="checkbox" 
                                            checked={checkedTypes.includes(type)}
                                            onChange={() => handleCheckboxChange(type)}
                                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-slate-700">{type} (ว่าง {count} เครื่อง)</span>
                                    </label>
                                    {checkedTypes.includes(type) && (
                                        <div className="pl-8 pt-2">
                                            <label className="text-sm text-slate-600">จำนวนที่ต้องการยืม:</label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max={count as number}
                                                value={quantities[type] || ''}
                                                onChange={(e) => handleQuantityChange(type, parseInt(e.target.value))}
                                                className="w-24 text-center border-slate-300 rounded-md py-1 ml-2"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            )) : <p className="text-slate-500">ไม่มีอุปกรณ์ว่างให้ยืมในขณะนี้</p>}
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input type="date" value={borrowDate} onChange={e => setBorrowDate(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200" required />
                        <input type="date" value={borrowDate ? new Date(new Date(borrowDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0,10) : ''} className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50" readOnly />
                    </div>
                    <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="วัตถุประสงค์/พื้นที่ปฏิบัติงาน" className="w-full px-3 py-2 rounded-lg border border-slate-200" required />
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="ผู้ประสานงาน" className="w-full px-3 py-2 rounded-lg border border-slate-200" required />
                        <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="เบอร์โทรติดต่อ" className="w-full px-3 py-2 rounded-lg border border-slate-200" required />
                    </div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="รายละเอียดเพิ่มเติม" className="w-full px-3 py-2 rounded-lg border border-slate-200"></textarea>
                    <button type="submit" className="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">ส่งคำขอ</button>
                </form>
            </div>
        </div>
    );
};

export default BorrowTab;