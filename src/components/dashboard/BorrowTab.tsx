import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getEquipmentList, createBorrowRequest } from '../../api/firestoreApi';

const BorrowTab = () => {
    const { user } = useAppContext();
    const [availableTypes, setAvailableTypes] = useState<any[]>([]);
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
                const typesMap = allEquipment.reduce((acc: any, equip: any) => {
                    if(equip.type) {
                        if (!acc[equip.type]) {
                            acc[equip.type] = { count: 0, imageUrl: equip.typeImageUrl };
                        }
                        acc[equip.type].count += 1;
                    }
                    return acc;
                }, {});
                const typesArray = Object.keys(typesMap).map(type => ({
                    type,
                    count: typesMap[type].count,
                    imageUrl: typesMap[type].imageUrl
                }));
                setAvailableTypes(typesArray);
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
        const newQuantities = { ...quantities };

        if (currentIndex === -1) {
            newChecked.push(type);
            newQuantities[type] = 1; // Default quantity to 1 when checked
        } else {
            newChecked.splice(currentIndex, 1);
            delete newQuantities[type];
        }
        setCheckedTypes(newChecked);
        setQuantities(newQuantities);
    };

    const handleQuantityChange = (type: string, quantity: number) => {
        const selectedType = availableTypes.find(t => t.type === type);
        if (!selectedType) return;

        const maxQuantity = selectedType.count || 0;
        const validQuantity = Math.max(1, Math.min(quantity, maxQuantity)); // Ensure quantity is at least 1
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
            alert("กรุณาเลือกอุปกรณ์ที่ต้องการยืม");
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
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-[var(--text-color-dark)] mb-4">สร้างคำขอยืมอุปกรณ์</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* --- Left Column: Equipment Selection List --- */}
                    <div className="border rounded-xl p-4 bg-gray-50/50">
                        <h4 className="font-semibold text-gray-800 mb-3"> เลือกอุปกรณ์</h4>
                        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {availableTypes.length > 0 ? availableTypes.map(item => (
                                <div key={item.type} className="p-2 border rounded-lg bg-white">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={checkedTypes.includes(item.type)}
                                                onChange={() => handleCheckboxChange(item.type)}
                                                className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-800 text-sm">{item.type}</span>
                                                <p className="text-xs text-gray-500">ว่าง: {item.count} เครื่อง</p>
                                            </div>
                                        </label>
                                        {item.imageUrl && <img src={item.imageUrl} alt={item.type} className="w-12 h-12 object-cover rounded-md ml-2 flex-shrink-0"/>}
                                    </div>
                                    {checkedTypes.includes(item.type) && (
                                        <div className="mt-2 pt-2 border-t border-solid border-gray-200">
                                            <label className="text-xs font-medium text-gray-700">จำนวนที่ต้องการยืม:</label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max={item.count}
                                                value={quantities[item.type] || 1}
                                                onChange={(e) => handleQuantityChange(item.type, parseInt(e.target.value || '1'))}
                                                className="w-24 text-center border-gray-300 rounded-md py-1 mt-1 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            )) : <p className="text-gray-500">ไม่มีอุปกรณ์ว่างให้ยืมในขณะนี้</p>}
                        </div>
                    </div>

                    {/* --- Right Column: Borrow Details Form --- */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-3">กรอกรายละเอียด</h4>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">วันที่ยืม</label>
                                    <input type="date" value={borrowDate} onChange={e => setBorrowDate(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-gray-50" required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">วันที่คืน (โดยประมาณ)</label>
                                    <input type="date" value={borrowDate ? new Date(new Date(borrowDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0,10) : ''} className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-gray-100" readOnly />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">วัตถุประสงค์/พื้นที่ปฏิบัติงาน</label>
                                <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="ระบุเหตุผลและสถานที่..." className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-gray-50" required />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">ผู้ประสานงาน</label>
                                    <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="ชื่อ-สกุล" className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-gray-50" required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">เบอร์โทรติดต่อ</label>
                                    <input 
                                    value={contactPhone}
                                    onChange={e => setContactPhone(e.target.value.replace(/[^0-9]/g, ''))} 
                                    placeholder="08x-xxx-xxxx" 
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-gray-50" 
                                    type="tel" 
                                    pattern="[0-9]{10}" 
                                    maxLength="10" 
                                    required 
                                />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">รายละเอียดเพิ่มเติม (ถ้ามี)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="เช่น ขอสายไฟยาว 20 เมตร..." className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-gray-50"></textarea>
                            </div>
                            <button type="submit" className="w-full px-4 py-2.5 rounded-lg bg-[var(--success-color)] text-white font-semibold hover:opacity-90 transition-opacity">
                                ส่งคำขอยืม
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BorrowTab;