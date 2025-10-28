import React, { useState } from 'react';
import { addEquipment } from '../api/firestoreApi';
import { useAppContext } from '../App';

const AddEquipmentForm = ({ onSuccess }) => {
    const { hideModal } = useAppContext();
    const [formData, setFormData] = useState({
        name: '',
        serial: '',
        type: '',
        department: '',
        price: 0,
        notes: '',
        status: 'available'
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addEquipment(formData);
            alert('เพิ่มอุปกรณ์เรียบร้อยแล้ว');
            onSuccess(); // Callback to refresh the equipment list
            hideModal();
        } catch (err) {
            console.error("Failed to add equipment:", err);
            alert('เกิดข้อผิดพลาดในการเพิ่มอุปกรณ์');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="ชื่ออุปกรณ์" required className="w-full px-3 py-2 border rounded-lg" />
            <input name="serial" value={formData.serial} onChange={handleChange} placeholder="Serial Number" required className="w-full px-3 py-2 border rounded-lg" />
            <input name="type" value={formData.type} onChange={handleChange} placeholder="ประเภท" required className="w-full px-3 py-2 border rounded-lg" />
            <input name="department" value={formData.department} onChange={handleChange} placeholder="หน่วยงาน" required className="w-full px-3 py-2 border rounded-lg" />
            <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="ราคา" required className="w-full px-3 py-2 border rounded-lg" />
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="available">ว่าง</option>
                <option value="borrowed">ถูกยืม</option>
                <option value="under_maintenance">ซ่อมบำรุง</option>
                <option value="pending_repair_approval">รออนุมัติซ่อม</option>
                <option value="deleted">ถูกลบ</option>
            </select>
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="หมายเหตุ" className="w-full px-3 py-2 border rounded-lg"></textarea>
            <div className="flex justify-end gap-3">
                <button type="button" onClick={hideModal} className="px-4 py-2 rounded-lg bg-slate-200">ยกเลิก</button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
                    {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
            </div>
        </form>
    );
};

export default AddEquipmentForm;